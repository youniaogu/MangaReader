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

const groundPoundGif = require('~/assets/ground_pound.gif');
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
const windowScale = Dimensions.get('window').scale;
const maximumSize = 1864000;
const maximumScale = maximumSize / (windowScale * windowWidth * windowHeight);
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
  headers?: { [name: string]: string };
  horizontal?: boolean;
  prevState?: ImageState;
  onChange?: (state: ImageState) => void;
}
export interface ComicImageProps extends ImageProps {
  useJMC?: boolean;
}

const DefaultImage = ({
  uri,
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

  const handleError = useCallback(() => {
    onChange && onChange({ ...imageState, loadStatus: AsyncStatus.Rejected });
    setImageState({ ...imageState, loadStatus: AsyncStatus.Rejected });
  }, [imageState, onChange]);
  const loadImage = useCallback(() => {
    setImageState({ ...imageState, loadStatus: AsyncStatus.Pending });
    CacheManager.prefetchBlob(source, { headers })
      .then((base64) => {
        if (!base64) {
          handleError();
          return;
        }
        if (horizontal) {
          onChange &&
            onChange({
              ...imageState,
              dataUrl: source,
              fillHeight: windowHeight,
              loadStatus: AsyncStatus.Fulfilled,
            });
          setImageState({
            ...imageState,
            dataUrl: source,
            fillHeight: windowHeight,
            loadStatus: AsyncStatus.Fulfilled,
          });
          return;
        }

        base64 = 'data:image/png;base64,' + base64;
        ReactNativeImage.getSize(base64, (width, height) => {
          const imageHeight = (height / width) * windowWidth;
          onChange &&
            onChange({
              ...imageState,
              dataUrl: source,
              fillHeight: imageHeight,
              loadStatus: AsyncStatus.Fulfilled,
            });
          setImageState({
            ...imageState,
            dataUrl: source,
            fillHeight: imageHeight,
            loadStatus: AsyncStatus.Fulfilled,
          });
        });
      })
      .catch(handleError);
  }, [source, headers, imageState, horizontal, onChange, handleError]);
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
        onChange && onChange({ ...imageState, hash: newHash, loadStatus: AsyncStatus.Default });
        setImageState({ ...imageState, hash: newHash, loadStatus: AsyncStatus.Default });
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
      style={horizontal ? styles.contain : { ...styles.cover, height: imageState.fillHeight }}
      resizeMode={horizontal ? 'contain' : 'cover'}
      onError={handleError}
    />
  );
};

const JMCImage = ({
  uri,
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

  const handleError = useCallback(() => {
    onChange && onChange({ ...imageState, loadStatus: AsyncStatus.Rejected });
    setImageState({ ...imageState, loadStatus: AsyncStatus.Rejected });
  }, [imageState, onChange]);
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
              const imageHeight = (height / width) * windowWidth;
              const newSource = res.replace(/^"|"$/g, '');
              onChange &&
                onChange({
                  ...imageState,
                  dataUrl: newSource,
                  fillHeight: imageHeight,
                  loadStatus: AsyncStatus.Fulfilled,
                });
              setImageState({
                ...imageState,
                dataUrl: newSource,
                fillHeight: imageHeight,
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
    [source, imageState, onChange, handleError]
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

        ReactNativeImage.getSizeWithHeaders(base64, headers, (width, height) =>
          base64ToUrl(base64 as string, width, height)
        );
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
        onChange && onChange({ ...prevState, hash: newHash, loadStatus: AsyncStatus.Default });
        setImageState((state) => ({ ...state, hash: newHash, loadStatus: AsyncStatus.Default }));
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
      source={{ uri: imageState.dataUrl }}
      alt="page"
      bg="black"
    />
  );
};

const styles = StyleSheet.create({
  contain: {
    width: windowWidth,
    height: windowHeight,
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
