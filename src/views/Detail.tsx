import React, { useEffect, useState } from 'react';
import { Box, Flex, Image, Text, ScrollView } from 'native-base';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { mock_detail } from '~/utils';

const Detail = () => {
  const navigation = useNavigation();
  const [data] = useState(mock_detail);
  const isActived = true;

  useEffect(() => {
    navigation.setOptions({ title: data.name });
  }, [navigation, data.name]);

  return (
    <ScrollView>
      <Flex w="100%" bg="#6200ee" flexDirection="row" pl="4" pr="4" pb="5">
        <Image
          w="130"
          h="160"
          flexGrow="0"
          flexShrink="0"
          source={{ uri: data.cover }}
          resizeMode="cover"
          borderRadius="md"
          alt="cover"
        />
        <Flex flexGrow="1" flexShrink="1" pl="4">
          <Text color="white" fontSize="20" fontWeight="bold" numberOfLines={2}>
            {data.name}
          </Text>
          <Text color="white" fontSize="14" fontWeight="bold" numberOfLines={1}>
            作者：{data.author}
          </Text>
          <Box flexGrow="1" />
          <Text color="white" fontSize="14" fontWeight="bold" numberOfLines={1}>
            更新日期：{data.updateTime}
          </Text>
        </Flex>
      </Flex>
      <Flex flexWrap="wrap" flexDirection="row" p={2}>
        {data.chapter.map((item) => {
          return (
            <Box w="1/4" p={2} key={item.name}>
              <TouchableOpacity activeOpacity={0.8}>
                <Text
                  bg={isActived ? '#6200ee' : ''}
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
                  {item.name}
                </Text>
              </TouchableOpacity>
            </Box>
          );
        })}
      </Flex>
    </ScrollView>
  );
};

export default Detail;
