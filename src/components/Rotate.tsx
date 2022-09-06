import React, { ReactNode, useCallback } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';

interface RotateProps {
  isRotate?: boolean;
  children: ReactNode;
}

const Rotate = ({ isRotate = false, children }: RotateProps) => {
  const offset = useSharedValue(0);
  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${offset.value}deg` }],
    };
  });

  useFocusEffect(
    useCallback(() => {
      if (isRotate) {
        offset.value = withRepeat(
          withTiming(360, { duration: 1500, easing: Easing.linear }),
          -1,
          false
        );
      } else {
        offset.value = 0;
      }
    }, [isRotate, offset])
  );

  return <Animated.View style={animatedStyles}>{children}</Animated.View>;
};

export default Rotate;
