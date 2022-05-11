import React, { useState, useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Dimensions, TouchableWithoutFeedback } from 'react-native';
import { Box, IconButton, Icon, HStack, Center } from 'native-base';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Controller from '~/components/Controller';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const cacheSize = 5;
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
  const [displayIndex, setDisplayIndex] = useState(initPage - 1);
  const [showExtra, setShowExtra] = useState(false);
  const current = useSharedValue(initPage - 1);
  const length = useSharedValue(data.length);
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
    onPageChange && onPageChange(displayIndex + 1);
  }, [displayIndex, onPageChange]);

  const panGesture = Gesture.Pan()
    .onChange((e) => {
      'worklet';
      translationX.value += e.changeX;
    })
    .onEnd(() => {
      'worklet';
      const distance = Math.abs(savedTranslationX.value - translationX.value);
      if (distance > 50) {
        if (savedTranslationX.value > translationX.value && current.value < length.value - 1) {
          runOnJS(setDisplayIndex)(Math.min(current.value + 1, length.value - 1));
          translationX.value = withTiming(-(current.value + 1) * windowWidth, {
            duration: (1 - distance / windowWidth) * 300,
          });
          savedTranslationX.value = -(current.value + 1) * windowWidth;
          current.value += 1;
          return;
        }

        if (savedTranslationX.value < translationX.value && current.value > 0) {
          runOnJS(setDisplayIndex)(Math.max(current.value - 1, 0));
          translationX.value = withTiming(-(current.value - 1) * windowWidth, {
            duration: (1 - distance / windowWidth) * 300,
          });
          savedTranslationX.value = -(current.value - 1) * windowWidth;
          current.value -= 1;
          return;
        }
      }

      translationX.value = withTiming(savedTranslationX.value, {
        duration: 300 * (distance / windowWidth),
      });
    });

  return (
    <TouchableWithoutFeedback onPress={() => setShowExtra(!showExtra)}>
      <Box w="full" h="full" overflow="hidden" bg="black">
        <GestureDetector gesture={panGesture}>
          <Animated.FlatList
            horizontal
            data={data}
            style={animatedStyle}
            renderItem={({ item, index }) => {
              if (Math.abs(index - displayIndex) > cacheSize) {
                return <Box w={windowWidth} bg="black" />;
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
              {displayIndex + 1} / {data.length}
            </Center>
          </HStack>
        )}
      </Box>
    </TouchableWithoutFeedback>
  );
};

export default Reader;
