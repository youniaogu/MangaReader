import { useEffect, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Orientation } from '~/utils';

export const useDimensions = () => {
  const _windowDimensions = useWindowDimensions();
  const [windowDimensions, setWindowDimensions] = useState({ ..._windowDimensions });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setWindowDimensions({ ..._windowDimensions });
    }, 1000);
    return () => timeout && clearTimeout(timeout);
  }, [_windowDimensions]);

  return useMemo(() => {
    return {
      ...windowDimensions,
      orientation:
        windowDimensions.width > windowDimensions.height
          ? Orientation.Landscape
          : Orientation.Portrait,
    };
  }, [windowDimensions]);
};
