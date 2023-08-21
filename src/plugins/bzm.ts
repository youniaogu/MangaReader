import Base, { Plugin, Options } from './base';
import { MangaStatus, ErrorMessage } from '~/utils';
import moment from 'moment';
import * as cheerio from 'cheerio';

interface DiscoveryResponse {
  items: {
    author: string;
    comic_id: string;
    name: string;
    region: 'cn' | 'jp' | 'kr' | 'en';
    region_name: string;
    /** e.g. yinianshiguang-iciyuandongman.jpg */
    topic_img: string;
    type_names: string[];
  };
  next: string;
}

const discoveryOptions = [
  {
    name: 'type',
    options: [
      { label: '选择分类', value: Options.Default },
      { value: '全部', label: 'all' },
      { value: '恋爱', label: 'lianai' },
      { value: '纯爱', label: 'chunai' },
      { value: '古风', label: 'gufeng' },
      { value: '异能', label: 'yineng' },
      { value: '悬疑', label: 'xuanyi' },
      { value: '剧情', label: 'juqing' },
      { value: '科幻', label: 'kehuan' },
      { value: '奇幻', label: 'qihuan' },
      { value: '玄幻', label: 'xuanhuan' },
      { value: '穿越', label: 'chuanyue' },
      { value: '冒险', label: 'mouxian' },
      { value: '推理', label: 'tuili' },
      { value: '武侠', label: 'wuxia' },
      { value: '格斗', label: 'gedou' },
      { value: '战争', label: 'zhanzheng' },
      { value: '热血', label: 'rexie' },
      { value: '搞笑', label: 'gaoxiao' },
      { value: '大女主', label: 'danuzhu' },
      { value: '都市', label: 'dushi' },
      { value: '总裁', label: 'zongcai' },
      { value: '后宫', label: 'hougong' },
      { value: '日常', label: 'richang' },
      { value: '韩漫', label: 'hanman' },
      { value: '少年', label: 'shaonian' },
      { value: '其它', label: 'qita' },
    ],
  },
  {
    name: 'region',
    options: [
      { label: '选择地区', value: Options.Default },
      { label: '国漫', value: 'cn' },
      { label: '日本', value: 'jp' },
      { label: '韩国', value: 'kr' },
      { label: '欧美', value: 'en' },
    ],
  },
  {
    name: 'status',
    options: [
      { label: '选择状态', value: Options.Default },
      { label: '連載中', value: 'serial' },
      { label: '完結', value: 'pub' },
    ],
  },
  {
    name: 'sort',
    options: [
      { label: '选择排序', value: Options.Default },
      { label: 'ABCD', value: 'ABCD' },
      { label: 'EFGH', value: 'EFGH' },
      { label: 'IJKL', value: 'IJKL' },
      { label: 'MNOP', value: 'MNOP' },
      { label: 'QRST', value: 'QRST' },
      { label: 'UVW', value: 'UVW' },
      { label: 'XYZ', value: 'XYZ' },
      { label: '0-9', value: '0-9' },
    ],
  },
];

class BaoziManga extends Base {
  constructor() {
    const userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';
    super({
      score: 5,
      id: Plugin.BZM,
      name: '包子漫画',
      shortName: 'BZM',
      description: '国漫',
      href: 'https://cn.baozimh.com/',
      userAgent,
      defaultHeaders: { 'User-Agent': userAgent, Referer: 'https://cn.baozimh.com/' },
      option: { discovery: discoveryOptions, search: [] },
    });
  }

  prepareDiscoveryFetch: Base['prepareDiscoveryFetch'] = (
    page,
    { type, region, status, filter }
  ) => {
    const body = {
      type,
      region,
      filter,
      page,
      state: status,
      limit: 36,
      language: 'cn',
      __amp_source_origin: this.href,
    };

    if (filter === Options.Default) {
      body.filter = '*';
    }
    if (region === Options.Default) {
      body.region = 'all';
    }
    if (status === Options.Default) {
      body.state = 'all';
    }

    return {
      url: 'https://cn.baozimh.com/api/bzmhq/amp_comic_list',
      body,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareSearchFetch: Base['prepareSearchFetch'] = (keyword, _page) => {
    return {
      url: `https://cn.baozimh.com/search?q=${keyword}`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareMangaInfoFetch: Base['prepareMangaInfoFetch'] = (mangaId) => {
    return {
      url: `https://cn.baozimh.com/comic/${mangaId}`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareChapterListFetch: Base['prepareChapterListFetch'] = () => {};
  prepareChapterFetch: Base['prepareChapterFetch'] = (mangaId, chapterId) => {
    return {
      url: `https://cn.czmanga.com/comic/chapter/${mangaId}/${chapterId}.html`,
      headers: new Headers(this.defaultHeaders),
    };
  };

  handleDiscovery: Base['handleDiscovery'] = (_res: DiscoveryResponse) => {
    return { error: new Error(ErrorMessage.NoSupport + 'handleDiscovery') };
  };

  handleSearch: Base['handleSearch'] = (_text: string | null) => {
    return { error: new Error(ErrorMessage.NoSupport + 'handleSearch') };
  };

  handleMangaInfo: Base['handleMangaInfo'] = (_text: string | null) => {
    return { error: new Error(ErrorMessage.NoSupport + 'handleMangaInfo') };
  };

  handleChapterList: Base['handleChapterList'] = () => {
    return { error: new Error(ErrorMessage.NoSupport + 'handleChapterList') };
  };

  handleChapter: Base['handleChapter'] = (_text: string | null) => {
    return { error: new Error(ErrorMessage.NoSupport + 'handleChapter') };
  };
}

export default new BaoziManga();
