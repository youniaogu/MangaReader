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

export const useIndexCache = (
  initIndex: number = 0,
  cacheSize: number = 3
): [Set<number>, (index: number) => void] => {
  const [indexList, setCacheList] = useState(new Set<number>(calculateCache(initIndex, cacheSize)));
  const putIndex = useCallback(
    (index: number) => {
      setCacheList(new Set([...indexList, ...calculateCache(index, cacheSize)]));
    },
    [indexList, cacheSize]
  );

  return [indexList, putIndex];
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
