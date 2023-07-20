import React, { useCallback, useState, useMemo, useRef, memo } from 'react';
import { Image as ReactNativeImage, StyleSheet, useWindowDimensions } from 'react-native';
import { CachedImage, CacheManager } from '@georstat/react-native-image-cache';
import { AsyncStatus, mergeQuery } from '~/utils';
import { useFocusEffect } from '@react-navigation/native';
import { Center, Image } from 'native-base';
import { nanoid } from '@reduxjs/toolkit';
import Canvas, { Image as CanvasImage } from 'react-native-canvas';
import ErrorWithRetry from '~/components/ErrorWithRetry';
import FastImage from 'react-native-fast-image';
import md5 from 'blueimp-md5';

const groundPoundGif = require('~/assets/ground_pound.gif');
const maxPixelSize = 1024000;
const defaultState = {
  hash: '',
  dataUrl: '',
  fillHeight: undefined,
  loadStatus: AsyncStatus.Default,
};

export interface ImageState {
  hash: string;
  dataUrl: string;
  fillHeight?: number;
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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [imageState, setImageState] = useState(prevState);
  const source = useMemo(
    () => (imageState.hash ? mergeQuery(uri, 'hash', imageState.hash) : uri),
    [uri, imageState]
  );
  const defaultFillHeight = useMemo(() => (windowHeight * 3) / 5, [windowHeight]);
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
  }, [source, headers, imageState, horizontal, updateData, handleError, windowWidth, windowHeight]);
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
      .finally(() =>
        updateData({ ...imageState, hash: nanoid(), loadStatus: AsyncStatus.Default })
      );
  };

  if (
    imageState.loadStatus === AsyncStatus.Pending ||
    imageState.loadStatus === AsyncStatus.Default
  ) {
    return (
      <Center
        w={windowWidth}
        h={horizontal ? windowHeight : imageState.fillHeight || defaultFillHeight}
      >
        <Image
          style={{ width: Math.min(windowWidth * 0.3, 180), height: windowHeight }}
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
      <Center
        w={windowWidth}
        h={horizontal ? windowHeight : imageState.fillHeight || defaultFillHeight}
      >
        <ErrorWithRetry onRetry={handleRetry} />
      </Center>
    );
  }

  return (
    <CachedImage
      source={source}
      options={{ headers }}
      style={{
        width: windowWidth,
        height: horizontal ? windowHeight : imageState.fillHeight || defaultFillHeight,
      }}
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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [imageState, setImageState] = useState(prevState);
  const source = useMemo(
    () => (imageState.hash ? mergeQuery(uri, 'hash', imageState.hash) : uri),
    [uri, imageState]
  );
  const defaultFillHeight = useMemo(() => (windowHeight * 3) / 5, [windowHeight]);
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
    (base64: string, i: string) => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        const image = new CanvasImage(canvasRef.current);

        image.src = base64;
        image.addEventListener('load', (event) => {
          // don't use Image.getSize from react-native
          // Image.getSize return wrong width and height when image have a huge width or height
          // https://github.com/facebook/react-native/issues/31130
          // https://github.com/facebook/react-native/issues/33498
          const width = event.target.width;
          const height = event.target.height;
          const step = unscramble(i, width, height);

          if (canvasRef.current) {
            if (width * height >= maxPixelSize) {
              const scale = maxPixelSize / width / height;
              canvasRef.current.width = width * scale;
              canvasRef.current.height = height * scale;
              ctx.scale(scale, scale);
            } else {
              canvasRef.current.width = width;
              canvasRef.current.height = height;
              ctx.scale(1, 1);
            }
          } else {
            return handleError();
          }

          step.forEach(({ dx, dy, sx, sy, sWidth, sHeight, dWidth, dHeight }) => {
            ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
          });

          if (canvasRef.current) {
            canvasRef.current
              .toDataURL()
              .then((res) => {
                updateData({
                  ...imageState,
                  dataUrl: res.replace(/^"|"$/g, ''),
                  fillHeight: (height / width) * windowWidth,
                  loadStatus: AsyncStatus.Fulfilled,
                });
              })
              .catch(() => {
                handleError();
              });
          } else {
            handleError();
          }
        });
      } else {
        handleError();
      }
    },
    [imageState, updateData, handleError, windowWidth]
  );
  const loadImage = useCallback(() => {
    setImageState((state) => ({ ...state, loadStatus: AsyncStatus.Pending }));
    CacheManager.prefetchBlob(source, { headers })
      .then((base64) =>
        base64 ? base64ToUrl('data:image/jpeg;base64,' + base64, source) : handleError()
      )
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
      <Center
        w={windowWidth}
        h={horizontal ? windowHeight : imageState.fillHeight || defaultFillHeight}
      >
        <ErrorWithRetry onRetry={handleRetry} />
      </Center>
    );
  }
  if (
    imageState.loadStatus === AsyncStatus.Pending ||
    imageState.loadStatus === AsyncStatus.Default
  ) {
    return (
      <Center
        w={windowWidth}
        h={horizontal ? windowHeight : imageState.fillHeight || defaultFillHeight}
      >
        <Image
          style={{ width: Math.min(windowWidth * 0.3, 180), height: windowHeight }}
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

  // https://github.com/facebook/react-native/issues/21301
  // https://github.com/facebook/fresco/issues/2397
  // https://github.com/facebook/react-native/issues/32411
  return (
    <FastImage
      style={{
        width: windowWidth,
        height: horizontal ? windowHeight : imageState.fillHeight || defaultFillHeight,
      }}
      resizeMode={horizontal ? 'contain' : 'cover'}
      source={{ uri: imageState.dataUrl }}
    />
  );
};

const styles = StyleSheet.create({
  canvas: {
    zIndex: -1,
    opacity: 0,
    position: 'absolute',
  },
});

function getChapterId(uri: string) {
  const [, id] = uri.match(/\/([0-9]+)\//) || [];
  return Number(id);
}
function getPicIndex(uri: string) {
  const [, index] = uri.match(/\/([0-9]+)\./) || [];
  return index;
}
function getSplitNum(id: number, index: string) {
  var a = 10;
  if (id >= 268850) {
    const str = md5(id + index);
    const nub = str.substring(str.length - 1).charCodeAt(0) % (id >= 421926 ? 8 : 10);

    switch (nub) {
      case 0:
        a = 2;
        break;
      case 1:
        a = 4;
        break;
      case 2:
        a = 6;
        break;
      case 3:
        a = 8;
        break;
      case 4:
        a = 10;
        break;
      case 5:
        a = 12;
        break;
      case 6:
        a = 14;
        break;
      case 7:
        a = 16;
        break;
      case 8:
        a = 18;
        break;
      case 9:
        a = 20;
    }
  }
  return a;
}
function unscramble(uri: string, width: number, height: number) {
  const step = [];
  const id = getChapterId(uri);
  const index = getPicIndex(uri);
  const numSplit = getSplitNum(id, index);
  const perheight = height % numSplit;

  for (let i = 0; i < numSplit; i++) {
    let sHeight = Math.floor(height / numSplit);
    let dy = sHeight * i;
    const sy = height - sHeight * (i + 1) - perheight;

    if (i === 0) {
      sHeight += perheight;
    } else {
      dy += perheight;
    }

    step.push({
      sx: 0,
      sy,
      sWidth: width,
      sHeight,
      dx: 0,
      dy,
      dWidth: width,
      dHeight: sHeight,
    });
  }

  return step;
}

const ComicImage = ({ useJMC, ...props }: ComicImageProps) => {
  if (useJMC) {
    return <JMCImage {...props} />;
  }

  return <DefaultImage {...props} />;
};

export default memo(ComicImage);
