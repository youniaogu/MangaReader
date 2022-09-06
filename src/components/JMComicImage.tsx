import React, { useRef, useState, useCallback, memo } from 'react';
import { Image as ReactNativeImage, StyleSheet, Dimensions } from 'react-native';
import { CachedImage, CacheManager } from '@georstat/react-native-image-cache';
import { AsyncStatus, scaleToFit } from '~/utils';
import { useFocusEffect } from '@react-navigation/native';
import { Image, Center } from 'native-base';
import { unscramble } from '~/plugins/jmc';
import { nanoid } from '@reduxjs/toolkit';
import ErrorWithRetry from '~/components/ErrorWithRetry';
import Canvas, { Image as CanvasImage } from 'react-native-canvas';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

interface JMComicImageProps {
  uri: string;
  headers?: { [name: string]: string };
  horizontal?: boolean;
  onSuccess?: ({ width, height }: { width: number; height: number }) => void;
}
interface Source {
  base64: string;
  width: number;
  height: number;
}

const JMComicImage = ({ uri, headers = {}, horizontal = false, onSuccess }: JMComicImageProps) => {
  const [source, setSource] = useState<Source>();
  const [dataUrl, setDataUrl] = useState<string>();
  const [retryHash, setRetryHash] = useState(nanoid());
  const [loadStatus, setLoadStatus] = useState(AsyncStatus.Default);
  const [imageHeight, setImageHeight] = useState(windowHeight);
  const canvasRef = useRef<Canvas>(null);

  useFocusEffect(
    useCallback(() => {
      if (canvasRef.current && source) {
        const { base64, width, height } = source;
        const ctx = canvasRef.current.getContext('2d');
        const step = unscramble(uri, width, height);
        const image = new CanvasImage(canvasRef.current, height, width);
        image.src = base64;

        const container = scaleToFit(
          { width, height },
          { width: windowWidth, height: windowHeight }
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
              setDataUrl(res.replace(/^"|"$/g, ''));
              setLoadStatus(AsyncStatus.Fulfilled);
            });
          }
        });
      }
    }, [uri, source])
  );

  useFocusEffect(
    useCallback(() => {
      if (loadStatus === AsyncStatus.Default) {
        setLoadStatus(AsyncStatus.Pending);
        CacheManager.prefetchBlob(uri, { headers })
          .then((base64) => {
            if (!base64) {
              handleError();
              return;
            }
            base64 = 'data:image/png;base64,' + base64;

            ReactNativeImage.getSizeWithHeaders(base64, headers, (width, height) => {
              const fillHeight = (height / width) * windowWidth;
              setSource({ base64: base64 as string, width, height });
              setImageHeight(fillHeight);
              onSuccess && onSuccess({ width: windowWidth, height: fillHeight });
            });
          })
          .catch(handleError);
      }
    }, [uri, headers, loadStatus, onSuccess])
  );

  const handleError = () => {
    setLoadStatus(AsyncStatus.Rejected);
  };
  const handleRetry = () => {
    CacheManager.removeCacheEntry(uri)
      .then(() => {})
      .catch(() => {})
      .finally(() => {
        setLoadStatus(AsyncStatus.Default);
        setRetryHash(nanoid());
      });
  };

  if (loadStatus === AsyncStatus.Rejected) {
    return <ErrorWithRetry onRetry={handleRetry} />;
  }

  if (!dataUrl || loadStatus === AsyncStatus.Pending) {
    return (
      <Center w={windowWidth} h={windowHeight} bg="black">
        <CachedImage
          source="https://raw.githubusercontent.com/youniaogu/walfie-gif/master/ground%20pound.gif"
          resizeMode="contain"
          style={styles.loading}
        />
        <Canvas key={retryHash} ref={canvasRef} style={styles.canvas} />
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
  canvas: {
    zIndex: -1,
    opacity: 0,
    position: 'absolute',
  },
  loading: {
    width: windowWidth * 0.3,
    height: windowHeight,
  },
});

export default memo(JMComicImage);
