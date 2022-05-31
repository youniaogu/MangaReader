import React, { useCallback, useMemo } from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { useFirstRender, isChapter } from '~/utils';
import { Center } from 'native-base';
import Loading from '~/components/Loading';
import Reader from '~/components/Reader';

const { loadChapter, viewChapter, viewPage } = action;

const Chapter = ({ route, navigation }: StackChapterProps) => {
  const { mangaHash, chapterHash, page } = route.params || {};
  const dispatch = useAppDispatch();
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
      headers={data.headers}
      onPageChange={handlePageChange}
      goBack={handleGoBack}
    />
  );
};

export default Chapter;
