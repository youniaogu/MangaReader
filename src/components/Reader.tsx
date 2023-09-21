import React, {
  memo,
  useRef,
  useMemo,
  useCallback,
  useImperativeHandle,
  forwardRef,
  ForwardRefRenderFunction,
} from 'react';
import { FlashList, ListRenderItemInfo, ViewToken } from '@shopify/flash-list';
import { LayoutMode, PositionX } from '~/utils';
import { useFocusEffect } from '@react-navigation/native';
import { useDimensions } from '~/hooks';
import { Box, Flex } from 'native-base';
import Controller, { LongPressController } from '~/components/Controller';
import ComicImage, { ImageState } from '~/components/ComicImage';

export interface ReaderProps {
  initPage?: number;
  inverted?: boolean;
  layoutMode?: LayoutMode;
  data?: {
    uri: string;
    needUnscramble?: boolean | undefined;
    pre: number;
    current: number;
    chapterHash: string;
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
}

const useTakeTwo = (data: Required<ReaderProps>['data'], size = 2) => {
  return useMemo(() => {
    const list: Required<ReaderProps>['data']['0'][][] = [];

    for (let i = 0; i < data.length - 1; i = i + size) {
      list.push(data.slice(i, i + size));
    }

    return list;
  }, [data, size]);
};

const Reader: ForwardRefRenderFunction<ReaderRef, ReaderProps> = (
  {
    initPage = 0,
    inverted = false,
    layoutMode = LayoutMode.Horizontal,
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
  const multipleData = useTakeTwo(data);
  const flashListRef = useRef<FlashList<any>>(null);
  const horizontalStateRef = useRef<ImageState[]>([]);
  const verticalStateRef = useRef<ImageState[]>([]);
  const multipleStateRef = useRef<ImageState[][]>([]);

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
        multipleStateRef.current = [];
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
      multipleStateRef.current = [];
    },
  }));

  // https://github.com/Shopify/flash-list/issues/637
  // onViewableItemsChanged is bound in constructor and do not get updated when those props change
  const HandleViewableItemsChanged = ({
    viewableItems,
  }: {
    viewableItems: ViewToken[];
    changed: ViewToken[];
  }) => {
    if (!viewableItems || viewableItems.length <= 0) {
      return;
    }

    if (layoutMode === LayoutMode.Multiple) {
      onPageChangeRef.current &&
        onPageChangeRef.current(viewableItems[viewableItems.length - 1].item[0].current - 1);
    } else {
      onPageChangeRef.current &&
        onPageChangeRef.current(viewableItems[viewableItems.length - 1].index || 0);
    }
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
          uri={uri}
          index={index}
          useJMC={needUnscramble}
          headers={headers}
          prevState={horizontalState}
          layoutMode={LayoutMode.Horizontal}
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
            layoutMode={LayoutMode.Vertical}
            onChange={(state, idx = index) => {
              verticalStateRef.current[idx] = state;
              onImageLoad && onImageLoad(uri, item.chapterHash, item.current);
            }}
          />
        </Controller>
      </Box>
    );
  };
  const renderMultipleItem = ({ item, index }: ListRenderItemInfo<(typeof multipleData)[0]>) => {
    return (
      <Controller horizontal onTap={onTap}>
        <Flex
          w={windowWidth}
          h={windowHeight}
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
        >
          {item.map(({ uri, needUnscramble, chapterHash, current }, i) => {
            const multipleState = (multipleStateRef.current[index] || [])[i];
            return (
              <Box key={uri}>
                <LongPressController
                  onLongPress={() =>
                    onLongPress && onLongPress(PositionX.Mid, multipleState.dataUrl)
                  }
                >
                  <ComicImage
                    uri={uri}
                    index={index}
                    useJMC={needUnscramble}
                    headers={headers}
                    prevState={multipleState}
                    layoutMode={LayoutMode.Multiple}
                    onChange={(state, idx = index) => {
                      if (!Array.isArray(multipleStateRef.current[idx])) {
                        multipleStateRef.current[idx] = [];
                      }
                      multipleStateRef.current[idx][i] = state;
                      onImageLoad && onImageLoad(uri, chapterHash, current);
                    }}
                  />
                </LongPressController>
              </Box>
            );
          })}
        </Flex>
      </Controller>
    );
  };

  if (layoutMode === LayoutMode.Multiple) {
    return (
      <FlashList
        ref={flashListRef}
        data={multipleData}
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
        renderItem={renderMultipleItem}
        keyExtractor={(item) => item.map((i) => i.uri).join('#')}
      />
    );
  }

  if (layoutMode === LayoutMode.Horizontal) {
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
