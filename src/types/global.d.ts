import { LoadStatus, UpdateStatus, env } from '~/utils';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PayloadAction } from '@reduxjs/toolkit';
import { Plugin } from '~/plugins';

declare global {
  type GET = 'GET' | 'get';
  type POST = 'POST' | 'post';
  type FetchMethod = GET | POST;
  type FetchResponseAction<T = undefined> = PayloadAction<
    undefined extends T
      ? { error?: Error }
      : { error: Error; data?: undefined } | { error?: undefined; data: T }
  >;

  type RootStackParamList = {
    Home: undefined;
    Search: undefined;
    Result: undefined;
    Detail: { mangaHash: string };
    Chapter: { mangaHash: string; chapterHash: string; page: number };
    Plugin: undefined;
    About: undefined;
  };
  type StackHomeProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
  type StackSearchProps = NativeStackScreenProps<RootStackParamList, 'Search'>;
  type StackResultProps = NativeStackScreenProps<RootStackParamList, 'Result'>;
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
    author: string;
    tag: string;
    status: UpdateStatus;
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
    images: string[];
  }

  declare interface RootState {
    app: {
      launchStatus: LoadStatus;
      syncStatus: LoadStatus;
      clearStatus: LoadStatus;
    };
    plugin: {
      source: Plugin;
      list: { name: string; label: string; value: Plugin; disabled: boolean }[];
    };
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
    favorites: string[];
    manga: {
      loadStatus: LoadStatus;
    };
    chapter: {
      loadStatus: LoadStatus;
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

  interface Window {
    env: typeof env;
    LoadStatus: typeof LoadStatus;
    UpdateStatus: typeof UpdateStatus;
  }

  interface String {
    splic(f: string): string[];
  }
}
