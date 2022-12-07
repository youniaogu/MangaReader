import React from 'react';
import { Center, Icon, IconButton } from 'native-base';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface ErrorWithRetryProps {
  onRetry?: () => void;
}

const ErrorWithRetry = ({ onRetry }: ErrorWithRetryProps) => {
  return (
    <Center w="full" h="full" bg="black">
      <IconButton
        icon={<Icon as={MaterialIcons} name="replay" size="2xl" color="white" />}
        onPress={onRetry}
      />
    </Center>
  );
};

export default ErrorWithRetry;
