import React, { ReactNode, useState, memo } from 'react';
import { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Dimensions } from 'react-native';
import { Box } from 'native-base';
import Animated from 'react-native-reanimated';

const doubleTapScaleValue = 2;
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

interface ControllerProps {
  onTap?: () => void;
  children: ReactNode;
  horizontal?: boolean;
}

const Controller = ({ onTap, children, horizontal = false }: ControllerProps) => {
  const [enabled, setEnabled] = useState(false);
  const width = useSharedValue(windowWidth);
  const height = useSharedValue(windowHeight);

  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const scale = useSharedValue(1);
  const top = useSharedValue(0);
  const left = useSharedValue(0);
  const right = useSharedValue(0);
  const bottom = useSharedValue(0);

  const savedTranslationX = useSharedValue(0);
  const savedTranslationY = useSharedValue(0);
  const savedScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value },
      { translateY: translationY.value },
      { scale: scale.value },
    ],
  }));

  const singleTap = Gesture.Tap()
    .runOnJS(true)
    .maxDuration(300)
    .numberOfTaps(1)
    .onStart(() => {
      onTap && onTap();
    });
  const doubleTap = Gesture.Tap()
    .maxDuration(300)
    .maxDelay(300)
    .numberOfTaps(2)
    .onStart((e) => {
      'worklet';
      if (savedScale.value > 1) {
        scale.value = withTiming(1, { duration: 300 });
        translationX.value = withTiming(0, { duration: 300 });
        translationY.value = withTiming(0, { duration: 300 });

        savedScale.value = 1;
        savedTranslationX.value = 0;
        savedTranslationY.value = 0;
        runOnJS(setEnabled)(false);
      } else {
        scale.value = withTiming(doubleTapScaleValue, { duration: 300 });
        const currentX = (windowWidth / doubleTapScaleValue - e.x) * (doubleTapScaleValue - 1);
        const currentY = (windowHeight / doubleTapScaleValue - e.y) * (doubleTapScaleValue - 1);
        const dX = width.value * doubleTapScaleValue - windowWidth;
        const dY = height.value * doubleTapScaleValue - windowHeight;
        translationX.value = withTiming(currentX, { duration: 300 });
        translationY.value = withTiming(currentY, { duration: 300 });
        top.value = Math.max(dY / 2, 0);
        bottom.value = Math.max(dY / 2, 0);
        left.value = Math.max(dX / 2, 0);
        right.value = Math.max(dX / 2, 0);

        savedScale.value = doubleTapScaleValue;
        savedTranslationX.value = currentX;
        savedTranslationY.value = currentY;
        runOnJS(setEnabled)(doubleTapScaleValue > 1);
      }
    });
  const pinchGesture = Gesture.Pinch()
    .onStart((e) => {
      'worklet';
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onChange((e) => {
      'worklet';
      const prevScale = savedScale.value;
      const currentScale = Math.min(Math.max(savedScale.value * e.scale, 1), 4);

      let currentX = savedTranslationX.value;
      let currentY = savedTranslationY.value;
      if (currentScale >= prevScale) {
        currentX += (windowWidth / 2 - focalX.value) * (currentScale / prevScale - 1);
        currentY += (windowHeight / 2 - focalY.value) * (currentScale / prevScale - 1);
      } else {
        currentX = (currentX / (prevScale - 1)) * (currentScale - 1);
        currentY = (currentY / (prevScale - 1)) * (currentScale - 1);
      }

      scale.value = currentScale;
      translationX.value = currentX;
      translationY.value = currentY;
    })
    .onEnd(() => {
      'worklet';
      const dX = width.value * scale.value - windowWidth;
      const dY = height.value * scale.value - windowHeight;
      top.value = Math.max(dY / 2, 0);
      bottom.value = Math.max(dY / 2, 0);
      left.value = Math.max(dX / 2, 0);
      right.value = Math.max(dX / 2, 0);

      savedScale.value = scale.value;
      savedTranslationX.value = translationX.value;
      savedTranslationY.value = translationY.value;
      runOnJS(setEnabled)(scale.value > 1);
    });
  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .onChange((e) => {
      'worklet';
      const currentX = translationX.value + e.changeX;
      const currentY = translationY.value + e.changeY;

      if (savedScale.value === 1) {
        return;
      }

      if (
        (currentX >= -left.value && currentX <= right.value) ||
        (currentX < -left.value && currentX > translationX.value) ||
        (currentX > right.value && currentX < translationX.value)
      ) {
        translationX.value = currentX;
      }
      if (
        (currentY >= -top.value && currentY <= bottom.value) ||
        (currentY < -top.value && currentY > translationY.value) ||
        (currentY > bottom.value && currentY < translationY.value)
      ) {
        translationY.value = currentY;
      }
    })
    .onEnd(() => {
      'worklet';
      savedTranslationX.value = translationX.value;
      savedTranslationY.value = translationY.value;
    });

  return (
    <GestureDetector gesture={Gesture.Exclusive(doubleTap, singleTap)}>
      <GestureDetector gesture={pinchGesture}>
        <GestureDetector gesture={panGesture}>
          {horizontal ? (
            <Box w={windowWidth} h={windowHeight} bg="black" safeArea>
              <Animated.View style={animatedStyle}>{children}</Animated.View>
            </Box>
          ) : (
            <Animated.View style={animatedStyle}>{children}</Animated.View>
          )}
        </GestureDetector>
      </GestureDetector>
    </GestureDetector>
  );
};

export default memo(Controller);
