import React, { useRef, useMemo, useState, useCallback, Fragment } from 'react';
import {
  AsyncStatus,
  Volume,
  LayoutMode,
  LightSwitch,
  ReaderDirection,
  PositionX,
  Orientation,
  ScrambleType,
  MultipleSeat,
  Hearing,
  Timer,
  Animated,
} from '~/utils';
import Cache from '~/utils/cache';
import {
  Box,
  Text,
  Flex,
  Center,
  HStack,
  Stagger,
  StatusBar,
  useToast,
  useDisclose,
} from 'native-base';
import { usePrevNext, useVolumeUpDown, useDebouncedSafeAreaFrame, useInterval } from '~/hooks';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { useFocusEffect } from '@react-navigation/native';
import PageSlider, { PageSliderRef } from '~/components/PageSlider';
import Reader, { ReaderRef } from '~/components/Reader';
import ActionsheetSelect from '~/components/ActionsheetSelect';
import ErrorWithRetry from '~/components/ErrorWithRetry';
import SpinLoading from '~/components/SpinLoading';
import InputModal from '~/components/InputModal';
import VectorIcon from '~/components/VectorIcon';
import Empty from '~/components/Empty';

const {
  loadChapter,
  viewChapter,
  viewPage,
  viewImage,
  setMode,
  setDirection,
  setLight,
  setSeat,
  setHearing,
  setTimer,
  setTimerGap,
  setAnimated,
  saveImage,
} = action;
const lastPageToastId = 'LAST_PAGE_TOAST_ID';
const ImageSelectOptions = [{ label: '保存图片', value: 'save' }];
const layoutIconDict = {
  [LayoutMode.Horizontal]: 'book-open-page-variant-outline',
  [LayoutMode.Vertical]: 'filmstrip',
  [LayoutMode.Multiple]: 'book-open-outline',
};

const useChapterFlat = (hashList: string[], dict: RootState['dict']['chapter']) => {
  return useMemo(() => {
    const list: {
      uri: string;
      scrambleType?: ScrambleType;
      needUnscramble?: boolean | undefined;
      pre: number;
      multiplePre: number;
      current: number;
      chapterHash: string;
    }[] = [];

    hashList.forEach((hash) => {
      const chapter = dict[hash];
      const images = chapter?.images || [];
      const pre = list.length;
      const multiplePre =
        list.length > 0
          ? list[list.length - 1].multiplePre + Math.ceil(list[list.length - 1].current / 2)
          : 0;
      images.forEach((item, index) =>
        list.push({ ...item, pre, multiplePre, current: index + 1, chapterHash: hash })
      );
    });

    return list;
  }, [hashList, dict]);
};

const Chapter = ({ route, navigation }: StackChapterProps) => {
  const { mangaHash, chapterHash: initChapterHash, page: initPage } = route.params || {};
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { isOpen, onOpen, onClose } = useDisclose();
  const { isOpen: isStaggerOpen, onOpen: onStaggerOpen, onClose: onStaggerClose } = useDisclose();
  const {
    isOpen: isTimerGapOpen,
    onOpen: onTimerGapOpen,
    onClose: onTimerGapClose,
  } = useDisclose();
  const [page, setPage] = useState(initPage - 1);
  const [showExtra, setShowExtra] = useState(false);
  const [timerSwitch, setTimerSwitch] = useState(true);
  const [chapterHash, setChapterHash] = useState(initChapterHash);
  const [hashList, setHashList] = useState([initChapterHash]);

  const { orientation } = useDebouncedSafeAreaFrame();
  const loadStatus = useAppSelector((state) => state.chapter.loadStatus);
  const seat = useAppSelector((state) => state.setting.seat);
  const mode = useAppSelector((state) => state.setting.mode);
  const light = useAppSelector((state) => state.setting.light);
  const timer = useAppSelector((state) => state.setting.timer);
  const timerGap = useAppSelector((state) => state.setting.timerGap);
  const animated = useAppSelector((state) => state.setting.animated);
  const hearing = useAppSelector((state) => state.setting.hearing);
  const direction = useAppSelector((state) => state.setting.direction);
  const mangaDict = useAppSelector((state) => state.dict.manga);
  const chapterDict = useAppSelector((state) => state.dict.chapter);

  const inverted = useMemo(
    () => mode !== LayoutMode.Vertical && direction === ReaderDirection.Left,
    [mode, direction]
  );
  const chapterList = useMemo(() => mangaDict[mangaHash]?.chapters || [], [mangaDict, mangaHash]);
  const data = useChapterFlat(hashList, chapterDict);
  const { pre, current, multiplePre } = useMemo(
    () => data[page] || { pre: 0, current: 0, multiplePre: 0 },
    [page, data]
  );
  const { title, headers, max } = useMemo(() => {
    const chapter = chapterDict[chapterHash];
    return {
      title: chapter?.title || '',
      headers: chapter?.headers || {},
      max: (chapter?.images || []).length,
    };
  }, [chapterDict, chapterHash]);
  const { lightOn, color, bg } = useMemo(
    () => ({
      lightOn: light === LightSwitch.On,
      color: light === LightSwitch.On ? 'black' : 'white',
      bg: light === LightSwitch.On ? 'white' : 'black',
    }),
    [light]
  );
  const [prev, next] = usePrevNext(chapterList, chapterHash);
  const [, more] = usePrevNext(chapterList, hashList[hashList.length - 1]);
  const readerRef = useRef<ReaderRef>(null);
  const pageSliderRef = useRef<PageSliderRef>(null);
  const callbackRef = useRef<(type: Volume) => void>();
  const sourceRef = useRef('');
  const [render, setRender] = useState(false);
  const cache = useMemo(() => new Cache(mangaHash), [mangaHash]);

  callbackRef.current = (type) => {
    if (type === Volume.Down) {
      handleNextPage();
    }
    if (type === Volume.Up) {
      handlePrevPage();
    }
  };

  useFocusEffect(
    useCallback(() => {
      dispatch(viewChapter({ mangaHash, chapterHash, chapterTitle: title }));
    }, [dispatch, mangaHash, chapterHash, title])
  );
  useFocusEffect(
    useCallback(() => {
      if (data.length <= 0) {
        dispatch(loadChapter({ chapterHash }));
      }
    }, [dispatch, chapterHash, data.length])
  );
  useFocusEffect(
    useCallback(() => {
      dispatch(viewPage({ mangaHash, page: current }));
    }, [current, dispatch, mangaHash])
  );
  const init = useCallback(async () => {
    setRender(false);
    try {
      await cache.initCacheMap();
    } catch (error) {
    } finally {
      setRender(true);
    }
  }, [cache]);
  useFocusEffect(
    useCallback(() => {
      init();
      return () => {
        cache.storeCacheMap();
      };
    }, [init, cache])
  );
  useVolumeUpDown(
    useCallback((type) => callbackRef.current && callbackRef.current(type), []),
    hearing === Hearing.Enable
  );
  useInterval(
    useCallback(() => callbackRef.current && callbackRef.current(Volume.Down), []),
    timer === Timer.Enable && timerSwitch,
    timerGap
  );

  const handlePrevPage = () => {
    if (mode !== LayoutMode.Multiple) {
      readerRef.current?.scrollToIndex(Math.max(page - 1, 0), animated === Animated.Enable);
    } else {
      readerRef.current?.scrollToIndex(
        Math.max(multiplePre + Math.ceil(current / 2) - 2, 0),
        animated === Animated.Enable
      );
    }
  };
  const handleNextPage = () => {
    if (mode !== LayoutMode.Multiple) {
      readerRef.current?.scrollToIndex(
        Math.min(page + 1, Math.max(data.length - 1, 0)),
        animated === Animated.Enable
      );
    } else {
      const multipleMax = data[data.length - 1].multiplePre + data[data.length - 1].current;
      readerRef.current?.scrollToIndex(
        Math.min(multiplePre + Math.ceil(current / 2), Math.max(multipleMax - 1, 0)),
        animated === Animated.Enable
      );
    }
  };
  const handlePrevChapter = () => {
    if (prev) {
      setChapterHash(prev.hash);
      setHashList([prev.hash]);
      setPage(0);
      pageSliderRef.current?.changePage(1);
      readerRef.current?.clearStateRef();
      readerRef.current?.scrollToIndex(0, false);
    } else {
      toast.show({ title: '第一话' });
    }
  };
  const handleNextChapter = () => {
    if (next) {
      setChapterHash(next.hash);
      setHashList([next.hash]);
      setPage(0);
      pageSliderRef.current?.changePage(1);
      readerRef.current?.clearStateRef();
      readerRef.current?.scrollToIndex(0, false);
    } else {
      toast.show({ title: '最后一话' });
    }
  };
  const handleTap = (position: PositionX) => {
    if (position === PositionX.Mid) {
      setShowExtra(!showExtra);
      showExtra && onStaggerClose();
    }
    if (inverted) {
      if (position === PositionX.Right) {
        handlePrevPage();
      }
      if (position === PositionX.Left) {
        handleNextPage();
      }
    } else {
      if (position === PositionX.Left) {
        handlePrevPage();
      }
      if (position === PositionX.Right) {
        handleNextPage();
      }
    }
  };
  const handleLongPress = (position: PositionX, source?: string) => {
    if (position === PositionX.Mid) {
      sourceRef.current = source || '';
      onOpen();
    }
    if (inverted) {
      if (position === PositionX.Right) {
        handlePrevChapter();
      }
      if (position === PositionX.Left) {
        handleNextChapter();
      }
    } else {
      if (position === PositionX.Left) {
        handlePrevChapter();
      }
      if (position === PositionX.Right) {
        handleNextChapter();
      }
    }
  };
  const handleImageLoad = (_uri: string, hash: string, index: number) => {
    dispatch(viewImage({ chapterHash: hash, index }));
  };
  const handlePageChange = (newPage: number) => {
    const image = data[newPage];
    if (newPage >= data.length - 1 && !next && !toast.isActive(lastPageToastId)) {
      toast.show({ id: lastPageToastId, title: '最后一页' });
    }

    setChapterHash(image.chapterHash);
    setPage(newPage);
    pageSliderRef.current?.changePage(image.current);
  };
  const handleLoadMore = () => {
    if (more && !hashList.includes(more.hash)) {
      setHashList([...hashList, more.hash]);
      !chapterDict[more.hash] && dispatch(loadChapter({ chapterHash: more.hash }));
    }
  };

  const handleImageSave = () => {
    if (sourceRef.current !== '') {
      dispatch(saveImage({ source: sourceRef.current, headers }));
    } else {
      toast.show({ title: '保存失败' });
    }
  };

  const handleGoBack = () => navigation.goBack();
  const handleSeatToggle = () => {
    if (seat === MultipleSeat.AToB) {
      toast.show({ title: '双页漫画顺序: 从右向左' });
      dispatch(setSeat(MultipleSeat.BToA));
    } else {
      toast.show({ title: '双页漫画顺序: 从左向右' });
      dispatch(setSeat(MultipleSeat.AToB));
    }
  };
  const handleHearingToggle = () => {
    if (hearing === Hearing.Enable) {
      toast.show({ title: '已关闭音量翻页' });
      dispatch(setHearing(Hearing.Disabled));
    } else {
      toast.show({ title: '已开启音量翻页' });
      dispatch(setHearing(Hearing.Enable));
    }
  };
  const handleTimerToggle = () => {
    if (timer === Timer.Enable) {
      toast.show({ title: '已关闭定时翻页' });
      dispatch(setTimer(Timer.Disabled));
    } else {
      toast.show({ title: `已开启定时翻页，间隔${(timerGap / 1000).toFixed(1)}s` });
      dispatch(setTimer(Timer.Enable));
    }
  };
  const handleAnimatedToggle = () => {
    if (animated === Animated.Enable) {
      toast.show({ title: '已关闭翻页动画' });
      dispatch(setAnimated(Animated.Disabled));
    } else {
      toast.show({ title: '已开启翻页动画' });
      dispatch(setAnimated(Animated.Enable));
    }
  };
  const handleOrientationToggle = () =>
    navigation.setOptions({
      orientation: orientation === Orientation.Portrait ? 'landscape_right' : 'portrait',
    });
  const handleReload = () => {
    setChapterHash(chapterHash);
    setHashList([chapterHash]);
    readerRef.current?.clearStateRef();
    dispatch(loadChapter({ chapterHash }));
  };
  const handleLightToggle = () => dispatch(setLight(lightOn ? LightSwitch.Off : LightSwitch.On));
  const handleDirectionToggle = () => {
    if (inverted) {
      toast.show({ title: '阅读方向: 从左向右' });
      dispatch(setDirection(ReaderDirection.Right));
    } else {
      toast.show({ title: '阅读方向: 从右向左' });
      dispatch(setDirection(ReaderDirection.Left));
    }
  };
  const handleModeToggle = () => {
    switch (mode) {
      case LayoutMode.Horizontal: {
        handleVertical();
        break;
      }
      case LayoutMode.Vertical: {
        handleMultiple();
        break;
      }
      case LayoutMode.Multiple:
      default: {
        handleHorizontal();
        break;
      }
    }
  };
  const handleVertical = () => {
    toast.show({ title: '条漫模式' });
    readerRef.current?.scrollToIndex(page, false);
    dispatch(setMode(LayoutMode.Vertical));
  };
  const handleHorizontal = () => {
    toast.show({ title: '翻页模式' });
    dispatch(setMode(LayoutMode.Horizontal));
  };
  const handleMultiple = () => {
    toast.show({ title: '双页模式' });
    readerRef.current?.scrollToIndex(multiplePre + Math.ceil(current / 2) - 1, false);
    dispatch(setMode(LayoutMode.Multiple));
  };
  const handleTimerGapOpen = () => {
    dispatch(setTimer(Timer.Disabled));
    onTimerGapOpen();
  };
  const handleTimerGapClose = (value: string) => {
    const gap = Number(value);

    if (gap >= 500) {
      dispatch(setTimerGap(gap));
      onTimerGapClose();
    } else {
      toast.show({ title: '间隔不能低于500ms' });
    }
  };
  const handleSliderChangeEnd = (newStep: number) => {
    const newPage = pre + Math.floor(newStep - 1);
    const multiplePage = multiplePre + Math.floor((newStep - 1) / 2);
    if (newStep > max - 5) {
      handleLoadMore();
    }
    setPage(newPage);
    readerRef.current?.scrollToIndex(mode !== LayoutMode.Multiple ? newPage : multiplePage, false);
  };

  if (data.length <= 0) {
    if (loadStatus === AsyncStatus.Pending) {
      return (
        <Center w="full" h="full" bg={bg}>
          <SpinLoading color={color} />
        </Center>
      );
    }
    if (loadStatus === AsyncStatus.Fulfilled) {
      return <Empty bg={bg} color={color} text="该章节是空的" onPress={handleReload} />;
    }
    if (loadStatus === AsyncStatus.Rejected) {
      return (
        <Center w="full" h="full" bg={bg}>
          <ErrorWithRetry color={color} onRetry={handleReload} />
        </Center>
      );
    }
  }

  return (
    <Box w="full" h="full" bg={bg}>
      <StatusBar
        backgroundColor={bg}
        barStyle={
          showExtra
            ? lightOn
              ? 'dark-content'
              : 'light-content'
            : lightOn
            ? 'light-content'
            : 'dark-content'
        }
      />
      {render && (
        <Reader
          key={orientation}
          ref={readerRef}
          data={data}
          headers={headers}
          initPage={page}
          inverted={inverted}
          seat={seat}
          layoutMode={mode}
          onTap={handleTap}
          onLongPress={handleLongPress}
          onImageLoad={handleImageLoad}
          onPageChange={handlePageChange}
          onLoadMore={handleLoadMore}
          onScrollBeginDrag={() => setTimerSwitch(false)}
          onScrollEndDrag={() => setTimerSwitch(true)}
          onZoomStart={(scale) => setTimerSwitch(scale <= 1)}
          onZoomEnd={(scale) => setTimerSwitch(scale <= 1)}
          cache={cache}
        />
      )}
      <ActionsheetSelect
        isOpen={isOpen}
        onClose={onClose}
        options={ImageSelectOptions}
        onChange={(value) => {
          if (value === 'save') {
            handleImageSave();
          }
        }}
      />
      <InputModal
        title="自动翻页间隔："
        rightAddon="ms"
        isOpen={isTimerGapOpen}
        keyboardType="number-pad"
        defaultValue={timerGap.toString()}
        onClose={handleTimerGapClose}
      />

      {showExtra && (
        <Fragment>
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            safeAreaTop
            safeAreaLeft
            safeAreaRight
          >
            <Flex position="relative" flexDirection="row" alignItems="center">
              <VectorIcon
                name="arrow-back"
                size="2xl"
                shadow="icon"
                color={color}
                onPress={handleGoBack}
              />
              <Text
                flexShrink={1}
                shadow="icon"
                fontSize="md"
                fontWeight="bold"
                numberOfLines={1}
                color={color}
              >
                {title}
              </Text>
              <VectorIcon
                name="replay"
                size="md"
                shadow="icon"
                color={color}
                onPress={handleReload}
              />

              <Box w={0} flexGrow={1} />

              <VectorIcon
                name={
                  orientation === Orientation.Portrait
                    ? 'stay-primary-portrait'
                    : 'stay-primary-landscape'
                }
                size="lg"
                shadow="icon"
                color={color}
                onPress={handleOrientationToggle}
              />
              <VectorIcon
                name="lightbulb"
                size="lg"
                shadow="icon"
                color={color}
                onPress={handleLightToggle}
              />
              <Text shadow="icon" px={1} color={color} fontWeight="bold">
                {current} / {max}
              </Text>
              <VectorIcon
                name="dots-horizontal"
                size="lg"
                shadow="icon"
                source="materialCommunityIcons"
                color={color}
                onPress={isStaggerOpen ? onStaggerClose : onStaggerOpen}
              />

              <Box position="absolute" right={0} top="100%">
                <Stagger visible={isStaggerOpen} initial={{ opacity: 0, scale: 0 }}>
                  <HStack>
                    <VectorIcon
                      name={layoutIconDict[mode]}
                      size="lg"
                      shadow="icon"
                      source="materialCommunityIcons"
                      color={color}
                      onPress={handleModeToggle}
                    />
                    {mode !== LayoutMode.Vertical ? (
                      <VectorIcon
                        name={inverted ? 'west' : 'east'}
                        size="lg"
                        shadow="icon"
                        color={color}
                        onPress={handleDirectionToggle}
                      />
                    ) : (
                      <Box />
                    )}
                    {mode === LayoutMode.Multiple ? (
                      <VectorIcon
                        name={
                          seat === MultipleSeat.AToB
                            ? 'format-letter-starts-with'
                            : 'format-letter-ends-with'
                        }
                        size="lg"
                        source="materialCommunityIcons"
                        shadow="icon"
                        color={color}
                        onPress={handleSeatToggle}
                      />
                    ) : (
                      <Box />
                    )}
                    <VectorIcon
                      name={hearing === Hearing.Enable ? 'earbuds-outline' : 'earbuds-off-outline'}
                      size="lg"
                      shadow="icon"
                      source="materialCommunityIcons"
                      color={color}
                      onPress={handleHearingToggle}
                    />
                    <VectorIcon
                      name={timer === Timer.Enable ? 'timer-outline' : 'timer-off-outline'}
                      size="lg"
                      shadow="icon"
                      source="materialCommunityIcons"
                      color={color}
                      onPress={handleTimerToggle}
                      onLongPress={handleTimerGapOpen}
                    />
                    <VectorIcon
                      name={
                        animated === Animated.Enable
                          ? 'arrow-left-right-bold'
                          : 'arrow-horizontal-lock'
                      }
                      size="lg"
                      shadow="icon"
                      source="materialCommunityIcons"
                      color={color}
                      onPress={handleAnimatedToggle}
                    />
                  </HStack>
                </Stagger>
              </Box>
            </Flex>
          </Box>

          <Flex
            position="absolute"
            left={0}
            right={0}
            bottom={6}
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
            safeAreaX
            safeAreaBottom
          >
            {prev ? (
              <VectorIcon
                name="skip-previous"
                size="lg"
                shadow="icon"
                color={color}
                onPress={handlePrevChapter}
              />
            ) : (
              <Box w={45} />
            )}
            <PageSlider
              mx={1}
              flex={1}
              ref={pageSliderRef}
              max={max}
              defaultValue={current}
              onSliderChangeEnd={handleSliderChangeEnd}
            />
            {next ? (
              <VectorIcon
                name="skip-next"
                size="lg"
                shadow="icon"
                color={color}
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

export default Chapter;
