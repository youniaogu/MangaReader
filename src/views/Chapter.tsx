import React, { useCallback, useMemo } from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { useFirstRender, isChapter } from '~/utils';
import { Center } from 'native-base';
import Loading from '~/components/Loading';
import Reader from '~/components/Reader';

const { loadChapter, viewChapter, viewPage } = action;

const Chapter = ({ route, navigation }: StackChapterProps) => {
  const { mangaId, chapterId, page } = route.params || {};
  const dispatch = useAppDispatch();
  const chapterDict = useAppSelector((state) => state.dict.chapter);
  const data = useMemo(
    () => chapterDict[mangaId + '$$' + chapterId],
    [chapterDict, mangaId, chapterId]
  );

  const loadAndViewChapter = useCallback(() => {
    !data && dispatch(loadChapter({ mangaId, chapterId }));
    dispatch(viewChapter({ mangaId, chapterId }));
  }, [dispatch, mangaId, chapterId, data]);
  const handlePageChange = useCallback(
    (currentPage: number) => {
      dispatch(viewPage({ mangaId, page: currentPage }));
    },
    [dispatch, mangaId]
  );
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  useFirstRender(loadAndViewChapter);

  if (!isChapter(data)) {
    return (
      <Center w="full" h="full" bg="black">
        <Loading color="white" />
      </Center>
    );
  }

  return (
    <Reader
      title={data.title}
      initPage={page}
      data={data.images}
      onPageChange={handlePageChange}
      goBack={handleGoBack}
    />
  );
};

export default Chapter;
