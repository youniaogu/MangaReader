import React, { useRef, useState, memo, useEffect } from 'react';
import { Image as ReactNativeImage, StyleSheet, Dimensions } from 'react-native';
import { CachedImage, CacheManager } from '@georstat/react-native-image-cache';
import { AsyncStatus, scaleToFit } from '~/utils';
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
}
interface Source {
  base64: string;
  width: number;
  height: number;
}

const JMComicImage = ({ uri, headers = {} }: JMComicImageProps) => {
  const [source, setSource] = useState<Source>();
  const [dataUrl, setDataUrl] = useState<string>();
  const [retryHash, setRetryHash] = useState(nanoid());
  const [loadStatus, setLoadStatus] = useState(AsyncStatus.Default);
  const canvasRef = useRef<Canvas>(null);

  useEffect(() => {
    if (canvasRef.current && source) {
      const { base64, width, height } = source;
      const ctx = canvasRef.current.getContext('2d');
      const step = unscramble(uri, width, height);
      const image = new CanvasImage(canvasRef.current, height, width);
      image.src = base64;

      const container = scaleToFit({ width, height }, { width: windowWidth, height: windowHeight });
      canvasRef.current.width = container.dWidth;
      canvasRef.current.height = container.dHeight;

      image.addEventListener('load', () => {
        step.forEach(({ dx, dy, sx, sy, sWidth, sHeight, dWidth, dHeight }) => {
          ctx.drawImage(
            image,
            dx,
            dy,
            sx,
            sy,
            sWidth * container.scale,
            sHeight * container.scale,
            dWidth * container.scale,
            dHeight * container.scale
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
  }, [uri, source]);

  useEffect(() => {
    if (loadStatus === AsyncStatus.Default) {
      setLoadStatus(AsyncStatus.Pending);
      CacheManager.prefetchBlob(uri, { headers })
        .then((base64) => {
          if (!base64) {
            handleError();
            return;
          }
          base64 = 'data:image/png;base64,' + base64;

          ReactNativeImage.getSizeWithHeaders(base64, headers, (width, height) =>
            setSource({ base64: base64 as string, width, height })
          );
        })
        .catch(handleError);
    }
  }, [uri, headers, loadStatus]);

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
      <Center w="full" h="full" bg="black">
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
    <Image w="full" h="full" resizeMode="contain" source={{ uri: dataUrl }} alt="page" bg="black" />
  );
};

const styles = StyleSheet.create({
  canvas: {
    zIndex: -1,
    opacity: 0,
    position: 'absolute',
  },
  loading: {
    width: '30%',
    height: '100%',
  },
});

export default memo(JMComicImage);
