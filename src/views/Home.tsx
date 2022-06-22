import React, { useState, useEffect, useMemo } from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { HStack, IconButton, Icon } from 'native-base';
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
  const batchStatus = useAppSelector((state) => state.app.batchStatus);

  useEffect(() => {
    setIsRotate(batchStatus === AsyncStatus.Pending);
  }, [batchStatus]);

  const handleSearch = () => {
    RootNavigation.navigate('Search');
  };
  const handleUpdate = () => {
    dispatch(batchUpdate());
  };

  return (
    <HStack flexShrink={0}>
      <Rotate isRotate={isRotate}>
        <IconButton
          isDisabled={isRotate}
          icon={<Icon as={MaterialIcons} name="autorenew" size={30} color="white" />}
          onPress={handleUpdate}
        />
      </Rotate>
      <IconButton
        icon={<Icon as={MaterialIcons} name="search" size={30} color="white" />}
        onPress={handleSearch}
      />
    </HStack>
  );
};

export default Home;
