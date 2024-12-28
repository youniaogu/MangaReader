import React, { useCallback, ReactNode } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';

interface WhiteCurtainProps {
  actived?: boolean;
  children: ReactNode;
}

const WhiteCurtain = ({ actived = false, children }: WhiteCurtainProps) => {
  const opacity = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: opacity.value,
  }));

  useFocusEffect(
    useCallback(() => {
      if (actived) {
        opacity.value = withTiming(1);
      } else {
        opacity.value = withTiming(0);
      }
      return () => {
        if (actived) {
          opacity.value = 1;
        } else {
          opacity.value = 0;
        }
      };
    }, [actived, opacity])
  );

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};

export default WhiteCurtain;
