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
import Controller from '~/components/Controller';
import PageSlider, { PageSliderRef } from '~/components/PageSlider';

const windowWidth = Dimensions.get('window').width;
const lastPageToastId = 'LAST_PAGE_TOAST_ID';

interface ReaderProps {
  title?: string;
  initPage?: number;
  data?: string[];
  headers?: {
    [index: string]: string;
  };
  onPageChange?: (page: number) => void;
  goBack: () => void;
}

const Reader = ({
  title = '',
  initPage = 1,
  data = [],
  headers = {},
  goBack,
  onPageChange,
}: ReaderProps) => {
  const toast = useToast();
  const [page, setPage] = useState(initPage);
  const [showExtra, setShowExtra] = useState(false);
  const pageSliderRef = useRef<PageSliderRef>(null);
  const flatListRef = useRef<FlatListRN>(null);

  useEffect(() => {
    onPageChange && onPageChange(page);
  }, [page, onPageChange]);

  const toggleExtra = useCallback(() => {
    setShowExtra((prev) => !prev);
  }, [setShowExtra]);
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffset = event.nativeEvent.contentOffset;
      const viewSize = event.nativeEvent.layoutMeasurement;
      const index = Math.floor(contentOffset.x / viewSize.width);
      const newPage = Math.min(Math.max(index + 1, 1), data.length);

      if (newPage === data.length && !toast.isActive(lastPageToastId)) {
        toast.show({
          id: lastPageToastId,
          placement: 'bottom',
          title: 'The Last Page',
          duration: 3000,
        });
      }
      setPage(newPage);
      pageSliderRef.current?.changePage(newPage);
    },
    [data.length, toast]
  );
  const handleSliderChangeEnd = useCallback((newStep: number) => {
    const newPage = Math.floor(newStep);
    setPage(newPage);
    flatListRef.current?.scrollToIndex({ index: newPage - 1, animated: false });
  }, []);
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<typeof data[0]>) => {
      return <Controller uri={item} headers={headers} onTap={toggleExtra} />;
    },
    [toggleExtra, headers]
  );

  return (
    <Box w="full" h="full" bg="black">
      <StatusBar backgroundColor="black" barStyle={showExtra ? 'light-content' : 'dark-content'} />
      <FlatList
        ref={flatListRef}
        horizontal
        data={data}
        pagingEnabled
        initialScrollIndex={initPage - 1}
        windowSize={3}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        updateCellsBatchingPeriod={1000}
        getItemLayout={(_data, index) => ({
          length: windowWidth,
          offset: windowWidth * index,
          index,
        })}
        onScroll={handleScroll}
        renderItem={renderItem}
        keyExtractor={(item) => item}
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
