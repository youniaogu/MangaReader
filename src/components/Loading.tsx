import React from 'react';
import { Center, HStack, Spinner, Heading } from 'native-base';

const Loading = () => {
  return (
    <Center>
      <HStack space={2} justifyContent="center">
        <Spinner accessibilityLabel="Loading posts" />
        <Heading color="primary.500" fontSize="md">
          Loading
        </Heading>
      </HStack>
    </Center>
  );
};

export default Loading;
