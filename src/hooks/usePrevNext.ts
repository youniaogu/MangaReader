import { useMemo } from 'react';

export const usePrevNext = (chapterList: ChapterItem[], chapterHash: string) => {
  return useMemo(() => {
    const index = chapterList.findIndex((item) => item.hash === chapterHash);

    if (index === -1) {
      return [undefined, undefined];
    }

    const prev = index < chapterList.length - 1 ? chapterList[index + 1] : undefined;
    const next = index > 0 ? chapterList[index - 1] : undefined;

    return [prev, next];
  }, [chapterList, chapterHash]);
};
