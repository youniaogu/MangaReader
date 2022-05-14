import React from 'react';
import { Spinner, Center } from 'native-base';

interface LoadingProps {
  color?: string;
}

const Loading = ({ color = '#6200ee' }: LoadingProps) => {
  return (
    <Center w="full" h={48}>
      <Spinner color={color} size="lg" accessibilityLabel="loading" />
    </Center>
  );
};

export default Loading;
