import React, { Fragment, useState, useCallback } from 'react';
import {
  Box,
  Flex,
  Text,
  Icon,
  IconButton,
  HStack,
  FlatList,
  Pressable,
  Toast,
  useTheme,
  useDisclose,
} from 'native-base';
import { nonNullable, coverAspectRatio, MangaStatus, AsyncStatus, PrefetchDownload } from '~/utils';
import { StyleSheet, Dimensions, RefreshControl, Linking, ListRenderItemInfo } from 'react-native';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { useFocusEffect } from '@react-navigation/native';
import { CachedImage } from '@georstat/react-native-image-cache';
import { useRoute } from '@react-navigation/native';
import { useOnce } from '~/hooks';
import ActionsheetSelect from '~/components/ActionsheetSelect';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SpinLoading from '~/components/SpinLoading';
import RedHeart from '~/components/RedHeart';

const {
  loadManga,
  addFavorites,
  removeFavorites,
  pushQueque,
  popQueue,
  viewFavorites,
  prehandleChapter,
} = action;
const gap = 4;
const windowWidth = Dimensions.get('window').width;
const quarterWidth = (windowWidth - gap * 5) / 4;
const PrefetchDownloadOptions = [
  { label: '预加载', value: PrefetchDownload.Prefetch },
  { label: '下载', value: PrefetchDownload.Download },
];

const Detail = ({ route, navigation }: StackDetailProps) => {
  const { isOpen, onOpen, onClose } = useDisclose();
  const { colors } = useTheme();
  const [chapter, setChapter] = useState<{ hash: string; title: string }>();
  const mangaHash = route.params.mangaHash;
  const dispatch = useAppDispatch();
  const loadStatus = useAppSelector((state) => state.manga.loadStatus);
  const mangaDict = useAppSelector((state) => state.dict.manga);
  const favorites = useAppSelector((state) => state.favorites);
  const data = mangaDict[mangaHash];

  useOnce(() => {
    if (!nonNullable(data) || (nonNullable(data) && data.chapters.length <= 0)) {
      dispatch(loadManga({ mangaHash }));
    }
  });

  useFocusEffect(
    useCallback(() => {
      nonNullable(data) && navigation.setOptions({ title: data.title });
    }, [navigation, data])
  );

  const handleReload = useCallback(() => {
    dispatch(loadManga({ mangaHash }));
  }, [dispatch, mangaHash]);
  const handleSearch = (keyword: string) => {
    return () => {
      if (!nonNullable(data)) {
        return;
      }
      navigation.navigate('Search', { keyword, source: data.source });
    };
  };

  const handleLongPress = (chapterHash: string, chapterTitle: string) => {
    return () => {
      onOpen();
      setChapter({ hash: chapterHash, title: chapterTitle });
    };
  };
  const handlePrefetch = () => {
    chapter && dispatch(prehandleChapter({ chapterHash: chapter.hash }));
  };
  const handleDownload = () => {
    chapter && dispatch(prehandleChapter({ chapterHash: chapter.title, save: true }));
  };

  if (!nonNullable(data)) {
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
      <Pressable
        _pressed={{ opacity: 0.8 }}
        onPress={handleChapter(item.hash)}
        onLongPress={handleLongPress(item.hash, item.title)}
        delayLongPress={200}
      >
        <Box w={quarterWidth} p={gap / 2}>
          <Text
            position="relative"
            bg={isActived ? 'purple.500' : 'transparent'}
            color={isActived ? 'white' : '#717171'}
            borderColor={isActived ? 'purple.500' : '#717171'}
            overflow="hidden"
            borderRadius="md"
            borderWidth={0.5}
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
          <Text
            color="white"
            fontSize={20}
            fontWeight="bold"
            numberOfLines={2}
            onPress={handleSearch(data.title)}
          >
            {data.title}
          </Text>
          <Text color="white" fontSize={14} fontWeight="bold" numberOfLines={1}>
            作者：
            {data.author.map((text, index) => (
              <Fragment key={text}>
                <Text onPress={handleSearch(text)}>{text}</Text>
                {index < data.author.length - 1 && <Text>、</Text>}
              </Fragment>
            ))}
            {data.author.length <= 0 && '未知'}
          </Text>

          <Box flexGrow={1} />

          <Text color="white" fontSize={14} fontWeight="bold" numberOfLines={1}>
            分类：
            {data.tag.map((text, index) => (
              <Fragment key={text}>
                <Text onPress={handleSearch(text)}>{text}</Text>
                {index < data.tag.length - 1 && <Text>、</Text>}
              </Fragment>
            ))}
            {data.tag.length <= 0 && '未知'}
          </Text>
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

      <ActionsheetSelect
        isOpen={isOpen}
        onClose={onClose}
        options={PrefetchDownloadOptions}
        onChange={(value) => {
          if (value === PrefetchDownload.Prefetch) {
            handlePrefetch();
          }
          if (value === PrefetchDownload.Download) {
            handleDownload();
          }
        }}
        headerComponent={
          <Text w="full" pl={4} color="gray.500" fontSize={16}>
            {chapter?.title}
          </Text>
        }
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
              size="2xl"
              color={manga?.inQueue ? 'white' : 'purple.200'}
            />
          }
          onPress={toggleQueue}
        />
      )}
      <RedHeart actived={actived} onPress={toggleFavorite} />
      <IconButton
        icon={<Icon as={MaterialIcons} name="open-in-browser" size="2xl" color="white" />}
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
