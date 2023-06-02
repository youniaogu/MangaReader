import { EmitterSubscription } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { VolumeManager } from 'react-native-volume-manager';
import { useCallback } from 'react';
import { Volume } from '~/utils';

export const useVolumeUpDown = (callback: (type: Volume) => void) => {
  useFocusEffect(
    useCallback(() => {
      let volumeListener: EmitterSubscription | undefined;
      VolumeManager.showNativeVolumeUI({ enabled: false });
      VolumeManager.getVolume().then((volume) => {
        let prev = typeof volume === 'number' ? volume : volume.volume;
        if (volume <= 0) {
          prev = 0.1;
        } else if (volume >= 1) {
          prev = 0.9;
        }
        VolumeManager.setVolume(prev);

        volumeListener = VolumeManager.addVolumeListener((result) => {
          VolumeManager.setVolume(prev).then(() => {
            if (result.volume > prev) {
              callback(Volume.Up);
            } else if (result.volume < prev) {
              callback(Volume.Down);
            }
          });
        });
      });

      return () => {
        VolumeManager.showNativeVolumeUI({ enabled: true });
        volumeListener && volumeListener.remove();
      };
    }, [callback])
  );
};
