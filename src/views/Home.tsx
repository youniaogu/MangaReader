import React, { useState, useEffect, useMemo } from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { HStack, IconButton, Icon, View, Text } from 'native-base';
import { AsyncStatus, isManga } from '~/utils';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Bookshelf from '~/components/Bookshelf';
import Rotate from '~/components/Rotate';
import Empty from '~/components/Empty';
import * as RootNavigation from '~/utils/navigation';

const { launch, batchUpdate } = action;

const Home = ({ navigation: { navigate } }: StackHomeProps) => {
  const dispatch = useAppDispatch();
  const list = useAppSelector((state) => state.favorites);
  const dict = useAppSelector((state) => state.dict.manga);
  const favoriteList = useMemo(
    () => list.map((item) => dict[item.mangaHash]).filter(isManga),
    [dict, list]
  );
  const trendList = useMemo(
    () => list.filter((item) => item.isTrend === true).map((item) => item.mangaHash),
    [list]
  );

  useEffect(() => {
    dispatch(launch());
  }, [dispatch]);

  const handleDetail = (mangaHash: string) => {
    navigate('Detail', { mangaHash });
  };

  if (list.length === 0) {
    return <Empty />;
  }

  return <Bookshelf list={favoriteList} trends={trendList} itemOnPress={handleDetail} />;
};

export const SearchAndAbout = () => {
  const [isRotate, setIsRotate] = useState(false);
  const dispatch = useAppDispatch();
  const favorites = useAppSelector((state) => state.favorites);
  const { loadStatus: batchStatus, queue } = useAppSelector((state) => state.batch);

  useEffect(() => {
    setIsRotate(batchStatus === AsyncStatus.Pending);
  }, [batchStatus]);

  const handleSearch = () => {
    RootNavigation.navigate('Search');
  };
  const handleUpdate = () => {
    dispatch(batchUpdate(favorites.map((item) => item.mangaHash)));
  };

  return (
    <HStack flexShrink={0}>
      <IconButton
        icon={<Icon as={MaterialIcons} name="search" size={30} color="white" />}
        onPress={handleSearch}
      />
      <View position="relative">
        <Rotate isRotate={isRotate}>
          <IconButton
            isDisabled={isRotate}
            icon={<Icon as={MaterialIcons} name="autorenew" size={30} color="white" />}
            onPress={handleUpdate}
          />
        </Rotate>
        {batchStatus === AsyncStatus.Pending && (
          <Text position="absolute" top={0} right={0} color="white" fontWeight="extrabold">
            {queue.length}
          </Text>
        )}
      </View>
    </HStack>
  );
};

export default Home;
