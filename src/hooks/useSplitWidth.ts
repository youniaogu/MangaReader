import { useDebouncedSafeAreaInsets } from './useDebouncedSafeAreaInsets';
import { useWindowDimensions } from 'react-native';
import { useMemo } from 'react';

export const useSplitWidth = ({
  gap = 0,
  width,
  minNumColumns = 3,
  maxSplitWidth = Infinity,
}: {
  gap?: number;
  width?: number;
  minNumColumns?: number;
  maxSplitWidth?: number;
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useDebouncedSafeAreaInsets();

  const split = useMemo(() => {
    const defaultWidth = windowWidth - insets.left - insets.right;
    const maxWindowSplitWidth = Math.min(windowWidth, windowHeight) / minNumColumns;

    const numColumns = Math.max(
      Math.floor((width || defaultWidth) / Math.min(maxSplitWidth, maxWindowSplitWidth)),
      minNumColumns
    );
    const splitWidth = ((width || defaultWidth) - gap * (numColumns + 1)) / numColumns;

    return { gap, splitWidth, numColumns };
  }, [gap, insets, width, windowWidth, windowHeight, minNumColumns, maxSplitWidth]);

  return split;
};
