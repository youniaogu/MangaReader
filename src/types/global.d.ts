import { LoadStatus, UpdateStatus, env } from '~/utils';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PayloadAction } from '@reduxjs/toolkit';

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
    Detail: { id: string };
    Chapter: { mangaId: string; chapterId: string; page: number };
    About: undefined;
  };
  type StackHomeProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
  type StackSearchProps = NativeStackScreenProps<RootStackParamList, 'Search'>;
  type StackResultProps = NativeStackScreenProps<RootStackParamList, 'Result'>;
  type StackDetailProps = NativeStackScreenProps<RootStackParamList, 'Detail'>;
  type StackChapterProps = NativeStackScreenProps<RootStackParamList, 'Chapter'>;
  type StackAboutProps = NativeStackScreenProps<RootStackParamList, 'About'>;

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
    chapters: ChapterItem[];
    lastWatchChapterId?: string;
    lastWatchPage?: number;
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
    app: {
      launchStatus: LoadStatus;
      syncStatus: LoadStatus;
      clearStatus: LoadStatus;
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
      chapter: {
        [key: string]: Chapter;
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
