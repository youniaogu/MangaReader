import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  ReactNode,
  ForwardRefRenderFunction,
  Fragment,
} from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useDimensions } from '~/hooks';

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
  { leakWidth = 12, contentWidth = 300, maskOpacity = 0.5, defaultDuration = 300, children },
  ref
) => {
  const { width: windowWidth, height: windowHeight } = useDimensions();
  const minContentWidth = Math.min(windowWidth * 0.55, contentWidth);
  const translationX = useSharedValue(minContentWidth);
  const savedTranslationX = useSharedValue(minContentWidth);

  const opacity = useSharedValue(0.1);
  const savedOpacity = useSharedValue(0.1);
  const backgroungColor = useSharedValue('transparent');
  const savedBackgroungColor = useSharedValue('transparent');
  const width = useSharedValue(leakWidth);
  const savedWidth = useSharedValue(leakWidth);

  const maskStyles = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      right: 0,
      opacity: opacity.value,
      width: width.value,
      height: windowHeight,
      backgroundColor: backgroungColor.value,
    };
  });
  const contentStyles = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      right: 0,
      width: minContentWidth,
      height: windowHeight,
      transform: [{ translateX: translationX.value }],
    };
  });

  useEffect(() => {
    if (translationX.value > 0) {
      translationX.value = minContentWidth;
    }
    if (savedTranslationX.value > 0) {
      savedTranslationX.value = minContentWidth;
    }
  }, [minContentWidth, translationX, savedTranslationX]);

  useImperativeHandle(ref, () => ({
    open: () => {
      width.value = windowWidth;
      savedWidth.value = windowWidth;
      backgroungColor.value = 'black';
      savedBackgroungColor.value = 'black';
      opacity.value = withTiming(maskOpacity, { duration: defaultDuration, easing: Easing.linear });
      savedOpacity.value = maskOpacity;
      translationX.value = withTiming(0, { duration: defaultDuration, easing: Easing.linear });
      savedTranslationX.value = 0;
    },
    close: () => {
      width.value = withDelay(defaultDuration, withTiming(leakWidth, { duration: 0 }));
      savedWidth.value = leakWidth;
      backgroungColor.value = withDelay(
        defaultDuration,
        withTiming('transparent', { duration: 0 })
      );
      savedBackgroungColor.value = 'transparent';
      opacity.value = withTiming(0.1, { duration: defaultDuration, easing: Easing.linear });
      savedOpacity.value = 0.1;
      translationX.value = withTiming(minContentWidth, {
        duration: defaultDuration,
        easing: Easing.linear,
      });
      savedTranslationX.value = minContentWidth;
    },
  }));

  const tapGesture = Gesture.Tap()
    .shouldCancelWhenOutside(false)
    .onStart((e) => {
      if (e.absoluteX < windowWidth - minContentWidth) {
        width.value = withDelay(defaultDuration, withTiming(leakWidth, { duration: 0 }));
        savedWidth.value = leakWidth;
        backgroungColor.value = withDelay(
          defaultDuration,
          withTiming('transparent', { duration: 0 })
        );
        savedBackgroungColor.value = 'transparent';
        opacity.value = withTiming(0.1, { duration: defaultDuration, easing: Easing.linear });
        savedOpacity.value = 0.1;
        translationX.value = withTiming(minContentWidth, {
          duration: defaultDuration,
          easing: Easing.linear,
        });
        savedTranslationX.value = minContentWidth;
      }
    });
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      width.value = windowWidth;
    })
    .onChange((e) => {
      'worklet';
      const x = Math.min(Math.max(savedTranslationX.value + e.translationX, 0), minContentWidth);
      backgroungColor.value = 'black';
      opacity.value = Math.min(Math.abs(1 - x / minContentWidth) * maskOpacity, maskOpacity);
      translationX.value = Math.min(
        Math.max(savedTranslationX.value + e.translationX, 0),
        minContentWidth
      );
    })
    .onEnd(() => {
      'worklet';
      const distance = Math.abs(translationX.value - savedTranslationX.value);
      const duration = defaultDuration * (1 - Math.abs(distance / minContentWidth));

      if (distance >= minContentWidth / 4) {
        if (translationX.value > savedTranslationX.value) {
          width.value = withDelay(duration, withTiming(leakWidth, { duration: 0 }));
          savedWidth.value = leakWidth;
          backgroungColor.value = withDelay(duration, withTiming('transparent', { duration: 0 }));
          savedBackgroungColor.value = 'transparent';
          opacity.value = withTiming(0.1, { duration, easing: Easing.linear });
          savedOpacity.value = 0.1;
          translationX.value = withTiming(minContentWidth, { duration, easing: Easing.linear });
          savedTranslationX.value = minContentWidth;
        } else {
          width.value = withDelay(duration, withTiming(windowWidth, { duration: 0 }));
          savedWidth.value = windowWidth;
          backgroungColor.value = withDelay(duration, withTiming('black', { duration: 0 }));
          savedBackgroungColor.value = 'black';
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
        backgroungColor.value = withDelay(
          duration,
          withTiming(savedBackgroungColor.value, { duration: 0 })
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
    <Fragment>
      <GestureDetector gesture={tapGesture}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={maskStyles} />
        </GestureDetector>
      </GestureDetector>
      <Animated.View style={contentStyles}>{children}</Animated.View>
    </Fragment>
  );
};

export default forwardRef(Drawer);
