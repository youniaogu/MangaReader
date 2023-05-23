import { useWindowDimensions } from 'react-native';
import { useSafeArea } from 'native-base';
import { useMemo } from 'react';

interface SafeArea {
  pt?: string;
  pl?: string;
  pr?: string;
  pb?: string;
}

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
  const { pl, pr }: SafeArea = useSafeArea({ safeAreaX: true });

  const { left, right } = useMemo(
    () => ({
      left: pl ? Number(pl.replace('px', '')) : 0,
      right: pr ? Number(pr.replace('px', '')) : 0,
    }),
    [pl, pr]
  );
  const split = useMemo(() => {
    const defaultWidth = windowWidth - left - right;
    const maxWindowSplitWidth = Math.min(windowWidth, windowHeight) / minNumColumns;

    const numColumns = Math.max(
      Math.floor((width || defaultWidth) / Math.min(maxSplitWidth, maxWindowSplitWidth)),
      minNumColumns
    );
    const splitWidth = ((width || defaultWidth) - gap * (numColumns + 1)) / numColumns;

    return { gap, splitWidth, numColumns };
  }, [gap, left, right, width, windowWidth, windowHeight, minNumColumns, maxSplitWidth]);

  return split;
};
