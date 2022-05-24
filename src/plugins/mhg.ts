import { firstMatch } from '~/utils';
import queryString from 'query-string';
import LZString from 'lz-string';
import cheerio from 'cheerio';
import Base from './base';

const { UpdateStatus } = window;
const pluginID = 'MHGM';
const pluginName = 'manhuagui(mobile)';
const PATTERN_MANGA_ID = /^https:\/\/m\.manhuagui\.com\/comic\/[0-9]+(?=\/$|$)/g;
const PATTERN_CHAPTER_ID = /^https:\/\/m\.manhuagui\.com\/comic\/[0-9]+\/[0-9]+(?=\.html|$)/g;
const PATTERN_SCRIPT = /^window\["\\x65\\x76\\x61\\x6c"\].+(?=$)/g;
const PATTERN_READER_DATA = /^SMH\.reader\(.+(?=\)\.preInit\(\);)/g;

class ManHuaGui extends Base {
  constructor() {
    super(pluginID, pluginName);
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
        const id = firstMatch(href.match(PATTERN_MANGA_ID)).replace(
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

        if (!id || !title) {
          return;
        }

        list.push({
          id,
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
        const id = firstMatch(href.match(PATTERN_MANGA_ID)).replace(
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

        if (!id || !title) {
          return;
        }

        list.push({
          id,
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
      id: '',
      cover: '',
      title: '',
      latest: '',
      updateTime: '',
      author: '',
      tag: '',
      status: 0,
      chapters: [],
    };
    const chapters: ChapterItem[] = [];

    const [latest, updateTime, author, tag] = $('div.cont-list dl')
      .toArray()
      .map((dl) => cheerio.load(dl).root().text());
    const statusLabel = $('div.thumb i').first().text(); // 连载 or 完结

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
            const [mangaId, chapterId] = firstMatch(href.match(PATTERN_CHAPTER_ID))
              .replace('https://m.manhuagui.com/comic/', '')
              .split('/');

            chapters.push({
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
          const [mangaId, chapterId] = firstMatch(href.match(PATTERN_CHAPTER_ID))
            .replace('https://m.manhuagui.com/comic/', '')
            .split('/');

          chapters.push({
            mangaId,
            chapterId,
            href,
            title,
          });
        });
    }

    if (statusLabel === '连载') {
      manga.status = 1;
    }
    if (statusLabel === '完结') {
      manga.status = 2;
    }

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

    const { bookId, chapterId, bookName, chapterTitle, images = [], nextId, prevId, sl } = data;

    return {
      mangaId: bookId,
      chapterId,
      name: bookName,
      title: chapterTitle,
      images: images.map((item: string) => {
        return {
          uri: encodeURI(
            decodeURI('https://i.hamreus.com' + item + '?' + queryString.stringify(sl))
          ),
          headers: {
            Host: 'i.hamreus.com',
            referer: 'https://m.manhuagui.com/',
          },
        };
      }),
      nextId,
      prevId,
    };
  }
}

export default ManHuaGui;
