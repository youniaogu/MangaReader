import { useEffect, useState } from 'react';
import { Orientation } from '~/utils';
import { Dimensions } from 'react-native';

type Dim = 'screen' | 'window';

const getSize = (dim: Dim = 'window') => {
  const { width, height, ...other } = Dimensions.get(dim);

  return {
    orientation: width >= height ? Orientation.Landscape : Orientation.Portrait,
    width,
    height,
    ...other,
  };
};

export const useOrientation = (dim: Dim = 'window') => {
  const [orientation, setOrientation] = useState(getSize(dim));

  useEffect(() => {
    const emitter = Dimensions.addEventListener('change', () => {
      setOrientation(getSize(dim));
    });

    return () => emitter.remove();
  }, [dim]);

  return orientation;
};
