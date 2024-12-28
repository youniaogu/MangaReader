import React, {
  memo,
  useRef,
  useMemo,
  useCallback,
  useImperativeHandle,
  forwardRef,
  ForwardRefRenderFunction,
} from 'react';
import {
  getDefaultFillMedianHeight,
  LayoutMode,
  PositionX,
  ScrambleType,
  MultipleSeat,
  SafeArea,
  Orientation,
} from '~/utils';
import { FlashList, ListRenderItemInfo, ViewToken } from '@shopify/flash-list';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useDebouncedSafeAreaFrame } from '~/hooks';
import { useFocusEffect } from '@react-navigation/native';
import { Box, Flex } from 'native-base';
import Controller, { LongPressController } from '~/components/Controller';
import ComicImage, { ImageState } from '~/components/ComicImage';
import Cache from '~/utils/cache';

export interface ReaderProps {
  initPage?: number;
  inverted?: boolean;
  seat?: MultipleSeat;
  layoutMode?: LayoutMode;
  data?: {
    uri: string;
    scrambleType?: ScrambleType;
    needUnscramble?: boolean | undefined;
    pre: number;
    current: number;
    chapterHash: string;
    isBase64Image?: boolean;
  }[];
  headers?: Chapter['headers'];
  onTap?: (position: PositionX) => void;
  onLongPress?: (position: PositionX, source?: string) => void;
  onImageLoad?: (uri: string, hash: string, index: number) => void;
  onPageChange?: (page: number) => void;
  onLoadMore?: () => void;
  onZoomStart?: (scale: number) => void;
  onZoomEnd?: (scale: number) => void;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollBeginDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollEndDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  cache: Cache;
}

export interface ReaderRef {
  scrollToIndex: (index: number, animated?: boolean) => void;
  scrollToOffset: (offset: number, animated?: boolean) => void;
  clearStateRef: () => void;
}

const useTakeTwo = (data: Required<ReaderProps>['data'], size = 2, seat: MultipleSeat) => {
  return useMemo(() => {
    const list: Required<ReaderProps>['data']['0'][][] = [];

    for (let i = 0; i < data.length; ) {
      const batch = data.slice(i, i + size).reduce<typeof data>((dict, item) => {
        if (dict.length <= 0) {
          dict.push(item);
        } else if (dict[0].chapterHash === item.chapterHash) {
          dict.push(item);
        }
        return dict;
      }, []);

      list.push(seat === MultipleSeat.AToB ? batch : batch.reverse());
      i += batch.length;
    }

    return list;
  }, [data, size, seat]);
};

const Reader: ForwardRefRenderFunction<ReaderRef, ReaderProps> = (
  {
    initPage = 0,
    inverted = false,
    seat = MultipleSeat.AToB,
    layoutMode = LayoutMode.Horizontal,
    data = [],
    headers = {},
    onTap,
    onLongPress,
    onImageLoad,
    onPageChange,
    onLoadMore,
    onZoomStart,
    onZoomEnd,
    onScroll,
    onScrollBeginDrag,
    onScrollEndDrag,
    cache,
  },
  ref
) => {
  const { width: windowWidth, height: windowHeight, orientation } = useDebouncedSafeAreaFrame();
  const multipleData = useTakeTwo(data, 2, seat);
  const flashListRef = useRef<FlashList<any>>(null);
  const horizontalStateRef = useRef<(ImageState | null)[]>([]);
  const verticalStateRef = useRef<(ImageState | null)[]>([]);
  const multipleStateRef = useRef<Record<string, ImageState | null>[]>([]);

  const portraitHeight = (Math.max(windowWidth, windowHeight) * 3) / 5;
  const landscapeHeight = (Math.min(windowWidth, windowHeight) * 3) / 5;
  const defaultPortraitHeightRef = useRef(portraitHeight);
  const defaultLandscapeHeightRef = useRef(landscapeHeight);

  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  const initialScrollIndex = useMemo(() => {
    if (layoutMode !== LayoutMode.Multiple) {
      return Math.max(Math.min(initPage, data.length - 1), 0);
    } else {
      return Math.max(Math.min(Math.ceil((initPage + 1) / 2) - 1, multipleData.length - 1), 0);
    }
  }, [initPage, data.length, multipleData, layoutMode]);

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

    const last = viewableItems[viewableItems.length - 1];
    onPageChangeRef.current && onPageChangeRef.current(last.index || 0);
  };
  const HandleMultipleViewableItemsChanged = ({
    viewableItems,
  }: {
    viewableItems: ViewToken[];
    changed: ViewToken[];
  }) => {
    if (!viewableItems || viewableItems.length <= 0) {
      return;
    }

    const last = viewableItems[viewableItems.length - 1];
    onPageChangeRef.current && onPageChangeRef.current(last.item[0].pre + last.item[0].current - 1);
  };
  const renderHorizontalItem = ({ item, index }: ListRenderItemInfo<(typeof data)[0]>) => {
    const { uri, scrambleType, needUnscramble, isBase64Image = false } = item;
    const horizontalState = horizontalStateRef.current[index] || undefined;
    return (
      <Controller
        horizontal
        onTap={onTap}
        onLongPress={(position) => onLongPress && onLongPress(position, horizontalState?.dataUrl)}
        onZoomStart={onZoomStart}
        onZoomEnd={onZoomEnd}
        safeAreaType={SafeArea.All}
      >
        <ComicImage
          uri={uri}
          index={index}
          scrambleType={scrambleType}
          needUnscramble={needUnscramble}
          isBase64Image={isBase64Image}
          headers={headers}
          prevState={horizontalState}
          defaultPortraitHeight={defaultPortraitHeightRef.current}
          defaultLandscapeHeight={defaultLandscapeHeightRef.current}
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
    const { uri, scrambleType, needUnscramble, isBase64Image = false } = item;
    const verticalState = verticalStateRef.current[index] || undefined;
    const cacheState = cache.getImageState(uri);
    return (
      <Box
        overflow="hidden"
        style={{
          height:
            orientation === Orientation.Portrait
              ? verticalState?.portraitHeight ||
                cacheState?.portraitHeight ||
                defaultPortraitHeightRef.current
              : verticalState?.landscapeHeight ||
                cacheState?.landscapeHeight ||
                defaultLandscapeHeightRef.current,
        }}
      >
        <Controller
          onTap={onTap}
          onLongPress={(position) => onLongPress && onLongPress(position, verticalState?.dataUrl)}
          onZoomStart={onZoomStart}
          onZoomEnd={onZoomEnd}
          safeAreaType={SafeArea.X}
        >
          <ComicImage
            uri={uri}
            index={index}
            scrambleType={scrambleType}
            needUnscramble={needUnscramble}
            isBase64Image={isBase64Image}
            headers={headers}
            prevState={verticalState}
            defaultPortraitHeight={defaultPortraitHeightRef.current}
            defaultLandscapeHeight={defaultLandscapeHeightRef.current}
            layoutMode={LayoutMode.Vertical}
            onChange={(state, idx = index) => {
              cache.setImageState(uri, state);
              verticalStateRef.current[idx] = state;
              onImageLoad && onImageLoad(uri, item.chapterHash, item.current);

              const defaultHeight = getDefaultFillMedianHeight(
                verticalStateRef.current.filter(
                  (imageState): imageState is ImageState => imageState !== null
                ),
                { portrait: portraitHeight, landscape: landscapeHeight }
              );
              defaultPortraitHeightRef.current = defaultHeight.portrait;
              defaultLandscapeHeightRef.current = defaultHeight.landscape;
            }}
          />
        </Controller>
      </Box>
    );
  };
  const renderMultipleItem = ({ item, index }: ListRenderItemInfo<(typeof multipleData)[0]>) => {
    return (
      <Controller
        horizontal
        safeAreaType={SafeArea.All}
        onTap={onTap}
        onZoomStart={onZoomStart}
        onZoomEnd={onZoomEnd}
      >
        <Flex w="full" h="full" flexDirection="row" alignItems="center" justifyContent="center">
          {item.map(
            ({
              uri,
              scrambleType,
              needUnscramble,
              chapterHash,
              current,
              isBase64Image = false,
            }) => {
              const multipleState = (multipleStateRef.current[index] || [])[uri] || undefined;
              return (
                <Box key={uri}>
                  <LongPressController
                    onLongPress={() =>
                      onLongPress && onLongPress(PositionX.Mid, multipleState?.dataUrl)
                    }
                  >
                    <ComicImage
                      uri={uri}
                      index={index}
                      scrambleType={scrambleType}
                      needUnscramble={needUnscramble}
                      isBase64Image={isBase64Image}
                      headers={headers}
                      prevState={multipleState}
                      defaultPortraitHeight={defaultPortraitHeightRef.current}
                      defaultLandscapeHeight={defaultLandscapeHeightRef.current}
                      layoutMode={LayoutMode.Multiple}
                      onChange={(state, idx = index) => {
                        if (typeof multipleStateRef.current[idx] !== 'object') {
                          multipleStateRef.current[idx] = {};
                        }
                        multipleStateRef.current[idx][uri] = state;
                        onImageLoad && onImageLoad(uri, chapterHash, current);
                      }}
                    />
                  </LongPressController>
                </Box>
              );
            }
          )}
        </Flex>
      </Controller>
    );
  };

  if (layoutMode === LayoutMode.Multiple) {
    return (
      <FlashList
        key="multiple"
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
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onEndReached={onLoadMore}
        onEndReachedThreshold={3}
        onViewableItemsChanged={HandleMultipleViewableItemsChanged}
        renderItem={renderMultipleItem}
        keyExtractor={(item) => item.map((i) => i.uri).join('#')}
      />
    );
  }

  if (layoutMode === LayoutMode.Horizontal) {
    return (
      <FlashList
        key="horizontal"
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
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
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
      key="vertical"
      ref={flashListRef}
      data={data}
      inverted={inverted}
      extraData={{ inverted, onTap, onLongPress, onImageLoad }}
      initialScrollIndex={initialScrollIndex}
      estimatedItemSize={(windowHeight * 3) / 5}
      estimatedListSize={{ width: windowWidth, height: windowHeight }}
      onScroll={onScroll}
      onScrollBeginDrag={onScrollBeginDrag}
      onScrollEndDrag={onScrollEndDrag}
      onEndReached={onLoadMore}
      onEndReachedThreshold={5}
      onViewableItemsChanged={HandleViewableItemsChanged}
      renderItem={renderVerticalItem}
      keyExtractor={(item) => item.uri}
      ListHeaderComponent={<Box height={0} safeAreaTop />}
      ListFooterComponent={<Box height={0} safeAreaBottom />}
      overrideItemLayout={(layout, item) => {
        const state = cache.getImageState(item.uri);
        if (state) {
          layout.size =
            orientation === Orientation.Portrait ? state.portraitHeight : state.landscapeHeight;
        }
      }}
    />
  );
};

export default memo(forwardRef(Reader));
