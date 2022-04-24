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
const list = [
  'https://images.alphacoders.com/549/thumb-1920-549450.png',
  'https://s1.ax1x.com/2022/04/14/LlcpCD.png',
  'https://wallpapercave.com/uwp/uwp1102321.jpeg',
  'https://images.unsplash.com/photo-1596701008477-309aeefa29ad?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2231&q=80',
  'https://images.unsplash.com/photo-1591233244149-62ee33f538d7?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80',
  'https://images.unsplash.com/photo-1600251215707-95bb01c73f51?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=930&q=80',
  'https://images.unsplash.com/photo-1626238247302-2f3065c90ff5?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1674&q=80',
  'https://images.unsplash.com/photo-1563432161839-82786c3b4726?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2231&q=80',
];

const Controller = ({ onNext, onPrev }: any) => {
  const uri = list[5];

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

  useEffect(() => {
    ReactImage.getSize(uri, (w, h) => {
      const { dWidth, dHeight } = scaleToFit(
        { width: w, height: h },
        { width: windowWidth, height: windowHeight }
      );
      width.value = dWidth;
      height.value = dHeight;
      console.log('GET_SIZE!');
    });
  }, [uri, width, height]);

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
        savedTranslationX.value > translationX.value ? runOnJS(onNext)() : runOnJS(onPrev)();
        translationX.value = withTiming(0, { duration: 300 });
        return;
      }

      savedTranslationX.value = translationX.value;
      savedTranslationY.value = translationY.value;
    });

  return (
    <View w={windowWidth} h={windowHeight} bg="black">
      <GestureDetector gesture={panGesture}>
        <GestureDetector gesture={pinchGesture}>
          <Animated.View style={[styles.wrapper, animatedStyle]}>
            <Image source={{ uri }} size="full" resizeMode="contain" alt="cover" />
          </Animated.View>
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
