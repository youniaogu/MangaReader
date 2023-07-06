import Base, { Plugin, Options } from './base';
import { MangaStatus, ErrorMessage } from '~/utils';
import LZString from 'lz-string';
import * as cheerio from 'cheerio';

const discoveryOptions = [
  {
    name: 'type',
    options: [
      { label: '选择分类', value: Options.Default },
      { label: '热血', value: '1' },
      { label: '冒险', value: '2' },
      { label: '魔幻', value: '3' },
      { label: '神鬼', value: '4' },
      { label: '搞笑', value: '5' },
      { label: '萌系', value: '6' },
      { label: '爱情', value: '7' },
      { label: '科幻', value: '8' },
      { label: '魔法', value: '9' },
      { label: '格斗', value: '10' },
      { label: '武侠', value: '11' },
      { label: '机战', value: '12' },
      { label: '战争', value: '13' },
      { label: '竞技', value: '14' },
      { label: '体育', value: '15' },
      { label: '校园', value: '16' },
      { label: '生活', value: '17' },
      { label: '励志', value: '18' },
      { label: '历史', value: '19' },
      { label: '伪娘', value: '20' },
      { label: '宅男', value: '21' },
      { label: '腐女', value: '22' },
      { label: '耽美', value: '23' },
      { label: '百合', value: '24' },
      { label: '后宫', value: '25' },
      { label: '治愈', value: '26' },
      { label: '美食', value: '27' },
      { label: '推理', value: '28' },
      { label: '悬疑', value: '29' },
      { label: '恐怖', value: '30' },
      { label: '四格', value: '31' },
      { label: '职场', value: '32' },
      { label: '侦探', value: '33' },
      { label: '社会', value: '34' },
      { label: '音乐', value: '35' },
      { label: '舞蹈', value: '36' },
      { label: '杂志', value: '37' },
      { label: '黑道', value: '38' },
    ],
  },
  {
    name: 'region',
    options: [
      { label: '选择地区', value: Options.Default },
      { label: '日本漫画', value: '1' },
      { label: '港台漫画', value: '2' },
      { label: '欧美漫画', value: '3' },
      { label: '韩国漫画', value: '4' },
      { label: '内地漫画', value: '5' },
      { label: '其他漫画', value: '6' },
    ],
  },
  {
    name: 'status',
    options: [
      { label: '选择状态', value: Options.Default },
      { label: '连载中', value: '1' },
      { label: '已完结', value: '2' },
    ],
  },
];

const PATTERN_MANGA_ID = /https:\/\/www\.maofly\.com\/manga\/([0-9]+)\.html/;
const PATTERN_CHAPTER_ID = /https:\/\/www\.maofly\.com\/manga\/([0-9]+)\/([0-9]+)\.html/;
const PATTERN_FULL_TIME = /[0-9]{4}-[0-9]{2}-[0-9]{2}/;
const PATTERN_SCRIPT = /let img_data = "(.+)"/;

class ManHuaMao extends Base {
  constructor() {
    const userAgent =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';
    super({
      score: 1,
      id: Plugin.MHM,
      name: 'manhuamao',
      shortName: 'MHM',
      description: '漫画猫：网站挂了，已失效',
      href: 'https://www.maofly.com',
      userAgent,
      defaultHeaders: { 'User-Agent': userAgent },
      config: { origin: { label: '域名', value: 'https://www.maofly.com' } },
      option: { discovery: discoveryOptions, search: [] },
      disabled: true,
    });
  }

  prepareDiscoveryFetch: Base['prepareDiscoveryFetch'] = (page, { type, region, status }) => {
    return {
      url: `https://www.maofly.com/list/a-${region === Options.Default ? 0 : region}-c-${
        type === Options.Default ? 0 : type
      }-t-0-y-0-i-0-m-${status === Options.Default ? 0 : status}-page-${page}.html`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareSearchFetch: Base['prepareSearchFetch'] = (keyword, page) => {
    return {
      url: `https://www.maofly.com/search.html?q=${keyword}&page=${page}`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareMangaInfoFetch: Base['prepareMangaInfoFetch'] = (mangaId) => {
    return {
      url: `https://www.maofly.com/manga/${mangaId}.html`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareChapterListFetch: Base['prepareChapterListFetch'] = () => {};
  prepareChapterFetch: Base['prepareChapterFetch'] = (mangaId, chapterId) => {
    return {
      url: `https://www.maofly.com/manga/${mangaId}/${chapterId}.html`,
      headers: new Headers(this.defaultHeaders),
    };
  };

  handleDiscovery: Base['handleDiscovery'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    const list: IncreaseManga[] = [];

    ($('div.comic-book-unit').toArray() as cheerio.TagElement[]).forEach((div) => {
      const $$ = cheerio.load(div);
      const img = $$('a img.comic-book-cover');

      const href = $$('a.d-block').attr('href') || '';
      const title = $$('div.media-body h2 a').first().text() || '';
      const cover = img.attr('src') || img.attr('data-original') || '';
      const author = (
        $$('div.media-body div.comic-creators ul a').toArray() as cheerio.TagElement[]
      ).map((a) => a.children[0].data || '');
      const tags = (
        $$(
          'div.media-body div.comic-categories li.list-inline-item span.badge'
        ).toArray() as cheerio.TagElement[]
      ).map((span) => (span.children[0].data || '').trim());
      const [, mangaId] = href.match(PATTERN_MANGA_ID) || [];

      let status = MangaStatus.Unknown;
      if (tags.includes('连载中')) {
        status = MangaStatus.Serial;
      }
      if (tags.includes('已完结')) {
        status = MangaStatus.End;
      }

      list.push({
        href,
        hash: Base.combineHash(this.id, mangaId),
        source: this.id,
        sourceName: this.name,
        mangaId,
        title,
        status,
        cover,
        author,
        tag: tags.filter((tag) => tag !== '连载中' && tag !== '已完结'),
      });
    });

    return { discovery: list };
  };

  handleSearch: Base['handleSearch'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    const list: IncreaseManga[] = [];

    $('div.comicbook-index')
      .toArray()
      .forEach((div) => {
        const $$ = cheerio.load(div);
        const img = $$('a.d-block img');

        const href = $$('a.d-block').attr('href') || '';
        const title = $$('a.d-block').attr('title') || '';
        const cover = img.attr('src') || img.attr('data-original') || '';
        const [, mangaId] = href.match(PATTERN_MANGA_ID) || [];
        const author = ($$('div.comic-author a').toArray() as cheerio.TagElement[]).map(
          (a) => a.children[0].data || ''
        );

        list.push({
          href,
          hash: Base.combineHash(this.id, mangaId),
          source: this.id,
          sourceName: this.name,
          mangaId,
          title,
          status: MangaStatus.Unknown,
          cover,
          author,
        });
      });

    return { search: list };
  };

  handleMangaInfo: Base['handleMangaInfo'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    const manga: IncreaseManga = {
      href: '',
      hash: '',
      source: this.id,
      sourceName: this.name,
      mangaId: '',
      cover: '',
      title: '',
      latest: '',
      updateTime: '',
      author: [],
      tag: [],
      status: MangaStatus.Unknown,
      chapters: [],
    };
    const chapters: ChapterItem[] = [];

    const title = $('meta[property=og:novel:book_name]').first().attr('content') || '';
    const cover = $('meta[property=og:image]').first().attr('content') || '';
    const author = [$('meta[property=og:novel:author]').first().attr('content') || ''];
    const statusLabel = $('meta[property=og:novel:status]').first().attr('content') || '';
    const updateTimeLabel = $('meta[property=og:novel:update_time]').first().attr('content') || '';
    const href = $('meta[property=og:url]').first().attr('content') || '';
    const tags = ($('div.comic-info ul.tags li a').toArray() as cheerio.TagElement[])
      .map((a) => (a.children[0].data || '').trim())
      .filter((tag) => tag !== '连载中' && tag !== '已完结');
    const [updateTime = ''] = updateTimeLabel.match(PATTERN_FULL_TIME) || [];
    const [, mangaId] = href.match(PATTERN_MANGA_ID) || [];

    ($('ol.links-of-books li a').toArray() as cheerio.TagElement[]).forEach((a) => {
      const [, , chapterId] = a.attribs.href.match(PATTERN_CHAPTER_ID) || [];

      chapters.push({
        hash: Base.combineHash(this.id, mangaId, chapterId),
        mangaId,
        chapterId,
        href: a.attribs.href,
        title: a.attribs.title,
      });
    });

    if (statusLabel === '连载中') {
      manga.status = MangaStatus.Serial;
    }
    if (statusLabel === '已完结') {
      manga.status = MangaStatus.End;
    }

    manga.href = href;
    manga.mangaId = mangaId;
    manga.hash = Base.combineHash(this.id, mangaId);
    manga.title = title;
    manga.cover = cover;
    manga.latest = chapters.length > 0 ? chapters[0].title : '';
    manga.updateTime = updateTime;
    manga.author = author;
    manga.tag = tags;
    manga.chapters = chapters;

    return { manga };
  };

  handleChapterList: Base['handleChapterList'] = () => {
    return { error: new Error(ErrorMessage.NoSupport + 'handleChapterList') };
  };

  handleChapter: Base['handleChapter'] = (text: string | null) => {
    const $ = cheerio.load(text || '');

    const name = $('div.comic-detail h1.text-center a').first().text();
    const title = $('div.comic-detail h2.text-center').first().text();
    const [, mangaId, chapterId] =
      ($('link[rel=canonical]').first().attr('href') || '').match(PATTERN_CHAPTER_ID) || [];
    const scriptContent =
      ($('script:not([src]):not([type])').toArray() as cheerio.TagElement[]).filter((script) =>
        PATTERN_SCRIPT.test(script.children[0].data || '')
      )[0].children[0].data || '';
    const [, base64] = scriptContent.match(PATTERN_SCRIPT) || [];

    const images = (LZString.decompressFromBase64(base64) || '')
      .split(',')
      .map((pathname) => encodeURI(decodeURI(`https://mao.mhtupian.com/uploads/${pathname}`)));

    return {
      canLoadMore: false,
      chapter: {
        hash: Base.combineHash(this.id, mangaId, chapterId),
        mangaId,
        chapterId,
        name,
        title,
        headers: {
          ...this.defaultHeaders,
          referer: 'https://www.maofly.com/',
          accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'accept-encoding': 'gzip, deflate, br',
          'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
        images: images.map((uri) => ({ uri })),
      },
    };
  };
}

export default new ManHuaMao();
