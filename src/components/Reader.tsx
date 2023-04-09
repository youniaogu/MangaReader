import React, {
  memo,
  useRef,
  useMemo,
  useImperativeHandle,
  forwardRef,
  ForwardRefRenderFunction,
  useCallback,
} from 'react';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { useFocusEffect } from '@react-navigation/native';
import { Dimensions } from 'react-native';
import { Box } from 'native-base';
import ComicImage, { ImageState } from '~/components/ComicImage';
import Controller from '~/components/Controller';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

export interface ReaderProps {
  initPage?: number;
  inverted?: boolean;
  horizontal?: boolean;
  data?: {
    uri: string;
    needUnscramble?: boolean | undefined;
    chapterHash: string;
    current: number;
  }[];
  headers?: Chapter['headers'];
  onTap?: (position: 'left' | 'mid' | 'right') => void;
  onLongPress?: (position: 'left' | 'right') => void;
  onImageLoad?: (uri: string, hash: string, index: number) => void;
  onPageChange?: (page: number) => void;
  onLoadMore?: () => void;
}

export interface ReaderRef {
  scrollToIndex: (index: number, animated?: boolean) => void;
  scrollToOffset: (offset: number, animated?: boolean) => void;
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
  const flashListRef = useRef<FlashList<(typeof data)[0]>>(null);
  const horizontalStateRef = useRef<ImageState[]>([]);
  const verticalStateRef = useRef<ImageState[]>([]);

  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  const initialScrollIndex = useMemo(
    () => Math.max(Math.min(initPage - 1, data.length - 1), 0),
    [initPage, data.length]
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        horizontalStateRef.current = [];
        verticalStateRef.current = [];
      };
    }, [])
  );

  useImperativeHandle(ref, () => ({
    scrollToIndex: (index: number, animated = true) => {
      flashListRef.current?.scrollToIndex({ index, animated });
    },
    scrollToOffset: (offset: number, animated = true) => {
      flashListRef.current?.scrollToOffset({ offset, animated });
    },
  }));

  // https://github.com/Shopify/flash-list/issues/637
  // onViewableItemsChanged is bound in constructor and do not get updated when those props change
  const HandleViewableItemsChanged = ({
    viewableItems,
  }: {
    viewableItems: {
      item: any;
      key: string;
      index: number | null;
      isViewable: boolean;
      timestamp: number;
    }[];
  }) => {
    if (!viewableItems || viewableItems.length <= 0) {
      return;
    }

    const last = viewableItems[viewableItems.length - 1];
    if (horizontal) {
      if (viewableItems.length === 1) {
        onPageChangeRef.current && onPageChangeRef.current(last.index || 0);
      }
    } else {
      onPageChangeRef.current && onPageChangeRef.current(last.index || 0);
    }
  };
  const renderItem = ({ item, index }: ListRenderItemInfo<(typeof data)[0]>) => {
    const { uri, needUnscramble } = item;
    const horizontalState = horizontalStateRef.current[index];
    const verticalState = verticalStateRef.current[index];
    return (
      <ComicImage
        uri={uri}
        horizontal={horizontal}
        useJMC={needUnscramble}
        headers={headers}
        prevState={horizontal ? horizontalState : verticalState}
        onChange={(state) => {
          if (horizontal) {
            horizontalStateRef.current[index] = state;
          } else {
            verticalStateRef.current[index] = state;
          }
          onImageLoad && onImageLoad(uri, item.chapterHash, item.current);
        }}
      />
    );
  };

  return (
    <Controller horizontal={horizontal} onTap={onTap} onLongPress={onLongPress}>
      <FlashList
        key={horizontal ? 'horizontal' : 'vertical'}
        ref={flashListRef}
        data={data}
        initialScrollIndex={horizontal ? initialScrollIndex : undefined}
        inverted={inverted}
        horizontal={horizontal}
        pagingEnabled={horizontal}
        estimatedItemSize={horizontal ? windowWidth : (windowHeight * 3) / 5}
        onEndReached={onLoadMore}
        onEndReachedThreshold={5}
        onViewableItemsChanged={HandleViewableItemsChanged}
        renderItem={renderItem}
        keyExtractor={(item) => item.uri}
        ListHeaderComponent={<Box height={0} safeAreaTop />}
        ListFooterComponent={<Box height={0} safeAreaBottom />}
      />
    </Controller>
  );
};

export default memo(forwardRef(Reader));
