import { AsyncStatus, MangaStatus, ReaderMode, ReaderDirection, customTheme, env } from '~/utils';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PayloadAction } from '@reduxjs/toolkit';
import { Plugin } from '~/plugins';

type CustomTheme = typeof customTheme;

declare module 'native-base' {
  interface ICustomTheme extends CustomTheme {}
}

declare global {
  type GET = 'GET' | 'get';
  type POST = 'POST' | 'post';
  type FetchResponseAction<T = undefined> = PayloadAction<
    undefined extends T
      ? { error?: Error; taskId?: string }
      :
          | { error: Error; data?: undefined; taskId?: string }
          | { error?: undefined; data: T; taskId?: string }
  >;
  type PartialOption<T, K extends string | number | symbol> = Omit<T, K> & {
    [A in Extract<keyof T, K>]?: T[A];
  };

  type BackupData = {
    createTime: number;
    favorites: string[];
  };

  type RootStackParamList = {
    Home: undefined;
    Discovery: undefined;
    Search: { keyword: string; source: Plugin };
    Detail: { mangaHash: string };
    Chapter: { mangaHash: string; chapterHash: string; page: number };
    Plugin: undefined;
    Scan: undefined;
    Webview: { uri: string; userAgent?: string };
    About: undefined;
  };
  type StackHomeProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
  type StackDiscoveryProps = NativeStackScreenProps<RootStackParamList, 'Discovery'>;
  type StackSearchProps = NativeStackScreenProps<RootStackParamList, 'Search'>;
  type StackDetailProps = NativeStackScreenProps<RootStackParamList, 'Detail'>;
  type StackChapterProps = NativeStackScreenProps<RootStackParamList, 'Chapter'>;
  type StackPluginProps = NativeStackScreenProps<RootStackParamList, 'Plugin'>;
  type StackScanProps = NativeStackScreenProps<RootStackParamList, 'Scan'>;
  type StackWebviewProps = NativeStackScreenProps<RootStackParamList, 'Webview'>;
  type StackAboutProps = NativeStackScreenProps<RootStackParamList, 'About'>;

  declare interface Manga {
    href: string;
    hash: string;
    source: Plugin;
    sourceName: string;
    mangaId: string;
    cover: string;
    headers?: {
      [key: string]: string;
    };
    title: string;
    latest: string;
    updateTime: string;
    author: string[];
    tag: string[];
    status: MangaStatus;
    chapters: ChapterItem[];
    lastWatchChapter?: string;
    lastWatchPage?: number;
  }
  declare interface IncreaseManga
    extends PartialOption<
      Manga,
      'latest' | 'updateTime' | 'author' | 'tag' | 'status' | 'chapters'
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
    name: string;
    title: string;
    headers?: {
      [key: string]: string;
    };
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
      apk: {
        size: number;
        downloadUrl: string;
      };
      ipa: {
        size: number;
        downloadUrl: string;
      };
    };
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
      mode: ReaderMode;
      direction: ReaderDirection;
    };
    plugin: {
      source: Plugin;
      list: {
        name: string;
        label: string;
        value: Plugin;
        score: number;
        description: string;
        disabled: boolean;
      }[];
    };
    batch: {
      loadStatus: AsyncStatus;
      stack: string[];
      queue: string[];
      success: string[];
      fail: string[];
    };
    favorites: { mangaHash: string; isTrend: boolean; inQueue: boolean }[];
    search: {
      page: number;
      isEnd: boolean;
      loadStatus: AsyncStatus;
      list: string[];
    };
    discovery: {
      type: string;
      region: string;
      status: string;
      sort: string;
      page: number;
      isEnd: boolean;
      loadStatus: AsyncStatus;
      list: string[];
    };
    manga: {
      loadStatus: AsyncStatus;
    };
    chapter: {
      loadStatus: AsyncStatus;
    };
    dict: {
      manga: {
        [key: string]: Manga | undefined;
      };
      chapter: {
        [key: string]: Chapter | undefined;
      };
    };
  }

  interface String {
    splic(f: string): string[];
  }

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: env;
      NAME: string;
      VERSION: string;
      PUBLISH_TIME: string;
    }
  }
}
