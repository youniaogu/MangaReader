import { FetchData } from '~/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface InitialData {
  id: Plugin;
  name: string;
  shortName: string;
  description: string;
  score: number;
  config: PartialOption<PluginConfig, 'batchDelay'>;
  typeOptions?: { label: string; value: string }[];
  regionOptions?: { label: string; value: string }[];
  statusOptions?: { label: string; value: string }[];
  sortOptions?: { label: string; value: string }[];
  disabled?: boolean;
}

interface PluginConfig {
  origin: {
    label: string;
    value: string;
  };
  batchDelay: number;
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
  /**
   * @description switch of display in plugins list
   * @type {boolean}
   * @memberof Base
   */
  readonly disabled: boolean;
  /**
   * @description config with sync by AsyncStorage
   * @type {PluginConfig}
   * @memberof Base
   */
  config: PluginConfig;

  /**
   * @description Creates an instance of Base.
   * @param {InitialData} init
   * @memberof Base
   */
  constructor(init: InitialData) {
    const {
      id,
      name,
      shortName,
      description,
      score,
      config,
      typeOptions = [],
      regionOptions = [],
      statusOptions = [],
      sortOptions = [],
      disabled = false,
    } = init;
    this.id = id;
    this.name = name;
    this.shortName = shortName;
    this.description = description;
    this.score = score;

    this.config = { ...config, batchDelay: config.batchDelay || 3000 };
    this.typeOptions = typeOptions;
    this.regionOptions = regionOptions;
    this.statusOptions = statusOptions;
    this.sortOptions = sortOptions;
    this.disabled = disabled;
    this.sync();
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
   * @description sync config from AsyncStorage
   * @memberof Base
   */
  public sync() {
    AsyncStorage.getItem(this.id).then((value) => {
      if (value) {
        this.config = JSON.parse(value);
      }
    });
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

  /**
   * @description plugin is ready for use
   * @return {*}  {Promise<boolean>}
   * @memberof Base
   */
  public ready(): boolean {
    return this.config === undefined;
  }

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
    response: any,
    mangaId: string,
    chapterId: string
  ): { error: Error; chapter?: undefined } | { error?: undefined; chapter: Chapter };
}

export default Base;
