import React, { useMemo, useState, useCallback } from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { nonNullable, AsyncStatus } from '~/utils';
import { View, Text, HStack } from 'native-base';
import { useFocusEffect } from '@react-navigation/native';
import VectorIcon from '~/components/VectorIcon';
import Bookshelf from '~/components/Bookshelf';
import Rotate from '~/components/Rotate';
import * as RootNavigation from '~/utils/navigation';

const { batchUpdate } = action;

const Home = ({ navigation: { navigate } }: StackHomeProps) => {
  const list = useAppSelector((state) => state.favorites);
  const dict = useAppSelector((state) => state.dict.manga);
  const failList = useAppSelector((state) => state.batch.fail);
  const activeList = useAppSelector((state) => state.batch.stack);
  const loadStatus = useAppSelector((state) => state.app.launchStatus);

  const favoriteList = useMemo(
    () => list.map((item) => dict[item.mangaHash]).filter(nonNullable),
    [dict, list]
  );
  const trendList = useMemo(
    () => list.filter((item) => item.isTrend).map((item) => item.mangaHash),
    [list]
  );
  const negativeList = useMemo(
    () => list.filter((item) => !item.enableBatch).map((item) => item.mangaHash),
    [list]
  );

  const handleDetail = (mangaHash: string) => {
    navigate('Detail', { mangaHash });
  };

  return (
    <Bookshelf
      emptyText="还没有收藏~"
      list={favoriteList}
      failList={failList}
      trendList={trendList}
      activeList={activeList}
      negativeList={negativeList}
      itemOnPress={handleDetail}
      loading={loadStatus === AsyncStatus.Pending}
    />
  );
};

export const SearchAndAbout = () => {
  const dispatch = useAppDispatch();
  const { loadStatus: batchStatus, stack, queue, fail } = useAppSelector((state) => state.batch);
  const [enableRotate, setEnableRotate] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setEnableRotate(batchStatus === AsyncStatus.Pending);
    }, [batchStatus])
  );

  const handleSearch = () => {
    RootNavigation.navigate('Discovery');
  };
  const handlePlugin = () => {
    RootNavigation.navigate('Plugin');
  };
  const handleUpdate = () => {
    dispatch(batchUpdate());
  };

  return (
    <HStack flexShrink={0}>
      <VectorIcon name="search" onPress={handleSearch} />
      <VectorIcon name="settings" onPress={handlePlugin} />
      <View position="relative">
        <Rotate enable={enableRotate}>
          <VectorIcon isDisabled={enableRotate} name="autorenew" onPress={handleUpdate} />
        </Rotate>
        {batchStatus === AsyncStatus.Pending && (
          <Text position="absolute" top={0} right={0} color="white" fontWeight="extrabold">
            {queue.length + stack.length}
          </Text>
        )}
        {batchStatus !== AsyncStatus.Pending && fail.length > 0 && (
          <Text position="absolute" top={0} right={0} color="red.400" fontWeight="extrabold">
            {fail.length}
          </Text>
        )}
      </View>
    </HStack>
  );
};

export default Home;
