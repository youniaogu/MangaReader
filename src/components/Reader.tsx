import React, { useState, useEffect, useRef } from 'react';
import {
  Dimensions,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { FlatList, Box, IconButton, Icon, HStack, Center, Pressable, StatusBar } from 'native-base';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Controller from '~/components/Controller';

const windowWidth = Dimensions.get('window').width;

interface ReaderProps {
  initPage?: number;
  data: {
    uri: string;
    headers: {
      [index: string]: string;
    };
  }[];
  onPageChange?: (page: number) => void;
  goBack: () => void;
}

const Reader = ({ initPage = 1, data, goBack, onPageChange }: ReaderProps) => {
  const [page, setPage] = useState(initPage);
  const [showExtra, setShowExtra] = useState(false);
  const timeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onPageChange && onPageChange(page);
  }, [page, onPageChange]);

  const toggleExtra = () => {
    setShowExtra(!showExtra);
  };
  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const viewSize = event.nativeEvent.layoutMeasurement;
    const index = Math.floor(contentOffset.x / viewSize.width);
    const newPage = Math.min(Math.max(index + 1, 1), data.length);

    timeout.current && clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setPage(newPage), 250);
  };

  const renderItem = ({ item }: ListRenderItemInfo<typeof data[0]>) => {
    return (
      <Pressable onPress={toggleExtra}>
        <Box>
          <Controller uri={item.uri} headers={item.headers} />
        </Box>
      </Pressable>
    );
  };

  return (
    <Box w="full" h="full" bg="black">
      <StatusBar barStyle={showExtra ? 'light-content' : 'dark-content'} />
      <FlatList
        horizontal
        data={data}
        pagingEnabled
        initialScrollIndex={initPage - 1}
        initialNumToRender={1}
        getItemLayout={(_data, index) => ({
          length: windowWidth,
          offset: windowWidth * index,
          index,
        })}
        onScroll={handleScrollEnd}
        renderItem={renderItem}
        keyExtractor={(item) => item.uri}
      />

      {showExtra && (
        <HStack position="absolute" top={0} alignItems="center" safeAreaTop>
          <IconButton
            icon={<Icon as={MaterialIcons} name="arrow-back" size={30} color="white" />}
            onPress={goBack}
          />

          <Center _text={{ color: 'white', fontWeight: 'bold' }} flexDirection="row">
            {page} / {data.length}
          </Center>
        </HStack>
      )}
    </Box>
  );
};

export default Reader;
