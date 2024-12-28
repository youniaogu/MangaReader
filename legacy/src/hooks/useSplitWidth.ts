import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';
import { ScaledSize, useWindowDimensions } from 'react-native';
import { useEffect, useState } from 'react';

interface SplitWidthLimit {
  gap?: number;
  width?: number;
  minNumColumns?: number;
  maxSplitWidth?: number;
}

function splitWidth(
  dimensions: ScaledSize,
  insets: EdgeInsets,
  { gap, width, minNumColumns, maxSplitWidth }: Required<SplitWidthLimit>
) {
  const { width: windowWidth, height: windowHeight } = dimensions;
  const defaultWidth = windowWidth - insets.left - insets.right;
  const maxWindowSplitWidth = Math.min(windowWidth, windowHeight) / minNumColumns;

  const numColumns = Math.max(
    Math.floor((width || defaultWidth) / Math.min(maxSplitWidth, maxWindowSplitWidth)),
    minNumColumns
  );
  const itemWidth = ((width || defaultWidth) - gap * (numColumns + 1)) / numColumns;

  return { gap, insets, itemWidth, numColumns, windowWidth, windowHeight };
}

export const useSplitWidth = ({
  gap = 0,
  width = 0,
  minNumColumns = 3,
  maxSplitWidth = Infinity,
}: SplitWidthLimit) => {
  const insets = useSafeAreaInsets();
  const windowDimensions = useWindowDimensions();
  const [split, setSplit] = useState(
    splitWidth(windowDimensions, insets, { gap, width, minNumColumns, maxSplitWidth })
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSplit(splitWidth(windowDimensions, insets, { gap, width, minNumColumns, maxSplitWidth }));
    }, 1000);
    return () => timeout && clearTimeout(timeout);
  }, [insets, windowDimensions, gap, width, minNumColumns, maxSplitWidth]);

  return split;
};
