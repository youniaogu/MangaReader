import React from 'react';
import { Center, Text, Spinner, HStack } from 'native-base';

const LoadMore = () => {
  return (
    <Center w="full" h="24">
      <HStack space={2}>
        <Text color="gray.500">Loading</Text>
        <Spinner color="#6200ee" accessibilityLabel="loading" />
      </HStack>
    </Center>
  );
};

export default LoadMore;
