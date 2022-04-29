import React, { useState, useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Dimensions, TouchableWithoutFeedback } from 'react-native';
import { View, IconButton, Icon, Box, Center } from 'native-base';
import Controller from '~/components/Controller';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const cacheSize = 2;
const windowWidth = Dimensions.get('window').width;

interface ReaderProps {
  data: {
    uri: string;
    headers: {
      [index: string]: string;
    };
  }[];
  goBack: () => void;
}

const Reader = ({ data, goBack }: ReaderProps) => {
  const [current, setCurrent] = useState(0);
  const [maxIndex, setMaxIndex] = useState(current + 2);
  const [showExtra, setShowExtra] = useState(false);
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translationX.value }, { translateY: translationY.value }],
  }));

  useEffect(() => {
    'worklet';
    translationX.value = withTiming(-current * windowWidth, { duration: 300 });
  }, [current, translationX]);

  const handlePrev = () => {
    setCurrent(Math.max(current - 1, 0));
  };
  const handleNext = () => {
    const newCurrent = Math.min(current + 1, data.length - 1);
    setCurrent(newCurrent);
    setMaxIndex(Math.max(maxIndex, newCurrent + cacheSize));
  };

  return (
    <TouchableWithoutFeedback onPress={() => setShowExtra(!showExtra)}>
      <View w={windowWidth * data.length} bg="black" flex={1}>
        <Animated.FlatList
          horizontal
          data={data}
          style={animatedStyle}
          renderItem={({ item, index }) => {
            if (Math.abs(index - current) > cacheSize && index > maxIndex) {
              return null;
            }

            return (
              <Controller
                uri={item.uri}
                headers={item.headers}
                onPrev={handlePrev}
                onNext={handleNext}
              />
            );
          }}
          keyExtractor={(item) => item.uri}
        />

        {showExtra && (
          <Box position="absolute" top={0} flexDirection="row" safeArea>
            <IconButton
              icon={<Icon as={MaterialIcons} name="arrow-back" size={30} color="white" />}
              onPress={goBack}
            />

            <Center _text={{ color: 'white', fontWeight: 'bold' }} flexDirection="row">
              {current + 1} / {data.length}
            </Center>
          </Box>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default Reader;
