import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Image as ReactImage, StyleSheet, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Image, View } from 'native-base';
import { scaleToFit } from '~utils';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

interface ControllerProps {
  uri: string;
  headers: {
    [index: string]: string;
  };
  onNext: () => void;
  onPrev: () => void;
}

const Controller = ({ uri, headers, onNext, onPrev }: ControllerProps) => {
  const width = useSharedValue(0);
  const height = useSharedValue(0);

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

  const doubleTapScaleValue = 2;

  useEffect(() => {
    ReactImage.getSizeWithHeaders(uri, headers, (w, h) => {
      const { dWidth, dHeight } = scaleToFit(
        { width: w, height: h },
        { width: windowWidth, height: windowHeight }
      );
      width.value = dWidth;
      height.value = dHeight;
    });
  }, [uri, headers, width, height]);

  const doubleTap = Gesture.Tap()
    .maxDuration(250)
    .maxDelay(250)
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
      } else {
        scale.value = withTiming(doubleTapScaleValue, { duration: 300 });
        const currentX = (windowWidth / doubleTapScaleValue - e.x) * (doubleTapScaleValue - 1);
        const currentY = (windowHeight / doubleTapScaleValue - e.y) * (doubleTapScaleValue - 1);
        translationX.value = withTiming(currentX, { duration: 300 });
        translationY.value = withTiming(currentY, { duration: 300 });

        savedScale.value = doubleTapScaleValue;
        savedTranslationX.value = currentX;
        savedTranslationY.value = currentY;
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
    });
  const panGesture = Gesture.Pan()
    .averageTouches(true)
    .onChange((e) => {
      'worklet';
      const currentX = translationX.value + e.changeX;
      const currentY = translationY.value + e.changeY;

      if (savedScale.value === 1) {
        translationX.value = currentX;
        return;
      }

      if (currentX >= -left.value && currentX <= right.value) {
        translationX.value = currentX;
      }
      if (currentY >= -top.value && currentY <= bottom.value) {
        translationY.value = currentY;
      }
    })
    .onEnd(() => {
      'worklet';
      if (savedScale.value === 1) {
        if (Math.abs(savedTranslationX.value - translationX.value) > 50) {
          savedTranslationX.value > translationX.value ? runOnJS(onNext)() : runOnJS(onPrev)();
          translationX.value = withTiming(0, { duration: 300 });
          return;
        }

        translationX.value = withTiming(0, { duration: 500 });
        savedTranslationX.value = 0;
        return;
      }

      savedTranslationX.value = translationX.value;
      savedTranslationY.value = translationY.value;
    });

  return (
    <View w={windowWidth} h={windowHeight} bg="black">
      <GestureDetector gesture={doubleTap}>
        <GestureDetector gesture={panGesture}>
          <GestureDetector gesture={pinchGesture}>
            <Animated.View style={[styles.wrapper, animatedStyle]}>
              <Image source={{ uri, headers }} size="full" resizeMode="contain" alt="cover" />
            </Animated.View>
          </GestureDetector>
        </GestureDetector>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    height: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Controller;
