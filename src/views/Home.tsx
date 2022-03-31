import React, { Fragment, useEffect, useState } from 'react';
import { Box, Flex, Image, Text, ScrollView } from 'native-base';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import { mock_collection } from '~utils';
import { useDispatch } from 'react-redux';
import { action } from '~redux';

const { loadLatest, loadManga, loadChapter } = action;

const Home = ({ navigation: { navigate } }: NativeStackHeaderProps) => {
  const [collection] = useState(mock_collection);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadLatest());
    dispatch(loadManga('39336'));
    dispatch(loadChapter('612275'));
  }, [dispatch]);

  const handleDetail = () => {
    navigate('Detail', {});
  };

  return (
    <ScrollView>
      <Flex flexWrap="wrap" flexDirection="row" p={1.5}>
        {collection.map((item, index) => {
          return (
            <Box key={index} width="1/3" p={1.5}>
              <TouchableOpacity activeOpacity={0.8} onPress={handleDetail}>
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
        })}
      </Flex>
    </ScrollView>
  );
};

export default Home;
