import React, { useEffect } from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { HStack, IconButton, Icon } from 'native-base';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Bookshelf from '~/components/Bookshelf';
import Empty from '~/components/Empty';
import * as RootNavigation from '~/utils/navigation';

const { launch } = action;

const Home = ({ navigation: { navigate } }: StackHomeProps) => {
  const dispatch = useAppDispatch();
  const list = useAppSelector((state) => state.favorites);
  const dict = useAppSelector((state) => state.dict.manga);

  useEffect(() => {
    dispatch(launch());
  }, [dispatch]);

  const handleDetail = (id: string) => {
    navigate('Detail', { id });
  };

  if (list.length === 0) {
    return <Empty />;
  }

  return (
    <Bookshelf
      list={list.map((item) => dict[item]).filter((item) => item !== undefined)}
      itemOnPress={handleDetail}
    />
  );
};

export const SearchAndAbout = () => {
  const handleSearch = () => {
    RootNavigation.navigate('Search');
  };
  const handleAbout = () => {
    RootNavigation.navigate('About');
  };

  return (
    <HStack flexShrink={0}>
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
