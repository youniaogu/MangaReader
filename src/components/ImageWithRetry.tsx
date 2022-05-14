import React, { useState } from 'react';
import { StyleSheet, TransformsStyle, ImageSourcePropType } from 'react-native';
import { Box, Center, Image, IconButton, Icon } from 'native-base';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Animated from 'react-native-reanimated';

const { LoadStatus } = window;
const loadingGif = require('~/assets/groundPound.gif');

interface StatusImageProps {
  source: ImageSourcePropType;
  animatedStyle?: TransformsStyle;
}

const StatusImage = ({ source, animatedStyle }: StatusImageProps) => {
  const [loadStatus, setLoadStatus] = useState(LoadStatus.Default);

  const handleLoadStart = () => {
    setLoadStatus(LoadStatus.Pending);
  };
  const handleLoadSuccess = () => {
    setLoadStatus(LoadStatus.Fulfilled);
  };
  const handleError = () => {
    setLoadStatus(LoadStatus.Rejected);
  };
  const handleRetry = () => {
    setLoadStatus(LoadStatus.Pending);
  };

  if (loadStatus === LoadStatus.Rejected) {
    return (
      <Center w="full" h="full" bg="black">
        <IconButton
          icon={
            <Icon as={MaterialIcons} name="refresh" size={30} color="white" onPress={handleRetry} />
          }
        />
      </Center>
    );
  }

  return (
    <Box position="relative">
      <Animated.Image
        source={source}
        style={[styles.img, animatedStyle]}
        resizeMode="contain"
        onLoadStart={handleLoadStart}
        onLoad={handleLoadSuccess}
        onError={handleError}
      />
      {loadStatus === LoadStatus.Pending && (
        <Center position="absolute" w="full" h="full" bg="black" zIndex={1}>
          <Image w="1/3" source={loadingGif} resizeMode="contain" alt="loading" />
        </Center>
      )}
    </Box>
  );
};

const styles = StyleSheet.create({
  img: {
    width: '100%',
    height: '100%',
  },
});

export default StatusImage;
