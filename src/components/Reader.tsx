import React, { useState, useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Dimensions, TouchableWithoutFeedback } from 'react-native';
import { View, IconButton, Icon, Box } from 'native-base';
import Controller from '~components/Controller';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

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
  const [index, setIndex] = useState(0);
  const [showExtra, setShowExtra] = useState(false);
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translationX.value }, { translateY: translationY.value }],
  }));

  useEffect(() => {
    translationX.value = withTiming(-index * windowWidth, { duration: 300 });
  }, [index, translationX]);

  const handlePrev = () => {
    setIndex(Math.max(index - 1, 0));
  };
  const handleNext = () => {
    setIndex(Math.min(index + 1, data.length - 1));
  };

  return (
    <TouchableWithoutFeedback onPress={() => setShowExtra(!showExtra)}>
      <View w={windowWidth * data.length} bg="black" flex={1}>
        <Animated.FlatList
          horizontal
          data={data}
          style={animatedStyle}
          initialNumToRender={5}
          renderItem={({ item }) => (
            <Controller
              uri={item.uri}
              headers={item.headers}
              onPrev={handlePrev}
              onNext={handleNext}
            />
          )}
          keyExtractor={(item) => item.uri}
        />

        {showExtra && (
          <Box position="absolute" top={0} safeArea>
            <IconButton
              icon={<Icon as={MaterialIcons} name="arrow-back" size={30} color="white" />}
              onPress={goBack}
            />
          </Box>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default Reader;
