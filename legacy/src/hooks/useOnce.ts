import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export const useOnce = (fn: () => void) => {
  const firstRender = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstRender.current) {
        fn();
        firstRender.current = false;
      }
    }, [fn])
  );
};
