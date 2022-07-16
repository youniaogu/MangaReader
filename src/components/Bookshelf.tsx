import React, { memo } from 'react';
import { StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Box, Text, FlatList } from 'native-base';
import { coverAspectRatio } from '~/utils';
import { CachedImage } from '@georstat/react-native-image-cache';
import SpinLoading from '~/components/SpinLoading';
import Loading from '~/components/Loading';
import Empty from '~/components/Empty';

const gap = 2;
const windowWidth = Dimensions.get('window').width;
const oneThirdWidth = (windowWidth - gap * 4) / 3;

interface BookshelfProps {
  list: Manga[];
  trends?: string[];
  loadMore?: () => void;
  itemOnPress: (hash: string) => void;
  loading?: boolean;
}

const Bookshelf = ({ list, trends, loadMore, itemOnPress, loading = false }: BookshelfProps) => {
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
    return <Empty />;
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
        <TouchableOpacity activeOpacity={0.8} onPress={handlePress(item.hash)}>
          <Box width={oneThirdWidth} flexDirection="column" p={gap / 2}>
            <Box position="relative" shadow={2}>
              <CachedImage source={item.cover} style={styles.img} resizeMode="cover" />
              {trends && trends.includes(item.hash) && (
                <Box
                  shadow={0}
                  position="absolute"
                  left={0}
                  bottom={0}
                  borderRadius={3}
                  borderBottomLeftRadius={6}
                  px={2}
                  background="#6200ee"
                >
                  <Text fontSize="xs" fontWeight="bold" color="white">
                    New
                  </Text>
                </Box>
              )}
            </Box>
            <Text pt={1} fontSize="md" fontWeight="bold" numberOfLines={1}>
              {item.title}
            </Text>
          </Box>
        </TouchableOpacity>
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
