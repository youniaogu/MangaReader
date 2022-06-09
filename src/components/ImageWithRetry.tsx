import React, { useState, memo } from 'react';
import { CachedImage, CacheManager } from '@georstat/react-native-image-cache';
import { Center, IconButton, Icon } from 'native-base';
import { StyleSheet } from 'react-native';
import { nanoid } from '@reduxjs/toolkit';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { AsyncStatus } = window;

interface StatusImageProps {
  uri: string;
  headers?: { [name: string]: string };
}

const ImageWithRetry = ({ uri, headers }: StatusImageProps) => {
  const [retryHash, setRetryHash] = useState(nanoid());
  const [loadStatus, setLoadStatus] = useState(AsyncStatus.Pending);

  const handleLoadSuccess = () => {
    setLoadStatus(AsyncStatus.Fulfilled);
  };
  const handleError = () => {
    setLoadStatus(AsyncStatus.Rejected);
  };
  const handleRetry = () => {
    CacheManager.removeCacheEntry(uri)
      .then(() => {})
      .catch(() => {})
      .finally(() => {
        setLoadStatus(AsyncStatus.Pending);
        setRetryHash(nanoid());
      });
  };

  if (loadStatus === AsyncStatus.Rejected) {
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
          <CachedImage
            source="https://raw.githubusercontent.com/youniaogu/walfie-gif/master/ground%20pound.gif"
            resizeMode="contain"
            style={styles.loading}
          />
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
  loading: {
    width: '30%',
    height: '100%',
  },
});

export default memo(ImageWithRetry);
