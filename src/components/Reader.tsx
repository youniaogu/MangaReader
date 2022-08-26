import React, { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import {
  FlatList as FlatListRN,
  Dimensions,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Box, Text, Flex, Icon, IconButton, FlatList, StatusBar, useToast } from 'native-base';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ImageWithRetry from '~/components/ImageWithRetry';
import JMComicImage from '~/components/JMComicImage';
import Controller from '~/components/Controller';
import PageSlider, { PageSliderRef } from '~/components/PageSlider';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
const lastPageToastId = 'LAST_PAGE_TOAST_ID';

interface ReaderProps {
  title?: string;
  initPage?: number;
  horizontal?: boolean;
  data?: Chapter['images'];
  headers?: Chapter['headers'];
  onPageChange?: (page: number) => void;
  goBack: () => void;
}

const Reader = ({
  title = '',
  initPage = 1,
  horizontal = false,
  data = [],
  headers = {},
  goBack,
  onPageChange,
}: ReaderProps) => {
  const toast = useToast();
  const [page, setPage] = useState(initPage);
  const [showExtra, setShowExtra] = useState(false);
  const [layout, setLayout] = useState(
    data.map((_, index) => ({ length: windowHeight, offset: index * windowHeight, index }))
  );
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatListRN>(null);
  const pageSliderRef = useRef<PageSliderRef>(null);
  const initialScrollIndex = Math.max(Math.min(initPage - 1, data.length - 1), 0);

  useEffect(() => {
    onPageChange && onPageChange(page);
  }, [page, onPageChange]);

  const toggleExtra = useCallback(() => {
    setShowExtra((prev) => !prev);
  }, []);
  const handleHorizontalScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffset = event.nativeEvent.contentOffset;
      const viewSize = event.nativeEvent.layoutMeasurement;
      const index = Math.floor(contentOffset.x / viewSize.width);
      const newPage = Math.min(Math.max(index + 1, 1), data.length);
      if (newPage === data.length && !toast.isActive(lastPageToastId)) {
        toast.show({ id: lastPageToastId, placement: 'bottom', title: '最后一页', duration: 3000 });
      }
      timeout.current && clearTimeout(timeout.current);
      timeout.current = setTimeout(() => {
        setPage(newPage);
        pageSliderRef.current?.changePage(newPage);
      }, 200);
    },
    [data.length, toast]
  );
  const handleVerticalScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffset = event.nativeEvent.contentOffset;
      const viewSize = event.nativeEvent.layoutMeasurement;
      const index = layout.findIndex(
        (item) => item.offset + item.length >= contentOffset.y + viewSize.height
      );
      const newPage = Math.min(Math.max(index + 1, 1), data.length);
      if (newPage === data.length && !toast.isActive(lastPageToastId)) {
        toast.show({ id: lastPageToastId, placement: 'bottom', title: '最后一页', duration: 3000 });
      }
      timeout.current && clearTimeout(timeout.current);
      timeout.current = setTimeout(() => {
        setPage(newPage);
        pageSliderRef.current?.changePage(newPage);
      }, 200);
    },
    [data.length, toast, layout]
  );
  const renderVerticalItem = useCallback(
    ({ item, index }: ListRenderItemInfo<typeof data[0]>) => {
      const { uri, needUnscramble } = item;
      const handleSuccess = (image: { width: number; height: number }) => {
        const prevIndex = layout[index].index;
        const prevLength = layout[index].length;
        const newLayout = layout.map((curr) => {
          if (curr.index < prevIndex) {
            return curr;
          }
          return {
            ...curr,
            length: image.height,
            offset: curr.offset - prevLength + image.height,
          };
        });

        setLayout(newLayout);
      };

      return needUnscramble ? (
        <JMComicImage uri={uri} headers={headers} onSuccess={handleSuccess} />
      ) : (
        <ImageWithRetry uri={uri} headers={headers} onSuccess={handleSuccess} />
      );
    },
    [headers, layout]
  );
  const renderHorizontalItem = useCallback(
    ({ item }: ListRenderItemInfo<typeof data[0]>) => {
      const { uri, needUnscramble } = item;

      return (
        <Controller horizontal onTap={toggleExtra}>
          {needUnscramble ? (
            <JMComicImage horizontal uri={uri} headers={headers} />
          ) : (
            <ImageWithRetry horizontal uri={uri} headers={headers} />
          )}
        </Controller>
      );
    },
    [headers, toggleExtra]
  );
  const handleSliderChangeEnd = useCallback((newStep: number) => {
    const newPage = Math.floor(newStep);
    setPage(newPage);
    if (newStep > 1) {
      flatListRef.current?.scrollToIndex({ index: newPage - 1, animated: false });
    } else {
      // bug fix, more detail in https://codesandbox.io/s/brave-shape-310n3d?file=/src/App.js
      flatListRef.current?.scrollToOffset({ offset: 1, animated: false });
    }
  }, []);

  return (
    <Box w="full" h="full" bg="black">
      <StatusBar backgroundColor="black" barStyle={showExtra ? 'light-content' : 'dark-content'} />
      {horizontal ? (
        <FlatList
          w="full"
          h="full"
          ref={flatListRef}
          data={data}
          horizontal
          pagingEnabled
          initialScrollIndex={initialScrollIndex}
          windowSize={3}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          updateCellsBatchingPeriod={200}
          getItemLayout={(_data, index) => {
            if (index === -1) {
              return { index, length: 0, offset: 0 };
            }
            return {
              length: windowWidth,
              offset: windowWidth * index,
              index,
            };
          }}
          onScroll={handleHorizontalScroll}
          renderItem={renderHorizontalItem}
          keyExtractor={(item) => item.uri}
        />
      ) : (
        <Controller onTap={toggleExtra}>
          <FlatList
            w="full"
            h="full"
            ref={flatListRef}
            data={data}
            windowSize={5}
            initialScrollIndex={initialScrollIndex}
            initialNumToRender={2}
            maxToRenderPerBatch={1}
            getItemLayout={(_data, index) => {
              if (index === -1) {
                return { index, length: 0, offset: 0 };
              }
              return layout[index];
            }}
            onScroll={handleVerticalScroll}
            renderItem={renderVerticalItem}
            keyExtractor={(item) => item.uri}
          />
        </Controller>
      )}

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
            <Text fontSize="md" w="2/3" numberOfLines={1} color="white" fontWeight="bold">
              {title}
            </Text>
            <Box flex={1} />
            <Text color="white" fontWeight="bold">
              {page} / {data.length}
            </Text>
          </Flex>

          <PageSlider
            ref={pageSliderRef}
            max={data.length}
            defaultValue={page}
            onSliderChangeEnd={handleSliderChangeEnd}
          />
        </Fragment>
      )}
    </Box>
  );
};

export default Reader;
