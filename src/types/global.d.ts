import {
  AsyncStatus,
  MangaStatus,
  Sequence,
  LayoutMode,
  LightSwitch,
  ReaderDirection,
  TaskType,
  customTheme,
} from '~/utils';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PayloadAction } from '@reduxjs/toolkit';
import { Plugin } from '~/plugins';
import '@types/cheerio';

type CustomTheme = typeof customTheme;

declare module 'native-base' {
  interface ICustomTheme extends CustomTheme {}
}

declare global {
  type GET = 'GET' | 'get';
  type POST = 'POST' | 'post';
  type FetchResponseAction<T = undefined> = PayloadAction<
    undefined extends T
      ? { error?: Error; actionId?: string }
      :
          | { error: Error; data?: undefined; actionId?: string }
          | { error?: undefined; data: T; actionId?: string }
  >;
  type PartialOption<T, K extends string | number | symbol> = Omit<T, K> & {
    [A in Extract<keyof T, K>]?: T[A];
  };

  type BackupData = {
    createTime: number;
    favorites: string[];
    lastWatch?: RootState['dict']['lastWatch'];
  };

  type InitPluginOptions = {
    OS: 'ios' | 'android' | 'windows' | 'macos' | 'web';
  };

  type OptionItem = { label: string; value: string };

  type RootStackParamList = {
    Home: undefined;
    Discovery: undefined;
    Search: { keyword: string; source: Plugin };
    Detail: { mangaHash: string; enabledMultiple?: boolean; selected?: string[] };
    Chapter: { mangaHash: string; chapterHash: string; page: number };
    Plugin: undefined;
    Webview: { uri: string; source?: Plugin; userAgent?: string; injectedJavascript?: string };
    About: undefined;
  };
  type StackHomeProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
  type StackDiscoveryProps = NativeStackScreenProps<RootStackParamList, 'Discovery'>;
  type StackSearchProps = NativeStackScreenProps<RootStackParamList, 'Search'>;
  type StackDetailProps = NativeStackScreenProps<RootStackParamList, 'Detail'>;
  type StackChapterProps = NativeStackScreenProps<RootStackParamList, 'Chapter'>;
  type StackPluginProps = NativeStackScreenProps<RootStackParamList, 'Plugin'>;
  type StackWebviewProps = NativeStackScreenProps<RootStackParamList, 'Webview'>;
  type StackAboutProps = NativeStackScreenProps<RootStackParamList, 'About'>;

  declare interface Manga {
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
  declare interface IncreaseManga
    extends PartialOption<
      Manga,
      'latest' | 'updateTime' | 'author' | 'tag' | 'status' | 'chapters' | 'bookCover' | 'infoCover'
    > {}
  declare interface ChapterItem {
    hash: string;
    mangaId: string;
    chapterId: string;
    href: string;
    title: string;
  }
  declare interface Chapter {
    hash: string;
    mangaId: string;
    chapterId: string;
    name?: string;
    title: string;
    headers?: Record<string, string>;
    images: { uri: string; needUnscramble?: boolean }[];
  }
  declare interface Release {
    loadStatus: AsyncStatus;
    name: string;
    version: string;
    publishTime: string;
    latest?: LatestRelease;
  }
  declare interface LatestRelease {
    url: string;
    version: string;
    changeLog: string;
    publishTime: string;
    file?: {
      apk: { size: number; downloadUrl: string };
      ipa: { size: number; downloadUrl: string };
    };
  }
  declare interface Task {
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
  declare interface Job {
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

  declare interface RootState {
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

  interface String {
    splic(f: string): string[];
  }

  interface Window {
    __InitMangaPlugin__: (options?: InitPluginOptions) => {
      Plugin: typeof Plugin;
      Options: typeof Options;
      PluginMap: Map<Plugin, Base>;
      combineHash: (id: Plugin, mangaId: string, chapterId?: string | undefined) => string;
      splitHash: (hash: string) => [Plugin, string, string];
      defaultPlugin: Plugin;
      defaultPluginList: {
        label: string;
        name: string;
        value: Plugin;
        score: number;
        href: string;
        userAgent: string | undefined;
        description: string;
        disabled: boolean;
      }[];
    };
  }

  namespace NodeJS {
    interface ProcessEnv {
      NAME: string;
      VERSION: string;
      PUBLISH_TIME: string;
    }
  }
}
