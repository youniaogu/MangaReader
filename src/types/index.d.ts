declare type LodaStatus = 0 | 1 | 2;

declare interface LatestItem {}
declare interface ChapterItem {}
declare interface MangaChapterItem {
  mangaId: string;
  chapterId: string;
  href: string;
  title: string;
}

declare interface MangaDetail {
  id: string;
  cover: string;
  title: string;
  latest: string;
  updateTime: string;
  author: string;
  tag: string;
  chapter: MangaChapterItem[];
  status: 0 | 1 | 2;
}
declare interface ChapterDetail {
  mangaId: string;
  chapterId: string;
  name: string;
  title: string;
  images: string[];
  nextId: string;
  prevId: string;
}

declare interface RootState {
  latest: {
    page: number;
    isEnd: boolean;
    loadStatus: LodaStatus;
    list: LatestItem[];
  };
  manga: {
    search: string;
    loadStatus: LodaStatus;
    dict: {
      [key: string]: MangaDetail;
    };
  };
  chapter: {
    search: string;
    loadStatus: LodaStatus;
    dict: {
      [key: string]: ChapterDetail;
    };
  };
}

// declare global {
//   interface String {
//     splic(f: string): string[];
//   }
// }

declare interface String {
  splic(f: string): string[];
}
