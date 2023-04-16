import React, { useCallback, useState, useMemo, useRef, memo } from 'react';
import { Image as ReactNativeImage, StyleSheet, Dimensions } from 'react-native';
import { CachedImage, CacheManager } from '@georstat/react-native-image-cache';
import { AsyncStatus, aspectFit, mergeQuery } from '~/utils';
import { useFocusEffect } from '@react-navigation/native';
import { Center, Image } from 'native-base';
import { unscramble } from '~/plugins/jmc';
import { nanoid } from '@reduxjs/toolkit';
import Canvas, { Image as CanvasImage } from 'react-native-canvas';
import ErrorWithRetry from '~/components/ErrorWithRetry';

const groundPoundGif = require('~/assets/ground_pound.gif');
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
const defaultState = {
  hash: '',
  dataUrl: '',
  fillHeight: (windowHeight * 3) / 5,
  loadStatus: AsyncStatus.Default,
};

export interface ImageState {
  hash: string;
  dataUrl: string;
  fillHeight: number;
  loadStatus: AsyncStatus;
}
export interface ImageProps {
  uri: string;
  index: number;
  headers?: { [name: string]: string };
  horizontal?: boolean;
  prevState?: ImageState;
  onChange?: (state: ImageState, idx?: number) => void;
}
export interface ComicImageProps extends ImageProps {
  useJMC?: boolean;
}

const DefaultImage = ({
  uri,
  index,
  headers = {},
  horizontal = false,
  prevState = defaultState,
  onChange,
}: ImageProps) => {
  const [imageState, setImageState] = useState(prevState);
  const source = useMemo(
    () => (imageState.hash ? mergeQuery(uri, 'hash', imageState.hash) : uri),
    [uri, imageState]
  );
  const uriRef = useRef(uri);

  const updateData = useCallback(
    (data: ImageState) => {
      let isUnmounted = false;
      onChange && onChange(data, index);
      !isUnmounted && setImageState(data);

      return () => {
        isUnmounted = true;
      };
    },
    [index, onChange]
  );
  const handleError = useCallback(() => {
    updateData({ ...imageState, loadStatus: AsyncStatus.Rejected });
  }, [imageState, updateData]);
  const loadImage = useCallback(() => {
    setImageState({ ...imageState, loadStatus: AsyncStatus.Pending });
    CacheManager.prefetchBlob(source, { headers })
      .then((base64) => {
        if (!base64) {
          handleError();
          return;
        }
        if (horizontal) {
          updateData({
            ...imageState,
            dataUrl: source,
            fillHeight: windowHeight,
            loadStatus: AsyncStatus.Fulfilled,
          });
          return;
        }

        base64 = 'data:image/png;base64,' + base64;
        ReactNativeImage.getSize(base64, (width, height) => {
          updateData({
            ...imageState,
            dataUrl: source,
            fillHeight: (height / width) * windowWidth,
            loadStatus: AsyncStatus.Fulfilled,
          });
        });
      })
      .catch(handleError);
  }, [source, headers, imageState, horizontal, updateData, handleError]);
  useFocusEffect(
    useCallback(() => {
      if (imageState.loadStatus === AsyncStatus.Default) {
        loadImage();
      }
    }, [imageState, loadImage])
  );
  useFocusEffect(
    useCallback(() => {
      if (uriRef.current !== uri) {
        uriRef.current = uri;
        setImageState(prevState);
      }
    }, [uri, prevState])
  );

  const handleRetry = () => {
    CacheManager.removeCacheEntry(source)
      .then(() => {})
      .catch(() => {})
      .finally(() => {
        const newHash = nanoid();
        updateData({ ...imageState, hash: newHash, loadStatus: AsyncStatus.Default });
      });
  };

  if (
    imageState.loadStatus === AsyncStatus.Pending ||
    imageState.loadStatus === AsyncStatus.Default
  ) {
    return (
      <Center w={windowWidth} h={horizontal ? windowHeight : imageState.fillHeight} bg="black">
        <Image
          style={styles.loading}
          resizeMode="contain"
          resizeMethod="resize"
          fadeDuration={0}
          source={groundPoundGif}
          alt="groundpound"
        />
      </Center>
    );
  }
  if (imageState.loadStatus === AsyncStatus.Rejected) {
    return (
      <Center w={windowWidth} h={horizontal ? windowHeight : imageState.fillHeight} bg="black">
        <ErrorWithRetry onRetry={handleRetry} />
      </Center>
    );
  }

  return (
    <CachedImage
      source={source}
      options={{ headers }}
      style={{ width: windowWidth, height: horizontal ? windowHeight : imageState.fillHeight }}
      resizeMode={horizontal ? 'contain' : 'cover'}
      onError={handleError}
    />
  );
};

const JMCImage = ({
  uri,
  index,
  headers = {},
  horizontal = false,
  prevState = defaultState,
  onChange,
}: ImageProps) => {
  const [imageState, setImageState] = useState(prevState);
  const source = useMemo(
    () => (imageState.hash ? mergeQuery(uri, 'hash', imageState.hash) : uri),
    [uri, imageState]
  );
  const canvasRef = useRef<Canvas>(null);
  const uriRef = useRef(uri);

  const updateData = useCallback(
    (data: ImageState) => {
      let isUnmounted = false;
      onChange && onChange(data, index);
      !isUnmounted && setImageState(data);

      return () => {
        isUnmounted = true;
      };
    },
    [index, onChange]
  );
  const handleError = useCallback(() => {
    updateData({ ...imageState, loadStatus: AsyncStatus.Rejected });
  }, [imageState, updateData]);
  const base64ToUrl = useCallback(
    (base64: string, width: number, height: number) => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        const step = unscramble(source, width, height);
        const image = new CanvasImage(canvasRef.current, height, width);
        image.src = base64;

        const container = aspectFit(
          { width, height },
          { width: windowWidth, height: windowHeight }
        );

        canvasRef.current.width = container.dWidth;
        canvasRef.current.height = container.dHeight;

        image.addEventListener('load', () => {
          let prevDy: number = 0;
          let prevDh: number = 0;
          step.forEach(({ dx, dy, sx, sy, sWidth, sHeight, dWidth, dHeight }, idx) => {
            if (idx <= 0) {
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
              updateData({
                ...imageState,
                dataUrl: res.replace(/^"|"$/g, ''),
                fillHeight: (height / width) * windowWidth,
                loadStatus: AsyncStatus.Fulfilled,
              });
            });
          } else {
            handleError();
          }
        });
      } else {
        handleError();
      }
    },
    [source, imageState, updateData, handleError]
  );
  const loadImage = useCallback(() => {
    setImageState((state) => ({ ...state, loadStatus: AsyncStatus.Pending }));
    CacheManager.prefetchBlob(source, { headers })
      .then((base64) => {
        if (!base64) {
          handleError();
          return;
        }
        base64 = 'data:image/png;base64,' + base64;

        ReactNativeImage.getSize(base64, (width, height) => {
          base64ToUrl(base64 as string, width, height);
        });
      })
      .catch(handleError);
  }, [source, headers, base64ToUrl, handleError]);
  useFocusEffect(
    useCallback(() => {
      if (imageState.loadStatus === AsyncStatus.Default) {
        loadImage();
      }
    }, [imageState, loadImage])
  );
  useFocusEffect(
    useCallback(() => {
      if (uriRef.current !== uri) {
        uriRef.current = uri;
        setImageState(prevState);
      }
    }, [uri, prevState])
  );

  const handleRetry = () => {
    CacheManager.removeCacheEntry(source)
      .then(() => {})
      .catch(() => {})
      .finally(() => {
        const newHash = nanoid();
        updateData({ ...prevState, hash: newHash, loadStatus: AsyncStatus.Default });
      });
  };

  if (imageState.loadStatus === AsyncStatus.Rejected) {
    return (
      <Center w={windowWidth} h={horizontal ? windowHeight : imageState.fillHeight} bg="black">
        <ErrorWithRetry onRetry={handleRetry} />
      </Center>
    );
  }
  if (
    imageState.loadStatus === AsyncStatus.Pending ||
    imageState.loadStatus === AsyncStatus.Default
  ) {
    return (
      <Center w={windowWidth} h={horizontal ? windowHeight : imageState.fillHeight} bg="black">
        <Image
          style={styles.loading}
          resizeMode="contain"
          resizeMethod="resize"
          fadeDuration={0}
          source={groundPoundGif}
          alt="groundpound"
        />
        <Canvas ref={canvasRef} style={styles.canvas} />
      </Center>
    );
  }

  return (
    <Image
      w={horizontal ? windowWidth : windowWidth}
      h={horizontal ? windowHeight : imageState.fillHeight}
      resizeMode={horizontal ? 'contain' : 'cover'}
      resizeMethod="resize"
      fadeDuration={0}
      source={{ uri: imageState.dataUrl }}
      alt="page"
      bg="black"
    />
  );
};

const styles = StyleSheet.create({
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
