import Base, { Plugin, Options } from './base';
import { MangaStatus, ErrorMessage, ScrambleType } from '~/utils';
import { Platform } from 'react-native';
import * as cheerio from 'cheerio';

const discoveryOptions = [
  {
    name: 'type',
    options: [
      { label: '选择分类', value: Options.Default },
      { label: '其他类', value: 'another' },
      { label: '同人', value: 'doujin' },
      { label: '韩漫', value: 'hanman' },
      { label: '美漫', value: 'meiman' },
      { label: '短篇', value: 'short' },
      { label: '单本', value: 'single' },
    ],
  },
  {
    name: 'sort',
    options: [
      { label: '选择排序', value: Options.Default },
      { label: '最新', value: 'mr' },
      { label: '最多订阅', value: 'mv' },
      { label: '最多图片', value: 'mp' },
      { label: '最高评分', value: 'tr' },
      { label: '最多评论', value: 'md' },
      { label: '最多爱心', value: 'tf' },
    ],
  },
];
const searchOptions = [
  {
    name: 'time',
    options: [
      { label: '选择时间', value: Options.Default },
      { label: '一天内', value: 't' },
      { label: '一周内', value: 'w' },
      { label: '一个月内', value: 'm' },
    ],
  },
  {
    name: 'sort',
    options: [
      { label: '选择排序', value: Options.Default },
      { label: '最新的', value: 'mr' },
      { label: '最多点阅', value: 'mv' },
      { label: '最多图片', value: 'mp' },
      { label: '最多爱心', value: 'tf' },
    ],
  },
];

const PATTERN_MANGA_ID = /\/album\/([0-9]+)/;
const PATTERN_CHAPTER_ID = /\/photo\/(.+)/;
const PATTERN_SCRIPT_MANGA_ID = /var series_id = (.+);/;
const PATTERN_SCRIPT_CHAPTER_ID = /var aid = (.+);/;
const PATTERN_SCRIPT_SCRAMBLE_ID = /var scramble_id = (.+);/;
const PATTERN_HTTP_URL = /(https?:\/\/[^\s/$.?#].[^\s]*)/;

class CopyManga extends Base {
  constructor() {
    const userAgent =
      Platform.OS === 'android'
        ? 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Mobile Safari/537.36'
        : 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
    super({
      score: 5,
      id: Plugin.JMC,
      name: '禁漫天堂',
      shortName: 'JMC',
      description: '需要代理，屏蔽日本ip',
      href: 'https://jmcomic.me',
      userAgent,
      defaultHeaders: {
        'User-Agent': userAgent,
        Host: 'jmcomic.me',
        Referer: 'https://jmcomic.me',
      },
      option: { discovery: discoveryOptions, search: searchOptions },
    });
  }

  prepareDiscoveryFetch: Base['prepareDiscoveryFetch'] = (page, { type, sort }) => {
    return {
      url: `https://jmcomic.me/albums${type === Options.Default ? '' : `/${type}`}`,
      body: {
        o: sort === Options.Default ? 'mr' : sort,
        page,
      },
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareSearchFetch: Base['prepareSearchFetch'] = (keyword, page, { time, sort }) => {
    return {
      url: 'https://jmcomic.me/search/photos',
      body: {
        main_tag: 0,
        search_query: keyword,
        t: time === Options.Default ? 'a' : sort,
        o: sort === Options.Default ? 'mr' : sort,
        page,
      },
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareMangaInfoFetch: Base['prepareMangaInfoFetch'] = (mangaId) => {
    return {
      url: `https://jmcomic.me/album/${mangaId}`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareChapterListFetch: Base['prepareChapterListFetch'] = () => {};
  prepareChapterFetch: Base['prepareChapterFetch'] = (_mangaId, chapterId) => {
    return {
      url: `https://jmcomic.me/photo/${chapterId}`,
      headers: new Headers(this.defaultHeaders),
    };
  };

  handleDiscovery: Base['handleDiscovery'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    const list: IncreaseManga[] = [];

    this.checkCloudFlare($);

    $('div.row div.list-col')
      .has('div.thumb-overlay-albums')
      .toArray()
      .forEach((div) => {
        const $$ = cheerio.load(div);
        const a = $$('a').first();
        const img = $$('img');
        const title = img.attr('title') || '';
        const href = a.attr('href') || '';
        const src = img.attr('data-original') || img.attr('src') || img.attr('data-cfsrc') || '';
        const [, cover] = src.match(PATTERN_HTTP_URL) || [];
        const [, mangaId] = href.match(PATTERN_MANGA_ID) || [];

        const author = (
          $$('div.title-truncate:not(.video-title):not(.tags) a').toArray() as cheerio.TagElement[]
        )
          .filter((item) => item.children[0])
          .map((item) => item.children[0].data || '');
        const tag = ($$('div.title-truncate.tags a').toArray() as cheerio.TagElement[])
          .filter((item) => item.children[0])
          .map((item) => item.children[0].data || '');

        let status = MangaStatus.Unknown;
        if (tag.includes('連載中')) {
          status = MangaStatus.Serial;
        } else if (tag.includes('完結')) {
          status = MangaStatus.End;
        }

        list.push({
          href: 'https://jmcomic.me' + href,
          hash: Base.combineHash(this.id, mangaId),
          source: this.id,
          sourceName: this.name,
          headers: this.defaultHeaders,
          mangaId,
          title,
          status,
          bookCover: cover,
          author,
          tag,
        });
      });

    return { discovery: list };
  };

  handleSearch: Base['handleSearch'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    const list: IncreaseManga[] = [];

    this.checkCloudFlare($);

    $('div.row div.list-col')
      .has('div.thumb-overlay')
      .toArray()
      .forEach((div) => {
        const $$ = cheerio.load(div);
        const a = $$('a').first();
        const img = $$('img');
        const title = img.attr('title') || '';
        const href = a.attr('href') || '';
        const src = img.attr('data-original') || img.attr('src') || img.attr('data-cfsrc') || '';
        const [, cover] = src.match(PATTERN_HTTP_URL) || [];
        const [, mangaId] = href.match(PATTERN_MANGA_ID) || [];

        const author = (
          $$('div.title-truncate:not(.video-title):not(.tags) a').toArray() as cheerio.TagElement[]
        )
          .filter((item) => item.children[0])
          .map((item) => item.children[0].data || '');
        const tag = ($$('div.title-truncate.tags a').toArray() as cheerio.TagElement[])
          .filter((item) => item.children[0])
          .map((item) => item.children[0].data || '');

        let status = MangaStatus.Unknown;
        if (tag.includes('連載中')) {
          status = MangaStatus.Serial;
        } else if (tag.includes('完結')) {
          status = MangaStatus.End;
        }

        list.push({
          href: 'https://jmcomic.me' + href,
          hash: Base.combineHash(this.id, mangaId),
          source: this.id,
          sourceName: this.name,
          headers: this.defaultHeaders,
          mangaId,
          title,
          status,
          bookCover: cover,
          author,
          tag,
        });
      });

    return { search: list };
  };

  handleMangaInfo: Base['handleMangaInfo'] = (text: string | null) => {
    const $ = cheerio.load(text || '');

    this.checkCloudFlare($);

    const [, mangaId] =
      ($('meta[property=og:url]').attr('content') || '').match(PATTERN_MANGA_ID) || [];
    const href = `https://jmcomic.me/album/${mangaId}`;
    const title = $('h1#book-name').text() || '';
    const updateTime = $('span[itemprop=datePublished]').last().attr('content') || '';
    const img = $('div#album_photo_cover div.thumb-overlay img').first();
    const src = img.attr('data-original') || img.attr('src') || img.attr('data-cfsrc') || '';
    const [, cover] = src.match(PATTERN_HTTP_URL) || [];
    const tag = (
      $('div#intro-block div.tag-block span[data-type=tags] a').toArray() as cheerio.TagElement[]
    ).map((item) => item.children[0].data || '');
    const author = (
      $('div#intro-block div.tag-block span[data-type=author] a').toArray() as cheerio.TagElement[]
    ).map((item) => item.children[0].data || '');
    const chapters = (
      $('div#episode-block div.episode ul.btn-toolbar a').toArray() as cheerio.TagElement[]
    )
      .map((a) => {
        const $$ = cheerio.load(a);
        const chapterHref = a.attribs.href;
        const chapterTitle = ($$('li')[0] as cheerio.TagElement).children[0].data || '';
        const [, chapterId] = chapterHref.match(PATTERN_CHAPTER_ID) || [];

        return {
          hash: Base.combineHash(this.id, mangaId, chapterId),
          mangaId,
          chapterId,
          href: `https://jmcomic.me${chapterHref}`,
          title: chapterTitle.replaceAll(/[\r\n]+/g, '').trim(),
        };
      })
      .reverse();
    const firstChapterHref = $('a.reading').first().attr('href');
    const [, firstChapterId] = firstChapterHref?.match(PATTERN_CHAPTER_ID) || [];

    let status = MangaStatus.Unknown;
    if (tag.includes('連載中')) {
      status = MangaStatus.Serial;
    } else if (tag.includes('完結')) {
      status = MangaStatus.End;
    } else if (chapters.length <= 0) {
      status = MangaStatus.End;
    }

    if (chapters.length <= 0) {
      chapters.push({
        hash: Base.combineHash(this.id, mangaId, firstChapterId),
        mangaId,
        chapterId: firstChapterId,
        href: `https://jmcomic.me${firstChapterHref}`,
        title: '开始阅读',
      });
    }
    const latest = chapters[0].title || '';

    return {
      manga: {
        href,
        hash: Base.combineHash(this.id, mangaId),
        source: this.id,
        sourceName: this.name,
        mangaId: mangaId,
        infoCover: cover,
        title,
        latest,
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

  handleChapter: Base['handleChapter'] = (text: string | null) => {
    const $ = cheerio.load(text || '');

    this.checkCloudFlare($);

    const scriptContent =
      ($('script:not([src])').toArray() as cheerio.TagElement[]).filter(
        (script) =>
          PATTERN_SCRIPT_MANGA_ID.test(script.children[0].data || '') &&
          PATTERN_SCRIPT_CHAPTER_ID.test(script.children[0].data || '') &&
          PATTERN_SCRIPT_SCRAMBLE_ID.test(script.children[0].data || '')
      )[0].children[0].data || '';
    let [, mangaId] = scriptContent.match(PATTERN_SCRIPT_MANGA_ID) || [];
    const [, chapterId] = scriptContent.match(PATTERN_SCRIPT_CHAPTER_ID) || [];
    const [, scrambleId] = scriptContent.match(PATTERN_SCRIPT_SCRAMBLE_ID) || [];
    const title = $('div.container div.panel-heading div.pull-left').text().replaceAll('\n', '');
    const images = (
      $(
        'div.panel-body div.thumb-overlay-albums div.scramble-page img.lazy_img'
      ).toArray() as cheerio.TagElement[]
    ).map((img) => {
      const src = img.attribs['data-original'] || img.attribs.src || '';
      const [, image] = src.match(PATTERN_HTTP_URL) || [];
      return image;
    });

    if (mangaId === '0') {
      mangaId = chapterId;
    }

    return {
      canLoadMore: false,
      chapter: {
        hash: Base.combineHash(this.id, mangaId, chapterId),
        mangaId,
        chapterId,
        name: '',
        title,
        headers: {
          ...this.defaultHeaders,
          referer: 'https://jmcomic.me/',
          accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'accept-encoding': 'gzip, deflate, br',
          'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
        images: images.map((uri) => ({
          uri,
          type: ScrambleType.JMC,
          needUnscramble: !uri.includes('.gif') && Number(chapterId) >= Number(scrambleId),
        })),
      },
    };
  };
}

export default new CopyManga();
