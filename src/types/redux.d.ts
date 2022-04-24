declare type LoadStatus = 0 | 1 | 2;
declare type UpdateStatus = 0 | 1 | 2;

declare interface ChapterItem {
  mangaId: string;
  chapterId: string;
  href: string;
  title: string;
}

declare interface Manga {
  id: string;
  cover: string;
  title: string;
  latest: string;
  updateTime: string;
  author: string;
  tag: string;
  status: UpdateStatus;
}
declare interface Chapter {
  mangaId: string;
  chapterId: string;
  name: string;
  title: string;
  images: {
    uri: string;
    headers: {
      [index: string]: string;
    };
  }[];
  nextId: string;
  prevId: string;
}

declare interface RootState {
  search: {
    keyword: string;
    page: number;
    isEnd: boolean;
    loadStatus: LoadStatus;
    list: string[];
  };
  update: {
    page: number;
    isEnd: boolean;
    loadStatus: LoadStatus;
    list: string[];
  };
  manga: {
    mangaId: string;
    loadStatus: LoadStatus;
  };
  chapter: {
    mangaId: string;
    chapterId: string;
    loadStatus: LoadStatus;
  };
  dict: {
    manga: {
      [key: string]: Manga;
    };
    mangaToChapter: {
      [key: string]: ChapterItem[];
    };
    chapter: {
      [key: string]: Chapter;
    };
  };
}
