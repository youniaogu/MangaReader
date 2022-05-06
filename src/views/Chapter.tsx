import React, { useEffect } from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import Reader from '~/components/Reader';

const { loadChapter, viewChapter } = action;

const Chapter = ({ route, navigation }: StackChapterProps) => {
  const { mangaId, chapterId } = route.params || {};
  const dispatch = useAppDispatch();
  const chapterDict = useAppSelector((state) => state.dict.chapter);
  const data = chapterDict[mangaId + '$$' + chapterId];

  useEffect(() => {
    dispatch(viewChapter({ mangaId, lastWatchChapterId: chapterId, lastWatchPage: 1 }));
    dispatch(loadChapter({ mangaId, chapterId }));
  }, [dispatch, mangaId, chapterId]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  if (!data) {
    return null;
  }

  return <Reader data={data.images} goBack={handleGoBack} />;
};

export default Chapter;
