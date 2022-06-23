import Base, { Plugin } from './base';
import { MangaStatus } from '~/utils';
import cheerio from 'cheerio';
import base64 from 'base-64';

const PATTERN_MANGA_ID = /^https:\/\/www\.manhuadb\.com\/manhua\/([0-9]+)/;
const PATTERN_CHAPTER_ID = /^https:\/\/www\.manhuadb\.com\/manhua\/[0-9]+\/([0-9_]+)\.html/;
const PATTERN_SCRIPT = /var img_data =[\n ]*'(.+)';/;

class ManHuaDB extends Base {
  readonly useMock = false;
  readonly userAgent =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';

  constructor(pluginID: Plugin, pluginName: string, pluginShortName: string) {
    super(pluginID, pluginName, pluginShortName);
  }

  prepareUpdateFetch: Base['prepareUpdateFetch'] = (page) => {
    return {
      url: `https://www.manhuadb.com/manhua/list-page-${page}.html`,
      headers: new Headers({
        referer: 'https://www.manhuadb.com/',
        'user-agent': this.userAgent,
      }),
    };
  };
  prepareSearchFetch: Base['prepareSearchFetch'] = (keyword, page) => {
    return {
      url: `https://www.manhuadb.com/search?q=${keyword}&p=${page}`,
      headers: new Headers({
        referer: 'https://www.manhuadb.com/',
        'user-agent': this.userAgent,
      }),
    };
  };
  prepareMangaInfoFetch: Base['prepareMangaInfoFetch'] = (mangaId) => {
    return {
      url: `https://www.manhuadb.com/manhua/${mangaId}`,
      headers: new Headers({
        referer: 'https://www.manhuadb.com/',
        'user-agent': this.userAgent,
      }),
    };
  };
  prepareChapterListFetch: Base['prepareChapterListFetch'] = () => {};
  prepareChapterFetch: Base['prepareChapterFetch'] = (mangaId, chapterId) => {
    return {
      url: `https://www.manhuadb.com/manhua/${mangaId}/${chapterId}.html`,
      headers: new Headers({
        referer: 'https://www.manhuadb.com/',
        'user-agent': this.userAgent,
      }),
    };
  };

  handleUpdate: Base['handleUpdate'] = (text: string | null) => {
    try {
      const $ = cheerio.load(text || '');
      const list: Manga[] = [];

      $('div.comic-main-section div.comic-book-unit')
        .toArray()
        .forEach((div) => {
          const $$ = cheerio.load(div);
          const a = $$('div.media-body a').first();
          const img = $$('a.d-block img.comic-book-cover').first();

          const title = a.text();
          const href = `https://www.manhuadb.com${a.attr('href')}/`;
          const author = $$('div.comic-creators a')
            .toArray()
            .map((e: any) => e.attribs.title)
            .join(',');
          const cover = img.attr('data-original') || img.attr('src') || '';
          const [, mangaId] = href.match(PATTERN_MANGA_ID) || [];
          const statusLabel = $$('div.comic-categories a span').first().text();
          const tag = ($$('div.comic-categories a span').toArray() as unknown as HTMLSpanElement[])
            .filter((_item, index) => index !== 0)
            .map((span) => (span.children[0] as any).data)
            .join(',');

          let status = MangaStatus.Unknown;
          if (statusLabel === '连载中') {
            status = MangaStatus.Serial;
          }
          if (statusLabel === '已完结') {
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
            latest: '',
            updateTime: '',
            author,
            tag,
            chapters: [],
          });
        });

      return { update: list };
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

      $('div.comicbook-index')
        .toArray()
        .forEach((div) => {
          const $$ = cheerio.load(div);
          const a = $$('a.d-block').first();
          const img = $$('a.d-block img.img-fluid').first();

          const title = a.attr('title') || '';
          const href = `https://www.manhuadb.com${a.attr('href')}/`;
          const author = $$('div.comic-author a')
            .toArray()
            .map((e: any) => e.attribs.title)
            .join(',');
          const cover = img.attr('data-original') || img.attr('src') || '';
          const [, mangaId] = href.match(PATTERN_MANGA_ID) || [];

          list.push({
            href,
            hash: Base.combineHash(this.id, mangaId),
            source: this.id,
            sourceName: this.name,
            mangaId,
            title,
            status: MangaStatus.Unknown,
            cover,
            latest: '',
            updateTime: '',
            author,
            tag: '',
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
        status: MangaStatus.Unknown,
        chapters: [],
      };
      const chapters: ChapterItem[] = [];

      const scriptContent: string = $('script:not([src])[type=application/ld+json]').get(1)
        .children[0].data;
      const {
        name = '',
        creator = [],
        genre = [],
        url = '',
      }: {
        name: string;
        creator: { '@type': string; name: string }[];
        genre: string[];
        url: string;
      } = JSON.parse(scriptContent);
      const cover = $('td.comic-cover img').first().attr('src') || '';
      const [, mangaId] = url.match(PATTERN_MANGA_ID) || [];
      const statusLabel = $('meta[property=og:novel:status]').first().attr('content');
      const latest = $('meta[property=og:novel:latest_chapter_name]').first().attr('content') || '';
      const updateTime = $('meta[property=og:novel:update_time]').first().attr('content') || '';

      $('div#comic-book-list div.tab-pane')
        .toArray()
        .forEach((div) => {
          const $$ = cheerio.load(div);

          $$('ol.links-of-books li a')
            .toArray()
            .reverse()
            .forEach((a) => {
              const { href: pathname, title } = (a as any).attribs;
              const href = 'https://www.manhuadb.com' + pathname;
              const [, chapterId] = href.match(PATTERN_CHAPTER_ID) || [];

              chapters.push({
                hash: Base.combineHash(this.id, mangaId, chapterId),
                mangaId,
                chapterId,
                href,
                title,
              });
            });
        });

      if (statusLabel === '连载中') {
        manga.status = MangaStatus.Serial;
      }
      if (statusLabel === '已完结') {
        manga.status = MangaStatus.End;
      }

      manga.href = url;
      manga.mangaId = mangaId;
      manga.hash = Base.combineHash(this.id, mangaId);
      manga.title = name;
      manga.cover = cover;
      manga.latest = latest;
      manga.updateTime = updateTime;
      manga.author = creator.map((item) => item.name).join(',');
      manga.tag = genre.join(',');
      manga.chapters = chapters;

      return { manga };
    } catch (error) {
      if (error instanceof Error) {
        return { error };
      } else {
        return { error: new Error('Unknown Error') };
      }
    }
  };

  handleChapterList: Base['handleChapterList'] = () => {
    return { error: new Error('Plugin MHDB not support handleChapterList') };
  };

  handleChapter: Base['handleChapter'] = (text: string | null) => {
    try {
      const $ = cheerio.load(text || '');
      const name = $('h1.h2 a').first().text();
      const title = $('h2.h4').first().text();
      const data = $('div.vg-r-data');
      const mangaId = data.attr('data-d') || '';
      const chapterId = `${data.attr('data-ccid')}_${data.attr('data-id')}`;
      const host = data.attr('data-host') || '';
      const path = data.attr('data-img_pre') || '';
      const script = $('script:not([src]):not([type])').get(2).children[0].data;
      const [, scriptContent] = script.match(PATTERN_SCRIPT) || [];
      const images: { img: string; p: number }[] = JSON.parse(base64.decode(scriptContent));

      return {
        chapter: {
          hash: Base.combineHash(this.id, mangaId, chapterId),
          mangaId,
          chapterId,
          name,
          title,
          headers: {
            referer: 'https://www.manhuadb.com/',
            accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'sec-fetch-dest': 'image',
            'sec-fetch-mode': 'no-cors',
            'sec-fetch-site': 'same-site',
            'Cache-control': 'no-store',
            'user-agent': this.userAgent,
          },
          images: images.map((image) => encodeURI(decodeURI(host + path + image.img))),
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

export default new ManHuaDB(Plugin.MHDB, 'manhuadb', 'MHDB');
