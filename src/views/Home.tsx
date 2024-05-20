import React, { useMemo, useState, useCallback, Fragment } from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { nonNullable, AsyncStatus } from '~/utils';
import { View, Text, HStack, Button, Modal, useDisclose } from 'native-base';
import { useFocusEffect } from '@react-navigation/native';
import VectorIcon from '~/components/VectorIcon';
import Bookshelf from '~/components/Bookshelf';
import Rotate from '~/components/Rotate';
import * as RootNavigation from '~/utils/navigation';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const { batchUpdate, removeFavorites } = action;

const Home = ({ navigation: { navigate, setOptions } }: StackHomeProps) => {
  const list = useAppSelector((state) => state.favorites);
  const dict = useAppSelector((state) => state.dict.manga);
  const failList = useAppSelector((state) => state.batch.fail);
  const activeList = useAppSelector((state) => state.batch.stack);
  const loadStatus = useAppSelector((state) => state.app.launchStatus);
  const [selectedManga, setSelectedManga] = useState<string[]>([]);
  const [isSelectMode, setSelectMode] = useState(false);
  const dispatch = useAppDispatch();
  const { isOpen, onOpen, onClose } = useDisclose();
  const headerRightOpacity = useSharedValue(0);

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
    if (isSelectMode) {
      if (selectedManga.includes(mangaHash)) {
        setSelectedManga(selectedManga.filter((hash) => hash !== mangaHash));
      } else {
        setSelectedManga([...selectedManga, mangaHash]);
      }
      return;
    }
    navigate('Detail', { mangaHash });
  };

  const handleSelect = (mangaHash: string) => {
    if (isSelectMode) {
      return;
    }
    setSelectMode(true);
    setSelectedManga([mangaHash]);
    headerRightOpacity.value = 1;
  };

  const handleCancel = useCallback(() => {
    setSelectMode(false);
    headerRightOpacity.value = 0;
  }, [headerRightOpacity]);

  const handleSelectAll = useCallback(() => {
    if (selectedManga.length === list.length) {
      setSelectedManga([]);
      return;
    }
    setSelectedManga(list.map((item) => item.mangaHash));
  }, [list, selectedManga]);

  const handleDelete = useCallback(() => {
    dispatch(removeFavorites(selectedManga));
    onClose();
  }, [dispatch, onClose, selectedManga]);

  const seteletModeHeaderRightStyle = useAnimatedStyle(() => {
    return {
      opacity: headerRightOpacity.value,
      transform: [{ scale: withSpring(headerRightOpacity.value) }],
    };
  }, []);

  const renderHeaderRight = useCallback(() => {
    if (isSelectMode) {
      return (
        <Animated.View style={seteletModeHeaderRightStyle}>
          <HStack flexShrink={0}>
            <VectorIcon name="select-all" onPress={handleSelectAll} />
            <VectorIcon name="deselect" onPress={handleCancel} />
            <VectorIcon name="delete" onPress={onOpen} />
          </HStack>
        </Animated.View>
      );
    }
    return <SearchAndAbout />;
  }, [isSelectMode, handleCancel, onOpen, handleSelectAll, seteletModeHeaderRightStyle]);

  useFocusEffect(
    useCallback(() => {
      setOptions({
        headerRight: renderHeaderRight,
      });
    }, [renderHeaderRight, setOptions])
  );

  return (
    <Fragment>
      <Bookshelf
        emptyText="漫画收藏为空~"
        list={favoriteList}
        failList={failList}
        trendList={trendList}
        activeList={activeList}
        negativeList={negativeList}
        selectedList={selectedManga}
        isSelectMode={isSelectMode}
        itemOnPress={handleDetail}
        itemOnLongPress={handleSelect}
        loading={loadStatus === AsyncStatus.Pending}
      />
      <Modal useRNModal isOpen={isOpen} onClose={onClose} size="sm">
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>确认</Modal.Header>
          <Modal.Body>
            <Text>从列表删除所选漫画？</Text>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" colorScheme="gray" size="sm" onPress={onClose}>
                取消
              </Button>
              <Button size="sm" colorScheme="purple" onPress={handleDelete}>
                确定
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </Fragment>
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
