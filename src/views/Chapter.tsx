import React, { useCallback, useMemo } from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { useFirstRender, isChapter, AsyncStatus } from '~/utils';
import { Center } from 'native-base';
import ErrorWithRetry from '~/components/ErrorWithRetry';
import SpinLoading from '~/components/SpinLoading';
import Reader from '~/components/Reader';

const { loadChapter, viewChapter, viewPage } = action;

const Chapter = ({ route, navigation }: StackChapterProps) => {
  const { mangaHash, chapterHash, page } = route.params || {};
  const dispatch = useAppDispatch();
  const loadStatus = useAppSelector((state) => state.chapter.loadStatus);
  const chapterDict = useAppSelector((state) => state.dict.chapter);
  const data = useMemo(() => chapterDict[chapterHash], [chapterDict, chapterHash]);

  const loadAndViewChapter = () => {
    !isChapter(data) && dispatch(loadChapter({ chapterHash }));
    dispatch(viewChapter({ mangaHash, chapterHash }));
  };
  useFirstRender(loadAndViewChapter);

  const handlePageChange = useCallback(
    (currentPage: number) => {
      dispatch(viewPage({ mangaHash, page: currentPage }));
    },
    [dispatch, mangaHash]
  );
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);
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
      title={data.title}
      initPage={page}
      data={data.images}
      headers={data.headers}
      onPageChange={handlePageChange}
      goBack={handleGoBack}
    />
  );
};

export default Chapter;
