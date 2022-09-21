import React, { useCallback } from 'react';
import {
  Box,
  Flex,
  Text,
  IconButton,
  Icon,
  FlatList,
  HStack,
  Pressable,
  Toast,
  useTheme,
} from 'native-base';
import { StyleSheet, Dimensions, RefreshControl, Linking, ListRenderItemInfo } from 'react-native';
import { coverAspectRatio, isManga, MangaStatus, AsyncStatus } from '~/utils';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { useFocusEffect } from '@react-navigation/native';
import { CachedImage } from '@georstat/react-native-image-cache';
import { useRoute } from '@react-navigation/native';
import { useOnce } from '~/hooks';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SpinLoading from '~/components/SpinLoading';
import RedHeart from '~/components/RedHeart';

const { loadManga, addFavorites, removeFavorites, pushQueque, popQueue, viewFavorites } = action;
const gap = 4;
const windowWidth = Dimensions.get('window').width;
const quarterWidth = (windowWidth - gap * 5) / 4;

const Detail = ({ route, navigation }: StackDetailProps) => {
  const { colors } = useTheme();
  const mangaHash = route.params.mangaHash;
  const dispatch = useAppDispatch();
  const loadStatus = useAppSelector((state) => state.manga.loadStatus);
  const mangaDict = useAppSelector((state) => state.dict.manga);
  const favorites = useAppSelector((state) => state.favorites);

  const data = mangaDict[mangaHash];

  useOnce(() => {
    if (!isManga(data) || (isManga(data) && data.chapters.length <= 0)) {
      dispatch(loadManga({ mangaHash }));
    }
  });

  useFocusEffect(
    useCallback(() => {
      isManga(data) && navigation.setOptions({ title: data.title });
    }, [navigation, data])
  );

  const handleReload = useCallback(() => {
    isManga(data) && dispatch(loadManga({ mangaHash }));
  }, [dispatch, mangaHash, data]);

  if (!isManga(data)) {
    return (
      <Flex w="full" h="full" alignItems="center" justifyContent="center">
        <SpinLoading />
      </Flex>
    );
  }

  const StatusToLabel = (status: MangaStatus) => {
    switch (status) {
      case MangaStatus.Serial: {
        return '连载中';
      }
      case MangaStatus.End: {
        return '已完结';
      }
      default:
        return '未知';
    }
  };

  const handleChapter = (chapterHash: string) => {
    return () => {
      if (favorites.find((item) => item.mangaHash === mangaHash)) {
        dispatch(viewFavorites(mangaHash));
      }

      navigation.navigate('Chapter', {
        mangaHash,
        chapterHash,
        page: chapterHash === data.lastWatchChapter ? data.lastWatchPage || 1 : 1,
      });
    };
  };

  const renderItem = ({ item }: ListRenderItemInfo<ChapterItem>) => {
    const isActived = item.hash === data.lastWatchChapter;
    return (
      <Pressable _pressed={{ opacity: 0.8 }} onPress={handleChapter(item.hash)}>
        <Box w={quarterWidth} p={gap / 2}>
          <Text
            bg={isActived ? 'purple.500' : 'transparent'}
            color={isActived ? 'white' : '#717171'}
            borderColor="#717171"
            overflow="hidden"
            borderRadius="md"
            borderWidth={isActived ? 0 : 0.5}
            textAlign="center"
            numberOfLines={1}
            fontWeight="bold"
            p={[1, 0]}
          >
            {item.title}
          </Text>
        </Box>
      </Pressable>
    );
  };

  return (
    <Box w="full" h="full">
      <Flex w="full" bg="purple.500" flexDirection="row" pl={4} pr={4} pb={5}>
        <CachedImage source={data.cover} style={styles.img} resizeMode="cover" />
        <Flex flexGrow={1} flexShrink={1} pl={4}>
          <Text color="white" fontSize={20} fontWeight="bold" numberOfLines={2}>
            {data.title}
          </Text>
          <Text color="white" fontSize={14} fontWeight="bold" numberOfLines={1}>
            作者：{data.author.length > 0 ? data.author.join(',') : '未知'}
          </Text>
          <Box flexGrow={1} />
          <Text color="white" fontSize={14} fontWeight="bold" numberOfLines={1}>
            来源：{data.sourceName}
          </Text>
          <Text color="white" fontSize={14} fontWeight="bold" numberOfLines={1}>
            状态：{StatusToLabel(data.status)}
          </Text>
          <Text color="white" fontSize={14} fontWeight="bold" numberOfLines={1}>
            最近更新：{data.updateTime || '未知'}
          </Text>
        </Flex>
      </Flex>

      <FlatList
        h="full"
        p={gap / 2}
        numColumns={4}
        data={data.chapters}
        refreshControl={
          <RefreshControl
            refreshing={loadStatus === AsyncStatus.Pending}
            onRefresh={handleReload}
            tintColor={colors.purple[500]}
          />
        }
        renderItem={renderItem}
        ListFooterComponent={<Box safeAreaBottom />}
        keyExtractor={(item) => item.hash}
      />
    </Box>
  );
};

export const HeartAndBrowser = () => {
  const route = useRoute<StackDetailProps['route']>();
  const dispatch = useAppDispatch();
  const favorites = useAppSelector((state) => state.favorites);
  const dict = useAppSelector((state) => state.dict.manga);
  const mangaHash = route.params.mangaHash;
  const manga = favorites.find((item) => item.mangaHash === mangaHash);
  const actived = Boolean(manga);

  const toggleFavorite = () => {
    dispatch(actived ? removeFavorites(mangaHash) : addFavorites(mangaHash));
  };
  const handleToBrowser = () => {
    const href = dict[mangaHash]?.href || '';
    Linking.canOpenURL(href).then((supported) => {
      supported && Linking.openURL(href);
    });
  };
  const toggleQueue = () => {
    dispatch(manga?.inQueue ? popQueue(mangaHash) : pushQueque(mangaHash));
    Toast.show({
      title: manga?.inQueue ? '已禁用批量更新' : '已启用批量更新',
      placement: 'bottom',
    });
  };

  return (
    <HStack>
      {actived && (
        <IconButton
          icon={
            <Icon
              as={MaterialIcons}
              name={manga?.inQueue ? 'lock-open' : 'lock-outline'}
              size={30}
              color={manga?.inQueue ? 'white' : 'purple.200'}
            />
          }
          onPress={toggleQueue}
        />
      )}
      <RedHeart actived={actived} onPress={toggleFavorite} />
      <IconButton
        icon={<Icon as={MaterialIcons} name="open-in-browser" size={30} color="white" />}
        onPress={handleToBrowser}
      />
    </HStack>
  );
};

const styles = StyleSheet.create({
  img: {
    width: 130,
    height: 130 / coverAspectRatio,
    flexGrow: 0,
    flexShrink: 0,
    borderRadius: 8,
    overflow: 'hidden',
  },
});

export default Detail;
