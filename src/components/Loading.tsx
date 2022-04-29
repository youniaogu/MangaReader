import React from 'react';
import { Spinner, Center } from 'native-base';

const Loading = () => {
  return (
    <Center w="full" h="48">
      <Spinner color="#6200ee" size="lg" accessibilityLabel="loading" />
    </Center>
  );
};

export default Loading;
