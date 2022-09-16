import React, { useState, useRef, useCallback, Fragment } from 'react';
import { Box, Text, Flex, Icon, IconButton, FlatList, StatusBar, useToast } from 'native-base';
import { FlatList as FlatListRN, Dimensions, ListRenderItemInfo } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ImageWithRetry from '~/components/ImageWithRetry';
import JMComicImage from '~/components/JMComicImage';
import Controller from '~/components/Controller';
import PageSlider, { PageSliderRef } from '~/components/PageSlider';

const windowWidth = Dimensions.get('window').width;
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
  onPrev?: () => void;
  onNext?: () => void;
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
  onPrev,
  onNext,
}: ReaderProps) => {
  const toast = useToast();
  const [page, setPage] = useState(initPage);
  const [showExtra, setShowExtra] = useState(false);
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatListRN>(null);
  const pageSliderRef = useRef<PageSliderRef>(null);
  const initialScrollIndex = Math.max(Math.min(page - 1, data.length - 1), 0);
  const toastRef = useRef(toast);
  const dataRef = useRef(data);
  toastRef.current = toast;
  dataRef.current = data;

  useFocusEffect(
    useCallback(() => {
      onPageChange && onPageChange(page);
    }, [page, onPageChange])
  );

  const toggleExtra = useCallback(() => {
    setShowExtra((prev) => !prev);
  }, []);
  const HandleViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (!viewableItems || viewableItems.length <= 0) {
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
    ({ item }: ListRenderItemInfo<typeof data[0]>) => {
      const { uri, needUnscramble } = item;

      return needUnscramble ? (
        <JMComicImage uri={uri} headers={headers} />
      ) : (
        <ImageWithRetry uri={uri} headers={headers} />
      );
    },
    [headers]
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

  const handleVertical = () => {
    onModeChange(false);
  };
  const handleHorizontal = () => {
    onModeChange(true);
  };
  const handlePrev = () => {
    onPrev && onPrev();
    setPage(1);
  };
  const handleNext = () => {
    onNext && onNext();
    setPage(1);
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

          <Flex
            w="full"
            position="absolute"
            bottom={8}
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
            safeAreaLeft
            safeAreaRight
            safeAreaBottom
          >
            {onPrev ? (
              <IconButton
                icon={<Icon as={MaterialIcons} name="skip-previous" size="lg" color="white" />}
                onPress={handlePrev}
              />
            ) : (
              <Box w={45} />
            )}
            <Box w={0} flexGrow={1} px={1}>
              <PageSlider
                ref={pageSliderRef}
                max={data.length}
                defaultValue={page}
                disabled={!horizontal}
                onSliderChangeEnd={handleSliderChangeEnd}
              />
            </Box>
            {onNext ? (
              <IconButton
                icon={<Icon as={MaterialIcons} name="skip-next" size="lg" color="white" />}
                onPress={handleNext}
              />
            ) : (
              <Box w={45} />
            )}
          </Flex>
        </Fragment>
      )}
    </Box>
  );
};

export default Reader;
