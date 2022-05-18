import React, { useState } from 'react';
import { Center, Image, IconButton, Icon } from 'native-base';
import { StyleSheet, TransformsStyle } from 'react-native';
import { CachedImage } from '@georstat/react-native-image-cache';
import { nanoid } from '@reduxjs/toolkit';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Animated from 'react-native-reanimated';

const { LoadStatus } = window;
const loadingGif = require('~/assets/groundPound.gif');

interface StatusImageProps {
  uri: string;
  headers?: { [name: string]: string };
  animatedStyle?: TransformsStyle;
}

const ImageWithRetry = ({ uri, headers, animatedStyle }: StatusImageProps) => {
  const [retryHash, setRetryHash] = useState(nanoid());
  const [loadStatus, setLoadStatus] = useState(LoadStatus.Pending);

  const handleLoadSuccess = () => {
    setLoadStatus(LoadStatus.Fulfilled);
  };
  const handleError = () => {
    setLoadStatus(LoadStatus.Rejected);
  };
  const handleRetry = () => {
    setLoadStatus(LoadStatus.Pending);
    setRetryHash(nanoid());
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
    <Animated.View style={animatedStyle}>
      <CachedImage
        key={retryHash}
        source={uri}
        options={{ headers }}
        style={styles.img}
        resizeMode="contain"
        onLoad={handleLoadSuccess}
        onError={handleError}
        loadingImageComponent={() => (
          <Center position="absolute" w="full" h="full" bg="black">
            <Image w="1/3" source={loadingGif} resizeMode="contain" alt="loading" />
          </Center>
        )}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  img: {
    width: '100%',
    height: '100%',
  },
});

export default ImageWithRetry;
