import React, { useState, useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Dimensions, TouchableWithoutFeedback } from 'react-native';
import { View, IconButton, Icon, HStack, Center } from 'native-base';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Controller from '~/components/Controller';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const cacheSize = 2;
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

interface ReaderProps {
  initPage?: number;
  data: {
    uri: string;
    headers: {
      [index: string]: string;
    };
  }[];
  onPageChange?: (page: number) => void;
  goBack: () => void;
}

const Reader = ({ initPage = 1, data, goBack, onPageChange }: ReaderProps) => {
  const [current, setCurrent] = useState(initPage - 1);
  const [maxIndex, setMaxIndex] = useState(current + 2);
  const [showExtra, setShowExtra] = useState(false);
  const width = useSharedValue(windowWidth * data.length);
  const height = useSharedValue(windowHeight);
  const translationX = useSharedValue(-(initPage - 1) * windowWidth);
  const savedTranslationX = useSharedValue(-(initPage - 1) * windowWidth);
  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
    height: height.value,
    transform: [{ translateX: translationX.value }],
  }));

  useEffect(() => {
    onPageChange && onPageChange(current + 1);
  }, [current, onPageChange]);

  const handlePrev = () => {
    setCurrent(Math.max(current - 1, 0));
  };
  const handleNext = () => {
    const newCurrent = Math.min(current + 1, data.length - 1);
    setCurrent(newCurrent);
    setMaxIndex(Math.max(maxIndex, newCurrent + cacheSize));
  };

  const panGesture = Gesture.Pan()
    .onChange((e) => {
      'worklet';
      const currentX = translationX.value + e.changeX;

      translationX.value = currentX;
    })
    .onEnd(() => {
      'worklet';
      const distance = Math.abs(savedTranslationX.value - translationX.value);
      if (distance > 50) {
        if (savedTranslationX.value > translationX.value) {
          translationX.value = withTiming(-(current + 1) * windowWidth, {
            duration: (1 - distance / windowWidth) * 300,
          });
          savedTranslationX.value = -(current + 1) * windowWidth;
          runOnJS(handleNext)();
        } else {
          translationX.value = withTiming(-(current - 1) * windowWidth, {
            duration: (1 - distance / windowWidth) * 300,
          });
          savedTranslationX.value = -(current - 1) * windowWidth;
          runOnJS(handlePrev)();
        }

        return;
      }

      translationX.value = withTiming(savedTranslationX.value, {
        duration: 300 * (distance / windowWidth),
      });
    });

  return (
    <TouchableWithoutFeedback onPress={() => setShowExtra(!showExtra)}>
      <View w="full" h="full" overflow="hidden" bg="black">
        <GestureDetector gesture={panGesture}>
          <Animated.FlatList
            horizontal
            data={data}
            style={animatedStyle}
            renderItem={({ item, index }) => {
              if (Math.abs(index - current) > cacheSize && index > maxIndex) {
                return null;
              }

              return <Controller uri={item.uri} headers={item.headers} />;
            }}
            keyExtractor={(item) => item.uri}
          />
        </GestureDetector>

        {showExtra && (
          <HStack position="absolute" top={0} alignItems="center" safeAreaTop>
            <IconButton
              icon={<Icon as={MaterialIcons} name="arrow-back" size={30} color="white" />}
              onPress={goBack}
            />

            <Center _text={{ color: 'white', fontWeight: 'bold' }} flexDirection="row">
              {current + 1} / {data.length}
            </Center>
          </HStack>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default Reader;
