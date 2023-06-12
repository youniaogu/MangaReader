import { EmitterSubscription } from 'react-native';
import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { VolumeManager } from 'react-native-volume-manager';
import { Volume } from '~/utils';

export const useVolumeUpDown = (callback: (type: Volume) => void) => {
  const volumeRef = useRef<number>();

  useFocusEffect(
    useCallback(() => {
      let volumeListener: EmitterSubscription | undefined;
      let timeout: NodeJS.Timeout | undefined;
      let callbackTimeout: NodeJS.Timeout | undefined;

      VolumeManager.showNativeVolumeUI({ enabled: false });
      VolumeManager.getVolume().then((volume) => {
        let prev = typeof volume === 'number' ? volume : volume.volume;
        if (prev < 0.3) {
          volumeRef.current = prev;
          prev = 0.3;
          VolumeManager.setVolume(prev);
        } else if (prev > 0.7) {
          volumeRef.current = prev;
          prev = 0.7;
          VolumeManager.setVolume(prev);
        }

        volumeListener = VolumeManager.addVolumeListener((result) => {
          if (Math.abs(result.volume - prev) > 0.0001) {
            timeout && clearTimeout(timeout);
            timeout = setTimeout(() => {
              VolumeManager.setVolume(prev);
            }, 500);

            if (result.volume - prev > 0.0001) {
              callbackTimeout && clearTimeout(callbackTimeout);
              callbackTimeout = setTimeout(() => {
                callback(Volume.Up);
              }, 200);
            } else if (prev - result.volume > 0.0001) {
              callbackTimeout && clearTimeout(callbackTimeout);
              callbackTimeout = setTimeout(() => {
                callback(Volume.Down);
              }, 200);
            }
          }
        });
      });

      return () => {
        timeout && clearTimeout(timeout);
        callbackTimeout && clearTimeout(callbackTimeout);
        volumeListener && volumeListener.remove();
        if (typeof volumeRef.current === 'number') {
          VolumeManager.setVolume(volumeRef.current).finally(() => {
            VolumeManager.showNativeVolumeUI({ enabled: true });
          });
        }
      };
    }, [callback])
  );
};
