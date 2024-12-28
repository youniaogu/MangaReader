import { useEffect, useRef } from 'react';

export const useInterval = (callback: () => void, enable = true, ms = 5000) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const fn = () => {
      if (enable) {
        callback();
        timeoutRef.current = setTimeout(fn, ms);
      }
    };

    timeoutRef.current = setTimeout(fn, ms);
    return () => {
      timeoutRef.current && clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    };
  }, [callback, enable, ms]);
};
