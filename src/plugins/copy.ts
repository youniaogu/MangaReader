import Base, { Plugin, Options } from './base';
import { MangaStatus, ErrorMessage } from '~/utils';
import { AESDecrypt } from '~/utils';
import * as cheerio from 'cheerio';

interface BaseResponse<T> {
  code: number;
  message: string;
  results: T;
}
interface DiscoveryResponse
  extends BaseResponse<{
    total: number;
    list: {
      name: string;
      cover: string;
      path_word: string;
      datetime_updated: string;
      author: { name: string; path_word: string }[];
      theme: { name: string; path_word: string }[];
    }[];
  }> {}
interface SearchResponse
  extends BaseResponse<{
    limit: number;
    list: {
      name: string;
      cover: string;
      path_word: string;
      author: { name: string; path_word: string }[];
      theme: { name: string; path_word: string }[];
    }[];
  }> {}
// interface MangaInfoResponse
//   extends BaseResponse<{
//     comic: {
//       name: string;
//       path_word: string;
//       status: { value: 0 | 1; display: string };
//       author: { name: string; path_word: string }[];
//       theme: { name: string; path_word: string }[];
//       datetime_updated: string;
//       cover: string;
//       last_chapter: { uuid: string; name: string };
//     };
//   }> {}
interface ChapterListResponse extends BaseResponse<string> {}
interface ChapterListInfo {
  build: {
    path_word: string;
    type: { id: number; name: string }[];
  };
  groups: Record<'default' | string, { chapters: { id: string; name: string }[] }>;
}
// interface ChapterInfoResponse
//   extends BaseResponse<{
//     comic: { name: string; path_word: string };
//     chapter: {
//       uuid: string;
//       count: number;
//       size: number;
//       name: string;
//       comic_id: string;
//       comic_path_word: string;
//       group_id: null;
//       group_path_word: string;
//       datetime_created: string;
//       contents: { url: string }[];
//     };
//   }> {}

const discoveryOptions = [
  {
    name: 'type',
    options: [
      { label: '选择分类', value: Options.Default },
      { label: '愛情', value: 'aiqing' },
      { label: '歡樂向', value: 'huanlexiang' },
      { label: '冒险', value: 'maoxian' },
      { label: '奇幻', value: 'qihuan' },
      { label: '百合', value: 'baihe' },
      { label: '校园', value: 'xiaoyuan' },
      { label: '科幻', value: 'kehuan' },
      { label: '東方', value: 'dongfang' },
      { label: '生活', value: 'shenghuo' },
      { label: '轻小说', value: 'qingxiaoshuo' },
      { label: '格鬥', value: 'gedou' },
      { label: '耽美', value: 'danmei' },
      { label: '悬疑', value: 'xuanyi' },
      { label: '神鬼', value: 'shengui' },
      { label: '其他', value: 'qita' },
      { label: '职场', value: 'zhichang' },
      { label: '萌系', value: 'mengxi' },
      { label: '治愈', value: 'zhiyu' },
      { label: '長條', value: 'changtiao' },
      { label: '四格', value: 'sige' },
      { label: '舰娘', value: 'jianniang' },
      { label: '节操', value: 'jiecao' },
      { label: 'TL', value: 'teenslove' },
      { label: '竞技', value: 'jingji' },
      { label: '搞笑', value: 'gaoxiao' },
      { label: '伪娘', value: 'weiniang' },
      { label: '热血', value: 'rexue' },
      { label: '後宮', value: 'hougong' },
      { label: '美食', value: 'meishi' },
      { label: '性转换', value: 'xingzhuanhuan' },
      { label: '侦探', value: 'zhentan' },
      { label: '励志', value: 'lizhi' },
      { label: 'AA', value: 'aa' },
      { label: '彩色', value: 'COLOR' },
      { label: '音乐舞蹈', value: 'yinyuewudao' },
      { label: '异世界', value: 'yishijie' },
      { label: '战争', value: 'zhanzheng' },
      { label: '历史', value: 'lishi' },
      { label: '机战', value: 'jizhan' },
      { label: '惊悚', value: 'jingsong' },
      { label: 'C99', value: 'comiket99' },
      { label: '恐怖', value: '恐怖' },
      { label: '都市', value: 'dushi' },
      { label: 'C97', value: 'comiket97' },
      { label: '穿越', value: 'chuanyue' },
      { label: 'C96', value: 'comiket96' },
      { label: '重生', value: 'chongsheng' },
      { label: '魔幻', value: 'mohuan' },
      { label: '宅系', value: 'zhaixi' },
      { label: '武侠', value: 'wuxia' },
      { label: 'C98', value: 'C98' },
      { label: '生存', value: 'shengcun' },
      { label: 'C95', value: 'comiket95' },
      { label: 'FATE', value: 'fate' },
      { label: '無修正', value: 'Uncensored' },
      { label: '转生', value: 'zhuansheng' },
      { label: 'LoveLive', value: 'loveLive' },
      { label: '男同', value: 'nantong' },
      { label: '仙侠', value: 'xianxia' },
      { label: '玄幻', value: 'xuanhuan' },
      { label: '真人', value: 'zhenren' },
    ],
  },
  {
    name: 'region',
    options: [
      { label: '选择地区', value: Options.Default },
      { label: '日本', value: 'japan' },
      { label: '韩国', value: 'korea' },
      { label: '欧美', value: 'west' },
      { label: '完结', value: 'finish' },
    ],
  },
  {
    name: 'sort',
    options: [
      { label: '更新时间⬇️', value: Options.Default },
      { label: '更新时间⬆️', value: 'datetime_updated' },
      { label: '热度⬇️', value: '-popular' },
      { label: '热度⬆️', value: 'popular' },
    ],
  },
];

const CHAPTER_PATTERN_KEY = /var ccy = '(.*?)'/;
const MANGA_PATTERN_KEY = /var ccx = '(.*?)'/;

class CopyManga extends Base {
  key = 'xxymanga.zzl.key';
  readonly fetchHeaders = {
    ...this.defaultHeaders,
    webp: '1',
    region: '1',
    platform: '3',
    version: '2.3.1',
    accept: 'application/json',
    'content-encoding': 'gzip, compress, br',
    'User-Agent': 'COPY/2.3.1',
  };
  readonly imageHeaders = {
    ...this.defaultHeaders,
    Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  };

  constructor() {
    const userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';
    super({
      score: 5,
      id: Plugin.COPY,
      name: '拷贝漫画',
      shortName: 'COPY',
      description: '',
      href: 'https://www.mangacopy.com',
      userAgent,
      defaultHeaders: {
        Referer: 'https://www.mangacopy.com',
        'User-Agent': userAgent,
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      option: { discovery: discoveryOptions, search: [] },
    });
  }

  prepareDiscoveryFetch: Base['prepareDiscoveryFetch'] = (page, { type, region, sort }) => {
    return {
      url: 'https://api.mangacopy.com/api/v3/comics',
      body: {
        free_type: 1,
        limit: 21,
        offset: (page - 1) * 21,
        ordering: sort === Options.Default ? '-datetime_updated' : sort,
        theme: type === Options.Default ? undefined : type,
        top: region === Options.Default ? undefined : region,
        _update: 'true',
      },
      headers: new Headers(this.fetchHeaders),
    };
  };
  prepareSearchFetch: Base['prepareSearchFetch'] = (keyword, page) => {
    return {
      url: 'https://api.mangacopy.com/api/v3/search/comic',
      body: {
        platform: 1,
        q: keyword,
        limit: 20,
        offset: (page - 1) * 20,
        q_type: '',
        _update: 'true',
      },
      headers: new Headers({ ...this.fetchHeaders, platform: '2' }),
    };
  };
  // prepareMangaInfoFetch: Base['prepareMangaInfoFetch'] = (mangaId) => {
  //   return {
  //     url: `https://api.mangacopy.com/api/v3/comic2/${mangaId}`,
  //     body: {
  //       platform: 3,
  //     },
  //     headers: new Headers(this.fetchHeaders),
  //   };
  // };
  prepareMangaInfoFetch: Base['prepareMangaInfoFetch'] = (mangaId) => {
    return {
      url: `https://www.mangacopy.com/comic/${mangaId}`,
      headers: new Headers({ 'User-Agent': this.userAgent || '' }),
    };
  };
  prepareChapterListFetch: Base['prepareChapterListFetch'] = (mangaId) => {
    return {
      url: `https://www.mangacopy.com/comicdetail/${mangaId}/chapters`,
      headers: new Headers({
        'User-Agent': this.userAgent || '',
        Referer: `https://www.mangacopy.com/comic/${mangaId}`,
      }),
    };
  };
  // prepareChapterFetch: Base['prepareChapterFetch'] = (mangaId, chapterId) => {
  //   return {
  //     url: `https://api.mangacopy.com/api/v3/comic/${mangaId}/chapter/${chapterId}`,
  //     body: { platform: 3 },
  //     headers: new Headers({ 'User-Agent': 'COPY/2.3.1' }),
  //   };
  // };
  prepareChapterFetch: Base['prepareChapterFetch'] = (mangaId, chapterId) => {
    return {
      url: `https://www.mangacopy.com/comic/${mangaId}/chapter/${chapterId}`,
      headers: new Headers({
        'User-Agent': this.userAgent || '',
        Referer: `https://www.mangacopy.com/comic/${mangaId}`,
      }),
    };
  };

  handleDiscovery: Base['handleDiscovery'] = (res: DiscoveryResponse) => {
    if (res.code === 200) {
      return {
        discovery: res.results.list.map((item) => {
          return {
            href: `https://mangacopy.com/h5/details/comic/${item.path_word}`,
            hash: Base.combineHash(this.id, item.path_word),
            source: this.id,
            sourceName: this.name,
            mangaId: item.path_word,
            bookCover: item.cover,
            title: item.name,
            updateTime: item.datetime_updated,
            author: item.author.map((obj) => obj.name),
            tag: item.theme.map((obj) => obj.name),
          };
        }),
      };
    } else {
      return { error: new Error(ErrorMessage.WrongResponse + res.message) };
    }
  };

  handleSearch: Base['handleSearch'] = (res: SearchResponse) => {
    if (res.code === 200) {
      return {
        search: res.results.list.map((item) => {
          return {
            href: `https://mangacopy.com/h5/details/comic/${item.path_word}`,
            hash: Base.combineHash(this.id, item.path_word),
            source: this.id,
            sourceName: this.name,
            mangaId: item.path_word,
            bookCover: item.cover,
            title: item.name,
          };
        }),
      };
    } else {
      return { error: new Error(ErrorMessage.WrongResponse + res.message) };
    }
  };

  matchKey = (html: string, patterKey: RegExp) => {
    const match = html.match(patterKey);
    if (match) {
      return match[1];
    }
    return '';
  };
  handleMangaInfo: Base['handleMangaInfo'] = (text: string | null, mangaId: string) => {
    this.key = this.matchKey(text ?? '', MANGA_PATTERN_KEY);

    const $ = cheerio.load(text || '');
    const cover = $('.comicParticulars-left-img > img').first().attr('data-src') || '';
    const title = $('.comicParticulars-title-right h6').first().text().trim();
    const li = $(
      '.comicParticulars-title .comicParticulars-title-right ul li'
    ).toArray() as cheerio.TagElement[];

    let author: string[] = [];
    let updateTime;
    let tag: string[] = [];
    let status: MangaStatus = MangaStatus.Unknown;
    li.forEach((ele) => {
      const $$ = cheerio.load(ele);
      const label = $$('span').first().text().trim();
      switch (label) {
        case '作者：': {
          author = ($$('.comicParticulars-right-txt a').toArray() as cheerio.TagElement[]).map(
            (a) => a.firstChild?.data || ''
          );
          break;
        }
        case '最後更新：': {
          updateTime = $$('.comicParticulars-right-txt').first().text().trim();
          break;
        }
        case '狀態：': {
          const statusLabel = $$('.comicParticulars-right-txt').first().text().trim();
          if (statusLabel.includes('連載中')) {
            status = MangaStatus.Serial;
          } else if (statusLabel.includes('已完結')) {
            status = MangaStatus.End;
          }
          break;
        }
        case '題材：': {
          tag = ($$('.comicParticulars-tag a').toArray() as cheerio.TagElement[]).map(
            (a) => a?.firstChild?.data || ''
          );
          break;
        }
        default:
          break;
      }
    });

    return {
      manga: {
        source: this.id,
        sourceName: this.name,
        href: `https://www.mangacopy.com/comic/${mangaId}`,
        hash: Base.combineHash(this.id, mangaId),
        mangaId,
        infoCover: cover,
        title,
        updateTime,
        author,
        tag,
        status,
      },
    };
  };
  // handleSearch: Base['handleSearch'] = (res: SearchResponse) => {
  //   if (res.code === 200) {
  //     return {
  //       search: res.results.list.map((item) => {
  //         return {
  //           href: `https://mangacopy.com/h5/details/comic/${item.path_word}`,
  //           hash: Base.combineHash(this.id, item.path_word),
  //           source: this.id,
  //           sourceName: this.name,
  //           mangaId: item.path_word,
  //           bookCover: item.cover,
  //           title: item.name,
  //         };
  //       }),
  //     };
  //   } else {
  //     return { error: new Error(ErrorMessage.WrongResponse + res.message) };
  //   }
  // };

  // handleMangaInfo: Base['handleMangaInfo'] = (res: MangaInfoResponse) => {
  //   if (res.code === 200) {
  //     const { name, status, cover, path_word, author, theme, datetime_updated, last_chapter } =
  //       res.results.comic;

  //     let mangaStatus = MangaStatus.Unknown;
  //     if (status.value === 0) {
  //       mangaStatus = MangaStatus.Serial;
  //     }
  //     if (status.value === 1) {
  //       mangaStatus = MangaStatus.End;
  //     }

  //     return {
  //       manga: {
  //         href: `https://mangacopy.com/h5/details/comic/${path_word}`,
  //         hash: Base.combineHash(this.id, path_word),
  //         source: this.id,
  //         sourceName: this.name,
  //         mangaId: path_word,
  //         infoCover: cover,
  //         title: name,
  //         latest: last_chapter.name,
  //         updateTime: datetime_updated,
  //         author: author.map((obj) => obj.name),
  //         tag: theme.map((obj) => obj.name),
  //         status: mangaStatus,
  //       },
  //     };
  //   } else {
  //     return { error: new Error(ErrorMessage.WrongResponse + res.message) };
  //   }
  // };

  handleChapterList: Base['handleChapterList'] = (res: ChapterListResponse) => {
    if (res.code === 200) {
      const data: ChapterListInfo = JSON.parse(AESDecrypt(res.results || '', this.key));
      const { build, groups } = data;
      const list = groups.default || { chapters: [] };

      Object.keys(groups)
        .filter((key) => key !== 'default')
        .forEach((key) => {
          list.chapters = groups[key].chapters.concat(list.chapters);
        });

      return {
        chapterList: list.chapters
          .map((item) => ({
            hash: Base.combineHash(this.id, build.path_word, item.id),
            mangaId: build.path_word,
            chapterId: item.id,
            href: `https://mangacopy.com/h5/comicContent/${build.path_word}/${item.id}`,
            title: item.name,
          }))
          .reverse(),
        canLoadMore: false,
      };
    } else {
      return { error: new Error(ErrorMessage.WrongResponse + res.message) };
    }
  };

  // handleChapter: Base['handleChapter'] = (
  //   res: ChapterInfoResponse,
  //   mangaId: string,
  //   chapterId: string
  // ) => {
  //   return {
  //     canLoadMore: false,
  //     chapter: {
  //       hash: Base.combineHash(this.id, mangaId, chapterId),
  //       mangaId,
  //       chapterId,
  //       name: res.results.comic.name,
  //       title: res.results.chapter.name,
  //       headers: this.imageHeaders,
  //       images: res.results.chapter.contents.map((item: { url: string }) => ({
  //         uri: item.url.replace(/\.c[0-9]+x\./, '.c1500x.'),
  //       })),
  //     },
  //   };
  // };
  handleChapter: Base['handleChapter'] = (
    text: string | null,
    mangaId: string,
    chapterId: string
  ) => {
    const $ = cheerio.load(text || '');
    const header = $('h4.header').first().text();
    const [name = '', title = ''] = header.split('/');
    const key = this.matchKey(text ?? '', CHAPTER_PATTERN_KEY);
    const imageData = ($('div.imageData')[0] as cheerio.TagElement).attribs.contentkey;
    const images: { url: string }[] = JSON.parse(AESDecrypt(imageData, key));
    return {
      canLoadMore: false,
      chapter: {
        hash: Base.combineHash(this.id, mangaId, chapterId),
        mangaId,
        chapterId,
        name,
        title,
        headers: this.imageHeaders,
        images: images.map((item: { url: string }) => ({
          uri: item.url.replace(/\.c[0-9]+x\./, '.c1500x.'),
        })),
      },
    };
  };
}

export default new CopyManga();
