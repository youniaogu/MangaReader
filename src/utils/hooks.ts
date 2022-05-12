import { useEffect, useRef } from 'react';

export const useFirstRender = (fn: () => void) => {
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      fn();
      firstRender.current = false;
    }
  }, [fn]);
};
