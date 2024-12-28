import Base, { Plugin, Options } from './base';
import { MangaStatus, ErrorMessage, ScrambleType } from '~/utils';
import * as cheerio from 'cheerio';
import dayjs from 'dayjs';

interface ScriptData<T> {
  props: {
    pageProps: T;
    __N_SSP: boolean;
  };
  page: string;
  query: Record<string, undefined | number | string>;
  buildId: string;
  isFallback: boolean;
  gssp: boolean;
  scriptLoader: string[];
}

interface DiscoverySearchData
  extends ScriptData<{
    books: {
      id: string;
      name: string;
      alias: string[];
      description: string;
      coverUrl: string;
      author: string;
      continued: boolean;
      tags: string[];
      rating: number | null;
      publish: boolean;
      /**
       * @example 2023-10-19T00:00:00.000Z
       */
      updatedAt: string;
      coverUrlRectangle: string;
      coverUrlSquare: string;
    }[];
    tags: { id: string; count: number }[];
    hasNextPage: boolean;
  }> {}

interface MangaData
  extends ScriptData<{
    book: {
      id: string;
      name: string;
      description: string;
      alias: string[];
      tags: string[];
      author: string;
      coverUrl: string;
      coverUrlRectangle: string;
      coverUrlSquare: string;
      rating: number | null;
      continued: boolean;
      viewCount: number;
      publish: boolean;
      /**
       * @example 2023-10-19T00:00:00.000Z
       */
      createdAt: string;
      /**
       * @example 2023-10-19T00:00:00.000Z
       */
      updatedAt: string;
      activeResourceId: string;
      activeResource: {
        id: string;
        description: string;
        coverUrl: string;
        author: string;
        continued: boolean;
        tags: string[];
        chapters: string[];
        resourceKey: string;
        resourceRef: string;
        folderPath: string;
        /**
         * @example 2023-10-19T00:00:00.000Z
         */
        createdAt: string;
        /**
         * @example 2023-10-19T00:00:00.000Z
         */
        updatedAt: string;
        bookId: string;
      };
    };
    onMyShelf: boolean;
    lastReadChapterIndex: number;
    session: string | null;
    adBookBottom: boolean;
    siteDomain: string;
  }> {}

interface ChapterData
  extends ScriptData<{
    bookName: string;
    alias: string[];
    chapterName: string;
    description: string;
    images?: { src: string; scramble: boolean }[];
    chapterAPIPath?: string;
    totalChapter: number;
    tags: string[];
    session: string | null;
    adBookBottom: boolean;
  }> {}

interface ChapterImageData {
  chapter: {
    name: string;
    images: { src: string; scramble: boolean }[];
  };
  description: string;
}

const discoveryOptions = [
  {
    name: 'type',
    options: [
      { label: '選擇分類', value: Options.Default },
      { label: '正妹', value: '正妹' },
      { label: '恋爱', value: '恋爱' },
      { label: '出版漫画', value: '出版漫画' },
      { label: '肉慾', value: '肉慾' },
      { label: '浪漫', value: '浪漫' },
      { label: '大尺度', value: '大尺度' },
      { label: '巨乳', value: '巨乳' },
      { label: '有夫之婦', value: '有夫之婦' },
      { label: '女大生', value: '女大生' },
      { label: '狗血劇', value: '狗血劇' },
      { label: '好友', value: '好友' },
      { label: '調教', value: '調教' },
      { label: '动作', value: '动作' },
      { label: '後宮', value: '後宮' },
      { label: '不倫', value: '不倫' },
    ],
  },
  {
    name: 'status',
    options: [
      { label: '選擇狀態', value: Options.Default },
      { label: '連載中', value: 'true' },
      { label: '已完結', value: 'false' },
    ],
  },
  {
    name: 'sort',
    options: [
      { label: '選擇排序', value: Options.Default },
      { label: '更新日期', value: Options.Default },
      { label: '評分', value: 'rating' },
    ],
  },
];

class RouMan5 extends Base {
  constructor() {
    const userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36';
    super({
      score: 5,
      id: Plugin.RM5,
      name: '肉漫屋',
      shortName: 'RM5',
      description: '需要代理，只有韩漫',
      href: 'https://rouman5.com/',
      userAgent,
      defaultHeaders: { Referer: 'https://rouman5.com/', 'User-Agent': userAgent },
      option: { discovery: discoveryOptions, search: [] },
    });
  }

  prepareDiscoveryFetch: Base['prepareDiscoveryFetch'] = (page, { type, status, sort }) => {
    return {
      url: 'https://rouman5.com/books',
      body: {
        tag: type === Options.Default ? undefined : type,
        continued: status === Options.Default ? undefined : status,
        sort: sort === Options.Default ? undefined : sort,
        page,
      },
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareSearchFetch: Base['prepareSearchFetch'] = (keyword, page) => {
    return {
      url: 'https://rouman5.com/search',
      body: {
        term: keyword,
        page,
      },
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareMangaInfoFetch: Base['prepareMangaInfoFetch'] = (mangaId) => {
    return {
      url: `https://rouman5.com/books/${mangaId}`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareChapterListFetch: Base['prepareChapterListFetch'] = () => {};
  prepareChapterFetch: Base['prepareChapterFetch'] = (mangaId, chapterId, _page, extra) => {
    return {
      url:
        typeof extra.path === 'string'
          ? `https://rouman5.com${extra.path}`
          : `https://rouman5.com/books/${mangaId}/${chapterId}`,
      headers: new Headers(this.defaultHeaders),
    };
  };

  handleDiscovery: Base['handleDiscovery'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    const scriptLabel =
      ($('script[id=__NEXT_DATA__]')[0] as cheerio.TagElement).children[0].data || '';
    const data: DiscoverySearchData = JSON.parse(scriptLabel);
    return {
      discovery: data.props.pageProps.books.map((item) => ({
        href: `https://rouman5.com/books/${item.id}`,
        hash: Base.combineHash(this.id, item.id),
        source: this.id,
        sourceName: this.name,
        mangaId: item.id,
        bookCover: item.coverUrl,
        title: item.name,
        updateTime: dayjs(item.updatedAt).format('YYYY-MM-DD'),
        headers: this.defaultHeaders,
        status: item.continued ? MangaStatus.Serial : MangaStatus.End,
        author: [item.author],
        tag: item.tags,
      })),
    };
  };

  handleSearch: Base['handleSearch'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    const scriptLabel =
      ($('script[id=__NEXT_DATA__]')[0] as cheerio.TagElement).children[0].data || '';
    const data: DiscoverySearchData = JSON.parse(scriptLabel);
    return {
      search: data.props.pageProps.books.map((item) => ({
        href: `https://rouman5.com/books/${item.id}`,
        hash: Base.combineHash(this.id, item.id),
        source: this.id,
        sourceName: this.name,
        mangaId: item.id,
        bookCover: item.coverUrl,
        title: item.name,
        updateTime: dayjs(item.updatedAt).format('YYYY-MM-DD'),
        headers: this.defaultHeaders,
        status: item.continued ? MangaStatus.Serial : MangaStatus.End,
        author: [item.author],
        tag: item.tags,
      })),
    };
  };

  handleMangaInfo: Base['handleMangaInfo'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    const scriptLabel =
      ($('script[id=__NEXT_DATA__]')[0] as cheerio.TagElement).children[0].data || '';
    const data: MangaData = JSON.parse(scriptLabel);
    const { id, name, tags, author, continued, updatedAt, activeResource } =
      data.props.pageProps.book;

    return {
      manga: {
        href: `https://rouman5.com/books/${id}`,
        hash: Base.combineHash(this.id, id),
        source: this.id,
        sourceName: this.name,
        mangaId: id,
        title: name,
        latest:
          activeResource.chapters.length > 0
            ? activeResource.chapters[activeResource.chapters.length - 1]
            : undefined,
        updateTime: dayjs(updatedAt).format('YYYY-MM-DD'),
        author: [author],
        tag: tags,
        status: continued ? MangaStatus.Serial : MangaStatus.End,
        chapters: activeResource.chapters
          .map((title, index) => ({
            hash: Base.combineHash(this.id, id, String(index)),
            mangaId: id,
            chapterId: String(index),
            href: `https://rouman5.com/books/${id}/${index}`,
            title,
          }))
          .reverse(),
      },
    };
  };
  handleChapterList: Base['handleChapterList'] = () => {
    return { error: new Error(ErrorMessage.NoSupport + 'handleChapterList') };
  };

  handleChapter: Base['handleChapter'] = (
    res: string | ChapterImageData,
    mangaId: string,
    chapterId: string
  ) => {
    if (typeof res === 'string') {
      const $ = cheerio.load(res || '');
      const scriptLabel =
        ($('script[id=__NEXT_DATA__]')[0] as cheerio.TagElement).children[0].data || '';
      const data: ChapterData = JSON.parse(scriptLabel);
      const { bookName, chapterName, images = [], chapterAPIPath } = data.props.pageProps;

      return {
        canLoadMore: typeof chapterAPIPath === 'string' ? true : false,
        chapter: {
          hash: Base.combineHash(this.id, mangaId, chapterId),
          mangaId,
          chapterId,
          name: bookName,
          title: chapterName,
          headers: this.defaultHeaders,
          images: images.map((item) => ({
            uri: item.src,
            scrambleType: ScrambleType.RM5,
            needUnscramble: !item.src.includes('.gif') && item.scramble,
          })),
        },
        nextExtra: { path: chapterAPIPath },
      };
    } else {
      const { name, images } = res.chapter;

      return {
        canLoadMore: false,
        chapter: {
          hash: Base.combineHash(this.id, mangaId, chapterId),
          mangaId,
          chapterId,
          title: name,
          headers: this.defaultHeaders,
          images: images.map((item) => ({
            uri: item.src,
            scrambleType: ScrambleType.RM5,
            needUnscramble: !item.src.includes('.gif') && item.scramble,
          })),
        },
      };
    }
  };
}

export default new RouMan5();
