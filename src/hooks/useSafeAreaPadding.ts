import { useMemo } from 'react';
import { useSafeArea } from 'native-base';

interface SafeArea {
  pt?: string;
  pl?: string;
  pr?: string;
  pb?: string;
}

export const useSafeAreaPadding = () => {
  const { pt, pl, pr, pb }: SafeArea = useSafeArea({ safeAreaX: true, safeAreaY: true });
  const safeArea = useMemo(
    () => ({
      top: pt ? Number(pt.replace('px', '')) : 0,
      left: pl ? Number(pl.replace('px', '')) : 0,
      right: pr ? Number(pr.replace('px', '')) : 0,
      bottom: pb ? Number(pb.replace('px', '')) : 0,
    }),
    [pt, pl, pr, pb]
  );
  return safeArea;
};
