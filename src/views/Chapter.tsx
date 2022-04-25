import React, { useEffect } from 'react';
import { action, useAppSelector, useAppDispatch } from '~redux';
import Reader from '~components/Reader';

// const headers = {};
// const mockData = [
//   { uri: 'https://images.alphacoders.com/549/thumb-1920-549450.png', headers },
//   { uri: 'https://s1.ax1x.com/2022/04/14/LlcpCD.png', headers },
//   { uri: 'https://wallpapercave.com/uwp/uwp1102321.jpeg', headers },
//   {
//     uri: 'https://images.unsplash.com/photo-1596701008477-309aeefa29ad?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2231&q=80',
//     headers,
//   },
//   {
//     uri: 'https://images.unsplash.com/photo-1591233244149-62ee33f538d7?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80',
//     headers,
//   },
//   {
//     uri: 'https://images.unsplash.com/photo-1600251215707-95bb01c73f51?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=930&q=80',
//     headers,
//   },
//   {
//     uri: 'https://images.unsplash.com/photo-1626238247302-2f3065c90ff5?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1674&q=80',
//     headers,
//   },
//   {
//     uri: 'https://images.unsplash.com/photo-1563432161839-82786c3b4726?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2231&q=80',
//     headers,
//   },
// ];

const { loadChapter } = action;

const Chapter = ({ route, navigation }: StackChapterProps) => {
  const { mangaId, chapterId } = route.params || {};
  const dispatch = useAppDispatch();
  const chapterDict = useAppSelector((state) => state.dict.chapter);
  const data = chapterDict[mangaId + '$$' + chapterId];

  useEffect(() => {
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
