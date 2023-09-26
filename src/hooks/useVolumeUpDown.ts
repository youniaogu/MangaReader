import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { VolumeManager } from 'react-native-volume-manager';
import { Volume } from '~/utils';

export const useVolumeUpDown = (callback: (type: Volume) => void) => {
  const volumeRef = useRef<number>();
  const [initVolume, setInitVolume] = useState<number>();

  const init = useCallback(() => {
    VolumeManager.getVolume().then((volume) => {
      let prev = typeof volume === 'number' ? volume : volume.volume;

      volumeRef.current = prev;
      if (prev <= 0) {
        prev = 0.025;
      } else if (prev >= 1) {
        prev = 0.975;
      }
      VolumeManager.setVolume(prev);
      setInitVolume(prev);
    });
  }, []);
  const listener = useCallback(() => {
    if (typeof initVolume !== 'number') {
      return;
    }

    VolumeManager.showNativeVolumeUI({ enabled: false });
    const volumeListener = VolumeManager.addVolumeListener((result) => {
      // On iOS, events could get swallowed if fired too rapidly.
      // https://github.com/hirbod/react-native-volume-manager/issues/3
      if (result.volume - initVolume > 0.0001) {
        setTimeout(
          () => VolumeManager.setVolume(initVolume).finally(() => callback(Volume.Up)),
          200
        );
      } else if (initVolume - result.volume > 0.0001) {
        setTimeout(
          () => VolumeManager.setVolume(initVolume).finally(() => callback(Volume.Down)),
          200
        );
      }
    });

    return () => {
      volumeListener && volumeListener.remove();
      if (typeof volumeRef.current === 'number') {
        VolumeManager.setVolume(volumeRef.current).finally(() => {
          VolumeManager.showNativeVolumeUI({ enabled: true });
        });
      }
    };
  }, [initVolume, callback]);

  useFocusEffect(init);
  useFocusEffect(listener);
};
