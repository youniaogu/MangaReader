import React, { memo } from 'react';
import { Box, Text, Icon, FlatList, Pressable } from 'native-base';
import { splitWidth, coverAspectRatio } from '~/utils';
import { CachedImage } from '@georstat/react-native-image-cache';
import { StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import WhiteCurtain from '~/components/WhiteCurtain';
import SpinLoading from '~/components/SpinLoading';
import Loading from '~/components/Loading';
import Empty from '~/components/Empty';

const { gap, partWidth, numColumns } = splitWidth({
  gap: 8,
  minNumColumns: 3,
  maxPartWidth: 200,
});

interface BookshelfProps {
  list: Manga[];
  trendList?: string[];
  activeList?: string[];
  negativeList?: string[];
  loadMore?: () => void;
  reload?: () => void;
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
  reload,
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
    return <Empty text={emptyText} onPress={reload} />;
  }

  return (
    <FlatList
      p={`${gap / 2}px`}
      numColumns={numColumns}
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
          <Box width={partWidth + gap} flexDirection="column" p={`${gap / 2}px`}>
            <Box position="relative" shadow={0} bg="white" borderRadius={6}>
              <CachedImage
                options={{ headers: item.headers }}
                source={item.cover}
                style={styles.img}
                resizeMode="cover"
              />
              {trendList && trendList.includes(item.hash) && (
                <Box
                  shadow={0}
                  position="absolute"
                  left={0}
                  bottom={0}
                  borderRadius={3}
                  borderBottomLeftRadius={6}
                  px={2}
                  bg="purple.500"
                >
                  <Text fontSize="xs" fontWeight="bold" color="white">
                    New
                  </Text>
                </Box>
              )}
              {negativeList && negativeList.includes(item.hash) && (
                <Icon
                  shadow="icon"
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
    height: partWidth / coverAspectRatio,
    overflow: 'hidden',
    borderRadius: 6,
  },
});

export default memo(Bookshelf);
