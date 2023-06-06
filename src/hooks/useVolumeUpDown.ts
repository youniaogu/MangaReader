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

      VolumeManager.showNativeVolumeUI({ enabled: false });
      VolumeManager.getVolume().then((volume) => {
        let prev = typeof volume === 'number' ? volume : volume.volume;
        if (prev < 0.2) {
          volumeRef.current = prev;
          prev = 0.2;
          VolumeManager.setVolume(prev);
        } else if (prev > 0.8) {
          volumeRef.current = prev;
          prev = 0.8;
          VolumeManager.setVolume(prev);
        }

        volumeListener = VolumeManager.addVolumeListener((result) => {
          VolumeManager.setVolume(prev);
          if (result.volume - prev > 0.0001) {
            callback(Volume.Up);
          } else if (result.volume - prev < -0.0001) {
            callback(Volume.Down);
          }
        });
      });

      return () => {
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
