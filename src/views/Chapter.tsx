import React, { useRef, useMemo, useState, useCallback, Fragment } from 'react';
import { Box, Text, Flex, Center, StatusBar, useToast } from 'native-base';
import { ReaderMode, AsyncStatus, ReaderDirection } from '~/utils';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { useFocusEffect } from '@react-navigation/native';
import { usePrevNext } from '~/hooks';
import PageSlider, { PageSliderRef } from '~/components/PageSlider';
import Reader, { ReaderRef } from '~/components/Reader';
import ErrorWithRetry from '~/components/ErrorWithRetry';
import SpinLoading from '~/components/SpinLoading';
import VectorIcon from '~/components/VectorIcon';

const { loadChapter, viewChapter, viewPage, viewImage, setMode, setDirection } = action;
const lastPageToastId = 'LAST_PAGE_TOAST_ID';

const Chapter = ({ route, navigation }: StackChapterProps) => {
  const { mangaHash, chapterHash: initChapterHash, page: initPage } = route.params || {};
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(initPage - 1);
  const [showExtra, setShowExtra] = useState(false);
  const [chapterHash, setChapterHash] = useState(initChapterHash);
  const [hashList, setHashList] = useState([initChapterHash]);

  const { mode, direction } = useAppSelector((state) => state.setting);
  const { loadStatus, loadingChapterHash } = useAppSelector((state) => state.chapter);
  const { manga: mangaDict, chapter: chapterDict } = useAppSelector((state) => state.dict);

  const inverted = useMemo(
    () => mode === ReaderMode.Horizontal && direction === ReaderDirection.Left,
    [mode, direction]
  );
  const horizontal = useMemo(() => mode === ReaderMode.Horizontal, [mode]);
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

  useFocusEffect(
    useCallback(() => {
      dispatch(viewChapter({ mangaHash, chapterHash }));
    }, [dispatch, mangaHash, chapterHash])
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

  const handlePrevChapter = useCallback(() => {
    if (prev) {
      setChapterHash(prev.hash);
      setHashList([prev.hash]);
      setPage(0);
      pageSliderRef.current?.changePage(1);
      readerRef.current?.scrollToIndex(0, false);
    } else {
      toast.show({ title: '第一话' });
    }
  }, [prev, toast]);
  const handleNextChapter = useCallback(() => {
    if (next) {
      setChapterHash(next.hash);
      setHashList([next.hash]);
      setPage(0);
      pageSliderRef.current?.changePage(1);
      readerRef.current?.scrollToIndex(0, false);
    } else {
      toast.show({ title: '最后一话' });
    }
  }, [next, toast]);
  const handleTap = useCallback(
    (position: 'left' | 'mid' | 'right') => {
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
    },
    [page, data, inverted]
  );
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
    [inverted, handlePrevChapter, handleNextChapter]
  );
  const handleImageLoad = useCallback(
    (_uri: string, index: number) => dispatch(viewImage({ mangaHash, chapterHash, index })),
    [dispatch, mangaHash, chapterHash]
  );
  const handlePageChange = useCallback(
    (newPage: number) => {
      const image = data[newPage - 1];
      if (newPage >= data.length && !toast.isActive(lastPageToastId)) {
        toast.show({ id: lastPageToastId, title: '最后一页' });
      }
      setPage(newPage - 1);
      setChapterHash(image.chapterHash);
      pageSliderRef.current?.changePage(image.current);
    },
    [data, toast]
  );
  const handleLoadMore = useCallback(() => {
    if (next && !hashList.includes(next.hash)) {
      setHashList([...hashList, next.hash]);
      dispatch(loadChapter({ chapterHash: next.hash }));
    }
  }, [next, dispatch, hashList]);

  const handleGoBack = () => navigation.goBack();
  const handleReload = () => dispatch(loadChapter({ chapterHash }));
  const handleLeft = () => dispatch(setDirection(ReaderDirection.Left));
  const handleRight = () => dispatch(setDirection(ReaderDirection.Right));
  const handleVertical = () => dispatch(setMode(ReaderMode.Vertical));
  const handleHorizontal = () => dispatch(setMode(ReaderMode.Horizontal));
  const handleSliderChangeEnd = (newStep: number) => {
    const newPage = pre + Math.floor(newStep - 1);
    if (newStep >= max - 5) {
      handleLoadMore();
    }
    setPage(newPage);
    readerRef.current?.scrollToIndex(newPage, false);
  };

  if (
    data.length <= 0 ||
    (loadStatus === AsyncStatus.Pending && loadingChapterHash === chapterHash)
  ) {
    return (
      <Center w="full" h="full" bg="black">
        <SpinLoading color="white" />
      </Center>
    );
  }
  if (loadStatus === AsyncStatus.Rejected) {
    return (
      <Center w="full" h="full" bg="black">
        <ErrorWithRetry onRetry={handleReload} />
      </Center>
    );
  }

  return (
    <Box w="full" h="full" bg="black">
      <StatusBar backgroundColor="black" barStyle={showExtra ? 'light-content' : 'dark-content'} />

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
            <VectorIcon name="arrow-back" size="2xl" shadow="icon" onPress={handleGoBack} />
            <Text
              flexShrink={1}
              shadow="icon"
              fontSize="md"
              numberOfLines={1}
              color="white"
              fontWeight="bold"
            >
              {title}
            </Text>
            <VectorIcon name="replay" size="md" shadow="icon" onPress={handleReload} />

            <Box flexGrow={1} flexShrink={1} />

            {horizontal &&
              (inverted ? (
                <VectorIcon name="west" size="lg" shadow="icon" onPress={handleRight} />
              ) : (
                <VectorIcon name="east" size="lg" shadow="icon" onPress={handleLeft} />
              ))}
            <Text shadow="icon" color="white" fontWeight="bold">
              {current} / {max}
            </Text>
            {horizontal ? (
              <VectorIcon
                name="stay-primary-landscape"
                size="lg"
                shadow="icon"
                onPress={handleVertical}
              />
            ) : (
              <VectorIcon
                name="stay-primary-portrait"
                size="lg"
                shadow="icon"
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
            {prev ? (
              <VectorIcon
                name="skip-previous"
                size="lg"
                shadow="icon"
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
              <VectorIcon name="skip-next" size="lg" shadow="icon" onPress={handleNextChapter} />
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
