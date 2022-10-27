import React, { useMemo, useCallback } from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { isChapter, AsyncStatus, ReaderMode } from '~/utils';
import { useFocusEffect } from '@react-navigation/native';
import { usePrevNext } from '~/hooks';
import { Center } from 'native-base';
import ErrorWithRetry from '~/components/ErrorWithRetry';
import SpinLoading from '~/components/SpinLoading';
import Reader from '~/components/Reader';

const { loadChapter, viewChapter, viewPage, setReaderMode } = action;

const Chapter = ({ route, navigation }: StackChapterProps) => {
  const { mangaHash, chapterHash, page } = route.params || {};
  const dispatch = useAppDispatch();
  const mangaDict = useAppSelector((state) => state.dict.manga);
  const readerMode = useAppSelector((state) => state.setting.readerMode);
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

  const handlePageChange = useCallback(
    (currentPage: number) => dispatch(viewPage({ mangaHash, page: currentPage })),
    [dispatch, mangaHash]
  );
  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleModeChange = useCallback(
    (isHorizontal) =>
      dispatch(setReaderMode(isHorizontal ? ReaderMode.Horizontal : ReaderMode.Vertical)),
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

  if (!isChapter(data)) {
    if (loadStatus === AsyncStatus.Rejected) {
      return <ErrorWithRetry onRetry={handleRetry} />;
    }

    return (
      <Center w="full" h="full" bg="black">
        <SpinLoading color="white" />
      </Center>
    );
  }

  return (
    <Reader
      key={chapterHash}
      horizontal={readerMode === ReaderMode.Horizontal}
      title={data.title}
      initPage={page}
      data={data.images}
      headers={data.headers}
      goBack={handleGoBack}
      onModeChange={handleModeChange}
      onPageChange={handlePageChange}
      onPrev={handlePrevChapter}
      onNext={handleNextChapter}
    />
  );
};

export default Chapter;
