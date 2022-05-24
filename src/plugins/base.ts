abstract class Base {
  readonly id: string;
  readonly name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  abstract handleUpdate(text: string | null): Manga[];
  abstract handleSearch(text: string | null): Manga[];
  abstract handleManga(text: string | null): Manga;
  abstract handleChapter(text: string | null): Chapter;
}

export default Base;
