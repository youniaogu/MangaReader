import React, { forwardRef, useImperativeHandle, ReactNode, ForwardRefRenderFunction } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Dimensions } from 'react-native';
import { View } from 'native-base';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

export interface DrawerRef {
  open: () => void;
  close: () => void;
}
interface DrawerProps {
  leakWidth?: number;
  contentWidth?: number;
  maskOpacity?: number;
  defaultDuration?: number;
  children?: ReactNode;
}

const Drawer: ForwardRefRenderFunction<DrawerRef, DrawerProps> = (
  {
    contentWidth = Math.min(windowWidth * 0.55, 300),
    leakWidth = 12,
    maskOpacity = 0.5,
    defaultDuration = 300,
    children,
  },
  ref
) => {
  const hideTranslateX = contentWidth - leakWidth;
  const translationX = useSharedValue(hideTranslateX);
  const savedTranslationX = useSharedValue(hideTranslateX);

  const opacity = useSharedValue(0);
  const savedOpacity = useSharedValue(0);
  const width = useSharedValue(0);
  const savedWidth = useSharedValue(0);

  const maskStyles = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: 0,
      opacity: opacity.value,
      width: width.value,
      height: windowHeight,
      backgroundColor: 'black',
      transform: [{ translateX: -windowWidth }],
    };
  });
  const contentStyles = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      right: 0,
      width: contentWidth,
      height: windowHeight,
      paddingLeft: leakWidth,
      transform: [{ translateX: translationX.value }],
    };
  });

  useImperativeHandle(ref, () => ({
    open: () => {
      width.value = windowWidth;
      savedWidth.value = windowWidth;
      opacity.value = withTiming(maskOpacity, { duration: defaultDuration, easing: Easing.linear });
      savedOpacity.value = maskOpacity;
      translationX.value = withTiming(0, { duration: defaultDuration, easing: Easing.linear });
      savedTranslationX.value = 0;
    },
    close: () => {
      width.value = withDelay(defaultDuration, withTiming(0, { duration: 0 }));
      savedWidth.value = 0;
      opacity.value = withTiming(0, { duration: defaultDuration, easing: Easing.linear });
      savedOpacity.value = 0;
      translationX.value = withTiming(hideTranslateX, {
        duration: defaultDuration,
        easing: Easing.linear,
      });
      savedTranslationX.value = hideTranslateX;
    },
  }));

  const tapGesture = Gesture.Tap()
    .shouldCancelWhenOutside(false)
    .onStart((e) => {
      if (e.absoluteX < windowWidth - contentWidth) {
        width.value = withDelay(defaultDuration, withTiming(0, { duration: 0 }));
        savedWidth.value = 0;
        opacity.value = withTiming(0, { duration: defaultDuration, easing: Easing.linear });
        savedOpacity.value = 0;
        translationX.value = withTiming(hideTranslateX, {
          duration: defaultDuration,
          easing: Easing.linear,
        });
        savedTranslationX.value = hideTranslateX;
      }
    });
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      width.value = windowWidth;
    })
    .onChange((e) => {
      'worklet';
      const x = Math.min(Math.max(savedTranslationX.value + e.translationX, 0), hideTranslateX);
      opacity.value = Math.min(Math.abs(1 - x / hideTranslateX) * maskOpacity, maskOpacity);
      translationX.value = Math.min(
        Math.max(savedTranslationX.value + e.translationX, 0),
        hideTranslateX
      );
    })
    .onEnd(() => {
      'worklet';
      const distance = Math.abs(translationX.value - savedTranslationX.value);
      const duration = defaultDuration * (1 - Math.abs(distance / hideTranslateX));

      if (distance >= hideTranslateX / 4) {
        if (translationX.value > savedTranslationX.value) {
          width.value = withDelay(duration, withTiming(0, { duration: 0 }));
          savedWidth.value = 0;
          opacity.value = withTiming(0, { duration, easing: Easing.linear });
          savedOpacity.value = 0;
          translationX.value = withTiming(hideTranslateX, { duration, easing: Easing.linear });
          savedTranslationX.value = hideTranslateX;
        } else {
          width.value = withDelay(duration, withTiming(windowWidth, { duration: 0 }));
          savedWidth.value = windowWidth;
          opacity.value = withTiming(maskOpacity, { duration, easing: Easing.linear });
          savedOpacity.value = maskOpacity;
          translationX.value = withTiming(0, { duration, easing: Easing.linear });
          savedTranslationX.value = 0;
        }
      } else {
        width.value = withDelay(
          defaultDuration - duration,
          withTiming(savedWidth.value, { duration: 0 })
        );
        opacity.value = withTiming(savedOpacity.value, {
          duration: defaultDuration - duration,
          easing: Easing.linear,
        });
        translationX.value = withTiming(savedTranslationX.value, {
          duration: defaultDuration - duration,
          easing: Easing.linear,
        });
      }
    });

  return (
    <GestureDetector gesture={tapGesture}>
      <GestureDetector gesture={panGesture}>
        <View position="absolute" top={0} right={0}>
          <Animated.View style={maskStyles} />
          <Animated.View style={contentStyles}>{children}</Animated.View>
        </View>
      </GestureDetector>
    </GestureDetector>
  );
};

export default forwardRef(Drawer);
