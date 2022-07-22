import React from 'react';
import { ColorType, SizeType, SafeAreaProps } from 'native-base/lib/typescript/components/types';
import { Spinner, Center } from 'native-base';
import { ColorValue } from 'react-native';

interface SpinLoadingProps extends SafeAreaProps {
  color?: ColorType;
  height?: SizeType;
}

const SpinLoading = ({ color = 'purple.500', height = 48, ...safeAreaProps }: SpinLoadingProps) => {
  return (
    <Center w="full" h={height} {...safeAreaProps}>
      <Spinner color={color as ColorValue} size="lg" accessibilityLabel="loading" />
    </Center>
  );
};

export default SpinLoading;
