import { AsyncStatus, MangaStatus, ReaderMode, customTheme, env } from '~/utils';
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
  type ActionParameters<T = Function> = PayloadAction<Parameters<T>[0]>;

  type RootStackParamList = {
    Home: undefined;
    Discovery: undefined;
    Search: { keyword: string };
    Detail: { mangaHash: string };
    Chapter: { mangaHash: string; chapterHash: string; page: number };
    Plugin: undefined;
    About: undefined;
  };
  type StackHomeProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
  type StackDiscoveryProps = NativeStackScreenProps<RootStackParamList, 'Discovery'>;
  type StackSearchProps = NativeStackScreenProps<RootStackParamList, 'Search'>;
  type StackDetailProps = NativeStackScreenProps<RootStackParamList, 'Detail'>;
  type StackChapterProps = NativeStackScreenProps<RootStackParamList, 'Chapter'>;
  type StackPluginProps = NativeStackScreenProps<RootStackParamList, 'Plugin'>;
  type StackAboutProps = NativeStackScreenProps<RootStackParamList, 'About'>;

  declare interface Manga {
    href: string;
    hash: string;
    source: Plugin;
    sourceName: string;
    mangaId: string;
    cover: string;
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
    headers: {
      [index: string]: string;
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
      syncStatus: AsyncStatus;
      clearStatus: AsyncStatus;
      errorMessage: string[];
    };
    release: Release;
    setting: {
      readerMode: ReaderMode;
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
