declare type LodaStatus = 0 | 1 | 2;
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
  images: string[];
  nextId: string;
  prevId: string;
}

declare interface RootState {
  search: {
    keyword: string;
    page: number;
    isEnd: boolean;
    loadStatus: LodaStatus;
    list: string[];
  };
  update: {
    page: number;
    isEnd: boolean;
    loadStatus: LodaStatus;
    list: string[];
  };
  manga: {
    currentId: string;
    loadStatus: LodaStatus;
  };
  chapter: {
    currentId: string;
    loadStatus: LodaStatus;
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
