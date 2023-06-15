import React, { useRef, useMemo, useState, useCallback, Fragment } from 'react';
import { AsyncStatus, Volume, LayoutMode, LightSwitch, ReaderDirection } from '~/utils';
import { Box, Text, Flex, Center, StatusBar, useToast } from 'native-base';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { usePrevNext, useVolumeUpDown } from '~/hooks';
import { useFocusEffect } from '@react-navigation/native';
import PageSlider, { PageSliderRef } from '~/components/PageSlider';
import Reader, { ReaderRef } from '~/components/Reader';
import ErrorWithRetry from '~/components/ErrorWithRetry';
import SpinLoading from '~/components/SpinLoading';
import VectorIcon from '~/components/VectorIcon';

const { loadChapter, viewChapter, viewPage, viewImage, setMode, setDirection, setLight } = action;
const lastPageToastId = 'LAST_PAGE_TOAST_ID';

const Chapter = ({ route, navigation }: StackChapterProps) => {
  const { mangaHash, chapterHash: initChapterHash, page: initPage } = route.params || {};
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(initPage - 1);
  const [showExtra, setShowExtra] = useState(false);
  const [chapterHash, setChapterHash] = useState(initChapterHash);
  const [hashList, setHashList] = useState([initChapterHash]);

  const loadStatus = useAppSelector((state) => state.chapter.loadStatus);
  const mode = useAppSelector((state) => state.setting.mode);
  const light = useAppSelector((state) => state.setting.light);
  const direction = useAppSelector((state) => state.setting.direction);
  const mangaDict = useAppSelector((state) => state.dict.manga);
  const chapterDict = useAppSelector((state) => state.dict.chapter);

  const inverted = useMemo(
    () => mode === LayoutMode.Horizontal && direction === ReaderDirection.Left,
    [mode, direction]
  );
  const lightOn = useMemo(() => light === LightSwitch.On, [light]);
  const horizontal = useMemo(() => mode === LayoutMode.Horizontal, [mode]);
  const chapterList = useMemo(() => mangaDict[mangaHash]?.chapters || [], [mangaDict, mangaHash]);
  const data = useMemo(() => {
    const preList = [];
    return hashList
      .map((hash) => {
        const chapter = chapterDict[hash];
        const images = chapter?.images || [];
        preList.push(...images);
        return images.map((item, index) => ({
          ...item,
          pre: preList.length - images.length,
          max: images.length,
          title: chapter?.title || '',
          headers: chapter?.headers,
          current: index + 1,
          chapterHash: hash,
        }));
      })
      .flat();
  }, [hashList, chapterDict]);
  const { pre, max, title, current, headers } = useMemo(() => data[page] || {}, [page, data]);
  const [prev, next] = usePrevNext(chapterList, chapterHash);
  const readerRef = useRef<ReaderRef>(null);
  const pageSliderRef = useRef<PageSliderRef>(null);
  const callbackRef = useRef<(type: Volume) => void>();

  callbackRef.current = (type) => {
    if (type === Volume.Down) {
      readerRef.current?.scrollToIndex(Math.min(page + 1, Math.max(data.length - 1, 0)), false);
    }
    if (type === Volume.Up) {
      readerRef.current?.scrollToIndex(Math.max(page - 1, 0), false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      dispatch(viewChapter({ mangaHash, chapterHash, chapterTitle: title }));
    }, [dispatch, mangaHash, chapterHash, title])
  );
  useFocusEffect(
    useCallback(() => {
      data.length <= 0 && dispatch(loadChapter({ chapterHash }));
    }, [data, dispatch, chapterHash])
  );
  useFocusEffect(
    useCallback(() => {
      dispatch(viewPage({ mangaHash, page: current }));
    }, [current, dispatch, mangaHash])
  );
  useVolumeUpDown(
    useCallback((type) => {
      callbackRef.current && callbackRef.current(type);
    }, [])
  );

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
  const handleTap = (position: 'left' | 'mid' | 'right') => {
    if (position === 'mid') {
      setShowExtra((value) => !value);
    }
    if (inverted) {
      if (position === 'right') {
        readerRef.current?.scrollToIndex(Math.max(page - 1, 0));
      }
      if (position === 'left') {
        readerRef.current?.scrollToIndex(Math.min(page + 1, Math.max(data.length - 1, 0)));
      }
    } else {
      if (position === 'left') {
        readerRef.current?.scrollToIndex(Math.max(page - 1, 0));
      }
      if (position === 'right') {
        readerRef.current?.scrollToIndex(Math.min(page + 1, Math.max(data.length - 1, 0)));
      }
    }
  };
  const handleLongPress = (position: 'left' | 'right') => {
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
    if (next && !hashList.includes(next.hash)) {
      setHashList([...hashList, next.hash]);
      dispatch(loadChapter({ chapterHash: next.hash }));
    }
  };

  const handleGoBack = () => navigation.goBack();
  const handleReload = () => dispatch(loadChapter({ chapterHash }));
  const handleLightOn = () => dispatch(setLight(LightSwitch.On));
  const handleLightOff = () => dispatch(setLight(LightSwitch.Off));
  const handleLeft = () => dispatch(setDirection(ReaderDirection.Left));
  const handleRight = () => dispatch(setDirection(ReaderDirection.Right));
  const handleVertical = () => dispatch(setMode(LayoutMode.Vertical));
  const handleHorizontal = () => dispatch(setMode(LayoutMode.Horizontal));
  const handleSliderChangeEnd = (newStep: number) => {
    const newPage = pre + Math.floor(newStep - 1);
    if (newStep > max - 5) {
      handleLoadMore();
    }
    setPage(newPage);
    readerRef.current?.scrollToIndex(newPage, false);
  };

  if (data.length <= 0) {
    return (
      <Center w="full" h="full" bg={lightOn ? 'white' : 'black'}>
        <SpinLoading color={lightOn ? 'black' : 'white'} />
      </Center>
    );
  }
  if (loadStatus === AsyncStatus.Rejected) {
    return (
      <Center w="full" h="full" bg={lightOn ? 'white' : 'black'}>
        <ErrorWithRetry onRetry={handleReload} />
      </Center>
    );
  }

  return (
    <Box w="full" h="full" bg={lightOn ? 'white' : 'black'}>
      <StatusBar
        backgroundColor={lightOn ? 'white' : 'black'}
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
        ref={readerRef}
        data={data}
        headers={headers}
        initPage={initPage}
        inverted={inverted}
        horizontal={horizontal}
        onTap={handleTap}
        onLongPress={handleLongPress}
        onImageLoad={handleImageLoad}
        onPageChange={handlePageChange}
        onLoadMore={handleLoadMore}
      />

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
            <VectorIcon
              name="arrow-back"
              size="2xl"
              shadow="icon"
              color={lightOn ? 'black' : 'white'}
              onPress={handleGoBack}
            />
            <Text
              flexShrink={1}
              shadow="icon"
              fontSize="md"
              fontWeight="bold"
              numberOfLines={1}
              color={lightOn ? 'black' : 'white'}
            >
              {title}
            </Text>
            <VectorIcon
              name="replay"
              size="md"
              shadow="icon"
              color={lightOn ? 'black' : 'white'}
              onPress={handleReload}
            />

            <Box flexGrow={1} flexShrink={1} />

            <VectorIcon
              name="lightbulb"
              size="lg"
              shadow="icon"
              color={lightOn ? 'black' : 'white'}
              onPress={lightOn ? handleLightOff : handleLightOn}
            />
            {horizontal && (
              <VectorIcon
                name={inverted ? 'west' : 'east'}
                size="lg"
                shadow="icon"
                color={lightOn ? 'black' : 'white'}
                onPress={inverted ? handleRight : handleLeft}
              />
            )}
            <Text shadow="icon" color={lightOn ? 'black' : 'white'} fontWeight="bold">
              {current} / {max}
            </Text>
            <VectorIcon
              name={horizontal ? 'stay-primary-landscape' : 'stay-primary-portrait'}
              size="lg"
              shadow="icon"
              color={lightOn ? 'black' : 'white'}
              onPress={horizontal ? handleVertical : handleHorizontal}
            />
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
            {prev ? (
              <VectorIcon
                name="skip-previous"
                size="lg"
                shadow="icon"
                color={lightOn ? 'black' : 'white'}
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
                disabled={!horizontal}
                onSliderChangeEnd={handleSliderChangeEnd}
              />
            </Box>
            {next ? (
              <VectorIcon
                name="skip-next"
                size="lg"
                shadow="icon"
                color={lightOn ? 'black' : 'white'}
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
