import { Plugin } from '~/plugins';
import queryString from 'query-string';
import LZString from 'lz-string';
import cheerio from 'cheerio';
import Base from './base';

const { UpdateStatus } = window;
const PATTERN_MANGA_ID = /^https:\/\/www\.mhgui\.com\/comic\/([0-9]+)/;
const PATTERN_MANGA_INFO = /{ id: ([0-9]*), status:[0-9]*,block_cc:'.*', name: '(.+)', url: '.*' }/;
const PATTERN_CHAPTER_ID = /^https:\/\/www\.mhgui\.com\/comic\/[0-9]+\/([0-9]+)(?=\.html|$)/;
const PATTERN_SCRIPT = /window\["\\x65\\x76\\x61\\x6c"\](.+)(?=$)/;
const PATTERN_READER_DATA = /^SMH\.imgData\((.+)(?=\)\.preInit\(\);)/;

class ManHuaGui extends Base {
  readonly useMock = false;

  constructor(pluginID: Plugin, pluginName: string, pluginShortName: string) {
    super(pluginID, pluginName, pluginShortName);
  }

  prepareUpdateFetch: Base['prepareUpdateFetch'] = (page) => {
    if (this.useMock) {
      return {
        url: process.env.PROXY + '/update',
      };
    }

    return {
      url: `https://www.mhgui.com/update/d${page}.html`,
    };
  };
  prepareSearchFetch: Base['prepareSearchFetch'] = (keyword, page) => {
    if (this.useMock) {
      return {
        url: process.env.PROXY + '/search',
        method: 'POST',
      };
    }

    return {
      url: `https://www.mhgui.com/s/${keyword}_p${page}.html`,
      method: 'POST',
    };
  };
  prepareMangaFetch: Base['prepareMangaFetch'] = (mangaId) => {
    if (this.useMock) {
      return {
        url: process.env.PROXY + '/manga',
      };
    }

    return {
      url: `https://www.mhgui.com/comic/${mangaId}/`,
    };
  };
  prepareChapterFetch: Base['prepareChapterFetch'] = (mangaId, chapterId) => {
    if (this.useMock) {
      return {
        url: process.env.PROXY + '/chapter',
      };
    }

    return {
      url: `https://www.mhgui.com/comic/${mangaId}/${chapterId}.html`,
    };
  };

  handleUpdate: Base['handleUpdate'] = (text) => {
    try {
      const $ = cheerio.load(text || '');
      const list: Manga[] = [];

      $('div.latest-list li')
        .toArray()
        .forEach((li) => {
          const $$ = cheerio.load(li);
          const a = $$('a:first-child').first();
          const img = $$('img').first();

          const href = `https://www.mhgui.com${a.attr('href')}/`;
          const title = a.attr('title');
          const cover = 'https:' + (img.attr('data-src') || img.attr('src'));
          const latest = $$('span.tt').first().text();
          const updateTime = $$('span.dt').first().text();
          const [, mangaId] = href.match(PATTERN_MANGA_ID) || [];

          let status = UpdateStatus.Unknow;
          if ($$('span.fd').toArray().length > 0) {
            status = UpdateStatus.Serial;
          } else {
            status = UpdateStatus.End;
          }

          if (!mangaId || !title) {
            return;
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
            latest,
            updateTime,
            author: '',
            tag: '',
            chapters: [],
          });
        });

      return { update: list };
    } catch {
      return { error: new Error('Fail to handleUpdate') };
    }
  };

  handleSearch: Base['handleSearch'] = (text) => {
    try {
      const $ = cheerio.load(text || '');
      const list: Manga[] = [];

      $('div.book-result ul li.cf')
        .toArray()
        .forEach((li) => {
          const $$ = cheerio.load(li);
          const a = $$('div.book-cover a.bcover').first();
          const img = $$('div.book-cover a.bcover img').first();

          const href = `https://www.mhgui.com${a.attr('href')}`;
          const title = a.attr('title');
          const cover = 'https:' + (img.attr('data-src') || img.attr('src'));
          const updateTime = $$('div.book-detail dd.status span.red').last().text();
          const latest = '更新至：' + $$('div.book-detail dd.status a.blue').first().text();
          const [, mangaId] = href.match(PATTERN_MANGA_ID) || [];

          const author = $$('div.book-detail dd:nth-child(4) a')
            .toArray()
            .map((item) => (item as any).attribs.title)
            .join(' ');
          const tag = $$('div.book-detail dd:nth-child(3) span:nth-child(3) a')
            .toArray()
            .map((item) => (item as any).attribs.title)
            .join(' ');

          let status = UpdateStatus.Unknow;
          if ($$('div.book-cover span.fd').toArray().length > 0) {
            status = UpdateStatus.Serial;
          } else {
            status = UpdateStatus.End;
          }

          if (!mangaId || !title) {
            return;
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
            latest,
            updateTime,
            author,
            tag,
            chapters: [],
          });
        });

      return { search: list };
    } catch {
      return { error: new Error('Fail to handleSearch') };
    }
  };

  handleManga: Base['handleManga'] = (text) => {
    try {
      const $ = cheerio.load(text || '');
      const manga: Manga = {
        href: '',
        hash: '',
        source: this.id,
        sourceName: this.name,
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

      const scriptContent = $('script:not([src])').get($('script:not([src])').length - 2)
        .children[0].data;
      const [, mangaId, title] = scriptContent.match(PATTERN_MANGA_INFO) || [];
      const latest = '更新至：' + $('div.chapter-bar a.blue').first().text();
      const updateTime = $('div.chapter-bar span.fr span.red').last().text();
      const author = $('div.book-detail ul.detail-list li:nth-child(2) span:nth-child(2) a').text();
      const tag = $('div.book-detail ul.detail-list li:nth-child(2) span:nth-child(1) a')
        .toArray()
        .map((item) => (item as any).attribs.title)
        .join(' ');
      const cover = 'https:' + $('p.hcover img').first().attr('src');

      const isAudit = $('#erroraudit_show').length > 0;

      if (isAudit) {
        const encodeHtml = $('#__VIEWSTATE').first().attr('value') || '';
        const decodeHtml = LZString.decompressFromBase64(encodeHtml);

        if (decodeHtml) {
          const $$ = cheerio.load(decodeHtml);

          $$('div.chapter-list li a')
            .toArray()
            .forEach((a) => {
              const href = 'https://www.mhgui.com' + (a as any).attribs.href;
              const chapterTitle = (a as any).children[0].children[0].data;
              const [, chapterId] = href.match(PATTERN_CHAPTER_ID) || [];

              chapters.push({
                hash: Base.combineHash(this.id, mangaId, chapterId),
                mangaId,
                chapterId,
                href,
                title: chapterTitle,
              });
            });
        }
      } else {
        $('div.chapter-list li a')
          .toArray()
          .forEach((a) => {
            const href = 'https://www.mhgui.com' + (a as any).attribs.href;
            const chapterTitle = (a as any).children[0].children[0].data;
            const [, chapterId] = href.match(PATTERN_CHAPTER_ID) || [];

            chapters.push({
              hash: Base.combineHash(this.id, mangaId, chapterId),
              mangaId,
              chapterId,
              href,
              title: chapterTitle,
            });
          });
      }

      if ($('p.hcover span.serial').toArray().length > 0) {
        manga.status = UpdateStatus.Serial;
      }
      if ($('p.hcover span.finish').toArray().length > 0) {
        manga.status = UpdateStatus.End;
      }

      manga.href = `https://www.mhgui.com/comic/${mangaId}`;
      manga.mangaId = mangaId;
      manga.hash = Base.combineHash(this.id, mangaId);
      manga.title = title;
      manga.cover = cover;
      manga.latest = latest;
      manga.updateTime = updateTime;
      manga.author = author;
      manga.tag = tag;
      manga.chapters = chapters;

      return { manga };
    } catch {
      return { error: new Error('Fail to handleManga') };
    }
  };

  handleChapter: Base['handleChapter'] = (text) => {
    try {
      const $ = cheerio.load(text || '');
      const scriptAfterFilter = (
        $('script:not([src])').toArray() as unknown as HTMLSpanElement[]
      ).filter((item) => PATTERN_SCRIPT.test((item.children[0] as any).data));

      if (scriptAfterFilter.length <= 0) {
        throw new Error('without chapter info');
      }
      const script = (scriptAfterFilter[0].children[0] as any).data;
      const [, scriptContent] = script.match(PATTERN_SCRIPT) || [];

      // eslint-disable-next-line no-eval
      const readerScript = eval(scriptContent) as string;
      const [, stringifyData] = readerScript.match(PATTERN_READER_DATA) || [];
      const data = JSON.parse(stringifyData);

      const { bid, cid, bname, cname, files = [], path, sl } = data;

      return {
        chapter: {
          hash: Base.combineHash(this.id, bid, cid),
          mangaId: bid,
          chapterId: cid,
          name: bname,
          title: cname,
          headers: {
            Host: 'i.hamreus.com',
            referer: 'https://www.mhgui.com/',
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
          images: files.map((item: string) =>
            encodeURI(
              decodeURI('https://i.hamreus.com/' + path + item + '?' + queryString.stringify(sl))
            )
          ),
        },
      };
    } catch {
      return { error: new Error('Fail to handleChapter') };
    }
  };
}

export default ManHuaGui;
