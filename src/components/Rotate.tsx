import React, { ReactNode, useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

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

  useEffect(() => {
    if (isRotate) {
      offset.value = withRepeat(
        withTiming(360, { duration: 1500, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      offset.value = 0;
    }
  }, [isRotate, offset]);

  return <Animated.View style={animatedStyles}>{children}</Animated.View>;
};

export default Rotate;
