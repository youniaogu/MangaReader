import React, { useRef } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Dimensions } from 'react-native';
import { View } from 'native-base';
import Controller from '~components/Controller';

const windowWidth = Dimensions.get('window').width;

const Reader = () => {
  const flatListRef = useRef<Animated.FlatList<string>>(null);

  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translationX.value }, { translateY: translationY.value }],
  }));

  const handlePrev = () => {
    translationX.value = withTiming(translationX.value + windowWidth, { duration: 300 });
  };
  const handleNext = () => {
    translationX.value = withTiming(translationX.value - windowWidth, { duration: 300 });
  };

  return (
    <View w={windowWidth * 4} bg="black" flex={1}>
      <Animated.FlatList
        horizontal
        ref={flatListRef}
        style={animatedStyle}
        data={['1', '2', '3', '4', '5', '6', '7', '8']}
        initialNumToRender={1}
        renderItem={() => <Controller onPrev={handlePrev} onNext={handleNext} />}
        keyExtractor={(item) => item}
      />
    </View>
  );
};

export default Reader;
