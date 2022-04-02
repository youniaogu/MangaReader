import React, { Fragment, useEffect } from 'react';
import { Box, Flex, Image, Text, ScrollView } from 'native-base';
import { useDispatch, useSelector } from 'react-redux';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import { action } from '~redux';

const { loadLatest } = action;

const Collection = ({ navigation: { navigate } }: NativeStackHeaderProps) => {
  const latest = useSelector((state: RootState) => state.latest);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadLatest());
  }, [dispatch]);

  const handleDetail = () => {
    navigate('Detail', {});
  };
  const { list } = latest;

  return (
    <ScrollView>
      <Flex flexWrap="wrap" flexDirection="row" p={1.5}>
        {list.map((item, index) => {
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

export default Collection;
