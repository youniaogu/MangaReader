import { FetchData } from '~/utils';

export enum Plugin {
  MHG = 'MHG',
  MHGM = 'MHGM',
  COPY = 'COPY',
  MHDB = 'MHDB',
  DMZJ = 'DMZJ',
  JMC = 'JMC',
  MHM = 'MHM',
}

export enum Options {
  Default = '$$DEFAULT$$',
}

abstract class Base {
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
   * @description score rate of plugin
   * @type {number}
   * @memberof Base
   */
  readonly score: number;
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

  /**
   * @description enum for type select
   * @type {{ label: string; value: string }[]}
   * @memberof Base
   */
  readonly typeOptions: { label: string; value: string }[];
  /**
   * @description enum for region select
   * @type {{ label: string; value: string }[]}
   * @memberof Base
   */
  readonly regionOptions: { label: string; value: string }[];
  /**
   * @description enum for status select
   * @type {{ label: string; value: string }[]}
   * @memberof Base
   */
  readonly statusOptions: { label: string; value: string }[];
  /**
   * @description enum for sort select
   * @type {{ label: string; value: string }[]}
   * @memberof Base
   */
  readonly sortOptions: { label: string; value: string }[];
  readonly disabled: boolean;

  /**
   * @description Creates an instance of Base.
   * @param {Plugin} id
   * @param {string} name
   * @param {string} shortName
   * @param {{ label: string; value: string }[]} [typeOptions=[]]
   * @param {{ label: string; value: string }[]} [regionOptions=[]]
   * @param {{ label: string; value: string }[]} [statusOptions=[]]
   * @param {{ label: string; value: string }[]} [sortOptions=[]]
   * @memberof Base
   */
  constructor(
    id: Plugin,
    name: string,
    score: number,
    shortName: string,
    description: string,
    typeOptions: { label: string; value: string }[] = [],
    regionOptions: { label: string; value: string }[] = [],
    statusOptions: { label: string; value: string }[] = [],
    sortOptions: { label: string; value: string }[] = [],
    disabled = false
  ) {
    this.id = id;
    this.name = name;
    this.score = score;
    this.shortName = shortName;
    this.description = description;
    this.typeOptions = typeOptions;
    this.regionOptions = regionOptions;
    this.statusOptions = statusOptions;
    this.sortOptions = sortOptions;
    this.disabled = disabled;
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
   * @abstract
   * @param {string} hash
   * @return {*}  {boolean}
   * @memberof Base
   */
  abstract is(hash: string): boolean;

  /**
   * @description accept page param, return body for discovery fetch
   * @abstract
   * @param {number} page
   * @return {*}  {FetchData}
   * @memberof Base
   */
  abstract prepareDiscoveryFetch(
    page: number,
    type: string,
    region: string,
    status: string,
    sort: string
  ): FetchData;

  /**
   * @description accept keyword param, return body for search fetch
   * @abstract
   * @param {string} keyword
   * @param {number} page
   * @return {*}  {FetchData}
   * @memberof Base
   */
  abstract prepareSearchFetch(keyword: string, page: number): FetchData;

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
  abstract prepareChapterFetch(mangaId: string, chapterId: string): FetchData;

  /**
   * @description crawl data from website or interface
   * @abstract
   * @param {*} response
   * @return {*}  {({ error: Error; update?: undefined } | { error?: undefined; update: Manga[] })}
   * @memberof Base
   */
  abstract handleDiscovery(
    response: any
  ): { error: Error; discovery?: undefined } | { error?: undefined; discovery: Manga[] };

  /**
   * @description crawl data from website or interface
   * @abstract
   * @param {*} response
   * @return {*}  {({ error: Error; search?: undefined } | { error?: undefined; search: Manga[] })}
   * @memberof Base
   */
  abstract handleSearch(
    response: any
  ): { error: Error; search?: undefined } | { error?: undefined; search: Manga[] };

  /**
   * @description crawl data from website or interface
   * @abstract
   * @param {*} response
   * @return {*}  {({ error: Error; manga?: undefined } | { error?: undefined; manga: Manga })}
   * @memberof Base
   */
  abstract handleMangaInfo(
    response: any
  ): { error: Error; manga?: undefined } | { error?: undefined; manga: Manga };

  /**
   * @description crawl data from website or interface
   * @abstract
   * @param {*} response
   * @return {*}  {({ error: Error; chapterList?: undefined }
   *     | { error?: undefined; chapterList: Manga['chapters'] })}
   * @memberof Base
   */
  abstract handleChapterList(
    response: any
  ):
    | { error: Error; chapterList?: undefined; canLoadMore?: boolean }
    | { error?: undefined; chapterList: Manga['chapters']; canLoadMore: boolean };

  /**
   * @description crawl data from website or interface
   * @abstract
   * @param {*} response
   * @return {*}  {({ error: Error; chapter?: undefined } | { error?: undefined; chapter: Chapter })}
   * @memberof Base
   */
  abstract handleChapter(
    response: any
  ): { error: Error; chapter?: undefined } | { error?: undefined; chapter: Chapter };
}

export default Base;
