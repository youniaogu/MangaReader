import Base, { Plugin, Options } from './base';
import { MangaStatus, ErrorMessage } from '~/utils';
import moment from 'moment';
import * as cheerio from 'cheerio';

const discoveryOptions = [
  {
    name: 'type',
    options: [
      { label: '选择分类', value: Options.Default },
      { label: '熱血', value: '31' },
      { label: '戀愛', value: '26' },
      { label: '校園', value: '1' },
      { label: '冒險', value: '2' },
      { label: '科幻', value: '25' },
      { label: '生活', value: '11' },
      { label: '懸疑', value: '17' },
      { label: '魔法', value: '15' },
      { label: '運動', value: '34' },
    ],
  },
  {
    name: 'status',
    options: [
      { label: '选择状态', value: Options.Default },
      { label: '連載中', value: '1' },
      { label: '完結', value: '2' },
    ],
  },
  {
    name: 'sort',
    options: [
      { label: '选择排序', value: Options.Default },
      { label: '人氣', value: '10' },
      { label: '更新時間', value: '2' },
    ],
  },
];

const PATTERN_MANGA_ID = /\/(.+)\//;
const PATTERN_SCRIPT_MANGA_ID = /var MANGABZ_COMIC_MID=([0-9]+);/;
const PATTERN_CHAPTER_ID = /\/(.+)\//;
const PATTERN_TODAY = /(今天 [0-9]{2}:[0-9]{2})/;
const PATTERN_YESTERDAY = /(昨天 [0-9]{2}:[0-9]{2})/;
const PATTERN_BEFORE_YESTERDAY = /(前天 [0-9]{2}:[0-9]{2})/;
const PATTERN_MMDD = /([0-9]{2}月[0-9]{2}號)/;
const PATTERN_YYYYMMDD = /([0-9]{4}-[0-9]{2}-[0-9]{2})/;
const PATTERN_IMAGE_INDEX = /\/([0-9]+)_.*/;
const PATTERN_EVAL = /^eval(.*)/;
const PATTERN_CHAPTER_TITLE = /var MANGABZ_CTITLE = "([^"]+)";/;
const PATTERN_CHAPTER_DATE = /var MANGABZ_VIEWSIGN_DT="([^"]+)";/;
const PATTERN_CHAPTER_SIGN = /var MANGABZ_VIEWSIGN="([^"]+)";/;

class MangaBZ extends Base {
  constructor() {
    const userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';
    super({
      score: 5,
      id: Plugin.MBZ,
      name: '漫画bz',
      shortName: 'MBZ',
      description: '需要代理',
      href: 'https://mangabz.com',
      userAgent,
      defaultHeaders: { 'User-Agent': userAgent, Referer: 'https://mangabz.com/' },
      option: { discovery: discoveryOptions, search: [] },
    });
  }

  prepareDiscoveryFetch: Base['prepareDiscoveryFetch'] = (page, { type, status, sort }) => {
    if (type === Options.Default) {
      type = '0';
    }
    if (status === Options.Default) {
      status = '0';
    }
    if (sort === Options.Default) {
      sort = '2';
    }

    return {
      url: `https://mangabz.com/manga-list-${type}-${status}-${sort}-p${page}/`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareSearchFetch: Base['prepareSearchFetch'] = (keyword, page) => {
    return {
      url: `https://mangabz.com/search?title=${keyword}&page=${page}`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareMangaInfoFetch: Base['prepareMangaInfoFetch'] = (mangaId) => {
    return {
      url: `https://mangabz.com/${mangaId}/`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareChapterListFetch: Base['prepareChapterListFetch'] = () => {};
  prepareChapterFetch: Base['prepareChapterFetch'] = (mangaId, chapterId, page, extra) => {
    if (typeof extra.sign === 'string' && typeof extra.date === 'string') {
      const cid = chapterId.replace('m', '');
      const mid = mangaId.replace('bz', '');
      return {
        url: `https://mangabz.com/${chapterId}/chapterimage.ashx?cid=${cid}&page=${page}&key=&_cid=${cid}&_mid=${mid}&_dt=${extra.date}&_sign=${extra.sign}`,
        headers: new Headers(this.defaultHeaders),
      };
    }
    return {
      url: `https://mangabz.com/${chapterId}/`,
      headers: new Headers(this.defaultHeaders),
    };
  };

  handleDiscovery: Base['handleDiscovery'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    const list: IncreaseManga[] = [];

    $('.mh-list .mh-item')
      .toArray()
      .forEach((div) => {
        const $$ = cheerio.load(div);

        const cover = $$('img.mh-cover').attr('src');
        const title = $$('.mh-item-detali .title a').first().text();
        const href = $$('a').first().attr('href') || '';
        const latest = $$('.chapter a').first().text();
        const statusLabel = $$('.chapter span').first().text();
        const [, mangaId] = href.match(PATTERN_MANGA_ID) || [];

        let status = MangaStatus.Unknown;
        if (statusLabel === '最新') {
          status = MangaStatus.Serial;
        }
        if (statusLabel === '完結') {
          status = MangaStatus.End;
        }

        list.push({
          href: `https://mangabz.com/${mangaId}/`,
          hash: Base.combineHash(this.id, mangaId),
          source: this.id,
          sourceName: this.name,
          headers: this.defaultHeaders,
          mangaId,
          title,
          status,
          bookCover: cover,
          latest,
        });
      });

    return { discovery: list };
  };

  handleSearch: Base['handleSearch'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    const list: IncreaseManga[] = [];

    $('.mh-list .mh-item')
      .toArray()
      .forEach((div) => {
        const $$ = cheerio.load(div);

        const cover = $$('img.mh-cover').attr('src');
        const title = $$('.mh-item-detali .title a').first().text();
        const href = $$('a').first().attr('href') || '';
        const latest = $$('.chapter a').first().text();
        const statusLabel = $$('.chapter span').first().text();
        const [, mangaId] = href.match(PATTERN_MANGA_ID) || [];

        let status = MangaStatus.Unknown;
        if (statusLabel === '最新') {
          status = MangaStatus.Serial;
        }
        if (statusLabel === '完結') {
          status = MangaStatus.End;
        }

        list.push({
          href: `https://mangabz.com/${mangaId}/`,
          hash: Base.combineHash(this.id, mangaId),
          source: this.id,
          sourceName: this.name,
          headers: this.defaultHeaders,
          mangaId,
          title,
          status,
          bookCover: cover,
          latest,
        });
      });

    return { search: list };
  };

  handleMangaInfo: Base['handleMangaInfo'] = (text: string | null) => {
    const $ = cheerio.load(text || '');

    const scriptContent =
      ($('script:not([src])').toArray() as cheerio.TagElement[]).filter((script) =>
        PATTERN_SCRIPT_MANGA_ID.test(script.children[0].data || '')
      )[0].children[0].data || '';
    const [, id] = scriptContent.match(PATTERN_SCRIPT_MANGA_ID) || [];
    const mangaId = id + 'bz';
    const cover = $('.detail-info img.detail-info-cover').first().attr('src');
    const title = $('.detail-info p.detail-info-title').first().text().trim();
    const author = (
      $('.detail-info-tip > span').eq(0).children().toArray() as cheerio.TagElement[]
    ).map((a) => a.children[0].data || '');
    const statusLabel = $('.detail-info-tip > span').eq(1).text();
    const tag = (
      $('.detail-info-tip > span').eq(2).children().toArray() as cheerio.TagElement[]
    ).map((a) => a.children[0].data || '');
    const latest = $('.detail-list-form-title span.s a').first().text() || '';
    const dateLabel = $('.detail-list-form-title').first().text() || '';
    const [, today] = dateLabel.match(PATTERN_TODAY) || [];
    const [, yesterday] = dateLabel.match(PATTERN_YESTERDAY) || [];
    const [, beforeYesterday] = dateLabel.match(PATTERN_BEFORE_YESTERDAY) || [];
    const [, MMDD] = dateLabel.match(PATTERN_MMDD) || [];
    const [, YYYYMMDD] = dateLabel.match(PATTERN_YYYYMMDD) || [];

    const chapters = (
      $('#chapterlistload a.detail-list-form-item').toArray() as cheerio.TagElement[]
    ).map((a) => {
      const chapterHref = a.attribs.href;
      const chapterTitle = (a.children[0].data || '').trim();
      const [, chapterId] = chapterHref.match(PATTERN_CHAPTER_ID) || [];

      return {
        hash: Base.combineHash(this.id, mangaId, chapterId),
        mangaId,
        chapterId,
        href: `https://mangabz.com/${chapterId}/`,
        title: chapterTitle,
      };
    });

    let updateTime;
    if (today) {
      updateTime = moment(today, '今天 HH:mm').format('YYYY-MM-DD');
    } else if (yesterday) {
      updateTime = moment(yesterday, '昨天 HH:mm').subtract(1, 'day').format('YYYY-MM-DD');
    } else if (beforeYesterday) {
      updateTime = moment(beforeYesterday, '前天 HH:mm').subtract(2, 'day').format('YYYY-MM-DD');
    } else if (MMDD) {
      updateTime = moment(MMDD, 'MM月DD號').format('YYYY-MM-DD');
    } else if (YYYYMMDD) {
      updateTime = YYYYMMDD;
    }

    let status = MangaStatus.Unknown;
    if (statusLabel.includes('連載中')) {
      status = MangaStatus.Serial;
    } else if (statusLabel.includes('已完結')) {
      status = MangaStatus.End;
    }

    return {
      manga: {
        href: `https://mangabz.com/${mangaId}/`,
        hash: Base.combineHash(this.id, mangaId),
        source: this.id,
        sourceName: this.name,
        mangaId: mangaId,
        infoCover: cover,
        latest,
        title,
        updateTime,
        author,
        tag,
        status,
        chapters,
      },
    };
  };

  handleChapterList: Base['handleChapterList'] = () => {
    return { error: new Error(ErrorMessage.NoSupport + 'handleChapterList') };
  };

  handleChapter: Base['handleChapter'] = (
    text: string | null,
    mangaId: string,
    chapterId: string,
    page: number
  ) => {
    if (!PATTERN_EVAL.test(text || '')) {
      const $ = cheerio.load(text || '');
      const scriptContent =
        ($('script:not([src])').toArray() as cheerio.TagElement[]).filter(
          (script) =>
            PATTERN_CHAPTER_TITLE.test(script.children[0].data || '') &&
            PATTERN_CHAPTER_DATE.test(script.children[0].data || '') &&
            PATTERN_CHAPTER_SIGN.test(script.children[0].data || '')
        )[0].children[0].data || '';
      const [, title] = scriptContent.match(PATTERN_CHAPTER_TITLE) || [];
      const [, date] = scriptContent.match(PATTERN_CHAPTER_DATE) || [];
      const [, sign] = scriptContent.match(PATTERN_CHAPTER_SIGN) || [];

      return {
        canLoadMore: true,
        chapter: {
          hash: Base.combineHash(this.id, mangaId, chapterId),
          mangaId,
          chapterId,
          title,
          headers: this.defaultHeaders,
          images: [],
        },
        nextExtra: {
          sign,
          date: moment(date, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD+HH:mm:ss'),
        },
        nextPage: 1,
      };
    }

    // eslint-disable-next-line no-eval
    const images: string[] = eval(text || '');
    const [, last] = images[images.length - 1].match(PATTERN_IMAGE_INDEX) || [];

    return {
      canLoadMore: images.length >= 2,
      chapter: {
        hash: Base.combineHash(this.id, mangaId, chapterId),
        mangaId,
        chapterId,
        headers: this.defaultHeaders,
        images: images
          .filter((item) => Number((item.match(PATTERN_IMAGE_INDEX) || [])[1]) >= page)
          .map((item) => ({ uri: item })),
      },
      nextPage: Number(last) + 1,
    };
  };
}

export default new MangaBZ();
