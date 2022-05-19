import React from 'react';
import { Center, Icon, IconButton } from 'native-base';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface ErrorWithRetryProps {
  onRetry: () => void;
}

const ErrorWithRetry = ({ onRetry }: ErrorWithRetryProps) => {
  return (
    <Center w="full" h={48}>
      <IconButton
        icon={<Icon as={MaterialIcons} name="replay" size="xl" color="gray.500" />}
        onPress={onRetry}
      />
    </Center>
  );
};

export default ErrorWithRetry;
