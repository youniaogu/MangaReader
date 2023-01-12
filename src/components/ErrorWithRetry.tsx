import React from 'react';
import { ColorType, SizeType, SafeAreaProps } from 'native-base/lib/typescript/components/types';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Center, Icon, IconButton } from 'native-base';
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
  const singleTap = Gesture.Tap()
    .runOnJS(true)
    .onStart(() => {
      onRetry && onRetry();
    });

  return (
    <Center w="full" h={height} bg="transparent" {...safeAreaProps}>
      <GestureDetector gesture={singleTap}>
        <IconButton icon={<Icon as={MaterialIcons} name="replay" size="2xl" color={color} />} />
      </GestureDetector>
    </Center>
  );
};

export default ErrorWithRetry;
