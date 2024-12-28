import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Plugin } from '~/plugins';

declare global {
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
}
