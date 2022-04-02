import { NativeStackScreenProps } from '@react-navigation/native-stack';

declare global {
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
}
