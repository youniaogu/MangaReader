import React, { useMemo, useState, useCallback, Fragment } from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { nonNullable, AsyncStatus } from '~/utils';
import { View, Text, HStack, Button, IconButton, Icon, Modal, useDisclose } from 'native-base';
import { useFocusEffect } from '@react-navigation/native';
import VectorIcon from '~/components/VectorIcon';
import Bookshelf from '~/components/Bookshelf';
import Rotate from '~/components/Rotate';
import * as RootNavigation from '~/utils/navigation';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { batchUpdate, removeFavorites } = action;

const Home = ({ navigation: { navigate } }: StackHomeProps) => {
  const list = useAppSelector((state) => state.favorites);
  const dict = useAppSelector((state) => state.dict.manga);
  const failList = useAppSelector((state) => state.batch.fail);
  const activeList = useAppSelector((state) => state.batch.stack);
  const loadStatus = useAppSelector((state) => state.app.launchStatus);
  const [selectedManga, setSelectedManga] = useState<string[]>([]);
  const [isSelectMode, setSelectMode] = useState(false);
  const sharedHeight = useSharedValue(0);
  const dispatch = useAppDispatch();
  const { isOpen, onOpen, onClose } = useDisclose();

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
    sharedHeight.value = withTiming(70);
  };

  const handleCancel = () => {
    setSelectMode(false);
    setSelectedManga([]);
    sharedHeight.value = withTiming(0);
  };

  const handleSelectAll = () => {
    if (selectedManga.length === list.length) {
      setSelectedManga([]);
      return;
    }
    setSelectedManga(list.map((item) => item.mangaHash));
  };

  const handleDelete = () => {
    dispatch(removeFavorites(selectedManga));
    onClose();
  };

  const animatedStyles = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      bottom: 0,
      height: sharedHeight.value,
      backgroundColor: '#fff',
      left: 0,
      right: 0,
      width: '100%',
      paddingHorizontal: 10,
    };
  });

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
      <Animated.View style={animatedStyles}>
        <HStack justifyContent="space-between" alignItems="center" flex={1}>
          <Button size="md" variant="ghost" onPress={handleCancel} colorScheme="purple">
            取消
          </Button>
          <HStack space={3} justifyContent="center">
            <IconButton
              colorScheme="purple"
              disabled={!selectedManga.length}
              borderRadius="full"
              icon={
                <Icon
                  as={MaterialCommunityIcons}
                  name="trash-can-outline"
                  size="xl"
                  color={!selectedManga.length ? 'gray.400' : 'purple.500'}
                />
              }
              onPress={onOpen}
            />
          </HStack>
          <Button size="md" variant="ghost" colorScheme="purple" onPress={handleSelectAll}>
            {selectedManga.length === list.length ? '全不选' : '全选'}
          </Button>
        </HStack>
      </Animated.View>
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
