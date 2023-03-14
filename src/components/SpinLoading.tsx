import React from 'react';
import { ColorType, SizeType, SafeAreaProps } from 'native-base/lib/typescript/components/types';
import { Spinner, Center } from 'native-base';
import { ColorValue } from 'react-native';

interface SpinLoadingProps extends SafeAreaProps {
  size?: 'lg' | 'sm';
  color?: ColorType;
  height?: SizeType;
}

const SpinLoading = ({
  size = 'lg',
  color = 'purple.500',
  height = 48,
  ...safeAreaProps
}: SpinLoadingProps) => {
  return (
    <Center w="full" h={height} {...safeAreaProps}>
      <Spinner color={color as ColorValue} size={size} accessibilityLabel="loading" />
    </Center>
  );
};

export default SpinLoading;
