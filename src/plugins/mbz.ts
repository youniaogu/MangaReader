import Base, { Plugin, Options } from './base';
import { MangaStatus, ErrorMessage } from '~/utils';
import moment from 'moment';
import * as cheerio from 'cheerio';

const discoveryOptions = [
  {
    name: 'type',
    options: [
      { label: '选择分类', value: Options.Default },
      { label: '熱血', value: '31' },
      { label: '戀愛', value: '26' },
      { label: '校園', value: '1' },
      { label: '冒險', value: '2' },
      { label: '科幻', value: '25' },
      { label: '生活', value: '11' },
      { label: '懸疑', value: '17' },
      { label: '魔法', value: '15' },
      { label: '運動', value: '34' },
    ],
  },
  {
    name: 'status',
    options: [
      { label: '选择状态', value: Options.Default },
      { label: '連載中', value: '1' },
      { label: '完結', value: '2' },
    ],
  },
  {
    name: 'sort',
    options: [
      { label: '选择排序', value: Options.Default },
      { label: '人氣', value: '10' },
      { label: '更新時間', value: '2' },
    ],
  },
];

class MangaBZ extends Base {
  constructor() {
    const userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';
    super({
      score: 5,
      id: Plugin.MBZ,
      name: 'mangabz',
      shortName: 'MBZ',
      description: 'BZ漫画',
      href: 'https://mangabz.com',
      userAgent,
      defaultHeaders: { 'User-Agent': userAgent },
      option: { discovery: discoveryOptions, search: [] },
    });
  }

  prepareDiscoveryFetch: Base['prepareDiscoveryFetch'] = (page, { type, status, sort }) => {
    if (type === Options.Default) {
      type = '0';
    }
    if (status === Options.Default) {
      status = '0';
    }
    if (sort === Options.Default) {
      sort = '2';
    }

    return {
      url: `https://mangabz.com/manga-list-${type}-${status}-${sort}-p${page}/`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareSearchFetch: Base['prepareSearchFetch'] = (keyword, page) => {
    return {
      url: `https://mangabz.com/search?title=${keyword}&page=${page}`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareMangaInfoFetch: Base['prepareMangaInfoFetch'] = (mangaId) => {
    return {
      url: `https://mangabz.com/${mangaId}/`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareChapterListFetch: Base['prepareChapterListFetch'] = () => {};
  prepareChapterFetch: Base['prepareChapterFetch'] = (_mangaId, chapterId) => {
    return {
      url: `https://mangabz.com/${chapterId}/`,
      headers: new Headers(this.defaultHeaders),
    };
  };

  handleDiscovery: Base['handleDiscovery'] = (text: string | null) => {};

  handleSearch: Base['handleSearch'] = (text: string | null) => {};

  handleMangaInfo: Base['handleMangaInfo'] = (text: string | null) => {};

  handleChapterList: Base['handleChapterList'] = () => {
    return { error: new Error(ErrorMessage.NoSupport + 'handleChapterList') };
  };

  handleChapter: Base['handleChapter'] = (text: string | null) => {};
}

export default new MangaBZ();
