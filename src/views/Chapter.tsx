import React, { useMemo, useCallback } from 'react';
import { isChapter, AsyncStatus, ReaderMode, ReaderDirection } from '~/utils';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { useFocusEffect } from '@react-navigation/native';
import { usePrevNext } from '~/hooks';
import { Center } from 'native-base';
import ErrorWithRetry from '~/components/ErrorWithRetry';
import SpinLoading from '~/components/SpinLoading';
import Reader from '~/components/Reader';

const { loadChapter, viewChapter, viewPage, setMode, setDirection } = action;

const Chapter = ({ route, navigation }: StackChapterProps) => {
  const { mangaHash, chapterHash, page } = route.params || {};
  const dispatch = useAppDispatch();
  const mangaDict = useAppSelector((state) => state.dict.manga);
  const mode = useAppSelector((state) => state.setting.mode);
  const direction = useAppSelector((state) => state.setting.direction);
  const loadStatus = useAppSelector((state) => state.chapter.loadStatus);
  const chapterDict = useAppSelector((state) => state.dict.chapter);
  const data = useMemo(() => chapterDict[chapterHash], [chapterDict, chapterHash]);
  const chapterList = useMemo(() => mangaDict[mangaHash]?.chapters || [], [mangaDict, mangaHash]);
  const [prev, next] = usePrevNext(chapterList, chapterHash);

  useFocusEffect(
    useCallback(() => {
      dispatch(viewChapter({ mangaHash, chapterHash }));
    }, [dispatch, mangaHash, chapterHash])
  );
  useFocusEffect(
    useCallback(() => {
      !isChapter(data) && dispatch(loadChapter({ chapterHash }));
    }, [data, dispatch, chapterHash])
  );

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleReload = useCallback(
    () => dispatch(loadChapter({ chapterHash })),
    [dispatch, chapterHash]
  );
  const handleModeChange = useCallback(
    (isHorizontal) => dispatch(setMode(isHorizontal ? ReaderMode.Horizontal : ReaderMode.Vertical)),
    [dispatch]
  );
  const handlePageChange = useCallback(
    (currentPage: number) => dispatch(viewPage({ mangaHash, page: currentPage })),
    [dispatch, mangaHash]
  );
  const handleDirectionChange = useCallback(
    (inverted: boolean) =>
      dispatch(setDirection(inverted ? ReaderDirection.Left : ReaderDirection.Right)),
    [dispatch]
  );
  const handlePrevChapter = useMemo(() => {
    if (prev) {
      return () => {
        navigation.setParams({
          mangaHash,
          chapterHash: prev.hash,
          page: 1,
        });
      };
    }
    return undefined;
  }, [prev, mangaHash, navigation]);
  const handleNextChapter = useMemo(() => {
    if (next) {
      return () => {
        navigation.setParams({
          mangaHash,
          chapterHash: next.hash,
          page: 1,
        });
      };
    }
    return undefined;
  }, [next, mangaHash, navigation]);

  const handleRetry = () => {
    dispatch(loadChapter({ chapterHash }));
  };

  if (!isChapter(data) || loadStatus === AsyncStatus.Pending) {
    return (
      <Center w="full" h="full" bg="black">
        <SpinLoading color="white" />
      </Center>
    );
  }
  if (loadStatus === AsyncStatus.Rejected) {
    return (
      <Center w="full" h="full" bg="black">
        <ErrorWithRetry onRetry={handleRetry} />
      </Center>
    );
  }

  return (
    <Reader
      key={chapterHash}
      horizontal={mode === ReaderMode.Horizontal}
      inverted={mode === ReaderMode.Horizontal && direction === ReaderDirection.Left}
      title={data.title}
      initPage={page}
      data={data.images}
      headers={data.headers}
      goBack={handleGoBack}
      onReload={handleReload}
      onModeChange={handleModeChange}
      onPageChange={handlePageChange}
      onDirectionChange={handleDirectionChange}
      onPrevChapter={handlePrevChapter}
      onNextChapter={handleNextChapter}
    />
  );
};

export default Chapter;
