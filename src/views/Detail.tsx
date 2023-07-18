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
  ChapterOptions,
  MangaStatus,
  AsyncStatus,
} from '~/utils';
import { useOnce, useDelayRender, useSplitWidth, useDebouncedSafeAreaInsets } from '~/hooks';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { StyleSheet, RefreshControl, Linking } from 'react-native';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { CachedImage } from '@georstat/react-native-image-cache';
import ActionsheetSelect, { ActionsheetSelectProps } from '~/components/ActionsheetSelect';
import Drawer, { DrawerRef } from '~/components/Drawer';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SpinLoading from '~/components/SpinLoading';
import VectorIcon from '~/components/VectorIcon';
import RedHeart from '~/components/RedHeart';

const {
  loadManga,
  setSequence,
  addFavorites,
  removeFavorites,
  disabledBatch,
  enabledBatch,
  viewFavorites,
  downloadChapter,
  exportChapter,
  removeTask,
  retryTask,
  setPrehandleLogStatus,
  setPrehandleLogVisible,
} = action;
const ChapterSelectOptions: ActionsheetSelectProps['options'] = [
  {
    label: '多选',
    value: ChapterOptions.Multiple,
    icon: { name: 'checkbox-multiple-marked-outline', source: 'materialCommunityIcons' },
  },
  {
    label: '下载',
    value: ChapterOptions.Download,
    icon: { name: 'download-box-outline', source: 'materialCommunityIcons' },
  },
  {
    label: '导出',
    value: ChapterOptions.Export,
    icon: { name: 'file-export-outline', source: 'materialCommunityIcons' },
  },
];

const Detail = ({ route, navigation }: StackDetailProps) => {
  const { mangaHash, enabledMultiple = false, selected = [] } = route.params;
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
    () => ({
      width: splitWidth,
      dict: reocrdDict,
      chapterHash: lastWatch.chapter,
      multiple: enabledMultiple,
      checkList: selected,
    }),
    [splitWidth, reocrdDict, lastWatch.chapter, enabledMultiple, selected]
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

  const handleMultiple = () => {
    navigation.setParams({ enabledMultiple: true, selected: [] });
  };
  const handleDownload = () => {
    chapter && dispatch(downloadChapter([chapter.hash]));
  };
  const handleExport = () => {
    chapter && dispatch(exportChapter([chapter.hash]));
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
    extraData: { width, dict, chapterHash, multiple, checkList },
  }: ListRenderItemInfo<ChapterItem>) => {
    const isActived = item.hash === chapterHash;
    const isChecked = checkList.includes(item.hash);
    const record = dict[item.hash];

    const handlePress = () => {
      if (multiple) {
        navigation.setParams({
          selected: isChecked
            ? selected.filter((hash) => hash !== item.hash)
            : [...selected, item.hash],
        });
      } else {
        handleChapter(item.hash);
      }
    };
    const handleLongPress = () => {
      if (!multiple) {
        onOpen();
        setChapter({ hash: item.hash, title: item.title });
      }
    };

    return (
      <Pressable
        _pressed={{ opacity: 0.8 }}
        onPress={handlePress}
        onLongPress={handleLongPress}
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
          {multiple && (
            <Icon
              as={MaterialCommunityIcons}
              size="sm"
              name="check-circle"
              color={isChecked ? 'purple.500' : 'gray.400'}
              position="absolute"
              top={`${gap / 3}px`}
              right={`${gap / 3}px`}
            />
          )}
          {!multiple && record && record.progress > 0 && (
            <Icon
              as={MaterialIcons}
              size="xs"
              style={{ transform: [{ rotateZ: '30deg' }] }}
              name={record.isVisited ? 'brightness-1' : 'brightness-2'}
              color={`purple.${Math.min(Math.floor(record.progress / 25) + 1, 5)}00`}
              position="absolute"
              top={`${gap / 3}px`}
              right={`${gap / 3}px`}
            />
          )}
        </Box>
      </Pressable>
    );
  };

  return (
    <Box w="full" h="full">
      <Flex safeAreaX w="full" bg="purple.500" flexDirection="row" pl={4} pr={4} pb={4}>
        <CachedImage
          source={data.infoCover || data.bookCover || data.cover || ''}
          style={{
            ...styles.img,
            width: Math.min(Math.min(windowWidth, windowHeight) / 3, 180),
            height: Math.min(Math.min(windowWidth, windowHeight) / 3, 180) / coverAspectRatio,
          }}
          resizeMode="cover"
        />
        <Flex flexGrow={1} flexShrink={1} pl={4}>
          <Text
            color="white"
            fontSize={18}
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
            上次观看：{lastWatch.title || '未知'}
          </Text>
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
        options={ChapterSelectOptions}
        onChange={(value) => {
          if (value === ChapterOptions.Multiple) {
            handleMultiple();
          }
          if (value === ChapterOptions.Download) {
            handleDownload();
          }
          if (value === ChapterOptions.Export) {
            handleExport();
          }
        }}
        headerComponent={
          <Text w="full" pl={4} pb={4} color="gray.500" fontSize={16}>
            {chapter?.title}
          </Text>
        }
      />
    </Box>
  );
};

export const HeartAndBrowser = () => {
  const route = useRoute<StackDetailProps['route']>();
  const navigation = useNavigation<StackDetailProps['navigation']>();
  const { mangaHash, enabledMultiple = false, selected = [] } = route.params;
  const dispatch = useAppDispatch();
  const sequence = useAppSelector((state) => state.setting.sequence);
  const favorites = useAppSelector((state) => state.favorites);
  const dict = useAppSelector((state) => state.dict.manga);
  const manga = useMemo(() => dict[mangaHash], [dict, mangaHash]);
  const { isActived, enableBatch } = useMemo(() => {
    const favorite = favorites.find((item) => item.mangaHash === mangaHash);
    return { isActived: Boolean(favorite), enableBatch: favorite?.enableBatch || false };
  }, [favorites, mangaHash]);

  const handleClose = () => {
    navigation.setParams({ enabledMultiple: false, selected: [] });
  };
  const handleCheckAll = () => {
    if (manga) {
      navigation.setParams({
        selected:
          selected.length < manga.chapters.length ? manga.chapters.map((item) => item.hash) : [],
      });
    }
  };
  const handleDownload = () => {
    selected.length > 0 && dispatch(downloadChapter(selected));
    handleClose();
  };
  const handleExport = () => {
    selected.length > 0 && dispatch(exportChapter(selected));
    handleClose();
  };

  const handleSwapSequence = () => {
    dispatch(setSequence(sequence === Sequence.Asc ? Sequence.Desc : Sequence.Asc));
  };
  const toggleFavorite = () => {
    const status = dict[mangaHash]?.status || '';
    dispatch(
      isActived
        ? removeFavorites(mangaHash)
        : addFavorites({ mangaHash, enableBatch: status !== MangaStatus.End })
    );
  };
  const handleToBrowser = () => {
    const href = dict[mangaHash]?.href || '';
    Linking.canOpenURL(href).then((supported) => {
      supported && Linking.openURL(href);
    });
  };
  const toggleQueue = () => {
    dispatch(enableBatch ? disabledBatch(mangaHash) : enabledBatch(mangaHash));
    Toast.show({
      title: enableBatch ? '已禁用批量更新' : '已启用批量更新',
      placement: 'bottom',
    });
  };

  if (enabledMultiple) {
    return (
      <HStack pr={1}>
        <VectorIcon source="materialCommunityIcons" name="window-close" onPress={handleClose} />
        {manga && (
          <VectorIcon
            source="materialCommunityIcons"
            name={
              selected.length <= 0
                ? 'checkbox-blank-outline'
                : selected.length >= manga.chapters.length - 1
                ? 'checkbox-marked-outline'
                : 'checkbox-intermediate'
            }
            onPress={handleCheckAll}
          />
        )}
        <VectorIcon
          source="materialCommunityIcons"
          name="download-box-outline"
          onPress={handleDownload}
        />
        <VectorIcon
          source="materialCommunityIcons"
          name="file-export-outline"
          onPress={handleExport}
        />
      </HStack>
    );
  }

  return (
    <HStack pr={1}>
      {isActived && (
        <VectorIcon
          name={enableBatch ? 'lock-open' : 'lock-outline'}
          color={enableBatch ? 'white' : 'purple.200'}
          onPress={toggleQueue}
        />
      )}
      <RedHeart actived={isActived} onPress={toggleFavorite} />
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
  const list = useAppSelector((state) => state.task.list);
  const openDrawer = useAppSelector((state) => state.chapter.openDrawer);
  const showDrawer = useAppSelector((state) => state.chapter.showDrawer);
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

  const handleRemove = (taskId: string) => {
    dispatch(removeTask(taskId));
  };
  const handleRetry = (taskId: string) => {
    dispatch(retryTask([taskId]));
  };

  const renderItem = ({ item, index }: ListRenderItemInfo<Task>) => {
    const progress = (item.success.length + item.fail.length) / item.queue.length;
    return (
      <HStack
        h="12"
        pl={3}
        pr={2}
        space={1}
        key={item.taskId}
        alignItems="center"
        borderColor="gray.200"
        borderBottomWidth={1}
        borderTopWidth={index === 0 ? 1 : 0}
      >
        <Text
          flex={1}
          fontWeight="bold"
          fontSize="md"
          color={`purple.${Math.floor(progress * 4) + 5}00`}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        {item.status === AsyncStatus.Pending && (
          <Box ml={1}>
            <SpinLoading size="sm" height={1} color={`purple.${Math.floor(progress * 4) + 5}00`} />
          </Box>
        )}
        {item.status === AsyncStatus.Fulfilled && (
          <Pressable px={1} _pressed={{ opacity: 0.5 }} onPress={() => handleRemove(item.taskId)}>
            <Icon
              as={MaterialIcons}
              size="md"
              fontWeight="semibold"
              name="check"
              color="purple.900"
            />
          </Pressable>
        )}
        {item.status === AsyncStatus.Rejected && (
          <Pressable px={1} _pressed={{ opacity: 0.5 }} onPress={() => handleRetry(item.taskId)}>
            <Text fontWeight="bold" fontSize="sm" color="red.800">
              {item.fail.length}
            </Text>
          </Pressable>
        )}
      </HStack>
    );
  };

  if (!showDrawer) {
    return null;
  }

  return (
    <Drawer ref={drawerRef}>
      <Box bg="gray.100" h="full">
        {list.length > 0 && (
          <FlashList
            data={list}
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
