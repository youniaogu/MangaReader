import React, { useMemo, useCallback } from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { isChapter, AsyncStatus, ReaderMode } from '~/utils';
import { useFocusEffect } from '@react-navigation/native';
import { Center } from 'native-base';
import ErrorWithRetry from '~/components/ErrorWithRetry';
import SpinLoading from '~/components/SpinLoading';
import Reader from '~/components/Reader';

const { loadChapter, viewChapter, viewPage, setReaderMode } = action;

const Chapter = ({ route, navigation }: StackChapterProps) => {
  const { mangaHash, chapterHash, page } = route.params || {};
  const dispatch = useAppDispatch();
  const readerMode = useAppSelector((state) => state.setting.readerMode);
  const loadStatus = useAppSelector((state) => state.chapter.loadStatus);
  const chapterDict = useAppSelector((state) => state.dict.chapter);
  const data = useMemo(() => chapterDict[chapterHash], [chapterDict, chapterHash]);

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
      horizontal={readerMode === ReaderMode.Horizontal}
      title={data.title}
      initPage={page}
      data={data.images}
      headers={data.headers}
      goBack={handleGoBack}
      onModeChange={handleModeChange}
      onPageChange={handlePageChange}
    />
  );
};

export default Chapter;
