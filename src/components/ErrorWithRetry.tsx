import React from 'react';
import { ColorType, SizeType, SafeAreaProps } from 'native-base/lib/typescript/components/types';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Center } from 'native-base';
import VectorIcon from '~/components/VectorIcon';

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
        <VectorIcon name="replay" size="2xl" color={color} />
      </GestureDetector>
    </Center>
  );
};

export default ErrorWithRetry;
