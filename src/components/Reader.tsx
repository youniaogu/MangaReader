import React, {
  memo,
  useRef,
  useMemo,
  useCallback,
  useImperativeHandle,
  forwardRef,
  ForwardRefRenderFunction,
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
  clearStateRef: () => void;
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

  const onTapRef = useRef(onTap);
  const onLongPressRef = useRef(onLongPress);
  const onPageChangeRef = useRef(onPageChange);
  onTapRef.current = onTap;
  onLongPressRef.current = onLongPress;
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
    clearStateRef: () => {
      horizontalStateRef.current = [];
      verticalStateRef.current = [];
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
  const renderHorizontalItem = ({ item, index }: ListRenderItemInfo<(typeof data)[0]>) => {
    const { uri, needUnscramble } = item;
    const horizontalState = horizontalStateRef.current[index];
    const verticalState = verticalStateRef.current[index];
    return (
      <Controller
        horizontal
        onTap={(position) => {
          onTapRef.current && onTapRef.current(position);
        }}
        onLongPress={(position) => {
          onLongPressRef.current && onLongPressRef.current(position);
        }}
      >
        <ComicImage
          horizontal
          uri={uri}
          index={index}
          useJMC={needUnscramble}
          headers={headers}
          prevState={horizontal ? horizontalState : verticalState}
          onChange={(state, idx = index) => {
            if (horizontal) {
              horizontalStateRef.current[idx] = state;
            } else {
              verticalStateRef.current[idx] = state;
            }
            onImageLoad && onImageLoad(uri, item.chapterHash, item.current);
          }}
        />
      </Controller>
    );
  };
  const renderVerticalItem = ({ item, index }: ListRenderItemInfo<(typeof data)[0]>) => {
    const { uri, needUnscramble } = item;
    const horizontalState = horizontalStateRef.current[index];
    const verticalState = verticalStateRef.current[index];
    return (
      <ComicImage
        uri={uri}
        index={index}
        useJMC={needUnscramble}
        headers={headers}
        prevState={horizontal ? horizontalState : verticalState}
        onChange={(state, idx = index) => {
          if (horizontal) {
            horizontalStateRef.current[idx] = state;
          } else {
            verticalStateRef.current[idx] = state;
          }
          onImageLoad && onImageLoad(uri, item.chapterHash, item.current);
        }}
      />
    );
  };

  if (horizontal) {
    return (
      <FlashList
        ref={flashListRef}
        data={data}
        inverted={inverted}
        horizontal
        pagingEnabled
        initialScrollIndex={initialScrollIndex}
        estimatedItemSize={windowWidth}
        onEndReached={onLoadMore}
        onEndReachedThreshold={5}
        onViewableItemsChanged={HandleViewableItemsChanged}
        renderItem={renderHorizontalItem}
        keyExtractor={(item) => item.uri}
      />
    );
  }

  return (
    <Controller onTap={onTap} onLongPress={onLongPress}>
      <FlashList
        ref={flashListRef}
        data={data}
        inverted={inverted}
        estimatedItemSize={(windowHeight * 3) / 5}
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
