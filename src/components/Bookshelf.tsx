import React, { Fragment } from 'react';
import { Box, Image, Text, FlatList } from 'native-base';
import { TouchableOpacity } from 'react-native';

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
      p={1.5}
      numColumns={3}
      data={list}
      onEndReached={loadMore}
      onEndReachedThreshold={0.25}
      renderItem={({ item }) => {
        return (
          <Box key={item.id} width="1/3" p={1.5}>
            <TouchableOpacity activeOpacity={0.8} onPress={handlePress(item.id)}>
              <Fragment>
                <Image
                  w="130"
                  h="160"
                  borderRadius="md"
                  source={{
                    uri: item.cover,
                  }}
                  resizeMode="cover"
                  alt="cover"
                />
                <Text pt="1" fontSize="md" fontWeight="bold" numberOfLines={1}>
                  {item.title}
                </Text>
              </Fragment>
            </TouchableOpacity>
          </Box>
        );
      }}
    />
  );
};

export default Bookshelf;
