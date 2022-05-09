import React from 'react';
import { TouchableOpacity, Dimensions } from 'react-native';
import { Box, Image, Text, FlatList } from 'native-base';
import { coverAspectRatio } from '~/utils';

const gap = 3;
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
      onEndReachedThreshold={0.5}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        return (
          <TouchableOpacity activeOpacity={0.8} onPress={handlePress(item.id)}>
            <Box shadow={0} width={oneThirdWidth} flexDirection="column" p={gap / 2}>
              <Image
                w={oneThirdWidth}
                h={oneThirdWidth / coverAspectRatio}
                borderRadius="md"
                source={{
                  uri: item.cover,
                }}
                resizeMode="cover"
                alt="cover"
              />
              <Text shadow="none" pt="1" fontSize="md" fontWeight="bold" numberOfLines={1}>
                {item.title}
              </Text>
            </Box>
          </TouchableOpacity>
        );
      }}
    />
  );
};

export default Bookshelf;
