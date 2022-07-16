import React from 'react';
import { Spinner, Center } from 'native-base';
import { SafeAreaProps } from 'native-base/lib/typescript/components/types';

interface SpinLoadingProps extends SafeAreaProps {
  color?: string;
  height?: number | 'full' | 'sm' | 'md' | 'lg';
}

const SpinLoading = ({ color = '#6200ee', height = 48, ...safeAreaProps }: SpinLoadingProps) => {
  return (
    <Center w="full" h={height} {...safeAreaProps}>
      <Spinner color={color} size="lg" accessibilityLabel="loading" />
    </Center>
  );
};

export default SpinLoading;
