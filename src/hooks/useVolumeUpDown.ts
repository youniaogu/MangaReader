import { EmitterSubscription } from 'react-native';
import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { VolumeManager } from 'react-native-volume-manager';
import { Volume } from '~/utils';

export const useVolumeUpDown = (callback: (type: Volume) => void) => {
  const volumeRef = useRef<number>();
  const initVolumeRef = useRef<number>(0.5);

  useFocusEffect(
    useCallback(() => {
      let volumeListener: EmitterSubscription | undefined;
      let timeout: NodeJS.Timeout | undefined;

      VolumeManager.showNativeVolumeUI({ enabled: false });
      VolumeManager.getVolume().then((volume) => {
        let prev = typeof volume === 'number' ? volume : volume.volume;

        volumeRef.current = prev;
        if (prev < 0.3) {
          prev = 0.3;
        } else if (prev > 0.7) {
          prev = 0.7;
        }
        initVolumeRef.current = prev;

        VolumeManager.setVolume(prev).then(() => {
          volumeListener = VolumeManager.addVolumeListener((result) => {
            if (result.volume - prev > 0.0001) {
              timeout && clearTimeout(timeout);
              timeout = setTimeout(() => {
                VolumeManager.setVolume(initVolumeRef.current).then(() => {
                  prev = initVolumeRef.current;
                  callback(Volume.Up);
                });
              }, 200);
            } else if (prev - result.volume > 0.0001) {
              timeout && clearTimeout(timeout);
              timeout = setTimeout(() => {
                VolumeManager.setVolume(initVolumeRef.current).then(() => {
                  prev = initVolumeRef.current;
                  callback(Volume.Down);
                });
              }, 200);
            }

            prev = result.volume;
          });
        });
      });

      return () => {
        timeout && clearTimeout(timeout);
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
