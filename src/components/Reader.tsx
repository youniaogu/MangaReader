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
import { useDimensions } from '~/hooks';
import { PositionX } from '~/utils';
import { Box } from 'native-base';
import ComicImage, { ImageState } from '~/components/ComicImage';
import Controller from '~/components/Controller';

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
  onTap?: (position: PositionX) => void;
  onLongPress?: (position: PositionX, source: string) => void;
  onImageLoad?: (uri: string, hash: string, index: number) => void;
  onPageChange?: (page: number) => void;
  onLoadMore?: () => void;
}

export interface ReaderRef {
  scrollToIndex: (index: number, animated?: boolean) => void;
  scrollToOffset: (offset: number, animated?: boolean) => void;
  clearStateRef: () => void;
  getSource: (index: number, isHorizontal?: boolean) => string;
}

const Reader: ForwardRefRenderFunction<ReaderRef, ReaderProps> = (
  {
    initPage = 0,
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
  const { width: windowWidth, height: windowHeight } = useDimensions();
  const flashListRef = useRef<FlashList<(typeof data)[0]>>(null);
  const horizontalStateRef = useRef<ImageState[]>([]);
  const verticalStateRef = useRef<ImageState[]>([]);

  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  const initialScrollIndex = useMemo(
    () => Math.max(Math.min(initPage, data.length - 1), 0),
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
    getSource: (index: number, isHorizontal = false) => {
      return (isHorizontal ? horizontalStateRef : verticalStateRef).current[index].dataUrl;
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

    onPageChangeRef.current &&
      onPageChangeRef.current(viewableItems[viewableItems.length - 1].index || 0);
  };
  const renderHorizontalItem = ({ item, index }: ListRenderItemInfo<(typeof data)[0]>) => {
    const { uri, needUnscramble } = item;
    const horizontalState = horizontalStateRef.current[index];
    return (
      <Controller
        horizontal
        onTap={onTap}
        onLongPress={(position) => onLongPress && onLongPress(position, horizontalState.dataUrl)}
      >
        <ComicImage
          horizontal
          uri={uri}
          index={index}
          useJMC={needUnscramble}
          headers={headers}
          prevState={horizontalState}
          onChange={(state, idx = index) => {
            horizontalStateRef.current[idx] = state;
            onImageLoad && onImageLoad(uri, item.chapterHash, item.current);
          }}
        />
      </Controller>
    );
  };
  const renderVerticalItem = ({ item, index }: ListRenderItemInfo<(typeof data)[0]>) => {
    const { uri, needUnscramble } = item;
    const verticalState = verticalStateRef.current[index];
    return (
      <Box overflow="hidden">
        <Controller
          onTap={onTap}
          onLongPress={(position) => onLongPress && onLongPress(position, verticalState.dataUrl)}
        >
          <ComicImage
            uri={uri}
            index={index}
            useJMC={needUnscramble}
            headers={headers}
            prevState={verticalState}
            onChange={(state, idx = index) => {
              verticalStateRef.current[idx] = state;
              onImageLoad && onImageLoad(uri, item.chapterHash, item.current);
            }}
          />
        </Controller>
      </Box>
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
        extraData={{ inverted, onTap, onLongPress, onImageLoad }}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        initialScrollIndex={initialScrollIndex}
        estimatedItemSize={windowWidth}
        estimatedListSize={{ width: windowWidth, height: windowHeight }}
        onEndReached={onLoadMore}
        onEndReachedThreshold={5}
        onViewableItemsChanged={HandleViewableItemsChanged}
        renderItem={renderHorizontalItem}
        keyExtractor={(item) => item.uri}
      />
    );
  }

  return (
    <FlashList
      ref={flashListRef}
      data={data}
      inverted={inverted}
      extraData={{ inverted, onImageLoad }}
      initialScrollIndex={initialScrollIndex}
      estimatedItemSize={(windowHeight * 3) / 5}
      estimatedListSize={{ width: windowWidth, height: windowHeight }}
      onEndReached={onLoadMore}
      onEndReachedThreshold={5}
      onViewableItemsChanged={HandleViewableItemsChanged}
      renderItem={renderVerticalItem}
      keyExtractor={(item) => item.uri}
      ListHeaderComponent={<Box height={0} safeAreaTop />}
      ListFooterComponent={<Box height={0} safeAreaBottom />}
    />
  );
};

export default memo(forwardRef(Reader));
