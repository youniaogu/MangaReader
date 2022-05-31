import { firstMatch, FetchData } from '~/utils';
import { Plugin } from '~/plugins';
import queryString from 'query-string';
import LZString from 'lz-string';
import cheerio from 'cheerio';
import Base from './base';

const { env, UpdateStatus } = window;
const PATTERN_MANGA_ID = /^https:\/\/m\.manhuagui\.com\/comic\/[0-9]+(?=\/$|$)/g;
const PATTERN_CHAPTER_ID = /^https:\/\/m\.manhuagui\.com\/comic\/[0-9]+\/[0-9]+(?=\.html|$)/g;
const PATTERN_SCRIPT = /^window\["\\x65\\x76\\x61\\x6c"\].+(?=$)/g;
const PATTERN_READER_DATA = /^SMH\.reader\(.+(?=\)\.preInit\(\);)/g;

const PATTERN_MANGA_INFO = /{ bid:([0-9]*), status:([0|1]),block_cc:'' }/;

class ManHuaGuiMobile extends Base {
  constructor(pluginID: Plugin, pluginName: string) {
    super(pluginID, pluginName);
  }

  prepareUpdateFetch(page: number): FetchData {
    if (process.env.NODE_ENV === env.DEV) {
      return {
        url: process.env.PROXY + '/update',
        body: {
          page,
          ajax: 1,
          order: 1,
        },
      };
    }

    return {
      url: 'https://m.manhuagui.com/update/',
      body: {
        page,
        ajax: 1,
        order: 1,
      },
    };
  }
  prepareSearchFetch(keyword: string, page: number): FetchData {
    const body = new FormData();
    body.append('key', keyword);
    body.append('page', String(page));
    body.append('ajax', '1');
    body.append('order', '1');

    if (process.env.NODE_ENV === env.DEV) {
      return {
        url: process.env.PROXY + '/search',
        method: 'POST',
        body: page > 1 ? body : undefined,
      };
    }

    return {
      url: `https://m.manhuagui.com/s/${keyword}.html/`,
      method: 'POST',
      body: page > 1 ? body : undefined,
    };
  }
  prepareMangaFetch(mangaId: string): FetchData {
    if (process.env.NODE_ENV === env.DEV) {
      return {
        url: process.env.PROXY + '/manga',
      };
    }

    return {
      url: 'https://m.manhuagui.com/comic/' + mangaId,
    };
  }
  prepareChapterFetch(mangaId: string, chapterId: string): FetchData {
    if (process.env.NODE_ENV === env.DEV) {
      return {
        url: process.env.PROXY + '/chapter',
      };
    }

    return {
      url: `https://m.manhuagui.com/comic/${mangaId}/${chapterId}.html`,
    };
  }

  handleUpdate(text: string): Manga[] {
    const $ = cheerio.load(text || '');
    const list: Manga[] = [];

    $('li > a')
      .toArray()
      .forEach((a) => {
        const $$ = cheerio.load(a);
        const href = 'https://m.manhuagui.com' + (a as any).attribs.href;
        const title = $$('h3').first().text();
        const statusLabel = $$('div.thumb i').first().text(); // 连载 or 完结
        const cover = 'https:' + $$('div.thumb img').first().attr('data-src');
        const [author, tag, latest, updateTime] = $$('dl')
          .toArray()
          .map((dl) => cheerio.load(dl).root().text());
        const mangaId = firstMatch(href.match(PATTERN_MANGA_ID)).replace(
          'https://m.manhuagui.com/comic/',
          ''
        );

        let status = UpdateStatus.Unknow;
        if (statusLabel === '连载') {
          status = UpdateStatus.Serial;
        }
        if (statusLabel === '完结') {
          status = UpdateStatus.End;
        }

        if (!mangaId || !title) {
          return;
        }

        list.push({
          hash: Base.combineHash(this.id, mangaId),
          source: this.id,
          mangaId,
          title,
          status,
          cover,
          latest,
          updateTime,
          author,
          tag,
          chapters: [],
        });
      });

    return list;
  }

  handleSearch(text: string): Manga[] {
    const $ = cheerio.load(text || '');
    const list: Manga[] = [];

    $('li > a')
      .toArray()
      .forEach((a) => {
        const $$ = cheerio.load(a);
        const href = 'https://m.manhuagui.com' + (a as any).attribs.href;
        const title = $$('h3').first().text();
        const statusLabel = $$('div.thumb i').first().text(); // 连载 or 完结
        const cover = 'https:' + $$('div.thumb img').first().attr('data-src');
        const [author, tag, latest, updateTime] = $$('dl')
          .toArray()
          .map((dl) => cheerio.load(dl).root().text());
        const mangaId = firstMatch(href.match(PATTERN_MANGA_ID)).replace(
          'https://m.manhuagui.com/comic/',
          ''
        );

        let status = UpdateStatus.Unknow;
        if (statusLabel === '连载') {
          status = UpdateStatus.Serial;
        }
        if (statusLabel === '完结') {
          status = UpdateStatus.End;
        }

        if (!mangaId || !title) {
          return;
        }

        list.push({
          hash: Base.combineHash(this.id, mangaId),
          source: this.id,
          mangaId,
          title,
          status,
          cover,
          latest,
          updateTime,
          author,
          tag,
          chapters: [],
        });
      });

    return list;
  }

  handleManga(text: string): Manga {
    const $ = cheerio.load(text || '');
    const manga: Manga = {
      hash: '',
      source: this.id,
      mangaId: '',
      cover: '',
      title: '',
      latest: '',
      updateTime: '',
      author: '',
      tag: '',
      status: UpdateStatus.Unknow,
      chapters: [],
    };
    const chapters: ChapterItem[] = [];

    const scriptContent: string = $('script:not([src]):not([type])').get(1).children[0].data;
    const [, mangaId, status] = scriptContent.match(PATTERN_MANGA_INFO) || [];

    const [latest, updateTime, author, tag] = $('div.cont-list dl')
      .toArray()
      .map((dl) => cheerio.load(dl).root().text());

    const isAudit = $('#erroraudit_show').length > 0;

    if (isAudit) {
      const encodeHtml = $('#__VIEWSTATE').first().attr('value') || '';
      const decodeHtml = LZString.decompressFromBase64(encodeHtml);

      if (decodeHtml) {
        const $$ = cheerio.load(decodeHtml);

        $$('ul > li > a')
          .toArray()
          .forEach((item) => {
            const $$$ = cheerio.load(item);
            const title = $$$('b').first().text();
            const href = 'https://m.manhuagui.com' + (item as any).attribs.href;
            const [, chapterId] = firstMatch(href.match(PATTERN_CHAPTER_ID))
              .replace('https://m.manhuagui.com/comic/', '')
              .split('/');

            chapters.push({
              hash: Base.combineHash(this.id, mangaId, chapterId),
              mangaId,
              chapterId,
              href,
              title,
            });
          });
      }
    } else {
      $('#chapterList > ul > li > a')
        .toArray()
        .forEach((item) => {
          const $$ = cheerio.load(item);
          const title = $$('b').first().text();
          const href = 'https://m.manhuagui.com' + (item as any).attribs.href;
          const [, chapterId] = firstMatch(href.match(PATTERN_CHAPTER_ID))
            .replace('https://m.manhuagui.com/comic/', '')
            .split('/');

          chapters.push({
            hash: Base.combineHash(this.id, mangaId, chapterId),
            mangaId,
            chapterId,
            href,
            title,
          });
        });
    }

    if (status === '1') {
      manga.status = UpdateStatus.Serial;
    }
    if (status === '2') {
      manga.status = UpdateStatus.End;
    }

    manga.mangaId = mangaId;
    manga.hash = Base.combineHash(this.id, mangaId);
    manga.title = $('div.main-bar > h1').first().text();
    manga.cover = 'https:' + $('div.thumb img').first().attr('src');
    manga.latest = latest;
    manga.updateTime = updateTime;
    manga.author = author;
    manga.tag = tag;
    manga.chapters = chapters;

    return manga;
  }

  handleChapter(text: string): Chapter {
    const $ = cheerio.load(text || '');
    const script = (
      ($('script:not([src])').eq(0)[0] as unknown as HTMLScriptElement).children[0] as Element & {
        data: string;
      }
    ).data;
    const scriptContent = firstMatch(script.match(PATTERN_SCRIPT)).replace(
      'window["\\x65\\x76\\x61\\x6c"]',
      ''
    );

    let data: any;
    try {
      // eslint-disable-next-line no-eval
      const readerScript = eval(scriptContent) as string;
      const stringifyData = firstMatch(readerScript.match(PATTERN_READER_DATA)).replace(
        'SMH.reader(',
        ''
      );

      data = JSON.parse(stringifyData);
    } catch (e) {
      data = {};
      console.error(e);
    }

    const { bookId, chapterId, bookName, chapterTitle, images = [], sl } = data;

    return {
      hash: Base.combineHash(this.id, bookId, chapterId),
      mangaId: bookId,
      chapterId,
      name: bookName,
      title: chapterTitle,
      headers: {
        Host: 'i.hamreus.com',
        referer: 'https://m.manhuagui.com/',
        Connection: 'keep-alive',
        accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'sec-fetch-dest': 'image',
        'sec-fetch-mode': 'no-cors',
        'sec-fetch-site': 'cross-site',
        'user-agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
      },
      images: images.map((item: string) =>
        encodeURI(decodeURI('https://i.hamreus.com' + item + '?' + queryString.stringify(sl)))
      ),
    };
  }
}

export default ManHuaGuiMobile;
