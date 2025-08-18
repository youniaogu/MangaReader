import React, { useCallback, useState, useMemo, useRef, useEffect, memo } from 'react';
import { aspectFit, AsyncStatus, LayoutMode, Orientation, ScrambleType, unscramble } from '~/utils';
import { Image as ReactNativeImage, StyleSheet, Dimensions, DimensionValue } from 'react-native';
import { useDebouncedSafeAreaFrame, useDebouncedSafeAreaInsets } from '~/hooks';
import { CachedImage, CacheManager } from '@georstat/react-native-image-cache';
import { Center, Image } from 'native-base';
import ErrorWithRetry from '~/components/ErrorWithRetry';
import FastImage, { ResizeMode } from 'react-native-fast-image';
import Canvas, { Image as CanvasImage } from 'react-native-canvas';
import { FileSystem } from 'react-native-file-access';

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
  base64?: string;
}
export interface ImageProps {
  uri: string;
  index: number;
  headers?: { [name: string]: string };
  layoutMode?: LayoutMode;
  prevState?: ImageState;
  /** 受 Reader 控制：只有允许时才启动加载 */
  shouldLoad?: boolean;
  /** 这两个高度只用于竖屏模式，动态修改高度避免抖动过度 */
  defaultPortraitHeight: number;
  defaultLandscapeHeight: number;
  onChange?: (state: ImageState, idx?: number) => void;
}
export interface ComicImageProps extends ImageProps {
  needUnscramble?: boolean;
  scrambleType?: ScrambleType;
  isBase64Image?: boolean;
}

const DefaultImage = ({
  uri,
  index,
  headers = {},
  layoutMode = LayoutMode.Horizontal,
  prevState = defaultState,
  shouldLoad = true,
  defaultPortraitHeight,
  defaultLandscapeHeight,
  onChange,
}: ImageProps) => {
  const { top, left, right, bottom } = useDebouncedSafeAreaInsets();
  const { width: windowWidth, height: windowHeight, orientation } = useDebouncedSafeAreaFrame();
  const [imageState, setImageState] = useState(prevState);
  const style = useMemo<{ width: DimensionValue; height: DimensionValue }>(() => {
    if (layoutMode === LayoutMode.Horizontal) {
      return {
        width: '100%',
        height: '100%',
      };
    } else if (layoutMode === LayoutMode.Vertical) {
      return {
        width: '100%',
        height:
          orientation === Orientation.Landscape
            ? imageState.landscapeHeight || defaultLandscapeHeight
            : imageState.portraitHeight || defaultPortraitHeight,
      };
    }
    // LayoutMode.Multiple
    return {
      width: imageState.multipleFitWidth || '100%',
      height: imageState.multipleFitHeight || '100%',
    };
  }, [layoutMode, imageState, orientation, defaultPortraitHeight, defaultLandscapeHeight]);
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

        ReactNativeImage.getSize(
          'data:image/png;base64,' + base64,
          (width, height) => {
            const { dWidth, dHeight } = aspectFit(
              { width, height },
              {
                width: (windowWidth - left - right) / 2,
                height: windowHeight - top - bottom,
              }
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
          },
          handleError
        );
      })
      .catch(handleError);
  }, [
    uri,
    headers,
    imageState,
    layoutMode,
    updateData,
    handleError,
    windowWidth,
    windowHeight,
    top,
    left,
    right,
    bottom,
  ]);
  useEffect(() => {
    if (shouldLoad && imageState.loadStatus === AsyncStatus.Default) {
      loadImage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldLoad, uri, headers]);
  // 资源变化时回填外部缓存状态（不再使用 useFocusEffect，避免循环依赖）
  useEffect(() => {
    if (uriRef.current !== uri) {
      uriRef.current = uri;
      setImageState(prevState);
    }
  }, [uri, prevState]);

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
  shouldLoad = true,
  defaultPortraitHeight,
  defaultLandscapeHeight,
  onChange,
  scrambleType,
}: ImageProps & { scrambleType?: ScrambleType }) => {
  const { top, left, right, bottom } = useDebouncedSafeAreaInsets();
  const { width: windowWidth, height: windowHeight, orientation } = useDebouncedSafeAreaFrame();
  const [imageState, setImageState] = useState(prevState);
  const style = useMemo<{ width: DimensionValue; height: DimensionValue }>(() => {
    if (layoutMode === LayoutMode.Horizontal) {
      return {
        width: '100%',
        height: '100%',
      };
    } else if (layoutMode === LayoutMode.Vertical) {
      return {
        width: '100%',
        height:
          orientation === Orientation.Landscape
            ? imageState.landscapeHeight || defaultLandscapeHeight
            : imageState.portraitHeight || defaultPortraitHeight,
      };
    }
    // LayoutMode.Multiple
    return {
      width: imageState.multipleFitWidth || '100%',
      height: imageState.multipleFitHeight || '100%',
    };
  }, [layoutMode, imageState, orientation, defaultPortraitHeight, defaultLandscapeHeight]);
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

        image.addEventListener('error', handleError);
        image.addEventListener('load', (event) => {
          // don't use Image.getSize from react-native
          // Image.getSize return wrong width and height when image have a huge width or height
          // https://github.com/facebook/react-native/issues/31130
          // https://github.com/facebook/react-native/issues/33498
          const width = event.target.width;
          const height = event.target.height;
          const step = unscramble(i, width, height, scrambleType);

          if (!canvasRef.current) {
            handleError();
            return;
          }

          // if image size more than maxPixelSize, scale image to smaller
          const imageScale = Math.floor(Math.min(maxPixelSize / (width * height), 1) * 100) / 100;
          const scale = imageScale / windowScale;

          canvasRef.current.width = width * scale;
          canvasRef.current.height = height * scale;
          ctx.scale(scale, scale);

          step.forEach(({ dx, dy, sx, sy, sWidth, sHeight, dWidth, dHeight }) => {
            ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
          });

          canvasRef.current
            .toDataURL()
            .then((res) => {
              const { dWidth, dHeight } = aspectFit(
                { width, height },
                {
                  width: (windowWidth - left - right) / 2,
                  height: windowHeight - top - bottom,
                }
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
            .catch(handleError);
        });
        image.src = base64;
      } else {
        handleError();
      }
    },
    [
      imageState,
      updateData,
      handleError,
      windowWidth,
      windowHeight,
      scrambleType,
      top,
      left,
      right,
      bottom,
    ]
  );
  const loadImage = useCallback(() => {
    setImageState((state) => ({ ...state, loadStatus: AsyncStatus.Pending }));
    CacheManager.prefetchBlob(uri, { headers })
      .then((base64) =>
        base64 ? base64ToUrl('data:image/png;base64,' + base64, uri) : handleError()
      )
      .catch(handleError);
  }, [uri, headers, base64ToUrl, handleError]);
  useEffect(() => {
    if (shouldLoad && imageState.loadStatus === AsyncStatus.Default) {
      loadImage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldLoad, uri, headers]);
  useEffect(() => {
    if (uriRef.current !== uri) {
      uriRef.current = uri;
      setImageState(prevState);
    }
  }, [uri, prevState]);

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

// happy漫画返回的图片格式不太一样，需要单独处理成base64，然后用FileSystem来实现缓存，CachedImage不支持传递base64
const Base64Image = ({
  uri,
  index,
  headers = {},
  layoutMode = LayoutMode.Horizontal,
  prevState = defaultState,
  shouldLoad = true,
  defaultPortraitHeight,
  defaultLandscapeHeight,
  onChange,
}: ImageProps) => {
  const { top, left, right, bottom } = useDebouncedSafeAreaInsets();
  const { width: windowWidth, height: windowHeight, orientation } = useDebouncedSafeAreaFrame();
  const [imageState, setImageState] = useState(prevState);
  const style = useMemo<{ width: DimensionValue; height: DimensionValue }>(() => {
    if (layoutMode === LayoutMode.Horizontal) {
      return {
        width: '100%',
        height: '100%',
      };
    } else if (layoutMode === LayoutMode.Vertical) {
      return {
        width: '100%',
        height:
          orientation === Orientation.Landscape
            ? imageState.landscapeHeight || defaultLandscapeHeight
            : imageState.portraitHeight || defaultPortraitHeight,
      };
    }
    // LayoutMode.Multiple
    return {
      width: imageState.multipleFitWidth || '100%',
      height: imageState.multipleFitHeight || '100%',
    };
  }, [layoutMode, imageState, orientation, defaultPortraitHeight, defaultLandscapeHeight]);
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
  const loadImage = useCallback(async () => {
    setImageState({ ...imageState, loadStatus: AsyncStatus.Pending });
    const path = CacheManager.defaultConfig.baseDir + '/' + uri.split('/').at(-1);
    try {
      // 读缓存
      let base64 = '';
      const isExist = await FileSystem.exists(path);
      if (isExist) {
        base64 = await FileSystem.readFile(path);
      }
      if (!base64) {
        const res = await fetch(uri, { headers });
        const blob = await res.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        base64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            resolve('data:image/png;base64,' + (reader.result as string).split(',')[1]);
          };
          reader.onerror = reject;
        });
      }
      if (!base64) {
        handleError();
        return;
      }
      // 写入缓存
      FileSystem.writeFile(path, base64);
      if (layoutMode === LayoutMode.Horizontal) {
        updateData({
          ...imageState,
          base64,
          dataUrl: uri,
          loadStatus: AsyncStatus.Fulfilled,
        });
        return;
      }
      ReactNativeImage.getSize(
        base64,
        (width, height) => {
          const { dWidth, dHeight } = aspectFit(
            { width, height },
            {
              width: (windowWidth - left - right) / 2,
              height: windowHeight - top - bottom,
            }
          );
          updateData({
            ...imageState,
            dataUrl: uri,
            base64,
            multipleFitWidth: dWidth,
            multipleFitHeight: dHeight,
            landscapeHeight: (height / width) * Math.max(windowWidth, windowHeight),
            portraitHeight: (height / width) * Math.min(windowWidth, windowHeight),
            loadStatus: AsyncStatus.Fulfilled,
          });
        },
        handleError
      );
    } catch (error) {
      handleError();
      return;
    }
  }, [
    uri,
    headers,
    imageState,
    layoutMode,
    updateData,
    handleError,
    windowWidth,
    windowHeight,
    top,
    left,
    right,
    bottom,
  ]);
  useEffect(() => {
    if (shouldLoad && imageState.loadStatus === AsyncStatus.Default) {
      loadImage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldLoad, uri, headers]);
  useEffect(() => {
    if (uriRef.current !== uri) {
      uriRef.current = uri;
      setImageState(prevState);
    }
  }, [uri, prevState]);

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
    <FastImage
      style={style}
      resizeMode={resizeModeDict[layoutMode]}
      source={{ uri: imageState.base64! }}
      onError={handleError}
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

const ComicImage = ({ scrambleType, needUnscramble, isBase64Image, ...props }: ComicImageProps) => {
  if (needUnscramble) {
    return <ScrambleImage scrambleType={scrambleType} {...props} />;
  }

  if (isBase64Image) {
    return <Base64Image {...props} />;
  }

  return <DefaultImage {...props} />;
};

export default memo(ComicImage);
