import React, { useState, useRef, useCallback, Fragment } from 'react';
import { Box, Text, Flex, Icon, FlatList, StatusBar, IconButton, useToast } from 'native-base';
import { FlatList as FlatListRN, Dimensions, ListRenderItemInfo } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AsyncStatus } from '~/utils';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import PageSlider, { PageSliderRef } from '~/components/PageSlider';
import ComicImage, { ImageState } from '~/components/ComicImage';
import Controller from '~/components/Controller';

const windowWidth = Dimensions.get('window').width;
const lastPageToastId = 'LAST_PAGE_TOAST_ID';

interface ReaderProps {
  title?: string;
  initPage?: number;
  inverted?: boolean;
  horizontal?: boolean;
  data?: Chapter['images'];
  headers?: Chapter['headers'];
  goBack: () => void;
  onReload?: () => void;
  onModeChange: (horizontal: boolean) => void;
  onPageChange?: (page: number) => void;
  onDirectionChange?: (inverted: boolean) => void;
  onPrevChapter?: () => void;
  onNextChapter?: () => void;
}

const Reader = ({
  title = '',
  initPage = 1,
  inverted = false,
  horizontal = false,
  data = [],
  headers = {},
  goBack,
  onReload,
  onPageChange,
  onModeChange,
  onDirectionChange,
  onPrevChapter,
  onNextChapter,
}: ReaderProps) => {
  const toast = useToast();
  const [page, setPage] = useState(initPage);
  const [showExtra, setShowExtra] = useState(false);
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatListRN>(null);
  const pageSliderRef = useRef<PageSliderRef>(null);
  const itemStateRef = useRef<ImageState[]>([]);
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
  useFocusEffect(() => {
    return () => timeout.current && clearTimeout(timeout.current);
  });

  const handlePrevPage = useCallback(() => {
    flatListRef.current?.scrollToIndex({ index: Math.max(page - 2, 0), animated: true });
  }, [page]);
  const handleNextPage = useCallback(() => {
    flatListRef.current?.scrollToIndex({ index: Math.min(page, data.length - 1), animated: true });
  }, [page, data.length]);
  const handleTap = useCallback(
    (position: 'left' | 'mid' | 'right') => {
      if (position === 'mid') {
        setShowExtra((prev) => !prev);
      }
      if (inverted) {
        if (position === 'right') {
          handlePrevPage();
        }
        if (position === 'left') {
          handleNextPage();
        }
      } else {
        if (position === 'left') {
          handlePrevPage();
        }
        if (position === 'right') {
          handleNextPage();
        }
      }
    },
    [handlePrevPage, handleNextPage, inverted]
  );
  const handlePrevChapter = useCallback(() => {
    onPrevChapter && onPrevChapter();
  }, [onPrevChapter]);
  const handleNextChapter = useCallback(() => {
    onNextChapter && onNextChapter();
  }, [onNextChapter]);
  const handleLongPress = useCallback(
    (position: 'left' | 'right') => {
      if (inverted) {
        if (position === 'right') {
          handlePrevChapter();
        }
        if (position === 'left') {
          handleNextChapter();
        }
      } else {
        if (position === 'left') {
          handlePrevChapter();
        }
        if (position === 'right') {
          handleNextChapter();
        }
      }
    },
    [handlePrevChapter, handleNextChapter, inverted]
  );

  const HandleViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (!viewableItems || viewableItems.length <= 0) {
      return;
    }
    const last = viewableItems[viewableItems.length - 1];
    const newPage = last.index + 1;
    if (newPage === dataRef.current.length && !toastRef.current.isActive(lastPageToastId)) {
      toastRef.current.show({ id: lastPageToastId, title: '最后一页' });
    }
    timeout.current && clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      setPage(newPage);
      pageSliderRef.current?.changePage(newPage);
    }, 200);
  }, []);
  const renderVerticalItem = useCallback(
    ({ item, index }: ListRenderItemInfo<(typeof data)[0]>) => {
      const { uri, needUnscramble } = item;
      const cacheState = itemStateRef.current[index];

      return (
        <ComicImage
          useJMC={needUnscramble}
          uri={uri}
          headers={headers}
          prevState={cacheState}
          onSuccess={({ height, hash, dataUrl }) => {
            itemStateRef.current[index] = {
              defaulthHash: hash,
              defaultHeight: height,
              defaultStatus: AsyncStatus.Fulfilled,
              defaultDataUrl: dataUrl,
            };
          }}
        />
      );
    },
    [headers]
  );
  const renderHorizontalItem = useCallback(
    ({ item }: ListRenderItemInfo<(typeof data)[0]>) => {
      const { uri, needUnscramble } = item;

      return (
        <Controller horizontal onTap={handleTap} onLongPress={handleLongPress}>
          <ComicImage horizontal useJMC={needUnscramble} uri={uri} headers={headers} />
        </Controller>
      );
    },
    [headers, handleTap, handleLongPress]
  );

  const handleSliderChangeEnd = useCallback((newStep: number) => {
    const newPage = Math.floor(newStep);

    setPage(newPage);
    flatListRef.current?.scrollToIndex({ index: newPage - 1, animated: false });
  }, []);

  const handleReload = () => {
    onReload && onReload();
  };
  const handleRight = () => {
    onDirectionChange && onDirectionChange(false);
  };
  const handleLeft = () => {
    onDirectionChange && onDirectionChange(true);
  };
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
          inverted={inverted}
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
        <Controller onTap={handleTap} onLongPress={handleLongPress}>
          <FlatList
            w="full"
            h="full"
            ref={flatListRef}
            data={data}
            inverted={inverted}
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
              icon={
                <Icon as={MaterialIcons} shadow={0} name="arrow-back" size="2xl" color="white" />
              }
              onPress={goBack}
            />
            <Text
              flexShrink={1}
              shadow={0}
              fontSize="md"
              numberOfLines={1}
              color="white"
              fontWeight="bold"
            >
              {title}
            </Text>
            <IconButton
              icon={<Icon as={MaterialIcons} shadow={0} name="replay" size="md" color="white" />}
              onPress={handleReload}
            />

            <Box flexGrow={1} flexShrink={1} />

            {horizontal &&
              (inverted ? (
                <IconButton
                  icon={<Icon as={MaterialIcons} shadow={0} name="west" size="lg" color="white" />}
                  onPress={handleRight}
                />
              ) : (
                <IconButton
                  icon={<Icon as={MaterialIcons} shadow={0} name="east" size="lg" color="white" />}
                  onPress={handleLeft}
                />
              ))}
            <Text shadow={0} color="white" fontWeight="bold">
              {page} / {data.length}
            </Text>
            {horizontal ? (
              <IconButton
                icon={
                  <Icon
                    as={MaterialIcons}
                    shadow={0}
                    name="stay-primary-landscape"
                    size="lg"
                    color="white"
                  />
                }
                onPress={handleVertical}
              />
            ) : (
              <IconButton
                icon={
                  <Icon
                    as={MaterialIcons}
                    shadow={0}
                    name="stay-primary-portrait"
                    size="lg"
                    color="white"
                  />
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
            {onPrevChapter ? (
              <IconButton
                icon={
                  <Icon
                    as={MaterialIcons}
                    shadow={0}
                    name="skip-previous"
                    size="lg"
                    color="white"
                  />
                }
                onPress={handlePrevChapter}
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
            {onNextChapter ? (
              <IconButton
                icon={
                  <Icon as={MaterialIcons} shadow={0} name="skip-next" size="lg" color="white" />
                }
                onPress={handleNextChapter}
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
