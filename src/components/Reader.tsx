import React, {
  memo,
  useRef,
  useMemo,
  useCallback,
  useImperativeHandle,
  forwardRef,
  ForwardRefRenderFunction,
} from 'react';
import { FlatList as FlatListRN, Dimensions, ListRenderItemInfo } from 'react-native';
import { Box, FlatList } from 'native-base';
import { AsyncStatus } from '~/utils';
import ComicImage, { ImageState } from '~/components/ComicImage';
import Controller from '~/components/Controller';

const windowWidth = Dimensions.get('window').width;

export interface ReaderProps {
  initPage?: number;
  inverted?: boolean;
  horizontal?: boolean;
  data?: Chapter['images'];
  headers?: Chapter['headers'];
  onTap?: (position: 'left' | 'mid' | 'right') => void;
  onLongPress?: (position: 'left' | 'right') => void;
  onImageLoad?: (uri: string, index: number) => void;
  onPageChange?: (page: number) => void;
  onLoadMore?: () => void;
}

export interface ReaderRef {
  scrollToIndex: (index: number, animated?: boolean) => void;
}

const Reader: ForwardRefRenderFunction<ReaderRef, ReaderProps> = (
  {
    initPage = 1,
    inverted = false,
    horizontal = false,
    data = [],
    headers = {},
    onTap,
    onLongPress,
    onImageLoad,
    onPageChange,
    onLoadMore,
  },
  ref
) => {
  const flatListRef = useRef<FlatListRN>(null);
  const itemStateRef = useRef<ImageState[]>([]);

  const dataRef = useRef(data);
  const onPageChangeRef = useRef(onPageChange);
  dataRef.current = data;
  onPageChangeRef.current = onPageChange;

  const initialScrollIndex = useMemo(
    () => Math.max(Math.min(initPage - 1, data.length - 1), 0),
    [initPage, data.length]
  );

  useImperativeHandle(ref, () => ({
    scrollToIndex: (index: number, animated = true) => {
      flatListRef.current?.scrollToIndex({ index, animated });
    },
  }));

  const HandleViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (!viewableItems || viewableItems.length <= 0) {
      return;
    }
    const last = viewableItems[viewableItems.length - 1];
    onPageChangeRef.current && onPageChangeRef.current(last.index + 1);
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
            onImageLoad && onImageLoad(uri, index);
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
    [headers, onImageLoad]
  );
  const renderHorizontalItem = useCallback(
    ({ item, index }: ListRenderItemInfo<(typeof data)[0]>) => {
      const { uri, needUnscramble } = item;

      return (
        <Controller horizontal onTap={onTap} onLongPress={onLongPress}>
          <ComicImage
            horizontal
            useJMC={needUnscramble}
            uri={uri}
            headers={headers}
            onSuccess={() => {
              onImageLoad && onImageLoad(uri, index);
            }}
          />
        </Controller>
      );
    },
    [headers, onTap, onLongPress, onImageLoad]
  );

  if (horizontal) {
    return (
      <FlatList
        w="full"
        h="full"
        ref={flatListRef}
        data={data}
        inverted={inverted}
        horizontal
        pagingEnabled
        initialScrollIndex={initialScrollIndex}
        windowSize={5}
        initialNumToRender={1}
        maxToRenderPerBatch={5}
        onEndReached={onLoadMore}
        onEndReachedThreshold={5}
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
    );
  }

  return (
    <Controller onTap={onTap} onLongPress={onLongPress}>
      <FlatList
        w="full"
        h="full"
        ref={flatListRef}
        data={data}
        inverted={inverted}
        windowSize={5}
        initialNumToRender={1}
        maxToRenderPerBatch={5}
        onEndReached={onLoadMore}
        onEndReachedThreshold={5}
        onViewableItemsChanged={HandleViewableItemsChanged}
        renderItem={renderVerticalItem}
        keyExtractor={(item) => item.uri}
        ListHeaderComponent={<Box height={0} safeAreaTop />}
        ListFooterComponent={<Box height={0} safeAreaBottom />}
      />
    </Controller>
  );
};

export default memo(forwardRef(Reader));
