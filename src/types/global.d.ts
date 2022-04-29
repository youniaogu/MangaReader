import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LoadStatus, UpdateStatus } from '~/utils';
import { PayloadAction } from '@reduxjs/toolkit';

declare global {
  type GET = 'GET' | 'get';
  type POST = 'POST' | 'post';
  type FetchMethod = GET | POST;
  type FetchResponseAction<T> = PayloadAction<
    { error: Error; data?: undefined } | { error: undefined; data: T }
  >;

  type RootStackParamList = {
    Home: undefined;
    Collection: undefined;
    Search: undefined;
    Detail: { id: string };
    Chapter: { mangaId: string; chapterId: string };
    About: undefined;
  };

  type StackHomeProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
  type StackCollectionProps = NativeStackScreenProps<RootStackParamList, 'Collection'>;
  type StackSearchProps = NativeStackScreenProps<RootStackParamList, 'Search'>;
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

  interface Window {
    LoadStatus: typeof LoadStatus;
    UpdateStatus: typeof UpdateStatus;
  }

  interface String {
    splic(f: string): string[];
  }
}
