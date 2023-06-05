import React, { Fragment, useState, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Flex,
  Text,
  Icon,
  HStack,
  Pressable,
  Toast,
  useTheme,
  useDisclose,
} from 'native-base';
import {
  nonNullable,
  coverAspectRatio,
  Sequence,
  MangaStatus,
  AsyncStatus,
  PrefetchDownload,
} from '~/utils';
import { useOnce, useDelayRender, useSplitWidth, useDebouncedSafeAreaInsets } from '~/hooks';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { StyleSheet, RefreshControl, Linking } from 'react-native';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { useFocusEffect } from '@react-navigation/native';
import { CachedImage } from '@georstat/react-native-image-cache';
import { useRoute } from '@react-navigation/native';
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
  setPrehandleLogStatus,
  setPrehandleLogVisible,
} = action;
const PrefetchDownloadOptions = [
  { label: '预加载', value: PrefetchDownload.Prefetch },
  { label: '下载', value: PrefetchDownload.Download },
];

const Detail = ({ route, navigation }: StackDetailProps) => {
  const mangaHash = route.params.mangaHash;
  const { gap, insets, splitWidth, numColumns, windowWidth, windowHeight } = useSplitWidth({
    gap: 12,
    minNumColumns: 3,
    maxSplitWidth: 100,
  });
  const { isOpen, onOpen, onClose } = useDisclose();
  const { colors } = useTheme();
  const [chapter, setChapter] = useState<{ hash: string; title: string }>();
  const render = useDelayRender(false, 300);
  const dispatch = useAppDispatch();
  const loadStatus = useAppSelector((state) => state.manga.loadStatus);
  const loadingMangaHash = useAppSelector((state) => state.manga.loadingMangaHash);
  const mangaDict = useAppSelector((state) => state.dict.manga);
  const reocrdDict = useAppSelector((state) => state.dict.record);
  const lastWatchDict = useAppSelector((state) => state.dict.lastWatch);
  const favorites = useAppSelector((state) => state.favorites);
  const sequence = useAppSelector((state) => state.setting.sequence);
  const data = useMemo(() => mangaDict[mangaHash], [mangaDict, mangaHash]);
  const lastWatch = useMemo(() => lastWatchDict[mangaHash] || {}, [lastWatchDict, mangaHash]);
  const extraData = useMemo(
    () => ({ width: splitWidth, dict: reocrdDict, chapterHash: lastWatch.chapter }),
    [splitWidth, reocrdDict, lastWatch.chapter]
  );
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

  useOnce(() => {
    if (!nonNullable(data) || (nonNullable(data) && data.chapters.length <= 0)) {
      dispatch(loadManga({ mangaHash }));
    }
  });

  useFocusEffect(
    useCallback(() => {
      dispatch(setPrehandleLogVisible(true));
      return () => {
        dispatch(setPrehandleLogVisible(false));
      };
    }, [dispatch])
  );
  useFocusEffect(
    useCallback(() => {
      nonNullable(data) && navigation.setOptions({ title: data.title });
    }, [navigation, data])
  );

  const handleReload = useCallback(() => {
    dispatch(loadManga({ mangaHash }));
  }, [dispatch, mangaHash]);
  const handleSearch = (keyword: string) => {
    if (!nonNullable(data)) {
      return;
    }
    navigation.navigate('Search', { keyword, source: data.source });
  };

  const handleLongPress = (chapterHash: string, chapterTitle: string) => {
    onOpen();
    setChapter({ hash: chapterHash, title: chapterTitle });
  };
  const handlePrefetch = () => {
    chapter && dispatch(prehandleChapter({ chapterHash: chapter.hash }));
  };
  const handleDownload = () => {
    chapter && dispatch(prehandleChapter({ chapterHash: chapter.hash, save: true }));
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
    if (favorites.find((item) => item.mangaHash === mangaHash)) {
      dispatch(viewFavorites(mangaHash));
    }

    navigation.navigate('Chapter', {
      mangaHash,
      chapterHash,
      page: chapterHash === lastWatch.chapter ? lastWatch.page || 1 : 1,
    });
  };

  const renderItem = ({
    item,
    extraData: { width, dict, chapterHash },
  }: ListRenderItemInfo<ChapterItem>) => {
    const isActived = item.hash === chapterHash;
    const record = dict[item.hash];

    return (
      <Pressable
        _pressed={{ opacity: 0.8 }}
        onPress={() => handleChapter(item.hash)}
        onLongPress={() => handleLongPress(item.hash, item.title)}
        delayLongPress={200}
      >
        <Box w={width + gap} p={`${gap / 2}px`} position="relative">
          <Text
            px={1}
            py={2}
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
          >
            {item.title}
          </Text>
          {record && record.progress > 0 && (
            <Icon
              as={MaterialIcons}
              size="xs"
              style={{ transform: [{ rotateZ: '30deg' }] }}
              name={record.isVisited ? 'brightness-1' : 'brightness-2'}
              color={`purple.${Math.min(Math.floor(record.progress / 25) + 1, 5)}00`}
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
      <Flex safeAreaX w="full" bg="purple.500" flexDirection="row" pl={4} pr={4} pb={5}>
        <CachedImage
          source={data.cover}
          style={{
            ...styles.img,
            width: Math.min(Math.min(windowWidth, windowHeight) / 3, 200),
            height: Math.min(Math.min(windowWidth, windowHeight) / 3, 200) / coverAspectRatio,
          }}
          resizeMode="cover"
        />
        <Flex flexGrow={1} flexShrink={1} pl={4}>
          <Text
            color="white"
            fontSize={20}
            fontWeight="bold"
            numberOfLines={2}
            onPress={() => handleSearch(data.title)}
          >
            {data.title}
          </Text>
          <Text color="white" fontSize={14} fontWeight="bold" numberOfLines={1}>
            作者：
            {data.author.map((text, index) => (
              <Fragment key={text}>
                <Text onPress={() => handleSearch(text)}>{text}</Text>
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
                <Text onPress={() => handleSearch(text)}>{text}</Text>
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

      {chapters.length > 0 && render ? (
        <FlashList
          data={chapters}
          extraData={extraData}
          contentContainerStyle={{
            padding: gap / 2,
            paddingLeft: gap / 2 + insets.left,
            paddingRight: gap / 2 + insets.right,
          }}
          numColumns={numColumns}
          estimatedItemSize={24}
          estimatedListSize={{ width: windowWidth, height: windowHeight }}
          refreshControl={
            <RefreshControl
              refreshing={loadStatus === AsyncStatus.Pending && mangaHash === loadingMangaHash}
              onRefresh={handleReload}
              tintColor={colors.purple[500]}
            />
          }
          renderItem={renderItem}
          ListFooterComponent={<Box safeAreaBottom />}
          keyExtractor={(item) => item.hash}
        />
      ) : (
        <Flex w="full" flexGrow={1} alignItems="center" justifyContent="center" safeAreaBottom>
          <SpinLoading />
        </Flex>
      )}

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
  // 待优化
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

export const PrehandleDrawer = () => {
  const dispatch = useAppDispatch();
  const openDrawer = useAppSelector((state) => state.chapter.openDrawer);
  const showDrawer = useAppSelector((state) => state.chapter.showDrawer);
  const prehandleLog = useAppSelector((state) => state.chapter.prehandleLog);
  const drawerRef = useRef<DrawerRef>(null);
  const insets = useDebouncedSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      if (openDrawer) {
        drawerRef.current?.open();
        dispatch(setPrehandleLogStatus(false));
      }
    }, [dispatch, openDrawer])
  );

  const renderItem = ({ item, index }: ListRenderItemInfo<(typeof prehandleLog)[0]>) => {
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
        <Text flex={1} fontWeight="bold" fontSize="lg" color="purple.900" numberOfLines={1} mr={1}>
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
  };

  if (!showDrawer) {
    return null;
  }

  return (
    <Drawer ref={drawerRef}>
      <Box bg="gray.100" h="full">
        {prehandleLog.length > 0 && (
          <FlashList
            data={prehandleLog}
            renderItem={renderItem}
            estimatedItemSize={50}
            contentContainerStyle={{
              paddingTop: insets.top,
              paddingLeft: insets.left,
              paddingRight: insets.right,
              paddingBottom: insets.bottom,
            }}
          />
        )}
      </Box>
    </Drawer>
  );
};

const styles = StyleSheet.create({
  img: {
    flexGrow: 0,
    flexShrink: 0,
    borderRadius: 8,
    overflow: 'hidden',
  },
});

export default Detail;
