import React from 'react';
import { HStack, IconButton, Icon } from 'native-base';
import { useAppSelector } from '~/redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Bookshelf from '~/components/Bookshelf';
import Empty from '~/components/Empty';
import * as RootNavigation from '~/utils/navigation';

const Home = ({ navigation: { navigate } }: StackHomeProps) => {
  const list = useAppSelector((state) => state.favorites);
  const dict = useAppSelector((state) => state.dict.manga);

  const handleDetail = (id: string) => {
    navigate('Detail', { id });
  };

  if (list.length === 0) {
    return <Empty />;
  }

  return <Bookshelf list={list.map((item) => dict[item])} itemOnPress={handleDetail} />;
};

export const SearchAndAbout = () => {
  const handleSearch = () => {
    RootNavigation.navigate('Search');
  };
  const handleAbout = () => {
    RootNavigation.navigate('About');
  };

  return (
    <HStack flexShrink="0">
      <IconButton
        icon={<Icon as={MaterialIcons} name="search" size={30} color="white" />}
        onPress={handleSearch}
      />
      <IconButton
        icon={<Icon as={MaterialIcons} name="info-outline" size={30} color="white" />}
        onPress={handleAbout}
      />
    </HStack>
  );
};

export default Home;
