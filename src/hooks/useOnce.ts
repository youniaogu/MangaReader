import { useEffect, useRef } from 'react';

export const useOnce = (fn: () => void) => {
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      fn();
      firstRender.current = false;
    }
  }, [fn]);
};
