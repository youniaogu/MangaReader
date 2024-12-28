import Base, { Plugin, Options } from './base';
import { MangaStatus, ErrorMessage } from '~/utils';
import * as cheerio from 'cheerio';

interface ChapterItem {
  chapter: string;
  id: string;
  last_update: string;
  manga: string;
  views: string;
}

const splitSymbol = '*';
const option = [
  {
    name: 'type',
    options: [
      { label: '选择分类', value: Options.Default },
      { label: '4 Koma', value: '4 Koma' },
      { label: 'Action', value: 'Action' },
      { label: 'Adult', value: 'Adult' },
      { label: 'Adventure', value: 'Adventure' },
      { label: 'Comedy', value: 'Comedy' },
      { label: 'Doujinshi', value: 'Doujinshi' },
      { label: 'Demons', value: 'Demons' },
      { label: 'Drama', value: 'Drama' },
      { label: 'Ecchi', value: 'Ecchi' },
      { label: 'Fantasy', value: 'Fantasy' },
      { label: 'Gender Bender', value: 'Gender Bender' },
      { label: 'Harem', value: 'Harem' },
      { label: 'Historical', value: 'Historical' },
      { label: 'Horror', value: 'Horror' },
      { label: 'Josei', value: 'Josei' },
      { label: 'Magic', value: 'Magic' },
      { label: 'Manhua', value: 'Manhua' },
      { label: 'Martial Art', value: 'Martial Art' },
      { label: 'Mature', value: 'Mature' },
      { label: 'Mecha', value: 'Mecha' },
      { label: 'Mystery', value: 'Mystery' },
      { label: 'One shot', value: 'One shot' },
      { label: 'Psychological', value: 'Psychological' },
      { label: 'Romance', value: 'Romance' },
      { label: 'School Life', value: 'School Life' },
      { label: 'Sci-fi', value: 'Sci-fi' },
      { label: 'Seinen', value: 'Seinen' },
      { label: 'Super Power', value: 'Super Power' },
      { label: 'Shoujo', value: 'Shoujo' },
      { label: 'Shoujo Ai', value: 'Shoujo Ai' },
      { label: 'Shounen', value: 'Shounen' },
      { label: 'Shounen Ai', value: 'Shounen Ai' },
      { label: 'Slice of Life', value: 'Slice of Life' },
      { label: 'Smut', value: 'Smut' },
      { label: 'Sports', value: 'Sports' },
      { label: 'Supernatural', value: 'Supernatural' },
      { label: 'Tragedy', value: 'Tragedy' },
      { label: 'Yaoi', value: 'Yaoi' },
    ],
  },
  {
    name: 'status',
    options: [
      { label: '选择状态', value: Options.Default },
      { label: 'Complete', value: '1' },
      { label: 'Incomplete', value: '2' },
    ],
  },
  {
    name: 'sort',
    options: [
      { label: '选择排序', value: Options.Default },
      { label: 'Name⬇️', value: ['name', 'DESC'].join(splitSymbol) },
      { label: 'Name⬆️', value: ['name', 'ASC'].join(splitSymbol) },
      { label: 'Most Views⬇️', value: ['views', 'DESC'].join(splitSymbol) },
      { label: 'Most Views⬆️', value: ['views', 'ASC'].join(splitSymbol) },
      { label: 'Last Update⬇️', value: ['last_update', 'DESC'].join(splitSymbol) },
      { label: 'Last Update⬆️', value: ['last_update', 'ASC'].join(splitSymbol) },
    ],
  },
];

const PATTERN_HREF_ID = /hwms-([^/]*)\.html/;
const PATTERN_LATEST_CHAPTER = /Last chapter: (.+)/;
const PATTERN_IMAGE_ALT = /Page [0-9]*/;

class KL extends Base {
  constructor() {
    const userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36';
    super({
      disabled: true,
      score: 1,
      id: Plugin.KL,
      name: 'kl漫画',
      shortName: 'KL',
      description: '不维护',
      href: 'https://klmanga.net',
      userAgent,
      defaultHeaders: { Referer: 'https://klmanga.net/', 'User-Agent': userAgent },
      option: { discovery: option, search: option },
    });
  }

  prepareDiscoveryFetch: Base['prepareDiscoveryFetch'] = (page, { type, region, status, sort }) => {
    let sortType;
    let sortOrder;
    if (type === Options.Default) {
      type = '';
    }
    if (region === Options.Default) {
      region = '';
    }
    if (status === Options.Default) {
      status = '';
    }
    if (sort === Options.Default) {
      sortType = 'last_update';
      sortOrder = 'DESC';
    } else {
      const [a = '', b = ''] = sort.split(splitSymbol) as [string, string];
      sortType = a;
      sortOrder = b;
    }

    return {
      url: 'https://klmanga.net/manga-list.html',
      body: {
        listType: 'pagination',
        page,
        m_status: status,
        genre: type,
        sort: sortType,
        sort_type: sortOrder,
      },
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareSearchFetch: Base['prepareSearchFetch'] = (
    keyword,
    page,
    { type, region, status, sort }
  ) => {
    let sortType;
    let sortOrder;
    if (type === Options.Default) {
      type = '';
    }
    if (region === Options.Default) {
      region = '';
    }
    if (status === Options.Default) {
      status = '';
    }
    if (sort === Options.Default) {
      sortType = '';
      sortOrder = '';
    } else {
      const [a = '', b = ''] = sort.split(splitSymbol) as [string, string];
      sortType = a;
      sortOrder = b;
    }

    return {
      url: 'https://klmanga.net/manga-list.html',
      body: {
        listType: 'pagination',
        name: keyword,
        page,
        m_status: status,
        genre: type,
        sort: sortType,
        sort_type: sortOrder,
      },
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareMangaInfoFetch: Base['prepareMangaInfoFetch'] = (mangaId) => {
    return {
      url: `https://klmanga.net/hwms-${mangaId}.html`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareChapterListFetch: Base['prepareChapterListFetch'] = (mangaId) => {
    return {
      url: `https://klmanga.net/app/manga/controllers/cont.listChapters.php?manga=${mangaId}`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareChapterFetch: Base['prepareChapterFetch'] = (mangaId, chapterId, _page, extra) => {
    if (typeof extra.cid === 'string') {
      return {
        url: `https://klmanga.net/app/manga/controllers/cont.listImg.php?cid=${extra.cid}`,
        headers: new Headers(this.defaultHeaders),
      };
    }

    return {
      url: `https://klmanga.net/bsaq-${mangaId}-chapter-${chapterId}.html`,
      headers: new Headers(this.defaultHeaders),
    };
  };

  handleDiscovery: Base['handleDiscovery'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    const list: IncreaseManga[] = [];

    $('div.bodythumb div.thumb-item-flow')
      .toArray()
      .forEach((div) => {
        const $$ = cheerio.load(div);

        const href = $$('div.series-title > a').attr('href') || '';
        const bg = $$('div.thumb-wrapper div.content').attr('data-bg') || '';
        const title = $$('div.series-title .title-thumb').text().trim() || '';
        const updateTime = $$('time.timeago').text() || '';
        const [, mangaId] = href.match(PATTERN_HREF_ID) || [];
        const [, latest] =
          ($$('div.thumb-detail a').text() || '').match(PATTERN_LATEST_CHAPTER) || [];

        let cover = bg;
        if (bg !== '' && !cover.includes('http')) {
          cover = 'https://klmanga.net' + bg;
        }

        list.push({
          href: 'https://klmanga.net/' + href,
          hash: Base.combineHash(this.id, mangaId),
          source: this.id,
          sourceName: this.name,
          headers: this.defaultHeaders,
          mangaId,
          title,
          status: MangaStatus.Unknown,
          bookCover: cover,
          latest,
          updateTime,
        });
      });

    return { discovery: list };
  };

  handleSearch: Base['handleSearch'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    const list: IncreaseManga[] = [];

    $('div.bodythumb div.thumb-item-flow')
      .toArray()
      .forEach((div) => {
        const $$ = cheerio.load(div);

        const href = $$('div.series-title > a').attr('href') || '';
        const bg = $$('div.thumb-wrapper div.content').attr('data-bg') || '';
        const title = $$('div.series-title .title-thumb').text().trim() || '';
        const updateTime = $$('time.timeago').text() || '';
        const [, mangaId] = href.match(PATTERN_HREF_ID) || [];
        const [, latest] =
          ($$('div.thumb-detail a').text() || '').match(PATTERN_LATEST_CHAPTER) || [];

        let cover = bg;
        if (bg !== '' && !bg.includes('http')) {
          cover = 'https://klmanga.net' + bg;
        }

        list.push({
          href: 'https://klmanga.net/' + href,
          hash: Base.combineHash(this.id, mangaId),
          source: this.id,
          sourceName: this.name,
          mangaId,
          title,
          status: MangaStatus.Unknown,
          bookCover: cover,
          latest,
          updateTime,
        });
      });

    return { search: list };
  };

  handleMangaInfo: Base['handleMangaInfo'] = (text: string | null) => {
    const $ = cheerio.load(text || '');

    const isChecking = $('title').first().text() === 'KLManga is checking.... ';
    if (isChecking) {
      throw new Error(ErrorMessage.DDoSRetry);
    }

    const href = $('link[rel=alternate]').attr('href') || '';
    const [, mangaId] = href.match(PATTERN_HREF_ID) || [];
    const bg = $('div.info-cover img.thumbnail').attr('src') || '';
    const title = $('.info-manga .breadcrumb li').last().text().trim();
    const updateTime = $('ul.manga-info i > span').text();
    const li = $('ul.manga-info > li').toArray();
    const statusList = li
      .filter((item) => cheerio.load(item)('b').text().includes('Status'))
      .map((item) => cheerio.load(item)('a').text());
    const author = li
      .filter((item) => cheerio.load(item)('b').text().includes('Magazine'))
      .map((item) => cheerio.load(item)('a').text());
    const tag = li
      .filter((item) => cheerio.load(item)('b').text().includes('Genre'))
      .map((item) =>
        (cheerio.load(item)('a').toArray() as cheerio.TagElement[]).map(
          (a) => a.children[0].data || ''
        )
      );

    let cover = bg;
    if (bg !== '' && !bg.includes('http')) {
      cover = 'https://klmanga.net' + bg;
    }

    let status = MangaStatus.Unknown;
    if (statusList.includes('Incomplete')) {
      status = MangaStatus.Serial;
    } else if (statusList.includes('Complete')) {
      status = MangaStatus.End;
    }

    return {
      manga: {
        href,
        hash: Base.combineHash(this.id, mangaId),
        source: this.id,
        sourceName: this.name,
        mangaId: mangaId,
        infoCover: cover,
        title,
        updateTime,
        author,
        tag: tag.flat(),
        status,
      },
    };
  };

  handleChapterList: Base['handleChapterList'] = (list: ChapterItem[], mangaId) => {
    const chapterList = list.map((item) => {
      const chapterId = item.chapter;
      const href = `https://klmanga.net/bsaq-${item.manga}-chapter-${item.chapter}.html`;
      const title = item.chapter;

      return {
        hash: Base.combineHash(this.id, mangaId, chapterId),
        mangaId,
        chapterId,
        href,
        title,
      };
    });

    return {
      chapterList: chapterList,
      canLoadMore: false,
    };
  };

  handleChapter: Base['handleChapter'] = (text: string | null, mangaId, chapterId) => {
    const $ = cheerio.load(text || '');

    if ($('meta').toArray().length > 0) {
      const cid = $('input#chapter').val();
      const [, , name = '', title = ''] = (
        $('div.chapter-content-top li span[itemprop=name]').toArray() as cheerio.TagElement[]
      ).map((span) => span.children[0].data);

      return {
        canLoadMore: true,
        nextExtra: { cid },
        chapter: {
          hash: Base.combineHash(this.id, mangaId, chapterId),
          mangaId,
          chapterId,
          name,
          title,
          headers: this.defaultHeaders,
          images: [],
        },
      };
    }

    const images = ($('p img').toArray() as cheerio.TagElement[])
      .filter((img) => PATTERN_IMAGE_ALT.test(img.attribs.alt))
      .map((img) => img.attribs.src);

    return {
      canLoadMore: false,
      chapter: {
        hash: Base.combineHash(this.id, mangaId, chapterId),
        mangaId,
        chapterId,
        headers: this.defaultHeaders,
        images: images.map((uri) => ({ uri: uri.replaceAll('\n', '') })),
      },
    };
  };
}

export default new KL();
