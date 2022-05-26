import React, { memo } from 'react';
import { StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Box, Text, FlatList } from 'native-base';
import { coverAspectRatio } from '~/utils';
import { CachedImage } from '@georstat/react-native-image-cache';

const gap = 2;
const windowWidth = Dimensions.get('window').width;
const oneThirdWidth = (windowWidth - gap * 4) / 3;

interface BookshelfProps {
  list: Manga[];
  loadMore?: (info: { distanceFromEnd: number }) => void;
  itemOnPress: (id: string) => void;
}

const Bookshelf = ({ list, loadMore, itemOnPress }: BookshelfProps) => {
  const handlePress = (id: string) => {
    return () => {
      itemOnPress(id);
    };
  };

  return (
    <FlatList
      p={gap / 2}
      numColumns={3}
      data={list}
      onEndReached={loadMore}
      onEndReachedThreshold={1}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => {
        return (
          <TouchableOpacity activeOpacity={0.8} onPress={handlePress(item.id)}>
            <Box
              shadow={0}
              width={oneThirdWidth}
              flexDirection="column"
              p={gap / 2}
              safeAreaBottom={index + 1 === list.length ? true : undefined}
            >
              <CachedImage source={item.cover} style={styles.img} resizeMode="cover" />
              <Text shadow="none" pt={1} fontSize="md" fontWeight="bold" numberOfLines={1}>
                {item.title}
              </Text>
            </Box>
          </TouchableOpacity>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  img: {
    width: '100%',
    height: oneThirdWidth / coverAspectRatio,
    overflow: 'hidden',
    borderRadius: 8,
  },
});

export default memo(Bookshelf);
