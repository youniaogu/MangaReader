import { NativeStackScreenProps } from '@react-navigation/native-stack';
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
    About: undefined;
  };

  type StackHomeProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
  type StackCollectionProps = NativeStackScreenProps<RootStackParamList, 'Collection'>;
  type StackSearchProps = NativeStackScreenProps<RootStackParamList, 'Search'>;
  type StackDetailProps = NativeStackScreenProps<RootStackParamList, 'Detail'>;
  type StackAboutProps = NativeStackScreenProps<RootStackParamList, 'About'>;

  interface String {
    splic(f: string): string[];
  }
}
