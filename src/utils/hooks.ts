import { useState, useEffect, useRef, useCallback } from 'react';

export const useFirstRender = (fn: () => void) => {
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      fn();
      firstRender.current = false;
    }
  }, [fn]);
};

const calculateCache = (index: number, cacheSize: number) => {
  const min = Math.max(index - cacheSize, 0);
  const max = index + cacheSize;

  return Array.from({ length: max + 1 }, (_value, i) => i + min);
};

export const usePageCache = (
  initPage: number = 0,
  cacheSize: number = 3
): [number, Set<number>, (index: number) => void] => {
  const [page, setPage] = useState(initPage);
  const [cacheList, setCacheList] = useState(new Set<number>(calculateCache(initPage, cacheSize)));
  const putPage = useCallback(
    (newPage: number) => {
      setPage(newPage);
      setCacheList(new Set([...cacheList, ...calculateCache(newPage, cacheSize)]));
    },
    [cacheList, cacheSize]
  );

  return [page, cacheList, putPage];
};

export const useUpdate = (fn: () => void) => {
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
    }
    fn();
  }, [fn]);
};
