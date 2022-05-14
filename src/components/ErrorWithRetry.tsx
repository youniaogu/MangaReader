import React from 'react';
import { Center, Heading, Icon, IconButton } from 'native-base';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface ErrorWithRetryProps {
  onRetry?: () => void;
}

const ErrorWithRetry = ({ onRetry }: ErrorWithRetryProps) => {
  return (
    <Center w="full" h={48}>
      {onRetry && (
        <IconButton
          icon={<Icon as={MaterialIcons} name="replay" size="4xl" color="gray.500" />}
          onPress={onRetry}
        />
      )}
      <Heading color="gray.500">Network Fail</Heading>
    </Center>
  );
};

export default ErrorWithRetry;
