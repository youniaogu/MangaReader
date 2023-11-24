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
} from '~/utils';
import { Box, Text, Flex, Center, StatusBar, useToast, useDisclose, Stagger } from 'native-base';
import { useOnce, usePrevNext, useVolumeUpDown, useDimensions } from '~/hooks';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { useFocusEffect } from '@react-navigation/native';
import PageSlider, { PageSliderRef } from '~/components/PageSlider';
import Reader, { ReaderRef } from '~/components/Reader';
import ActionsheetSelect from '~/components/ActionsheetSelect';
import ErrorWithRetry from '~/components/ErrorWithRetry';
import SpinLoading from '~/components/SpinLoading';
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
  const [page, setPage] = useState(initPage - 1);
  const [showExtra, setShowExtra] = useState(false);
  const [chapterHash, setChapterHash] = useState(initChapterHash);
  const [hashList, setHashList] = useState([initChapterHash]);

  const { orientation } = useDimensions();
  const loadStatus = useAppSelector((state) => state.chapter.loadStatus);
  const loadingChapterHash = useAppSelector((state) => state.chapter.loadingChapterHash);
  const seat = useAppSelector((state) => state.setting.seat);
  const mode = useAppSelector((state) => state.setting.mode);
  const light = useAppSelector((state) => state.setting.light);
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
  const { pre, current, multiplePre } = useMemo(() => data[page] || {}, [page, data]);
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
  useOnce(() => {
    if (data.length <= 0) {
      dispatch(loadChapter({ chapterHash }));
    }
  });
  useFocusEffect(
    useCallback(() => {
      dispatch(viewPage({ mangaHash, page: current }));
    }, [current, dispatch, mangaHash])
  );
  useVolumeUpDown(
    useCallback((type) => callbackRef.current && callbackRef.current(type), []),
    hearing === Hearing.Enable
  );

  const handlePrevPage = () => {
    if (mode !== LayoutMode.Multiple) {
      readerRef.current?.scrollToIndex(Math.max(page - 1, 0));
    } else {
      readerRef.current?.scrollToIndex(Math.max(multiplePre + Math.ceil(current / 2) - 2, 0));
    }
  };
  const handleNextPage = () => {
    if (mode !== LayoutMode.Multiple) {
      readerRef.current?.scrollToIndex(Math.min(page + 1, Math.max(data.length - 1, 0)));
    } else {
      const multipleMax = data[data.length - 1].multiplePre + data[data.length - 1].current;
      readerRef.current?.scrollToIndex(
        Math.min(multiplePre + Math.ceil(current / 2), Math.max(multipleMax - 1, 0))
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
  const handleLongPress = (position: PositionX, source: string) => {
    if (position === PositionX.Mid) {
      sourceRef.current = source;
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
      toast.show({ title: '已关闭音量上下翻页' });
      dispatch(setHearing(Hearing.Disabled));
    } else {
      toast.show({ title: '已开启音量上下翻页' });
      dispatch(setHearing(Hearing.Enable));
    }
  };
  const handleOrientationToggle = () =>
    navigation.setOptions({
      orientation: orientation === Orientation.Portrait ? 'landscape_right' : 'portrait',
    });
  const handleReload = () => dispatch(loadChapter({ chapterHash }));
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
  const handleSliderChangeEnd = (newStep: number) => {
    const newPage = pre + Math.floor(newStep - 1);
    const multiplePage = multiplePre + Math.floor((newStep - 1) / 2);
    if (newStep > max - 5) {
      handleLoadMore();
    }
    setPage(newPage);
    readerRef.current?.scrollToIndex(mode !== LayoutMode.Multiple ? newPage : multiplePage, false);
  };

  if (loadStatus === AsyncStatus.Pending && chapterHash === loadingChapterHash) {
    return (
      <Center w="full" h="full" bg={bg}>
        <SpinLoading color={color} />
      </Center>
    );
  }
  if (
    loadStatus === AsyncStatus.Fulfilled &&
    chapterHash === loadingChapterHash &&
    data.length <= 0
  ) {
    return <Empty bg={bg} color={color} text="该章节是空的" onPress={handleReload} />;
  }
  if (loadStatus === AsyncStatus.Rejected) {
    return (
      <Center w="full" h="full" bg={bg}>
        <ErrorWithRetry color={color} onRetry={handleReload} />
      </Center>
    );
  }
  if (data.length <= 0) {
    return null;
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
      />

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
                    name={hearing === Hearing.Enable ? 'earbuds' : 'earbuds-off'}
                    size="lg"
                    shadow="icon"
                    source="materialCommunityIcons"
                    color={color}
                    onPress={handleHearingToggle}
                  />
                </Stagger>
              </Box>
            </Flex>
          </Box>

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
            <Box w={0} flexGrow={1} px={1}>
              <PageSlider
                ref={pageSliderRef}
                max={max}
                defaultValue={current}
                onSliderChangeEnd={handleSliderChangeEnd}
              />
            </Box>
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
