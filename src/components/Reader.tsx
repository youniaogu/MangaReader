import React, { useState, useEffect, useRef, Fragment } from 'react';
import {
  FlatList as FlatListRN,
  Dimensions,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import {
  Box,
  Text,
  Flex,
  Icon,
  IconButton,
  Slider,
  FlatList,
  StatusBar,
  Pressable,
  useToast,
} from 'native-base';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Controller from '~/components/Controller';

const windowWidth = Dimensions.get('window').width;
const lastPageToastId = Symbol().toString();

interface ReaderProps {
  title?: string;
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

const Reader = ({ title = '', initPage = 1, data, goBack, onPageChange }: ReaderProps) => {
  const toast = useToast();
  const [page, setPage] = useState(initPage);
  const [showExtra, setShowExtra] = useState(false);
  const flatListRef = useRef<FlatListRN>(null);
  const timeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onPageChange && onPageChange(page);
  }, [page, onPageChange]);

  const toggleExtra = () => {
    setShowExtra(!showExtra);
  };
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const viewSize = event.nativeEvent.layoutMeasurement;
    const index = Math.floor(contentOffset.x / viewSize.width);
    const newPage = Math.min(Math.max(index + 1, 1), data.length);

    if (newPage === data.length && !toast.isActive(lastPageToastId)) {
      toast.show({
        id: lastPageToastId,
        placement: 'bottom',
        title: 'Last Page',
      });
    }
    timeout.current && clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setPage(newPage), 250);
  };
  const handleSliderChange = (step: number) => {
    const newPage = Math.floor(step);
    if (newPage !== page) {
      setPage(newPage);
      flatListRef.current?.scrollToIndex({ index: newPage - 1, animated: false });
    }
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
        ref={flatListRef}
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
        onScroll={handleScroll}
        renderItem={renderItem}
        keyExtractor={(item) => item.uri}
      />

      {showExtra && (
        <Fragment>
          <Flex
            position="absolute"
            top={0}
            flexDirection="row"
            alignItems="center"
            safeAreaTop
            safeAreaLeft
            safeAreaRight
            pr={3}
          >
            <IconButton
              icon={<Icon as={MaterialIcons} name="arrow-back" size={30} color="white" />}
              onPress={goBack}
            />
            <Text fontSize="md" color="white" fontWeight="bold">
              {title}
            </Text>
            <Box flex={1} />
            <Text color="white" fontWeight="bold">
              {page} / {data.length}
            </Text>
          </Flex>

          <Flex
            w="full"
            position="absolute"
            bottom={12}
            alignItems="center"
            justifyContent="center"
            safeAreaLeft
            safeAreaRight
            safeAreaBottom
          >
            <Slider
              w="3/4"
              size="md"
              defaultValue={page}
              step={page}
              minValue={1}
              maxValue={data.length}
              colorScheme="purple"
              onChangeEnd={handleSliderChange}
            >
              <Slider.Track>
                <Slider.FilledTrack />
              </Slider.Track>
              <Slider.Thumb />
            </Slider>
          </Flex>
        </Fragment>
      )}
    </Box>
  );
};

export default Reader;
