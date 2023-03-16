import React, { Fragment, useState, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Flex,
  Text,
  Icon,
  HStack,
  VStack,
  FlatList,
  Pressable,
  Toast,
  useTheme,
  useDisclose,
  ScrollView,
} from 'native-base';
import {
  splitWidth,
  nonNullable,
  coverAspectRatio,
  Sequence,
  MangaStatus,
  AsyncStatus,
  PrefetchDownload,
} from '~/utils';
import { Dimensions, StyleSheet, RefreshControl, Linking, ListRenderItemInfo } from 'react-native';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { useFocusEffect } from '@react-navigation/native';
import { CachedImage } from '@georstat/react-native-image-cache';
import { useRoute } from '@react-navigation/native';
import { useOnce } from '~/hooks';
import ActionsheetSelect from '~/components/ActionsheetSelect';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SpinLoading from '~/components/SpinLoading';
import VectorIcon from '~/components/VectorIcon';
import RedHeart from '~/components/RedHeart';
import Drawer, { DrawerRef } from '~/components/Drawer';

const {
  loadManga,
  setSequence,
  addFavorites,
  removeFavorites,
  popQueue,
  pushQueque,
  viewFavorites,
  prehandleChapter,
} = action;
const { gap, partWidth, numColumns } = splitWidth({
  gap: 12,
  minNumColumns: 4,
  maxPartWidth: 100,
});
const coverWidth = Math.min((Dimensions.get('window').width * 1) / 3, 200);
const coverHeight = coverWidth / coverAspectRatio;
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
  const sequence = useAppSelector((state) => state.setting.sequence);
  const prehandleLog = useAppSelector((state) => state.chapter.prehandleLog);
  const data = useMemo(() => mangaDict[mangaHash], [mangaDict, mangaHash]);
  const chapters = useMemo(() => {
    if (!data) {
      return [];
    }

    if (sequence === Sequence.Desc) {
      return data.chapters;
    } else {
      return [...data.chapters].reverse();
    }
  }, [data, sequence]);
  const drawerRef = useRef<DrawerRef>(null);

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
    chapter && dispatch(prehandleChapter({ mangaHash, chapterHash: chapter.hash }));
  };
  const handleDownload = () => {
    chapter && dispatch(prehandleChapter({ mangaHash, chapterHash: chapter.hash }));
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
    const history = data.history[item.hash];
    return (
      <Pressable
        _pressed={{ opacity: 0.8 }}
        onPress={handleChapter(item.hash)}
        onLongPress={handleLongPress(item.hash, item.title)}
        delayLongPress={200}
      >
        <Box w={partWidth + gap} p={`${gap / 2}px`} position="relative">
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
            p={1}
          >
            {item.title}
          </Text>
          {history && history.progress > 0 && (
            <Icon
              as={MaterialIcons}
              size="xs"
              style={{ transform: [{ rotateZ: '30deg' }] }}
              name={history.isVisited ? 'brightness-1' : 'brightness-2'}
              color={`purple.${Math.floor(history.progress / 25) + 1}00`}
              position="absolute"
              top={`${gap / 4}px`}
              right={`${gap / 4}px`}
            />
          )}
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
        p={`${gap / 2}px`}
        numColumns={numColumns}
        data={chapters}
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

      <Drawer ref={drawerRef}>
        <ScrollView bg="gray.100" height="full">
          <VStack safeAreaY>
            {prehandleLog.map((item, index) => {
              return (
                <Box
                  key={item.id}
                  flexDirection="row"
                  alignItems="center"
                  borderColor="gray.200"
                  borderBottomWidth={1}
                  borderTopWidth={index === 0 ? 1 : 0}
                  p={3}
                >
                  <Text
                    flex={1}
                    fontWeight="bold"
                    fontSize="lg"
                    color="purple.900"
                    numberOfLines={1}
                    mr={1}
                  >
                    {item.text}
                  </Text>
                  {item.status === AsyncStatus.Pending && (
                    <Box>
                      <SpinLoading size="sm" height={1} />
                    </Box>
                  )}
                  {item.status === AsyncStatus.Rejected && (
                    <Text fontWeight="bold" fontSize="md" color="red.700">
                      Fail
                    </Text>
                  )}
                </Box>
              );
            })}
          </VStack>
        </ScrollView>
      </Drawer>

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
  const sequence = useAppSelector((state) => state.setting.sequence);
  const favorites = useAppSelector((state) => state.favorites);
  const dict = useAppSelector((state) => state.dict.manga);
  const mangaHash = route.params.mangaHash;
  const manga = favorites.find((item) => item.mangaHash === mangaHash);
  const actived = Boolean(manga);

  const handleSwapSequence = () => {
    dispatch(setSequence(sequence === Sequence.Asc ? Sequence.Desc : Sequence.Asc));
  };
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
    <HStack pr={1}>
      {actived && (
        <VectorIcon
          name={manga?.inQueue ? 'lock-open' : 'lock-outline'}
          color={manga?.inQueue ? 'white' : 'purple.200'}
          onPress={toggleQueue}
        />
      )}
      <RedHeart actived={actived} onPress={toggleFavorite} />
      <VectorIcon
        source="octicons"
        name={sequence === Sequence.Asc ? 'sort-asc' : 'sort-desc'}
        onPress={handleSwapSequence}
      />
      <VectorIcon name="open-in-browser" onPress={handleToBrowser} />
    </HStack>
  );
};

const styles = StyleSheet.create({
  img: {
    width: coverWidth,
    height: coverHeight,
    flexGrow: 0,
    flexShrink: 0,
    borderRadius: 8,
    overflow: 'hidden',
  },
});

export default Detail;
