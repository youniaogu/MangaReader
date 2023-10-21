import {
  AsyncStatus,
  MangaStatus,
  Sequence,
  LayoutMode,
  LightSwitch,
  ReaderDirection,
  TaskType,
} from '~/utils';
import { Plugin } from '~/plugins';

declare global {
  interface Manga {
    href: string;
    hash: string;
    source: Plugin;
    sourceName: string;
    mangaId: string;
    // redundancy data for init after upgrade
    // remove it when next version
    cover?: string;
    bookCover: string;
    infoCover: string;
    headers?: Record<string, string>;
    title: string;
    latest: string;
    updateTime: string;
    author: string[];
    tag: string[];
    status: MangaStatus;
    chapters: ChapterItem[];
  }
  interface IncreaseManga
    extends PartialOption<
      Manga,
      'latest' | 'updateTime' | 'author' | 'tag' | 'status' | 'chapters' | 'bookCover' | 'infoCover'
    > {}
  interface ChapterItem {
    hash: string;
    mangaId: string;
    chapterId: string;
    href: string;
    title: string;
  }
  interface Chapter {
    hash: string;
    mangaId: string;
    chapterId: string;
    /** 漫画名 */
    name?: string;
    /** 章节名 */
    title: string;
    headers?: Record<string, string>;
    images: { uri: string; needUnscramble?: boolean; scrambleType?: ScrambleType }[];
  }
  interface Release {
    loadStatus: AsyncStatus;
    name: string;
    version: string;
    publishTime: string;
    latest?: LatestRelease;
  }
  interface LatestRelease {
    url: string;
    version: string;
    changeLog: string;
    publishTime: string;
    file?: {
      apk: { size: number; downloadUrl: string };
      ipa: { size: number; downloadUrl: string };
    };
  }
  interface Task {
    taskId: string;
    chapterHash: string;
    title: string;
    type: TaskType;
    status: AsyncStatus;
    headers?: Record<string, string>;
    queue: { index: number; source: string; jobId: string }[];
    pending: string[];
    success: string[];
    fail: string[];
  }
  interface Job {
    taskId: string;
    jobId: string;
    chapterHash: string;
    type: TaskType;
    status: AsyncStatus;
    source: string;
    album: string;
    index: number;
    headers?: Record<string, string>;
  }

  interface RootState {
    app: {
      launchStatus: AsyncStatus;
      message: string[];
    };
    datasync: {
      syncStatus: AsyncStatus;
      clearStatus: AsyncStatus;
      backupStatus: AsyncStatus;
      restoreStatus: AsyncStatus;
    };
    release: Release;
    setting: {
      mode: LayoutMode;
      light: LightSwitch;
      direction: ReaderDirection;
      sequence: Sequence;
      androidDownloadPath: string;
    };
    plugin: {
      source: Plugin;
      list: {
        name: string;
        label: string;
        value: Plugin;
        score: number;
        href: string;
        userAgent?: string;
        description: string;
        disabled: boolean;
        injectedJavaScript?: string;
      }[];
      extra: Record<string, any>;
    };
    batch: {
      loadStatus: AsyncStatus;
      stack: string[];
      queue: string[];
      success: string[];
      fail: string[];
    };
    favorites: { mangaHash: string; isTrend: boolean; enableBatch: boolean }[];
    search: {
      filter: Record<string, string>;
      keyword: string;
      page: number;
      isEnd: boolean;
      loadStatus: AsyncStatus;
      list: string[];
    };
    discovery: {
      filter: Record<string, string>;
      page: number;
      isEnd: boolean;
      loadStatus: AsyncStatus;
      list: string[];
    };
    manga: {
      loadStatus: AsyncStatus;
      loadingMangaHash: string;
    };
    chapter: {
      loadStatus: AsyncStatus;
      loadingChapterHash: string;
      openDrawer: boolean;
      showDrawer: boolean;
    };
    task: {
      list: Task[];
      job: {
        max: number;
        list: Job[];
        thread: { taskId: string; jobId: string }[];
      };
    };
    dict: {
      manga: Record<string, Manga | undefined>;
      chapter: Record<string, Chapter | undefined>;
      record: Record<
        string,
        { total: number; progress: number; imagesLoaded: number[]; isVisited: boolean }
      >;
      lastWatch: Record<string, { page?: number; chapter?: string; title?: string }>;
    };
  }
}

export type ExportRootState = { A: string };
