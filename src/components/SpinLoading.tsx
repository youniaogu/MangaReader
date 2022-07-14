import React from 'react';
import { Spinner, Center } from 'native-base';

interface SpinLoadingProps {
  color?: string;
}

const SpinLoading = ({ color = '#6200ee' }: SpinLoadingProps) => {
  return (
    <Center w="full" h={48}>
      <Spinner color={color} size="lg" accessibilityLabel="loading" />
    </Center>
  );
};

export default SpinLoading;
