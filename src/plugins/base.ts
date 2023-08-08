import { FetchData } from '~/utils';

interface InitialData {
  id: Plugin;
  name: string;
  shortName?: string;
  description?: string;
  score: number;
  href: string;
  userAgent?: string;
  defaultHeaders?: Record<string, string>;
  option?: {
    discovery: PartialOption<FilterItem, 'defaultValue'>[];
    search: PartialOption<FilterItem, 'defaultValue'>[];
  };
  disabled?: boolean;
  batchDelay?: number;
  injectedJavaScript?: string;
}

interface FilterItem {
  name: string;
  defaultValue: string;
  options: OptionItem[];
}

export enum Plugin {
  MHG = 'MHG',
  MHGM = 'MHGM',
  COPY = 'COPY',
  MHDB = 'MHDB',
  DMZJ = 'DMZJ',
  JMC = 'JMC',
  MHM = 'MHM',
  KL = 'KL',
  NH = 'NH',
  PICA = 'PICA',
  MBZ = 'MBZ',
}

export enum Options {
  Default = '$$DEFAULT$$',
}

abstract class Base {
  /**
   * @description score rate of plugin
   * @type {number}
   * @memberof Base
   */
  readonly score: number;
  /**
   * @description key differences between plugins
   * @type {Plugin}
   * @memberof Base
   */
  readonly id: Plugin;
  /**
   * @description full name, use for display
   * @type {string}
   * @memberof Base
   */
  readonly name: string;
  /**
   * @description short name of plugin, like icon
   * @type {string}
   * @memberof Base
   */
  readonly shortName: string;
  /**
   * @description description of the plugin
   * @type {string}
   * @memberof Base
   */
  readonly description: string;
  readonly href: string;
  readonly userAgent?: string;
  readonly defaultHeaders: Record<string, string>;

  /**
   * @description filter in Discovery and Search page
   * @type {{ discovery: FilterItem[]; search: FilterItem[] }}
   * @memberof Base
   */
  readonly option: { discovery: FilterItem[]; search: FilterItem[] };
  /**
   * @description switch of display in plugins list
   * @type {boolean}
   * @memberof Base
   */
  readonly disabled: boolean;
  /**
   * @type {number}
   * @memberof Base
   */
  batchDelay: number;
  /**
   * @description run js in webview
   * @type {string}
   * @memberof Base
   */
  injectedJavaScript?: string;

  /**
   * @description Creates an instance of Base.
   * @param {InitialData} init
   * @memberof Base
   */
  constructor(init: InitialData) {
    const {
      id,
      name,
      shortName = name,
      description = name,
      href,
      userAgent,
      defaultHeaders = {},
      score,
      option = { discovery: [], search: [] },
      disabled = false,
      batchDelay = 3000,
      injectedJavaScript,
    } = init;
    this.id = id;
    this.name = name;
    this.shortName = shortName;
    this.description = description;
    this.href = href;
    this.userAgent = userAgent;
    this.defaultHeaders = defaultHeaders;
    this.score = score;
    this.option = {
      discovery: option.discovery.map((item) => ({
        ...item,
        defaultValue: item.defaultValue || Options.Default,
      })),
      search: option.search.map((item) => ({
        ...item,
        defaultValue: item.defaultValue || Options.Default,
      })),
    };
    this.disabled = disabled;
    this.batchDelay = batchDelay;
    this.injectedJavaScript = injectedJavaScript;
  }

  /**
   * @description encode and return hash
   * @static
   * @param {Plugin} id
   * @param {string} mangaId
   * @param {string} [chapterId]
   * @return {*}  {string}
   * @memberof Base
   */
  static combineHash(id: Plugin, mangaId: string, chapterId?: string): string {
    if (!chapterId) {
      return [id, mangaId].join('&');
    }

    return [id, mangaId, chapterId].join('&');
  }

  /**
   * @description decode and return params
   * @static
   * @param {string} hash
   * @return {*}  {[Plugin, string, string]}
   * @memberof Base
   */
  static splitHash(hash: string): [Plugin, string, string] {
    const [plugin, mangaId, chapterId] = hash.split('&');
    return [plugin as Plugin, mangaId, chapterId];
  }

  /**
   * @description verify hash belong to the plugin
   * @public
   * @param {string} hash
   * @return {*}  {boolean}
   * @memberof Base
   */
  public is(hash: string): boolean {
    const [plugin] = Base.splitHash(hash);
    return plugin === this.id;
  }

  public syncExtraData(_data: Record<string, any>) {}

  /**
   * @description accept page param, return body for discovery fetch
   * @abstract
   * @param {number} page
   * @param {Record<string, string>} filter
   * @return {*}  {FetchData}
   * @memberof Base
   */
  abstract prepareDiscoveryFetch(page: number, filter: Record<string, string>): FetchData;

  /**
   * @description accept keyword param, return body for search fetch
   * @abstract
   * @param {string} keyword
   * @param {number} page
   * @param {Record<string, string>} filter
   * @return {*}  {FetchData}
   * @memberof Base
   */
  abstract prepareSearchFetch(
    keyword: string,
    page: number,
    filter: Record<string, string>
  ): FetchData;

  /**
   * @description accept mangaId param, return body for manga info fetch
   * @abstract
   * @param {string} mangaId
   * @return {*}  {FetchData}
   * @memberof Base
   */
  abstract prepareMangaInfoFetch(mangaId: string): FetchData;

  /**
   * @description accept mangaId and page param, return body or void
   * @abstract
   * @param {string} mangaId
   * @param {number} page
   * @return {*}  {(FetchData | void)}
   * @memberof Base
   */
  abstract prepareChapterListFetch(mangaId: string, page: number): FetchData | void;

  /**
   * @description accept mangaId and chapterId param, return body for chapter fetch
   * @abstract
   * @param {string} mangaId
   * @param {string} chapterId
   * @return {*}  {FetchData}
   * @memberof Base
   */
  abstract prepareChapterFetch(
    mangaId: string,
    chapterId: string,
    page: number,
    extra: Record<string, any>
  ): FetchData;

  /**
   * @description crawl data from website or interface
   * @abstract
   * @param {*} response
   * @return {*}  {({ error: Error; update?: undefined } | { error?: undefined; update: IncreaseManga[] })}
   * @memberof Base
   */
  abstract handleDiscovery(
    response: any
  ): { error: Error; discovery?: undefined } | { error?: undefined; discovery: IncreaseManga[] };

  /**
   * @description crawl data from website or interface
   * @abstract
   * @param {*} response
   * @return {*}  {({ error: Error; search?: undefined } | { error?: undefined; search: IncreaseManga[] })}
   * @memberof Base
   */
  abstract handleSearch(
    response: any
  ): { error: Error; search?: undefined } | { error?: undefined; search: IncreaseManga[] };

  /**
   * @description crawl data from website or interface
   * @abstract
   * @param {*} response
   * @return {*}  {({ error: Error; manga?: undefined } | { error?: undefined; manga: IncreaseManga })}
   * @memberof Base
   */
  abstract handleMangaInfo(
    response: any
  ): { error: Error; manga?: undefined } | { error?: undefined; manga: IncreaseManga };

  /**
   * @description crawl data from website or interface
   * @abstract
   * @param {*} response
   * @return {*}  {({ error: Error; chapterList?: undefined }
   *     | { error?: undefined; chapterList: Manga['chapters'] })}
   * @memberof Base
   */
  abstract handleChapterList(
    response: any,
    mangaId: string
  ):
    | { error: Error; chapterList?: undefined; canLoadMore?: boolean; nextPage?: number }
    | {
        error?: undefined;
        chapterList: Manga['chapters'];
        canLoadMore: boolean;
        nextPage?: number;
      };

  /**
   * @description crawl data from website or interface
   * @abstract
   * @param {*} response
   * @return {*}  {({ error: Error; chapter?: undefined } | { error?: undefined; chapter: Chapter })}
   * @memberof Base
   */
  abstract handleChapter(
    response: any,
    mangaId: string,
    chapterId: string,
    page: number
  ):
    | {
        error: Error;
        chapter?: undefined;
        canLoadMore?: boolean;
        nextPage?: number;
        nextExtra?: Record<string, any>;
      }
    | {
        error?: undefined;
        chapter: Chapter;
        canLoadMore: boolean;
        nextPage?: number;
        nextExtra?: Record<string, any>;
      };
}

export default Base;
