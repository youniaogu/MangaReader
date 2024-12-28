import Base, { Plugin, Options } from './base';
import { MangaStatus, ErrorMessage } from '~/utils';
import { Platform } from 'react-native';
import dayjs from 'dayjs';
import * as cheerio from 'cheerio';

const searchOptions = [
  {
    name: 'sort',
    options: [
      { label: 'Recent', value: Options.Default },
      { label: 'Today', value: 'popular-today' },
      { label: 'Week', value: 'popular-week' },
      { label: 'All Time', value: 'popular' },
    ],
  },
];

const PATTERN_MANGA_ID = /https:\/\/nhentai.net\/g\/([0-9]+)\//;
const PATTERN_SCRIPT = /window\._gallery = JSON\.parse\((.+)\);/;
const PATTERN_PICTURE = /(.+)\/[0-9]+\..+$/;

class NHentai extends Base {
  constructor() {
    const userAgent =
      Platform.OS === 'android'
        ? 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Mobile Safari/537.36'
        : 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
    super({
      score: 5,
      id: Plugin.NH,
      name: 'nhentai',
      shortName: 'NH',
      description: '需要代理',
      href: 'https://nhentai.net/',
      userAgent,
      defaultHeaders: { 'User-Agent': userAgent, Host: 'nhentai.net' },
      option: { discovery: [], search: searchOptions },
    });
  }

  prepareDiscoveryFetch: Base['prepareDiscoveryFetch'] = (page) => {
    return {
      url: `https://nhentai.net/?page=${page}`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareSearchFetch: Base['prepareSearchFetch'] = (keyword, page, { sort }) => {
    return {
      url: `https://nhentai.net/search/?q=${keyword}&page=${page}&sort=${sort}`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareMangaInfoFetch: Base['prepareMangaInfoFetch'] = (mangaId) => {
    return {
      url: `https://nhentai.net/g/${mangaId}/`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareChapterListFetch: Base['prepareChapterListFetch'] = () => {};
  prepareChapterFetch: Base['prepareChapterFetch'] = (mangaId, _chapterId) => {
    return {
      url: `https://nhentai.net/g/${mangaId}/1`,
      headers: new Headers(this.defaultHeaders),
    };
  };

  handleDiscovery: Base['handleDiscovery'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    this.checkCloudFlare($);
    const list: IncreaseManga[] = [];

    (
      $(
        'div#content div.container.index-container:not(.index-popular) div.gallery a.cover'
      ).toArray() as cheerio.TagElement[]
    ).forEach((a) => {
      const $$ = cheerio.load(a);
      const href = 'https://nhentai.net' + a.attribs.href;
      const [, mangaId] = href.match(PATTERN_MANGA_ID) || [];
      const title = $$('div.caption').text();
      const cover = $$('img.lazyload').attr('data-src') || '';

      list.push({
        href,
        hash: Base.combineHash(this.id, mangaId),
        source: this.id,
        sourceName: this.name,
        status: MangaStatus.End,
        mangaId,
        title,
        bookCover: cover,
      });
    });

    return { discovery: list };
  };

  handleSearch: Base['handleSearch'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    this.checkCloudFlare($);
    const list: IncreaseManga[] = [];
    const isMangaInfo =
      ($('script:not([src])').toArray() as cheerio.TagElement[]).filter((item) =>
        PATTERN_SCRIPT.test(item.children[0].data || '')
      ).length > 0;

    if (isMangaInfo) {
      const cover = $('div#content div#cover img.lazyload').attr('data-src') || '';
      const scriptContent =
        ($('script:not([src])').toArray() as cheerio.TagElement[]).filter((item) =>
          PATTERN_SCRIPT.test(item.children[0].data || '')
        )[0].children[0].data || '';
      const [, stringifyData] = scriptContent.match(PATTERN_SCRIPT) || [];
      const data = JSON.parse(JSON.parse(decodeURI(stringifyData)));
      const mangaId = data.id;
      const chapterId = data.num_pages;
      const href = `https://nhentai.net/g/${mangaId}/`;

      const tags = (data.tags as { type: string; name: string }[])
        .filter((item) => item.type === 'tag')
        .map((item) => item.name);
      const artist = (data.tags as { type: string; name: string }[])
        .filter((item) => item.type === 'artist')
        .map((item) => item.name);
      const group = (data.tags as { type: string; name: string }[])
        .filter((item) => item.type === 'group')
        .map((item) => item.name);
      const chapters: ChapterItem[] = [
        {
          hash: Base.combineHash(this.id, mangaId, chapterId),
          mangaId,
          chapterId: chapterId,
          href: `https://nhentai.net/g/${mangaId}/1`,
          title: '开始阅读',
        },
      ];

      list.push({
        href,
        hash: Base.combineHash(this.id, mangaId),
        source: this.id,
        sourceName: this.name,
        mangaId,
        bookCover: cover,
        title: data.title.japanese,
        status: MangaStatus.End,
        latest: chapters.length > 0 ? chapters[0].title : '',
        updateTime: dayjs.unix(data.upload_date).format('YYYY-MM-DD'),
        author: [...artist, ...group],
        tag: tags,
        chapters: chapters,
      });
    } else {
      (
        $(
          'div#content div.container.index-container:not(.index-popular) div.gallery a.cover'
        ).toArray() as cheerio.TagElement[]
      ).forEach((a) => {
        const $$ = cheerio.load(a);
        const href = 'https://nhentai.net' + a.attribs.href;
        const [, mangaId] = href.match(PATTERN_MANGA_ID) || [];
        const title = $$('div.caption').text();
        const cover = $$('img.lazyload').attr('data-src') || '';

        list.push({
          href,
          hash: Base.combineHash(this.id, mangaId),
          source: this.id,
          sourceName: this.name,
          status: MangaStatus.End,
          mangaId,
          title,
          bookCover: cover,
        });
      });
    }

    return { search: list };
  };

  handleMangaInfo: Base['handleMangaInfo'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    this.checkCloudFlare($);
    const manga: IncreaseManga = {
      href: '',
      hash: '',
      source: this.id,
      sourceName: this.name,
      mangaId: '',
      title: '',
      latest: '',
      updateTime: '',
      author: [],
      tag: [],
      status: MangaStatus.End,
      chapters: [],
    };
    const cover = $('div#content div#cover img.lazyload').attr('data-src') || '';
    const scriptContent =
      ($('script:not([src])').toArray() as cheerio.TagElement[]).filter((item) =>
        PATTERN_SCRIPT.test(item.children[0].data || '')
      )[0].children[0].data || '';
    const [, stringifyData] = scriptContent.match(PATTERN_SCRIPT) || [];
    const data = JSON.parse(JSON.parse(decodeURI(stringifyData)));
    const mangaId = data.id;
    const chapterId = data.num_pages;
    const href = `https://nhentai.net/g/${mangaId}/`;

    const tags = (data.tags as { type: string; name: string }[])
      .filter((item) => item.type !== 'artist' && item.type !== 'group')
      .map((item) => item.name);
    const artist = (data.tags as { type: string; name: string }[])
      .filter((item) => item.type === 'artist')
      .map((item) => item.name);
    const group = (data.tags as { type: string; name: string }[])
      .filter((item) => item.type === 'group')
      .map((item) => item.name);
    const chapters: ChapterItem[] = [
      {
        hash: Base.combineHash(this.id, mangaId, chapterId),
        mangaId,
        chapterId: chapterId,
        href: `https://nhentai.net/g/${mangaId}/1`,
        title: '开始阅读',
      },
    ];

    manga.href = href;
    manga.mangaId = mangaId;
    manga.hash = Base.combineHash(this.id, mangaId);
    manga.title = data.title.japanese || data.title.english || data.title.pretty;
    manga.infoCover = cover;
    manga.latest = chapters.length > 0 ? chapters[0].title : '';
    manga.updateTime = dayjs.unix(data.upload_date).format('YYYY-MM-DD');
    manga.author = [...artist, ...group];
    manga.tag = tags;
    manga.chapters = chapters;

    return { manga };
  };

  handleChapterList: Base['handleChapterList'] = () => {
    return { error: new Error(ErrorMessage.NoSupport + 'handleChapterList') };
  };

  handleChapter: Base['handleChapter'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    this.checkCloudFlare($);

    const scriptContent =
      ($('script:not([src])').toArray() as cheerio.TagElement[]).filter((item) =>
        PATTERN_SCRIPT.test(item.children[0].data || '')
      )[0].children[0].data || '';
    const [, stringifyData] = scriptContent.match(PATTERN_SCRIPT) || [];
    const data = JSON.parse(JSON.parse(decodeURI(stringifyData)));
    const mangaId = data.id;
    const chapterId = data.num_pages;
    const picture = $('section#image-container img').attr('src') || '';
    const [, href] = picture.match(PATTERN_PICTURE) || [];

    return {
      canLoadMore: false,
      chapter: {
        hash: Base.combineHash(this.id, mangaId, chapterId),
        mangaId,
        chapterId,
        name: data.title.japanese,
        title: data.title.pretty,
        headers: {},
        images: (data.images.pages as { t: 'j' | 'p' | 'g' }[]).map((item, index) => {
          switch (item.t) {
            case 'g': {
              return { uri: `${href}/${index + 1}.gif` };
            }
            case 'p': {
              return { uri: `${href}/${index + 1}.png` };
            }
            case 'j':
            default: {
              return { uri: `${href}/${index + 1}.jpg` };
            }
          }
        }),
      },
    };
  };
}

export default new NHentai();
