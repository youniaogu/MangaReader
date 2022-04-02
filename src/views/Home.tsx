import React, { Fragment, useEffect } from 'react';
import { action, useAppSelector, useAppDispatch } from '~redux';
import { Box, Image, Text, FlatList } from 'native-base';
import { TouchableOpacity } from 'react-native';

const { loadLatest } = action;

const Home = ({ navigation: { navigate } }: StackHomeProps) => {
  const latest = useAppSelector((state) => state.latest);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadLatest(true));
  }, [dispatch]);

  const handleLoadMore = () => {
    console.log('load more');
    dispatch(loadLatest());
  };
  const handleDetail = (id: string) => {
    return () => {
      navigate('Detail', { id });
    };
  };
  const { list } = latest;

  return (
    <FlatList
      p={1.5}
      numColumns={3}
      data={list}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.25}
      renderItem={({ item }) => {
        return (
          <Box key={item.id} width="1/3" p={1.5}>
            <TouchableOpacity activeOpacity={0.8} onPress={handleDetail(item.id)}>
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

export default Home;
