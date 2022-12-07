import React, { ReactNode, useCallback } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';

interface ShakeProps {
  enable?: boolean;
  children: ReactNode;
}

const springConfig = {
  mass: 0.5,
  stiffness: 500,
  overshootClamping: true,
};

const Shake = ({ enable = false, children }: ShakeProps) => {
  const offset = useSharedValue(0);
  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${offset.value}deg` }],
    };
  });

  useFocusEffect(
    useCallback(() => {
      if (enable) {
        offset.value = withRepeat(
          withDelay(
            3000,
            withSequence(
              withSpring(16, springConfig),
              withSpring(-16, springConfig),
              withSpring(12, springConfig),
              withSpring(-12, springConfig),
              withSpring(8, springConfig),
              withSpring(-8, springConfig),
              withSpring(4, springConfig),
              withSpring(-4, springConfig),
              withSpring(0, springConfig)
            )
          ),
          -1
        );
      } else {
        offset.value = 0;
      }
    }, [enable, offset])
  );

  return <Animated.View style={animatedStyles}>{children}</Animated.View>;
};

export default Shake;
