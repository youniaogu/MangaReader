import { FetchData } from '~/utils';
import { Plugin } from './index';

abstract class Base {
  /**
   * @description key differences between plugins
   * @type {Plugin}
   * @memberof Base
   */
  readonly id: Plugin;
  /**
   * @description
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
   * @description Creates an instance of Base.
   * @param {Plugin} id
   * @param {string} name
   * @param {string} shortName
   * @memberof Base
   */
  constructor(id: Plugin, name: string, shortName: string) {
    this.id = id;
    this.name = name;
    this.shortName = shortName;
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
   * @description accept page param, return body for update fetch
   * @abstract
   * @param {number} page
   * @return {*}  {FetchData}
   * @memberof Base
   */
  abstract prepareUpdateFetch(page: number): FetchData;
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
   * @description accept mangaId param, return body for manga fetch
   * @abstract
   * @param {string} mangaId
   * @return {*}  {FetchData}
   * @memberof Base
   */
  abstract prepareMangaFetch(mangaId: string): FetchData;
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
   * @description crawl data from website
   * @abstract
   * @param {(string | null)} text
   * @return {*}  {({ error: Error; update?: undefined } | { error?: undefined; update: Manga[] })}
   * @memberof Base
   */
  abstract handleUpdate(
    text: string | null
  ): { error: Error; update?: undefined } | { error?: undefined; update: Manga[] };
  /**
   * @description crawl data from website
   * @abstract
   * @param {(string | null)} text
   * @return {*}  {({ error: Error; search?: undefined } | { error?: undefined; search: Manga[] })}
   * @memberof Base
   */
  abstract handleSearch(
    text: string | null
  ): { error: Error; search?: undefined } | { error?: undefined; search: Manga[] };
  /**
   * @description crawl data from website
   * @abstract
   * @param {(string | null)} text
   * @return {*}  {({ error: Error; manga?: undefined } | { error?: undefined; manga: Manga })}
   * @memberof Base
   */
  abstract handleManga(
    text: string | null
  ): { error: Error; manga?: undefined } | { error?: undefined; manga: Manga };
  /**
   * @description crawl data from website
   * @abstract
   * @param {(string | null)} text
   * @return {*}  {({ error: Error; chapter?: undefined } | { error?: undefined; chapter: Chapter })}
   * @memberof Base
   */
  abstract handleChapter(
    text: string | null
  ): { error: Error; chapter?: undefined } | { error?: undefined; chapter: Chapter };
}

export default Base;
