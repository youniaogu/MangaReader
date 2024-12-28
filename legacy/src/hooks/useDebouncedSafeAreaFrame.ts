import { useEffect, useMemo, useState } from 'react';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { Orientation } from '~/utils';

export const useDebouncedSafeAreaFrame = () => {
  const _frame = useSafeAreaFrame();
  const [frame, setFrame] = useState({ ..._frame });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFrame({ ..._frame });
    }, 1000);
    return () => timeout && clearTimeout(timeout);
  }, [_frame]);

  return useMemo(() => {
    return {
      ...frame,
      orientation: frame.width > frame.height ? Orientation.Landscape : Orientation.Portrait,
    };
  }, [frame]);
};
