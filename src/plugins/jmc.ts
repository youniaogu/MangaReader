import Base, { Plugin, Options } from './base';
import { MangaStatus } from '~/utils';
import md5 from 'blueimp-md5';
import * as cheerio from 'cheerio';

const options = {
  type: [
    { label: '选择分类', value: Options.Default },
    { label: '其他类', value: 'another' },
    { label: '同人', value: 'doujin' },
    { label: '韩漫', value: 'hanman' },
    { label: '美漫', value: 'meiman' },
    { label: '短篇', value: 'short' },
    { label: '单本', value: 'single' },
  ],
  region: [{ label: '选择地区', value: Options.Default }],
  status: [{ label: '选择状态', value: Options.Default }],
  sort: [
    { label: '选择排序', value: Options.Default },
    { label: '最新', value: 'mr' },
    { label: '最多订阅', value: 'mv' },
    { label: '最多图片', value: 'mp' },
    { label: '最高评分', value: 'tr' },
    { label: '最多评论', value: 'md' },
    { label: '最多爱心', value: 'tf' },
  ],
};

const PATTERN_MANGA_ID = /\/album\/([0-9]+)/;
const PATTERN_CHAPTER_ID = /\/photo\/(.+)/;
const PATTERN_SCRIPT_MANGA_ID = /var series_id = (.+);/;
const PATTERN_SCRIPT_CHAPTER_ID = /var aid = (.+);/;

class CopyManga extends Base {
  readonly userAgent =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';
  readonly defaultHeaders = { 'user-agent': this.userAgent };

  constructor(
    pluginID: Plugin,
    pluginName: string,
    pluginScore: number,
    pluginShortName: string,
    pluginDescription: string
  ) {
    super(
      pluginID,
      pluginName,
      pluginScore,
      pluginShortName,
      pluginDescription,
      options.type,
      options.region,
      options.status,
      options.sort
    );
  }

  is(hash: string) {
    const [plugin] = Base.splitHash(hash);
    return plugin === Plugin.JMC;
  }

  prepareDiscoveryFetch: Base['prepareDiscoveryFetch'] = (page, type, _region, _status, sort) => {
    return {
      url: `https://jmcomic.asia/albums${type === Options.Default ? '' : `/${type}`}`,
      body: {
        o: sort,
        page,
      },
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareSearchFetch: Base['prepareSearchFetch'] = (keyword, page) => {
    return {
      url: 'https://jmcomic.asia/search/photos',
      body: {
        main_tag: 0,
        search_query: keyword,
        page,
      },
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareMangaInfoFetch: Base['prepareMangaInfoFetch'] = (mangaId) => {
    return {
      url: `https://jmcomic.asia/album/${mangaId}`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareChapterListFetch: Base['prepareChapterListFetch'] = () => {};
  prepareChapterFetch: Base['prepareChapterFetch'] = (_mangaId, chapterId) => {
    return {
      url: `https://jmcomic.asia/photo/${chapterId}`,
      headers: new Headers(this.defaultHeaders),
    };
  };

  handleDiscovery: Base['handleDiscovery'] = (text: string | null) => {
    try {
      const $ = cheerio.load(text || '');
      const list: Manga[] = [];

      $('div.row div.list-col')
        .has('div.thumb-overlay-albums')
        .toArray()
        .forEach((div) => {
          const $$ = cheerio.load(div);
          const a = $$('a').first();
          const img = $$('img');
          const title = img.attr('title') || '';
          const href = a.attr('href') || '';
          const cover = img.attr('data-original') || img.attr('src') || '';
          const [, mangaId] = href.match(PATTERN_MANGA_ID) || [];

          const author = (
            $$(
              'div.title-truncate:not(.video-title):not(.tags) a'
            ).toArray() as cheerio.TagElement[]
          )
            .filter((item) => item.children[0])
            .map((item) => item.children[0].data)
            .join(',');
          const tag = ($$('div.title-truncate.tags a').toArray() as cheerio.TagElement[])
            .filter((item) => item.children[0])
            .map((item) => {
              return item.children[0].data;
            })
            .join(',');

          let status = MangaStatus.Unknown;
          if (tag.includes('連載中')) {
            status = MangaStatus.Serial;
          } else if (tag.includes('完結')) {
            status = MangaStatus.End;
          }

          list.push({
            href: 'https://jmcomic.asia' + href,
            hash: Base.combineHash(this.id, mangaId),
            source: this.id,
            sourceName: this.name,
            mangaId,
            title,
            status,
            cover,
            latest: '',
            updateTime: '',
            author,
            tag,
            chapters: [],
          });
        });

      return { discovery: list };
    } catch (error) {
      if (error instanceof Error) {
        return { error };
      } else {
        return { error: new Error('Unknown Error') };
      }
    }
  };

  handleSearch: Base['handleSearch'] = (text: string | null) => {
    try {
      const $ = cheerio.load(text || '');
      const list: Manga[] = [];

      $('div.row div.list-col')
        .has('div.thumb-overlay')
        .toArray()
        .forEach((div) => {
          const $$ = cheerio.load(div);
          const a = $$('a').first();
          const img = $$('img');
          const title = img.attr('title') || '';
          const href = a.attr('href') || '';
          const cover = img.attr('data-original') || img.attr('src') || '';
          const [, mangaId] = href.match(PATTERN_MANGA_ID) || [];

          const author = (
            $$(
              'div.title-truncate:not(.video-title):not(.tags) a'
            ).toArray() as cheerio.TagElement[]
          )
            .filter((item) => item.children[0])
            .map((item) => item.children[0].data)
            .join(',');
          const tag = ($$('div.title-truncate.tags a').toArray() as cheerio.TagElement[])
            .filter((item) => item.children[0])
            .map((item) => {
              return item.children[0].data;
            })
            .join(',');

          let status = MangaStatus.Unknown;
          if (tag.includes('連載中')) {
            status = MangaStatus.Serial;
          } else if (tag.includes('完結')) {
            status = MangaStatus.End;
          }

          list.push({
            href: 'https://jmcomic.asia' + href,
            hash: Base.combineHash(this.id, mangaId),
            source: this.id,
            sourceName: this.name,
            mangaId,
            title,
            status,
            cover,
            latest: '',
            updateTime: '',
            author,
            tag,
            chapters: [],
          });
        });

      return { search: list };
    } catch (error) {
      if (error instanceof Error) {
        return { error };
      } else {
        return { error: new Error('Unknown Error') };
      }
    }
  };

  handleMangaInfo: Base['handleMangaInfo'] = (text: string | null) => {
    try {
      const $ = cheerio.load(text || '');

      const href = $('meta[property=og:url]').attr('content') || '';
      const [, mangaId] = href.match(PATTERN_MANGA_ID) || [];
      const title = $('h1#book-name').text() || '';
      const updateTime = $('span[itemprop=datePublished]').last().attr('content') || '';
      const cover = $('div.show_zoom img').first().attr('src') || '';
      const tag = (
        $('div#intro-block div.tag-block span[data-type=tags] a').toArray() as cheerio.TagElement[]
      )
        .map((item) => item.children[0].data)
        .join(',');
      const author = (
        $(
          'div#intro-block div.tag-block span[data-type=author] a'
        ).toArray() as cheerio.TagElement[]
      )
        .map((item) => item.children[0].data)
        .join(',');
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
            href: `https://jmcomic.asia${chapterHref}`,
            title: chapterTitle.replaceAll('\n', ''),
          };
        })
        .reverse();
      const firstChapterHref = $('div.visible-lg div.read-block a.reading').first().attr('href');
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
          href: `https://jmcomic.asia${firstChapterHref}`,
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
        return { error: new Error('Unknown Error') };
      }
    }
  };

  handleChapterList: Base['handleChapterList'] = () => {
    return { error: new Error('Plugin JMC not support handleChapterList') };
  };

  handleChapter: Base['handleChapter'] = (text: string | null) => {
    try {
      const $ = cheerio.load(text || '');

      const scriptContent =
        ($('script:not([src]):not([type])').toArray() as cheerio.TagElement[]).filter(
          (script) =>
            PATTERN_SCRIPT_MANGA_ID.test(script.children[0].data || '') &&
            PATTERN_SCRIPT_CHAPTER_ID.test(script.children[0].data || '')
        )[0].children[0].data || '';
      let [, mangaId] = scriptContent.match(PATTERN_SCRIPT_MANGA_ID) || [];
      const [, chapterId] = scriptContent.match(PATTERN_SCRIPT_CHAPTER_ID) || [];
      const title = $('div.container div.panel-heading div.pull-left').text().replaceAll('\n', '');
      const images = (
        $(
          'div.panel-body div.thumb-overlay-albums div.scramble-page img.lazy_img'
        ).toArray() as cheerio.TagElement[]
      ).map((img) => img.attribs['data-original'] || img.attribs.src);

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
            referer: 'https://jmcomic.asia/',
            accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            pragma: 'no-cache',
            'cache-control': 'no-cache',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
          },
          images,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        return { error };
      } else {
        return { error: new Error('Unknown Error') };
      }
    }
  };
}

function getChapterId(uri: string) {
  const [, id] = uri.match(/\/([0-9]+)\//) || [];
  return Number(id);
}
function getPicIndex(uri: string) {
  const [, index] = uri.match(/\/([0-9]+)\./) || [];
  return index;
}
function getSplitNum(id: number, index: string) {
  var a = 10;
  if (id >= 268850) {
    const str = md5(id + index);
    const nub = str.substring(str.length - 1).charCodeAt(0) % 10;

    switch (nub) {
      case 0:
        a = 2;
        break;
      case 1:
        a = 4;
        break;
      case 2:
        a = 6;
        break;
      case 3:
        a = 8;
        break;
      case 4:
        a = 10;
        break;
      case 5:
        a = 12;
        break;
      case 6:
        a = 14;
        break;
      case 7:
        a = 16;
        break;
      case 8:
        a = 18;
        break;
      case 9:
        a = 20;
    }
  }
  return a;
}
export function unscramble(uri: string, width: number, height: number) {
  const step = [];
  const id = getChapterId(uri);
  const index = getPicIndex(uri);
  const numSplit = getSplitNum(id, index);
  const perheight = height % numSplit;

  for (let i = 0; i < numSplit; i++) {
    let sy = Math.floor(height / numSplit);
    let sHeight = sy * i;
    const dy = height - sy * (i + 1) - perheight;

    if (i === 0) {
      sy += perheight;
    } else {
      sHeight += perheight;
    }

    step.push({
      dx: 0,
      dy,
      sx: width,
      sy,
      sWidth: 0,
      sHeight,
      dWidth: width,
      dHeight: sy,
    });
  }

  return step;
}

export default new CopyManga(Plugin.JMC, 'jmcomic', 5, 'JMC', '禁漫天堂，主打韩漫、本子类');
