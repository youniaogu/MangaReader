import React, { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { Box, Text, Flex, Icon, IconButton, FlatList, StatusBar, useToast } from 'native-base';
import { FlatList as FlatListRN, Dimensions, ListRenderItemInfo } from 'react-native';
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
  goBack: () => void;
  onModeChange: (horizontal: boolean) => void;
  onPageChange?: (page: number) => void;
}

const Reader = ({
  title = '',
  initPage = 1,
  horizontal = false,
  data = [],
  headers = {},
  goBack,
  onPageChange,
  onModeChange,
}: ReaderProps) => {
  const toast = useToast();
  const [page, setPage] = useState(initPage);
  const [showExtra, setShowExtra] = useState(false);
  const layout = useRef(
    data.map((_, index) => ({ length: windowHeight, offset: index * windowHeight, index }))
  );
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatListRN>(null);
  const pageSliderRef = useRef<PageSliderRef>(null);
  const initialScrollIndex = Math.max(Math.min(initPage - 1, data.length - 1), 0);
  const toastRef = useRef(toast);
  const dataRef = useRef(data);
  toastRef.current = toast;
  dataRef.current = data;

  useEffect(() => {
    onPageChange && onPageChange(page);
  }, [page, onPageChange]);

  const toggleExtra = useCallback(() => {
    setShowExtra((prev) => !prev);
  }, []);
  const HandleViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (!viewableItems) {
      return;
    }
    const last = viewableItems[viewableItems.length - 1];
    const newPage = last.index + 1;
    if (newPage === dataRef.current.length && !toastRef.current.isActive(lastPageToastId)) {
      toastRef.current.show({
        id: lastPageToastId,
        placement: 'bottom',
        title: '最后一页',
        duration: 3000,
      });
    }
    timeout.current && clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      setPage(newPage);
      pageSliderRef.current?.changePage(newPage);
    }, 200);
  }, []);
  const renderVerticalItem = useCallback(
    ({ item, index }: ListRenderItemInfo<typeof data[0]>) => {
      const { uri, needUnscramble } = item;
      const handleSuccess = (image: { width: number; height: number }) => {
        const prevIndex = layout.current[index].index;
        const prevLength = layout.current[index].length;
        const newLayout = layout.current.map((curr) => {
          if (curr.index < prevIndex) {
            return curr;
          }
          return {
            ...curr,
            length: image.height,
            offset: curr.offset - prevLength + image.height,
          };
        });
        layout.current === newLayout;
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
  const handleSliderChangeEndHor = useCallback((newStep: number) => {
    const newPage = Math.floor(newStep);

    setPage(newPage);
    if (newStep > 1) {
      flatListRef.current?.scrollToIndex({ index: newPage - 1, animated: false });
    } else {
      // bug fix, more detail in https://codesandbox.io/s/brave-shape-310n3d?file=/src/App.js
      flatListRef.current?.scrollToOffset({ offset: 1, animated: false });
    }
  }, []);
  const handleSliderChangeEndVer = useCallback((newStep: number) => {
    const newPage = Math.floor(newStep);
    const offset = layout.current[newPage].offset;

    setPage(newPage);
    flatListRef.current?.scrollToOffset({
      offset: offset <= 0 ? 1 : offset,
    });
  }, []);

  const handleVertical = () => {
    onModeChange(false);
  };
  const handleHorizontal = () => {
    onModeChange(true);
  };

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
          maxToRenderPerBatch={3}
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
          onViewableItemsChanged={HandleViewableItemsChanged}
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
            windowSize={3}
            initialNumToRender={1}
            maxToRenderPerBatch={3}
            onViewableItemsChanged={HandleViewableItemsChanged}
            renderItem={renderVerticalItem}
            keyExtractor={(item) => item.uri}
            ListHeaderComponent={<Box height={0} safeAreaTop />}
            ListFooterComponent={<Box height={0} safeAreaBottom />}
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
          >
            <IconButton
              icon={<Icon as={MaterialIcons} name="arrow-back" size={30} color="white" />}
              onPress={goBack}
            />
            <Text fontSize="md" w="3/5" numberOfLines={1} color="white" fontWeight="bold">
              {title}
              {title}
              {title}
              {title}
              {title}
              {title}
              {title}
            </Text>
            <Box flex={1} />
            <Text color="white" fontWeight="bold">
              {page} / {data.length}
            </Text>
            {horizontal ? (
              <IconButton
                icon={
                  <Icon as={MaterialIcons} name="stay-primary-landscape" size="lg" color="white" />
                }
                onPress={handleVertical}
              />
            ) : (
              <IconButton
                icon={
                  <Icon as={MaterialIcons} name="stay-primary-portrait" size="lg" color="white" />
                }
                onPress={handleHorizontal}
              />
            )}
          </Flex>

          <PageSlider
            ref={pageSliderRef}
            max={data.length}
            defaultValue={page}
            onSliderChangeEnd={horizontal ? handleSliderChangeEndHor : handleSliderChangeEndVer}
          />
        </Fragment>
      )}
    </Box>
  );
};

export default Reader;
