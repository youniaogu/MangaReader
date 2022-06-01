import { FetchData } from '~/utils';
import { Plugin } from './index';

abstract class Base {
  readonly id: Plugin;
  readonly name: string;
  readonly shortName: string;

  constructor(id: Plugin, name: string, shortName: string) {
    this.id = id;
    this.name = name;
    this.shortName = shortName;
  }

  static combineHash(id: Plugin, mangaId: string, chapterId?: string): string {
    if (!chapterId) {
      return [id, mangaId].join('&');
    }

    return [id, mangaId, chapterId].join('&');
  }
  static splitHash(hash: string): [Plugin, string, string] {
    const [plugin, mangaId, chapterId] = hash.split('&');
    return [plugin as Plugin, mangaId, chapterId];
  }

  abstract prepareUpdateFetch(page: number): FetchData;
  abstract prepareSearchFetch(keyword: string, page: number): FetchData;
  abstract prepareMangaFetch(mangaId: string): FetchData;
  abstract prepareChapterFetch(mangaId: string, chapterId: string): FetchData;

  abstract handleUpdate(
    text: string | null
  ): { error: Error; update?: undefined } | { error?: undefined; update: Manga[] };
  abstract handleSearch(
    text: string | null
  ): { error: Error; search?: undefined } | { error?: undefined; search: Manga[] };
  abstract handleManga(
    text: string | null
  ): { error: Error; manga?: undefined } | { error?: undefined; manga: Manga };
  abstract handleChapter(
    text: string | null
  ): { error: Error; chapter?: undefined } | { error?: undefined; chapter: Chapter };
}

export default Base;
