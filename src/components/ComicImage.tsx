import React, { useCallback, useState, useMemo, useRef, memo } from 'react';
import { Image as ReactNativeImage, StyleSheet, Dimensions } from 'react-native';
import { CachedImage, CacheManager } from '@georstat/react-native-image-cache';
import { AsyncStatus, scaleToFit, mergeQuery } from '~/utils';
import { useFocusEffect } from '@react-navigation/native';
import { Center, Image } from 'native-base';
import { unscramble } from '~/plugins/jmc';
import { nanoid } from '@reduxjs/toolkit';
import ErrorWithRetry from '~/components/ErrorWithRetry';
import Canvas, { Image as CanvasImage } from 'react-native-canvas';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
const windowScale = Dimensions.get('window').scale;
const maximumSize = 1864000;
const maximumScale = maximumSize / (windowScale * windowWidth * windowHeight);
const defaultState = {
  defaulthHash: '',
  defaultHeight: windowHeight,
  defaultStatus: AsyncStatus.Default,
  defaultDataUrl: '',
};

export interface ImageState {
  defaulthHash: string;
  defaultHeight: number;
  defaultStatus: AsyncStatus;
  defaultDataUrl: string;
}
export interface ImageProps {
  uri: string;
  headers?: { [name: string]: string };
  horizontal?: boolean;
  prevState?: ImageState;
  onSuccess?: ({
    width,
    height,
    hash,
    dataUrl,
  }: {
    width: number;
    height: number;
    hash: string;
    dataUrl: string;
  }) => void;
}
export interface ComicImageProps extends ImageProps {
  useJMC?: boolean;
}

const DefaultImage = ({
  uri,
  headers = {},
  horizontal = false,
  prevState = defaultState,
  onSuccess,
}: ImageProps) => {
  const [hash, setHash] = useState(prevState.defaulthHash);
  const [loadStatus, setLoadStatus] = useState(prevState.defaultStatus);
  const [imageHeight, setImageHeight] = useState(prevState.defaultHeight);
  const source = useMemo(() => {
    if (hash) {
      return mergeQuery(uri, 'hash', hash);
    }
    return uri;
  }, [uri, hash]);

  useFocusEffect(
    useCallback(() => {
      loadStatus === AsyncStatus.Default && setLoadStatus(AsyncStatus.Pending);
    }, [loadStatus])
  );

  const handleLoadSuccess = () => {
    if (loadStatus === AsyncStatus.Pending) {
      if (!horizontal) {
        CacheManager.prefetchBlob(source, { headers })
          .then((base64) => {
            if (!base64) {
              handleError();
              return;
            }
            base64 = 'data:image/png;base64,' + base64;

            ReactNativeImage.getSizeWithHeaders(base64, headers, (width, height) => {
              const fillHeight = (height / width) * windowWidth;
              onSuccess &&
                onSuccess({ width: windowWidth, height: fillHeight, hash, dataUrl: source });
              setImageHeight(fillHeight);
              setLoadStatus(AsyncStatus.Fulfilled);
            });
          })
          .catch(handleError);
      } else {
        onSuccess && onSuccess({ width: windowWidth, height: windowHeight, hash, dataUrl: source });
        setLoadStatus(AsyncStatus.Fulfilled);
      }
    }
  };
  const handleError = () => {
    setLoadStatus(AsyncStatus.Rejected);
  };
  const handleRetry = () => {
    CacheManager.removeCacheEntry(source)
      .then(() => {})
      .catch(() => {})
      .finally(() => {
        setHash(nanoid());
        setLoadStatus(AsyncStatus.Pending);
      });
  };

  if (loadStatus === AsyncStatus.Rejected) {
    return <ErrorWithRetry height="full" onRetry={handleRetry} />;
  }

  return (
    <>
      <CachedImage
        source={source}
        options={{ headers }}
        style={horizontal ? styles.contain : { ...styles.cover, height: imageHeight }}
        resizeMode={horizontal ? 'contain' : 'cover'}
        onLoad={handleLoadSuccess}
        onError={handleError}
      />
      {loadStatus === AsyncStatus.Pending && (
        <Center position="absolute" w="full" h="full" bg="black">
          <CachedImage
            source="https://raw.githubusercontent.com/youniaogu/walfie-gif/master/ground%20pound.gif"
            resizeMode="contain"
            style={styles.loading}
          />
        </Center>
      )}
    </>
  );
};

const JMCImage = ({
  uri,
  headers = {},
  horizontal = false,
  prevState = defaultState,
  onSuccess,
}: ImageProps) => {
  const [hash, setHash] = useState(prevState.defaulthHash);
  const [dataUrl, setDataUrl] = useState(prevState.defaultDataUrl);
  const [loadStatus, setLoadStatus] = useState(prevState.defaultStatus);
  const [imageHeight, setImageHeight] = useState(prevState.defaultHeight);
  const canvasRef = useRef<Canvas>(null);
  const source = useMemo(() => {
    if (hash) {
      return mergeQuery(uri, 'hash', hash);
    }
    return uri;
  }, [uri, hash]);

  const base64ToUrl = useCallback(
    (base64: string, width: number, height: number) => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        const step = unscramble(source, width, height);
        const image = new CanvasImage(canvasRef.current, height, width);
        image.src = base64;

        const container = scaleToFit(
          { width, height },
          { width: windowWidth * maximumScale, height: windowHeight * maximumScale }
        );

        canvasRef.current.width = container.dWidth;
        canvasRef.current.height = container.dHeight;

        image.addEventListener('load', () => {
          let prevDy: number = 0;
          let prevDh: number = 0;
          step.forEach(({ dx, dy, sx, sy, sWidth, sHeight, dWidth, dHeight }, index) => {
            if (index <= 0) {
              prevDy = dy * container.scale;
            } else {
              prevDy = prevDh + prevDy;
            }
            prevDh = dHeight * container.scale;

            ctx.drawImage(
              image,
              sx,
              sy,
              sWidth,
              sHeight,
              dx * container.scale,
              prevDy,
              dWidth * container.scale,
              prevDh
            );
          });

          if (canvasRef.current) {
            canvasRef.current.toDataURL().then((res) => {
              const fillHeight = (height / width) * windowWidth;
              onSuccess &&
                onSuccess({
                  width: windowWidth,
                  height: fillHeight,
                  hash,
                  dataUrl: res.replace(/^"|"$/g, ''),
                });
              setDataUrl(res.replace(/^"|"$/g, ''));
              setImageHeight(fillHeight);
              setLoadStatus(AsyncStatus.Fulfilled);
            });
          }
        });
      }
    },
    [source, hash, onSuccess]
  );

  useFocusEffect(
    useCallback(() => {
      if (loadStatus === AsyncStatus.Default) {
        setLoadStatus(AsyncStatus.Pending);
        CacheManager.prefetchBlob(source, { headers })
          .then((base64) => {
            if (!base64) {
              handleError();
              return;
            }
            base64 = 'data:image/png;base64,' + base64;

            ReactNativeImage.getSizeWithHeaders(base64, headers, (width, height) =>
              base64ToUrl(base64 as string, width, height)
            );
          })
          .catch(handleError);
      }
    }, [source, headers, loadStatus, base64ToUrl])
  );

  const handleError = () => {
    setLoadStatus(AsyncStatus.Rejected);
  };
  const handleRetry = () => {
    CacheManager.removeCacheEntry(source)
      .then(() => {})
      .catch(() => {})
      .finally(() => {
        setLoadStatus(AsyncStatus.Default);
        setHash(nanoid());
      });
  };

  if (loadStatus === AsyncStatus.Rejected) {
    return <ErrorWithRetry height="full" onRetry={handleRetry} />;
  }

  if (!dataUrl || loadStatus === AsyncStatus.Pending) {
    return (
      <Center w={windowWidth} h={windowHeight} bg="black">
        <CachedImage
          source="https://raw.githubusercontent.com/youniaogu/walfie-gif/master/ground%20pound.gif"
          resizeMode="contain"
          style={styles.loading}
        />
        <Canvas key={hash} ref={canvasRef} style={styles.canvas} />
      </Center>
    );
  }

  return (
    <Image
      w={horizontal ? 'full' : windowWidth}
      h={horizontal ? 'full' : imageHeight}
      resizeMode={horizontal ? 'contain' : 'cover'}
      source={{ uri: dataUrl }}
      alt="page"
      bg="black"
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
  canvas: {
    zIndex: -1,
    opacity: 0,
    position: 'absolute',
  },
});

const ComicImage = ({ useJMC, ...props }: ComicImageProps) => {
  if (useJMC) {
    return <JMCImage {...props} />;
  }

  return <DefaultImage {...props} />;
};

export default memo(ComicImage);
