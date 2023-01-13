import React, { useMemo, useState, useCallback } from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { HStack, IconButton, Icon, View, Text } from 'native-base';
import { nonNullable, AsyncStatus } from '~/utils';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Bookshelf from '~/components/Bookshelf';
import Rotate from '~/components/Rotate';
import * as RootNavigation from '~/utils/navigation';

const { batchUpdate } = action;

const Home = ({ navigation: { navigate } }: StackHomeProps) => {
  const list = useAppSelector((state) => state.favorites);
  const dict = useAppSelector((state) => state.dict.manga);
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
    () => list.filter((item) => !item.inQueue).map((item) => item.mangaHash),
    [list]
  );

  const handleDetail = (mangaHash: string) => {
    navigate('Detail', { mangaHash });
  };

  return (
    <Bookshelf
      emptyText="还没有收藏~"
      list={favoriteList}
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

  const handleScan = () => {
    RootNavigation.navigate('Scan');
  };
  const handleSearch = () => {
    RootNavigation.navigate('Discovery');
  };
  const handleUpdate = () => {
    dispatch(batchUpdate());
  };

  return (
    <HStack flexShrink={0}>
      <IconButton
        icon={<Icon as={MaterialIcons} name="qr-code-scanner" size="2xl" color="white" />}
        onPress={handleScan}
      />
      <IconButton
        icon={<Icon as={MaterialIcons} name="search" size="2xl" color="white" />}
        onPress={handleSearch}
      />
      <View position="relative">
        <Rotate enable={enableRotate}>
          <IconButton
            isDisabled={enableRotate}
            icon={<Icon as={MaterialIcons} name="autorenew" size="2xl" color="white" />}
            onPress={handleUpdate}
          />
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
