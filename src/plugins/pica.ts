import Base, { Plugin, Options } from './base';
import { ErrorMessage, MangaStatus } from '~/utils';
import { Buffer } from 'buffer';
import queryString from 'query-string';
import CryptoJS from 'crypto-js';
import moment from 'moment';

interface Response<T> {
  code: number;
  message: string;
  data: T;
}
interface Image {
  fileServer: string;
  originalName: string;
  path: string;
}
interface MangaItem {
  author: string;
  categories: string[];
  epsCount: number;
  finished: boolean;
  id: string;
  likesCount: number;
  pagesCount: number;
  thumb: Image;
  title: string;
  totalLikes: number;
  totalViews: number;
  _id: string;
}
interface DiscoveryResponse
  extends Response<{
    comics: { docs: MangaItem[]; limit: number; page: number; pages: number; total: number };
  }> {}
interface SearchResponse
  extends Response<{
    comics: { docs: MangaItem[]; limit: number; page: number; pages: number; total: number };
  }> {}
interface MangaInfoResponse
  extends Response<{
    comic: {
      allowComment: boolean;
      allowDownload: boolean;
      author: string;
      categories: string[];
      chineseTeam: string;
      commentsCount: number;
      created_at: string;
      description: string;
      epsCount: number;
      finished: false;
      isFavourite: false;
      isLiked: false;
      likesCount: number;
      pagesCount: number;
      tags: string[];
      thumb: Image;
      title: string;
      totalComments: number;
      totalLikes: number;
      totalViews: number;
      updated_at: string;
      viewsCount: number;
      _creator: {
        avatar: Image;
        characters: string[];
        exp: number;
        gender: string;
        level: number;
        name: string;
        role: string;
        slogan: string;
        title: string;
        verified: boolean;
        _id: string;
      };
      _id: string;
    };
  }> {}
interface ChapterListResponse
  extends Response<{
    eps: {
      docs: { id: string; order: number; title: string; updated_at: string; _id: string }[];
      limit: number;
      page: number;
      pages: number;
      total: number;
    };
  }> {}
interface ChapterResponse
  extends Response<{
    comics: { docs: MangaItem[]; limit: number; page: number; pages: number; total: number };
  }> {}

const ImageToBeImg = 'https://img.picacomic.com';
const ImageToBs = 'https://storage-b.picacomic.com';
const ImageDefault = 'https://storage1.picacomic.com';
const discoveryOptions = [
  {
    name: 'type',
    options: [
      { label: '选择分类', value: Options.Default },
      // { label: '过去24小时', value: '24h' },
      // { label: '过去7天', value: '7d' },
      // { label: '过去30天', value: '30d' },
      { label: '大家都在看', value: '大家都在看' },
      { label: '大濕推薦', value: '大濕推薦' },
      { label: '那年今天', value: '那年今天' },
      { label: '官方都在看', value: '官方都在看' },
      { label: '嗶咔漢化', value: '嗶咔漢化' },
      { label: '全彩', value: '全彩' },
      { label: '長篇', value: '長篇' },
      { label: '同人', value: '同人' },
      { label: '全彩', value: '全彩' },
      { label: '短篇', value: '短篇' },
      { label: '圓神領域', value: '圓神領域' },
      { label: '碧藍幻想', value: '碧藍幻想' },
      { label: 'CG雜圖', value: 'CG雜圖' },
      { label: '英語 ENG', value: '英語 ENG' },
      { label: '生肉', value: '生肉' },
      { label: '純愛', value: '純愛' },
      { label: '百合花園', value: '百合花園' },
      { label: '耽美花園', value: '耽美花園' },
      { label: '偽娘哲學', value: '偽娘哲學' },
      { label: '後宮閃光', value: '後宮閃光' },
      { label: '扶他樂園', value: '扶他樂園' },
      { label: '單行本', value: '單行本' },
      { label: '姐姐系', value: '姐姐系' },
      { label: '妹妹系', value: '妹妹系' },
      { label: 'SM', value: 'SM' },
      { label: '性轉換', value: '性轉換' },
      { label: '足の恋', value: '足の恋' },
      { label: '人妻', value: '人妻' },
      { label: 'NTR', value: 'NTR' },
      { label: '強暴', value: '強暴' },
      { label: '非人類', value: '非人類' },
      { label: '艦隊收藏', value: '艦隊收藏' },
      { label: 'Love Live', value: 'Love Live' },
      { label: 'SAO 刀劍神域', value: 'SAO 刀劍神域' },
      { label: 'Fate', value: 'Fate' },
      { label: '東方', value: '東方' },
      { label: 'WEBTOON', value: 'WEBTOON' },
      { label: '禁書目錄', value: '禁書目錄' },
      { label: '歐美', value: '歐美' },
      { label: 'Cosplay', value: 'Cosplay' },
      { label: '重口地帶', value: '重口地帶' },
    ],
  },
  {
    name: 'sort',
    options: [
      { label: '选择排序', value: Options.Default },
      { label: '新到旧', value: 'dd' },
      { label: '旧到新', value: 'da' },
      { label: '最多爱心', value: 'ld' },
      { label: '最多绅士指名次数', value: 'vd' },
    ],
  },
];

class PicaComic extends Base {
  constructor() {
    const userAgent =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';
    super({
      score: 5,
      id: Plugin.PICA,
      name: 'picacomic',
      shortName: 'PICA',
      description: '哔咔漫画',
      href: 'https://manhuabika.com',
      userAgent,
      defaultHeaders: {
        Accept: 'application/vnd.picacomic.com.v1+json',
        'App-Channel': '1',
        'App-Uuid': 'webUUID',
        'App-Platform': 'android',
        'Image-Quality': 'original',
        'Content-Type': 'application/json; charset=UTF-8',
        'User-Agent': userAgent,
        Authorization: '',
      },
      config: { origin: { label: '域名', value: 'https://manhuabika.com' } },
      option: { discovery: discoveryOptions, search: [] },
    });
  }

  prepareDiscoveryFetch: Base['prepareDiscoveryFetch'] = (page, { type, sort }) => {
    const query = {
      page,
      s: sort === Options.Default ? 'dd' : sort,
      c: type === Options.Default ? undefined : type,
    };
    return {
      url: 'https://api.manhuabika.com/comics',
      body: query,
      headers: this.getHeaders(queryString.stringifyUrl({ url: 'comics', query }), 'GET'),
    };
  };
  prepareSearchFetch: Base['prepareSearchFetch'] = (keyword, _page) => {
    return {
      url: `https://m.dmzj.com/search/${keyword}.html`,
      headers: this.getHeaders(queryString.stringifyUrl({ url: 'comics' }), 'GET'),
    };
  };
  prepareMangaInfoFetch: Base['prepareMangaInfoFetch'] = (mangaId) => {
    return {
      url: `https://api.manhuabika.com/comics/${mangaId}`,
      headers: this.getHeaders(`comics/${mangaId}`, 'GET'),
    };
  };
  prepareChapterListFetch: Base['prepareChapterListFetch'] = (mangaId, page) => {
    const query = { page };
    return {
      url: `https://api.manhuabika.com/comics/${mangaId}/eps`,
      body: query,
      headers: this.getHeaders(
        queryString.stringifyUrl({ url: `comics/${mangaId}/eps`, query }),
        'GET'
      ),
    };
  };
  prepareChapterFetch: Base['prepareChapterFetch'] = (mangaId, chapterId) => {
    return {
      url: `https://m.dmzj.com/view/${mangaId}/${chapterId}.html`,
      headers: this.getHeaders(queryString.stringifyUrl({ url: 'comics' }), 'GET'),
    };
  };

  handleDiscovery: Base['handleDiscovery'] = (res: DiscoveryResponse) => {
    try {
      if (res.code === 200) {
        return {
          discovery: res.data.comics.docs.map((item) => ({
            href: `https://manhuabika.com/pcomicview/?cid=${item.id}`,
            hash: Base.combineHash(this.id, item.id),
            source: this.id,
            sourceName: this.name,
            mangaId: item.id,
            cover: this.stringifyImageUrl(item.thumb),
            // cover: 'https://img.picacomic.com/' + item.thumb.path.replace('tobeimg/', ''),
            // cover: 'https://s3.picacomic.com/static/' + item.thumb.path,
            title: item.title,
            status: item.finished ? MangaStatus.End : MangaStatus.Serial,
            author: item.author.split(','),
            tag: item.categories,
          })),
        };
      } else {
        throw new Error(ErrorMessage.WrongResponse + res.message);
      }
    } catch (error) {
      if (error instanceof Error) {
        return { error };
      } else {
        return { error: new Error(ErrorMessage.Unknown) };
      }
    }
  };

  handleSearch: Base['handleSearch'] = (_res: SearchResponse) => {
    try {
      return { error: new Error(ErrorMessage.Unknown) };
    } catch (error) {
      if (error instanceof Error) {
        return { error };
      } else {
        return { error: new Error(ErrorMessage.Unknown) };
      }
    }
  };

  handleMangaInfo: Base['handleMangaInfo'] = (res: MangaInfoResponse) => {
    try {
      if (res.code === 200) {
        const { _id, tags, title, thumb, author, finished, updated_at } = res.data.comic;
        return {
          manga: {
            href: `https://manhuabika.com/pcomicview/?cid=${_id}`,
            hash: Base.combineHash(this.id, _id),
            source: this.id,
            sourceName: this.name,
            mangaId: _id,
            cover: this.stringifyImageUrl(thumb),
            title,
            updateTime: moment(updated_at).format('YYYY-MM-DD'),
            author: author.split(','),
            tag: tags,
            status: finished ? MangaStatus.End : MangaStatus.Serial,
          },
        };
      } else {
        throw new Error(ErrorMessage.WrongResponse + res.message);
      }
    } catch (error) {
      if (error instanceof Error) {
        return { error };
      } else {
        return { error: new Error(ErrorMessage.Unknown) };
      }
    }
  };

  handleChapterList: Base['handleChapterList'] = (res: ChapterListResponse, mangaId) => {
    try {
      if (res.code === 200) {
        const { docs, page, total, limit } = res.data.eps;
        return {
          chapterList: docs
            .sort((a, b) => a.order - b.order)
            .map((item) => ({
              hash: Base.combineHash(this.id, mangaId, item.id),
              mangaId,
              chapterId: item.id,
              href: `https://manhuabika.com/pchapter/?cid=${mangaId}&chapter=${item.order}`,
              title: item.title,
            }))
            .reverse(),
          canLoadMore: total > page * limit,
        };
      } else {
        throw new Error(ErrorMessage.WrongResponse + res.message);
      }
    } catch (error) {
      if (error instanceof Error) {
        return { error };
      } else {
        return { error: new Error(ErrorMessage.Unknown) };
      }
    }
  };

  handleChapter: Base['handleChapter'] = (_res: ChapterResponse) => {
    try {
      return { error: new Error(ErrorMessage.Unknown) };
    } catch (error) {
      if (error instanceof Error) {
        return { error };
      } else {
        return { error: new Error(ErrorMessage.Unknown) };
      }
    }
  };

  randomString = (e: number = 32) => {
    let t = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
    let a = t.length;
    let n = '';
    for (let i = 0; i < e; i++) {
      n += t.charAt(Math.floor(Math.random() * a));
    }
    return n;
  };
  getsignature = (url: string, ts: string, method: string, nonce: string) => {
    const appleKillFlag = 'C69BAF41DA5ABD1FFEDC6D2FEA56B';
    const appleVerSion = '~d}$Q7$eIni=V)9\\RK/P.RM4;9[7|@/CA}b~OW!3?EV`:<>M7pddUBL5n|0/*Cn';
    const raw = (url + ts + nonce + method + appleKillFlag).toLowerCase();
    return CryptoJS.HmacSHA256(raw, appleVerSion).toString(CryptoJS.enc.Hex);
  };
  getHeaders = (pathname: string, method: 'GET' | 'POST') => {
    const timestamp = (new Date().getTime() / 1000).toFixed(0);
    const nonce = this.randomString(32).toLowerCase();

    return new Headers({
      Time: timestamp,
      Nonce: nonce,
      Signature: this.getsignature(pathname, timestamp, method, nonce),
      ...this.defaultHeaders,
    });
  };
  decodeImageTobeImgPath = (path: string) => {
    if (!path.startsWith('tobeimg/')) {
      return path;
    }
    const filename = path.substring(path.lastIndexOf('/') + 1);
    const encoded = filename.substring(0, filename.lastIndexOf('.'));
    const absoluteUrl = Buffer.from(encoded, 'base64').toString('utf-8');
    return absoluteUrl;
  };
  stringifyImageUrl = (image: Image): string => {
    let { path, fileServer } = image;
    if (path.startsWith('tobeimg/')) {
      if (fileServer === ImageDefault || fileServer === ImageToBs) {
        return this.decodeImageTobeImgPath(path);
      } else {
        fileServer ||= ImageToBeImg;
        path = '/' + path.substring(8);
      }
    } else if (path.startsWith('tobs/')) {
      fileServer ||= ImageToBs;
      path = '/static/' + path.substring(5);
    } else {
      fileServer ||= ImageDefault;
      path = '/static/' + path;
    }
    return fileServer.replace(/\/$/, '') + path;
  };
}

export default new PicaComic();
