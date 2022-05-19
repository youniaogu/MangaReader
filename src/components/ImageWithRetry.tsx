import React, { useState } from 'react';
import { Image, Center, IconButton, Icon } from 'native-base';
import { CachedImage } from '@georstat/react-native-image-cache';
import { StyleSheet } from 'react-native';
import { nanoid } from '@reduxjs/toolkit';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { LoadStatus } = window;
const loadingGif = require('~/assets/ground-pound.gif');

interface StatusImageProps {
  uri: string;
  headers?: { [name: string]: string };
}

const ImageWithRetry = ({ uri, headers }: StatusImageProps) => {
  const [retryHash, setRetryHash] = useState(nanoid());
  const [loadStatus, setLoadStatus] = useState(LoadStatus.Pending);

  const handleLoadSuccess = () => {
    setLoadStatus(LoadStatus.Fulfilled);
  };
  const handleError = (event?: { nativeEvent: { error: Error } }) => {
    if (event?.nativeEvent.error.message === 'Could not load image') {
      setLoadStatus(LoadStatus.Rejected);
    }
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
  );
};

const styles = StyleSheet.create({
  img: {
    width: '100%',
    height: '100%',
  },
});

export default ImageWithRetry;
