import { useWindowDimensions } from 'react-native';
import { Orientation } from '~/utils';
import { useMemo } from 'react';

export const useDimensions = () => {
  const windowDimensions = useWindowDimensions();
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
