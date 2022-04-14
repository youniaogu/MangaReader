import React, { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Image as ReactImage, StyleSheet, Dimensions } from 'react-native';
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

const Reader = () => {
  const uri = list[0];
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  useEffect(() => {
    ReactImage.getSize(uri, (w, h) => {
      console.log({ w, h });
      console.log({ windowWidth, windowHeight });
      console.log(
        scaleToFit({ width: w, height: h }, { width: windowWidth, height: windowHeight })
      );
    });
  }, [uri]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale < 1 ? 1 : savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });
  const panGesture = Gesture.Pan()
    .enabled(false)
    .averageTouches(true)
    .onChange((e) => {
      'worklet';
      translationX.value = translationX.value + e.changeX < 0 ? 0 : translationX.value + e.changeX;
      translationY.value = translationY.value + e.changeY < 0 ? 0 : translationY.value + e.changeY;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value },
      { translateY: translationY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View w="100%" h="100%" bg="black">
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

export default Reader;
