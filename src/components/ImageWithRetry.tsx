import React, { useState, memo } from 'react';
import { Image as ReactNativeImage, StyleSheet, Dimensions } from 'react-native';
import { CachedImage, CacheManager } from '@georstat/react-native-image-cache';
import { AsyncStatus } from '~/utils';
import { nanoid } from '@reduxjs/toolkit';
import { Center } from 'native-base';
import ErrorWithRetry from '~/components/ErrorWithRetry';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

interface ImageWithRetryProps {
  uri: string;
  headers?: { [name: string]: string };
  horizontal?: boolean;
  onSuccess?: ({ width, height }: { width: number; height: number }) => void;
}

const ImageWithRetry = ({
  uri,
  headers = {},
  horizontal = false,
  onSuccess,
}: ImageWithRetryProps) => {
  const [retryHash, setRetryHash] = useState(nanoid());
  const [loadStatus, setLoadStatus] = useState(AsyncStatus.Pending);
  const [imageHeight, setImageHeight] = useState(windowHeight);

  const handleLoadSuccess = () => {
    setLoadStatus(AsyncStatus.Fulfilled);

    if (!horizontal) {
      CacheManager.prefetchBlob(uri, { headers })
        .then((base64) => {
          if (!base64) {
            handleError();
            return;
          }
          base64 = 'data:image/png;base64,' + base64;

          ReactNativeImage.getSizeWithHeaders(base64, headers, (width, height) => {
            const fillHeight = (height / width) * windowWidth;
            setImageHeight(fillHeight);
            onSuccess && onSuccess({ width: windowWidth, height: fillHeight });
          });
        })
        .catch(handleError);
    }
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
    return <ErrorWithRetry onRetry={handleRetry} />;
  }

  return (
    <CachedImage
      key={retryHash}
      source={uri}
      options={{ headers }}
      style={horizontal ? styles.contain : { ...styles.cover, height: imageHeight }}
      resizeMode={horizontal ? 'contain' : 'cover'}
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
  contain: {
    width: '100%',
    height: '100%',
  },
  cover: {
    width: windowWidth,
  },
  loading: {
    width: windowWidth * 0.3,
    height: windowHeight,
  },
});

export default memo(ImageWithRetry);
