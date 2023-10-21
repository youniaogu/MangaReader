import React, { useCallback, useState, useMemo, useRef, memo } from 'react';
import {
  Image as ReactNativeImage,
  StyleSheet,
  Dimensions,
  StyleProp,
  ImageStyle,
} from 'react-native';
import { aspectFit, AsyncStatus, LayoutMode, Orientation, ScrambleType, unscramble } from '~/utils';
import { CachedImage, CacheManager } from '@georstat/react-native-image-cache';
import { useFocusEffect } from '@react-navigation/native';
import { Center, Image } from 'native-base';
import { useDimensions } from '~/hooks';
import Canvas, { Image as CanvasImage } from 'react-native-canvas';
import ErrorWithRetry from '~/components/ErrorWithRetry';
import FastImage, { ImageStyle as FastImageStyle, ResizeMode } from 'react-native-fast-image';

const groundPoundGif = require('~/assets/ground_pound.gif');
const windowScale = Dimensions.get('window').scale;
const maxPixelSize = 4096 * 4096;
const resizeModeDict: Record<LayoutMode, ResizeMode> = {
  [LayoutMode.Horizontal]: 'contain',
  [LayoutMode.Vertical]: 'cover',
  [LayoutMode.Multiple]: 'contain',
};

const defaultState = {
  dataUrl: '',
  landscapeHeight: undefined,
  portraitHeight: undefined,
  loadStatus: AsyncStatus.Default,
};

export interface ImageState {
  dataUrl: string;
  landscapeHeight?: number;
  portraitHeight?: number;
  multipleFitWidth?: number;
  multipleFitHeight?: number;
  loadStatus: AsyncStatus;
}
export interface ImageProps {
  uri: string;
  index: number;
  headers?: { [name: string]: string };
  layoutMode?: LayoutMode;
  prevState?: ImageState;
  onChange?: (state: ImageState, idx?: number) => void;
}
export interface ComicImageProps extends ImageProps {
  needUnscramble?: boolean;
  scrambleType?: ScrambleType;
}

const DefaultImage = ({
  uri,
  index,
  headers = {},
  layoutMode = LayoutMode.Horizontal,
  prevState = defaultState,
  onChange,
}: ImageProps) => {
  const { width: windowWidth, height: windowHeight, orientation } = useDimensions();
  const [imageState, setImageState] = useState(prevState);
  const defaultFillHeight = useMemo(() => (windowHeight * 3) / 5, [windowHeight]);
  const style = useMemo<StyleProp<ImageStyle>>(() => {
    if (layoutMode === LayoutMode.Horizontal) {
      return {
        width: '100%',
        height: '100%',
      };
    } else if (layoutMode === LayoutMode.Vertical) {
      return {
        width: '100%',
        height:
          (orientation === Orientation.Landscape
            ? imageState.landscapeHeight
            : imageState.portraitHeight) || defaultFillHeight,
      };
    }
    // LayoutMode.Multiple
    return {
      width: imageState.multipleFitWidth || '100%',
      height: imageState.multipleFitHeight || '100%',
    };
  }, [layoutMode, imageState, orientation, defaultFillHeight]);
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
    CacheManager.prefetchBlob(uri, { headers })
      .then((base64) => {
        if (!base64) {
          handleError();
          return;
        }
        if (layoutMode === LayoutMode.Horizontal) {
          updateData({ ...imageState, dataUrl: uri, loadStatus: AsyncStatus.Fulfilled });
          return;
        }

        base64 = 'data:image/png;base64,' + base64;
        ReactNativeImage.getSize(base64, (width, height) => {
          const { dWidth, dHeight } = aspectFit(
            { width, height },
            { width: windowWidth / 2, height: windowHeight }
          );
          updateData({
            ...imageState,
            dataUrl: uri,
            multipleFitWidth: dWidth,
            multipleFitHeight: dHeight,
            landscapeHeight: (height / width) * Math.max(windowWidth, windowHeight),
            portraitHeight: (height / width) * Math.min(windowWidth, windowHeight),
            loadStatus: AsyncStatus.Fulfilled,
          });
        });
      })
      .catch(handleError);
  }, [uri, headers, imageState, layoutMode, updateData, handleError, windowWidth, windowHeight]);
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
    CacheManager.removeCacheEntry(uri)
      .then(() => {})
      .catch(() => {})
      .finally(() => updateData({ ...imageState, loadStatus: AsyncStatus.Default }));
  };

  if (
    imageState.loadStatus === AsyncStatus.Pending ||
    imageState.loadStatus === AsyncStatus.Default
  ) {
    return (
      <Center style={style}>
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
      <Center style={style}>
        <ErrorWithRetry onRetry={handleRetry} />
      </Center>
    );
  }

  return (
    <CachedImage
      source={uri}
      options={{ headers }}
      style={style}
      resizeMode={resizeModeDict[layoutMode]}
      onError={handleError}
    />
  );
};

const ScrambleImage = ({
  uri,
  index,
  headers = {},
  layoutMode = LayoutMode.Horizontal,
  prevState = defaultState,
  onChange,
  scrambleType,
}: ImageProps & { scrambleType?: ScrambleType }) => {
  const { width: windowWidth, height: windowHeight, orientation } = useDimensions();
  const [imageState, setImageState] = useState(prevState);
  const defaultFillHeight = useMemo(() => (windowHeight * 3) / 5, [windowHeight]);
  const style = useMemo<StyleProp<FastImageStyle>>(() => {
    if (layoutMode === LayoutMode.Horizontal) {
      return {
        width: '100%',
        height: '100%',
      };
    } else if (layoutMode === LayoutMode.Vertical) {
      return {
        width: '100%',
        height:
          (orientation === Orientation.Landscape
            ? imageState.landscapeHeight
            : imageState.portraitHeight) || defaultFillHeight,
      };
    }
    // LayoutMode.Multiple
    return {
      width: imageState.multipleFitWidth || '100%',
      height: imageState.multipleFitHeight || '100%',
    };
  }, [layoutMode, imageState, orientation, defaultFillHeight]);
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
          const step = unscramble(i, width, height, scrambleType);

          if (canvasRef.current) {
            // if image size more than maxPixelSize, scale image to smaller
            const imageScale = Math.floor(Math.min(maxPixelSize / (width * height), 1) * 100) / 100;
            const scale = imageScale / windowScale;

            canvasRef.current.width = width * scale;
            canvasRef.current.height = height * scale;
            ctx.scale(scale, scale);
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
                const { dWidth, dHeight } = aspectFit(
                  { width, height },
                  { width: windowWidth / 2, height: windowHeight }
                );
                updateData({
                  ...imageState,
                  dataUrl: res.replace(/^"|"$/g, ''),
                  multipleFitWidth: dWidth,
                  multipleFitHeight: dHeight,
                  landscapeHeight: (height / width) * Math.max(windowWidth, windowHeight),
                  portraitHeight: (height / width) * Math.min(windowWidth, windowHeight),
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
    [imageState, updateData, handleError, windowWidth, windowHeight, scrambleType]
  );
  const loadImage = useCallback(() => {
    setImageState((state) => ({ ...state, loadStatus: AsyncStatus.Pending }));
    CacheManager.prefetchBlob(uri, { headers })
      .then((base64) =>
        base64 ? base64ToUrl('data:image/png;base64,' + base64, uri) : handleError()
      )
      .catch(handleError);
  }, [uri, headers, base64ToUrl, handleError]);
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
    CacheManager.removeCacheEntry(uri)
      .then(() => {})
      .catch(() => {})
      .finally(() => updateData({ ...prevState, loadStatus: AsyncStatus.Default }));
  };

  if (imageState.loadStatus === AsyncStatus.Rejected) {
    return (
      <Center style={style}>
        <ErrorWithRetry onRetry={handleRetry} />
      </Center>
    );
  }
  if (
    imageState.loadStatus === AsyncStatus.Pending ||
    imageState.loadStatus === AsyncStatus.Default
  ) {
    return (
      <Center style={style}>
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
      style={style}
      resizeMode={resizeModeDict[layoutMode]}
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

const ComicImage = ({ scrambleType, needUnscramble, ...props }: ComicImageProps) => {
  if (needUnscramble) {
    return <ScrambleImage scrambleType={scrambleType} {...props} />;
  }

  return <DefaultImage {...props} />;
};

export default memo(ComicImage);
