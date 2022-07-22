import React, { useCallback, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  IconButton,
  Icon,
  FlatList,
  HStack,
  Pressable,
  useTheme,
} from 'native-base';
import { StyleSheet, Dimensions, RefreshControl, Linking, ListRenderItemInfo } from 'react-native';
import { coverAspectRatio, useFirstRender, isManga, MangaStatus, AsyncStatus } from '~/utils';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { CachedImage } from '@georstat/react-native-image-cache';
import { useRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SpinLoading from '~/components/SpinLoading';

const { loadManga, addFavorites, removeFavorites, viewFavorites } = action;
const gap = 4;
const windowWidth = Dimensions.get('window').width;
const quarterWidth = (windowWidth - gap * 5) / 4;

const Detail = ({ route, navigation }: StackDetailProps) => {
  const { colors } = useTheme();
  const mangaHash = route.params.mangaHash;
  const dispatch = useAppDispatch();
  const loadStatus = useAppSelector((state) => state.manga.loadStatus);
  const mangaDict = useAppSelector((state) => state.dict.manga);

  const data = mangaDict[mangaHash];

  useFirstRender(() => {
    if (!isManga(data) || (isManga(data) && data.chapters.length <= 0)) {
      dispatch(loadManga({ mangaHash }));
    }
  });

  useEffect(() => {
    isManga(data) && navigation.setOptions({ title: data.title });
  }, [navigation, data]);

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
            {data.author}
          </Text>
          <Box flexGrow={1} />
          <Text color="white" fontSize={14} fontWeight="bold" numberOfLines={1}>
            {data.sourceName}
          </Text>
          <Text color="white" fontSize={14} fontWeight="bold" numberOfLines={1}>
            {data.updateTime}【{StatusToLabel(data.status)}】
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

export const Heart = () => {
  const route = useRoute<StackDetailProps['route']>();
  const dispatch = useAppDispatch();
  const favorites = useAppSelector((state) => state.favorites);
  const dict = useAppSelector((state) => state.dict.manga);
  const mangaHash = route.params.mangaHash;

  useFirstRender(() => {
    favorites.find((item) => item.mangaHash === mangaHash) && dispatch(viewFavorites(mangaHash));
  });

  const handleFavorite = () => {
    dispatch(addFavorites(mangaHash));
  };
  const handleUnfavorite = () => {
    dispatch(removeFavorites(mangaHash));
  };
  const handleToBrowser = () => {
    const href = dict[mangaHash]?.href || '';
    Linking.canOpenURL(href).then((supported) => {
      supported && Linking.openURL(href);
    });
  };

  if (favorites.find((item) => item.mangaHash === mangaHash)) {
    return (
      <HStack>
        <IconButton
          icon={<Icon as={MaterialIcons} name="favorite" size={30} color="red.500" />}
          onPress={handleUnfavorite}
        />
        <IconButton
          icon={<Icon as={MaterialIcons} name="open-in-browser" size={30} color="white" />}
          onPress={handleToBrowser}
        />
      </HStack>
    );
  }
  return (
    <HStack>
      <IconButton
        icon={<Icon as={MaterialIcons} name="favorite-outline" size={30} color="white" />}
        onPress={handleFavorite}
      />
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
