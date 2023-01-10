import React from 'react';
import { Center, Icon, IconButton } from 'native-base';
import { ColorType, SizeType, SafeAreaProps } from 'native-base/lib/typescript/components/types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface ErrorWithRetryProps extends SafeAreaProps {
  color?: ColorType;
  height?: SizeType;
  onRetry?: () => void;
}

const ErrorWithRetry = ({
  color = 'white',
  height = 48,
  onRetry,
  ...safeAreaProps
}: ErrorWithRetryProps) => {
  return (
    <Center w="full" h={height} bg="transparent" {...safeAreaProps}>
      <IconButton
        icon={<Icon as={MaterialIcons} name="replay" size="2xl" color={color} />}
        onPress={onRetry}
      />
    </Center>
  );
};

export default ErrorWithRetry;
