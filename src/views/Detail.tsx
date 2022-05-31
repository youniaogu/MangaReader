import React, { useCallback, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ListRenderItemInfo,
} from 'react-native';
import { Box, Flex, Text, IconButton, Icon, FlatList } from 'native-base';
import { coverAspectRatio, useFirstRender, isManga } from '~/utils';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { CachedImage } from '@georstat/react-native-image-cache';
import { useRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Loading from '~/components/Loading';

const { LoadStatus } = window;
const { loadManga, addFavorites, removeFavorites, viewFavorites } = action;
const gap = 4;
const windowWidth = Dimensions.get('window').width;
const quarterWidth = (windowWidth - gap * 5) / 4;

const Detail = ({ route, navigation }: StackDetailProps) => {
  const mangaHash = route.params.mangaHash;
  const dispatch = useAppDispatch();
  const loadStatus = useAppSelector((state) => state.manga.loadStatus);
  const mangaDict = useAppSelector((state) => state.dict.manga);

  const data = mangaDict[mangaHash];

  useEffect(() => {
    dispatch(loadManga({ mangaHash }));
  }, [dispatch, mangaHash]);

  useEffect(() => {
    isManga(data) && navigation.setOptions({ title: data.title });
  }, [navigation, data]);

  const handleReload = useCallback(() => {
    isManga(data) && dispatch(loadManga({ mangaHash }));
  }, [dispatch, mangaHash, data]);

  if (!isManga(data)) {
    return (
      <Flex w="full" h="full" alignItems="center" justifyContent="center">
        <Loading />
      </Flex>
    );
  }

  const handleChapter = (chapterHash: string) => {
    return () => {
      navigation.navigate('Chapter', {
        mangaHash,
        chapterHash,
        page: chapterHash === data.lastWatchChapter ? data.lastWatchPage || 1 : 1,
      });
    };
  };

  const renderItem = ({ item, index }: ListRenderItemInfo<ChapterItem>) => {
    const isActived = item.hash === data.lastWatchChapter;
    const isLastone = index + 1 === data.chapters.length;
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={handleChapter(item.hash)}>
        <Box w={quarterWidth} p={gap / 2} safeAreaBottom={isLastone ? true : undefined}>
          <Text
            bg={isActived ? '#6200ee' : 'transparent'}
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
      </TouchableOpacity>
    );
  };

  return (
    <Box w="full" h="full">
      <Flex w="full" bg="#6200ee" flexDirection="row" pl={4} pr={4} pb={5}>
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
            {data.updateTime}
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
            refreshing={loadStatus === LoadStatus.Pending}
            onRefresh={handleReload}
            tintColor="#6200ee"
          />
        }
        renderItem={renderItem}
        keyExtractor={(item) => item.hash}
      />
    </Box>
  );
};

export const Heart = () => {
  const route = useRoute<StackDetailProps['route']>();
  const dispatch = useAppDispatch();
  const favorites = useAppSelector((state) => state.favorites);
  const mangaHash = route.params.mangaHash;

  useFirstRender(
    useCallback(() => {
      favorites.includes(mangaHash) && dispatch(viewFavorites(mangaHash));
    }, [dispatch, favorites, mangaHash])
  );

  const handleFavorite = () => {
    dispatch(addFavorites(mangaHash));
  };
  const handleUnfavorite = () => {
    dispatch(removeFavorites(mangaHash));
  };

  if (favorites.includes(mangaHash)) {
    return (
      <IconButton
        icon={<Icon as={MaterialIcons} name="favorite" size={30} color="red.500" />}
        onPress={handleUnfavorite}
      />
    );
  }
  return (
    <IconButton
      icon={<Icon as={MaterialIcons} name="favorite-outline" size={30} color="white" />}
      onPress={handleFavorite}
    />
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
