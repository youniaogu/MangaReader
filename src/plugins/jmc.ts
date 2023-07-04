import Base, { Plugin, Options } from './base';
import { MangaStatus, ErrorMessage } from '~/utils';
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
      'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';
    super({
      score: 5,
      id: Plugin.JMC,
      name: 'jmcomic',
      shortName: 'JMC',
      description: '禁漫天堂：主打韩漫、本子类，需要代理',
      href: 'https://18comic.vip',
      userAgent,
      defaultHeaders: {
        'User-Agent': userAgent,
        Host: '18comic.vip',
        Referer: 'https://18comic.vip',
      },
      config: { origin: { label: '域名', value: 'https://18comic.vip' } },
      option: { discovery: discoveryOptions, search: searchOptions },
    });
  }

  prepareDiscoveryFetch: Base['prepareDiscoveryFetch'] = (page, { type, sort }) => {
    return {
      url: `https://18comic.vip/albums${type === Options.Default ? '' : `/${type}`}`,
      body: {
        o: sort === Options.Default ? 'mr' : sort,
        page,
      },
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareSearchFetch: Base['prepareSearchFetch'] = (keyword, page, { time, sort }) => {
    return {
      url: 'https://18comic.vip/search/photos',
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
      url: `https://18comic.vip/album/${mangaId}`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareChapterListFetch: Base['prepareChapterListFetch'] = () => {};
  prepareChapterFetch: Base['prepareChapterFetch'] = (_mangaId, chapterId) => {
    return {
      url: `https://18comic.vip/photo/${chapterId}`,
      headers: new Headers(this.defaultHeaders),
    };
  };

  handleDiscovery: Base['handleDiscovery'] = (text: string | null) => {
    try {
      const $ = cheerio.load(text || '');
      const list: IncreaseManga[] = [];

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
            $$(
              'div.title-truncate:not(.video-title):not(.tags) a'
            ).toArray() as cheerio.TagElement[]
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
            href: 'https://18comic.vip' + href,
            hash: Base.combineHash(this.id, mangaId),
            source: this.id,
            sourceName: this.name,
            headers: this.defaultHeaders,
            mangaId,
            title,
            status,
            cover,
            author,
            tag,
          });
        });

      return { discovery: list };
    } catch (error) {
      if (error instanceof Error) {
        return { error };
      } else {
        return { error: new Error(ErrorMessage.Unknown) };
      }
    }
  };

  handleSearch: Base['handleSearch'] = (text: string | null) => {
    try {
      const $ = cheerio.load(text || '');
      const list: IncreaseManga[] = [];

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
            $$(
              'div.title-truncate:not(.video-title):not(.tags) a'
            ).toArray() as cheerio.TagElement[]
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
            href: 'https://18comic.vip' + href,
            hash: Base.combineHash(this.id, mangaId),
            source: this.id,
            sourceName: this.name,
            headers: this.defaultHeaders,
            mangaId,
            title,
            status,
            cover,
            author,
            tag,
          });
        });

      return { search: list };
    } catch (error) {
      if (error instanceof Error) {
        return { error };
      } else {
        return { error: new Error(ErrorMessage.Unknown) };
      }
    }
  };

  handleMangaInfo: Base['handleMangaInfo'] = (text: string | null) => {
    try {
      const $ = cheerio.load(text || '');

      const [, mangaId] =
        ($('meta[property=og:url]').attr('content') || '').match(PATTERN_MANGA_ID) || [];
      const href = `https://18comic.vip/album/${mangaId}`;
      const title = $('h1#book-name').text() || '';
      const updateTime = $('span[itemprop=datePublished]').last().attr('content') || '';
      const img = $('div#album_photo_cover div.thumb-overlay img').first();
      const src = img.attr('data-original') || img.attr('src') || img.attr('data-cfsrc') || '';
      const [, cover] = src.match(PATTERN_HTTP_URL) || [];
      const tag = (
        $('div#intro-block div.tag-block span[data-type=tags] a').toArray() as cheerio.TagElement[]
      ).map((item) => item.children[0].data || '');
      const author = (
        $(
          'div#intro-block div.tag-block span[data-type=author] a'
        ).toArray() as cheerio.TagElement[]
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
            href: `https://18comic.vip${chapterHref}`,
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
          href: `https://18comic.vip${firstChapterHref}`,
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
          cover,
          title,
          latest,
          updateTime,
          author,
          tag,
          status,
          chapters,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        return { error };
      } else {
        return { error: new Error(ErrorMessage.Unknown) };
      }
    }
  };

  handleChapterList: Base['handleChapterList'] = () => {
    return { error: new Error(ErrorMessage.NoSupport + 'handleChapterList') };
  };

  handleChapter: Base['handleChapter'] = (text: string | null) => {
    try {
      const $ = cheerio.load(text || '');

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
        chapter: {
          hash: Base.combineHash(this.id, mangaId, chapterId),
          mangaId,
          chapterId,
          name: '',
          title,
          headers: {
            ...this.defaultHeaders,
            referer: 'https://18comic.vip/',
            accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
          },
          images: images.map((uri) => ({
            uri,
            needUnscramble: !uri.includes('.gif') && Number(chapterId) >= Number(scrambleId),
          })),
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        return { error };
      } else {
        return { error: new Error(ErrorMessage.Unknown) };
      }
    }
  };
}

export default new CopyManga();
