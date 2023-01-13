import React, { memo } from 'react';
import { Box, Text, Icon, FlatList, Pressable } from 'native-base';
import { StyleSheet, Dimensions } from 'react-native';
import { coverAspectRatio } from '~/utils';
import { CachedImage } from '@georstat/react-native-image-cache';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import WhiteCurtain from '~/components/WhiteCurtain';
import SpinLoading from '~/components/SpinLoading';
import Loading from '~/components/Loading';
import Empty from '~/components/Empty';

const gap = 2;
const windowWidth = Dimensions.get('window').width;
const oneThirdWidth = (windowWidth - gap * 4) / 3;

interface BookshelfProps {
  list: Manga[];
  trendList?: string[];
  activeList?: string[];
  negativeList?: string[];
  loadMore?: () => void;
  itemOnPress: (hash: string) => void;
  loading?: boolean;
  emptyText?: string;
}

const Bookshelf = ({
  list,
  trendList,
  activeList,
  negativeList,
  loadMore,
  itemOnPress,
  loading = false,
  emptyText,
}: BookshelfProps) => {
  const handlePress = (hash: string) => {
    return () => {
      itemOnPress(hash);
    };
  };
  const handleEndReached = () => {
    !loading && loadMore && loadMore();
  };

  if (loading && list.length === 0) {
    return <Loading />;
  }
  if (!loading && list.length === 0) {
    return <Empty text={emptyText} />;
  }

  return (
    <FlatList
      p={gap / 2}
      numColumns={3}
      data={list}
      onEndReached={handleEndReached}
      onEndReachedThreshold={1}
      windowSize={3}
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      keyExtractor={(item) => item.hash}
      ListFooterComponent={
        loading ? <SpinLoading height={24} safeAreaBottom /> : <Box height={0} safeAreaBottom />
      }
      renderItem={({ item }) => (
        <Pressable _pressed={{ opacity: 0.8 }} onPress={handlePress(item.hash)}>
          <Box width={oneThirdWidth} flexDirection="column" p={gap / 2}>
            <Box position="relative" shadow={2}>
              <CachedImage source={item.cover} style={styles.img} resizeMode="cover" />
              {trendList && trendList.includes(item.hash) && (
                <Box
                  shadow={0}
                  position="absolute"
                  left={0}
                  bottom={0}
                  borderRadius={3}
                  borderBottomLeftRadius={6}
                  px={2}
                  background="purple.500"
                >
                  <Text fontSize="xs" fontWeight="bold" color="white">
                    New
                  </Text>
                </Box>
              )}
              {negativeList && negativeList.includes(item.hash) && (
                <Icon
                  shadow={1}
                  position="absolute"
                  top={1}
                  right={1}
                  as={MaterialIcons}
                  name="lock"
                  size="sm"
                  color="purple.700"
                />
              )}
              <WhiteCurtain actived={activeList && activeList.includes(item.hash)}>
                <Box
                  position="absolute"
                  w="full"
                  h="full"
                  top={0}
                  left={0}
                  backgroundColor="white"
                  opacity={0.3}
                />
                <SpinLoading />
              </WhiteCurtain>
            </Box>
            <Text pt={1} fontSize="md" fontWeight="bold" numberOfLines={1}>
              {item.title || item.hash}
            </Text>
          </Box>
        </Pressable>
      )}
    />
  );
};

const styles = StyleSheet.create({
  img: {
    width: '100%',
    height: oneThirdWidth / coverAspectRatio,
    overflow: 'hidden',
    borderRadius: 6,
  },
});

export default memo(Bookshelf);
