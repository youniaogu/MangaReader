import Base, { Plugin, Options } from './base';
import { MangaStatus, ErrorMessage } from '~/utils';
import base64 from 'base-64';
import * as cheerio from 'cheerio';

const discoveryOptions = [
  {
    name: 'type',
    options: [
      { label: '选择分类', value: Options.Default },
      { label: '爱情', value: 'c-26' },
      { label: '东方', value: 'c-66' },
      { label: '冒险', value: 'c-12' },
      { label: '欢乐向', value: 'c-64' },
      { label: '百合', value: 'c-39' },
      { label: '搞笑', value: 'c-41' },
      { label: '科幻', value: 'c-20' },
      { label: '校园', value: 'c-40' },
      { label: '生活', value: 'c-33' },
      { label: '魔幻', value: 'c-48' },
      { label: '奇幻', value: 'c-13' },
      { label: '热血', value: 'c-46' },
      { label: '格斗', value: 'c-44' },
      { label: '其他', value: 'c-71' },
      { label: '神鬼', value: 'c-52' },
      { label: '魔法', value: 'c-43' },
      { label: '悬疑', value: 'c-27' },
      { label: '动作', value: 'c-18' },
      { label: '竞技', value: 'c-55' },
      { label: '纯爱', value: 'c-72' },
      { label: '喜剧', value: 'c-32' },
      { label: '萌系', value: 'c-59' },
      { label: '恐怖', value: 'c-16' },
      { label: '耽美', value: 'c-53' },
      { label: '四格', value: 'c-56' },
      { label: 'ゆり', value: 'c-80' },
      { label: '治愈', value: 'c-54' },
      { label: '伪娘', value: 'c-60' },
      { label: '舰娘', value: 'c-73' },
      { label: '励志', value: 'c-47' },
      { label: '职场', value: 'c-58' },
      { label: '战争', value: 'c-30' },
      { label: '侦探', value: 'c-51' },
      { label: '惊悚', value: 'c-21' },
      { label: '职业', value: 'c-22' },
      { label: '体育', value: 'c-11' },
      { label: '历史', value: 'c-9' },
      { label: '美食', value: 'c-45' },
      { label: '秀吉', value: 'c-68' },
      { label: '性转换', value: 'c-67' },
      { label: '推理', value: 'c-19' },
      { label: '音乐舞蹈', value: 'c-70' },
      { label: '后宫', value: 'c-57' },
      { label: '料理', value: 'c-29' },
      { label: '机战', value: 'c-61' },
      { label: 'AA', value: 'c-78' },
      { label: '社会', value: 'c-37' },
      { label: '节操', value: 'c-76' },
      { label: '音乐', value: 'c-17' },
      { label: '西方魔幻', value: 'c-65' },
      { label: '武侠', value: 'c-23' },
      { label: '资料集', value: 'c-28' },
      { label: '宅男', value: 'c-49' },
      { label: '传记', value: 'c-10' },
      { label: '轻小说', value: 'c-69' },
      { label: '黑道', value: 'c-62' },
      { label: '灾难', value: 'c-34' },
      { label: '杂志', value: 'c-42' },
      { label: '舞蹈', value: 'c-50' },
      { label: '宅系', value: 'c-77' },
      { label: '颜艺', value: 'c-74' },
      { label: '露营', value: 'c-81' },
      { label: '旅行', value: 'c-82' },
      { label: 'TS', value: 'c-83' },
      { label: '腐女', value: 'c-63' },
    ],
  },
  {
    name: 'region',
    options: [
      { label: '选择地区', value: Options.Default },
      { label: '日本', value: 'r-4' },
      { label: '香港', value: 'r-5' },
      { label: '韩国', value: 'r-6' },
      { label: '台湾', value: 'r-7' },
      { label: '内地', value: 'r-8' },
      { label: '欧美', value: 'r-9' },
    ],
  },
  {
    name: 'status',
    options: [
      { label: '选择状态', value: Options.Default },
      { label: '连载中', value: 's-1' },
      { label: '已完结', value: 's-2' },
    ],
  },
];

const PATTERN_MANGA_ID = /^https:\/\/www\.manhuadb\.com\/manhua\/([0-9]+)/;
const PATTERN_CHAPTER_ID = /^https:\/\/www\.manhuadb\.com\/manhua\/[0-9]+\/([0-9_]+)\.html/;
const PATTERN_SCRIPT = /var img_data =[\n ]*'(.+)';/;

class ManHuaDB extends Base {
  constructor() {
    const userAgent =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';
    super({
      score: 3,
      id: Plugin.MHDB,
      name: 'manhuadb',
      shortName: 'MHDB',
      description: '漫画DB：资源较少，实在找不到可以来这里看下',
      href: 'https://www.manhuadb.com',
      userAgent,
      defaultHeaders: { Referer: 'https://www.manhuadb.com/', 'User-Agent': userAgent },
      config: { origin: { label: '域名', value: 'https://www.manhuadb.com' } },
      option: { discovery: discoveryOptions, search: [] },
    });
  }

  prepareDiscoveryFetch: Base['prepareDiscoveryFetch'] = (page, { type, region, status }) => {
    let query = '';
    if (region !== Options.Default) {
      query += '-' + region;
    }
    if (status !== Options.Default) {
      query += '-' + status;
    }
    if (type !== Options.Default) {
      query += '-' + type;
    }

    return {
      url: `https://www.manhuadb.com/manhua/list${query}-page-${page}.html`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareSearchFetch: Base['prepareSearchFetch'] = (keyword, page) => {
    return {
      url: `https://www.manhuadb.com/search?q=${keyword}&p=${page}`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareMangaInfoFetch: Base['prepareMangaInfoFetch'] = (mangaId) => {
    return {
      url: `https://www.manhuadb.com/manhua/${mangaId}`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareChapterListFetch: Base['prepareChapterListFetch'] = () => {};
  prepareChapterFetch: Base['prepareChapterFetch'] = (mangaId, chapterId) => {
    return {
      url: `https://www.manhuadb.com/manhua/${mangaId}/${chapterId}.html`,
      headers: new Headers(this.defaultHeaders),
    };
  };

  handleDiscovery: Base['handleDiscovery'] = (text: string | null) => {
    try {
      const $ = cheerio.load(text || '');
      const list: IncreaseManga[] = [];

      $('div.comic-main-section div.comic-book-unit')
        .toArray()
        .forEach((div) => {
          const $$ = cheerio.load(div);
          const a = $$('div.media-body a').first();
          const img = $$('a.d-block img.comic-book-cover').first();

          const title = a.text();
          const href = `https://www.manhuadb.com${a.attr('href')}/`;
          const author = ($$('div.comic-creators a').toArray() as cheerio.TagElement[]).map(
            (e) => e.attribs.title
          );
          const cover = img.attr('data-original') || img.attr('src') || '';
          const [, mangaId] = href.match(PATTERN_MANGA_ID) || [];
          const statusLabel = $$('div.comic-categories a span').first().text();
          const tag = ($$('div.comic-categories a span').toArray() as cheerio.TagElement[])
            .filter((_item, index) => index !== 0)
            .map((span) => span.children[0].data || '');

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

      $('div.comicbook-index')
        .toArray()
        .forEach((div) => {
          const $$ = cheerio.load(div);
          const a = $$('a.d-block').first();
          const img = $$('a.d-block img.img-fluid').first();

          const title = a.attr('title') || '';
          const href = `https://www.manhuadb.com${a.attr('href')}/`;
          const author = ($$('div.comic-author a').toArray() as cheerio.TagElement[]).map(
            (item) => item.attribs.title
          );
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
            author,
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

      const scriptContent: string =
        ($('script:not([src])[type=application/ld+json]').get(1) as cheerio.TagElement).children[0]
          .data || '';
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

          ($$('ol.links-of-books li a').toArray() as cheerio.TagElement[])
            .reverse()
            .forEach((a) => {
              const { href: pathname, title } = a.attribs;
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
      manga.author = creator.map((item) => item.name);
      manga.tag = genre;
      manga.chapters = chapters;

      return { manga };
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
      const name = $('h1.h2 a').first().text();
      const title = $('h2.h4').first().text();
      const data = $('div.vg-r-data');
      const mangaId = data.attr('data-d') || '';
      const chapterId = `${data.attr('data-ccid')}_${data.attr('data-id')}`;
      const host = data.attr('data-host') || '';
      const path = data.attr('data-img_pre') || '';
      const script =
        ($('script:not([src]):not([type])').get(2) as cheerio.TagElement).children[0].data || '';
      const [, scriptContent] = script.match(PATTERN_SCRIPT) || [];
      const images: { img: string; p: number }[] = JSON.parse(base64.decode(scriptContent));

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
            accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
          },
          images: images.map((image) => ({ uri: encodeURI(decodeURI(host + path + image.img)) })),
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

export default new ManHuaDB();
