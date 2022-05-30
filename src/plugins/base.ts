import { FetchData } from '~/utils';
import { Plugin } from './index';

abstract class Base {
  readonly id: Plugin;
  readonly name: string;

  constructor(id: Plugin, name: string) {
    this.id = id;
    this.name = name;
  }

  abstract prepareUpdateFetch(page: number): FetchData;
  abstract prepareSearchFetch(keyword: string, page: number): FetchData;
  abstract prepareMangaFetch(mangaId: string): FetchData;
  abstract prepareChapterFetch(mangaId: string, chapterId: string): FetchData;

  abstract handleUpdate(text: string | null): Manga[];
  abstract handleSearch(text: string | null): Manga[];
  abstract handleManga(text: string | null): Manga;
  abstract handleChapter(text: string | null): Chapter;
}

export default Base;
