import { useCallback, useRef, useState } from 'react';
import { AppStateStatus, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { VolumeManager } from 'react-native-volume-manager';
import { useAppState } from './useAppState';
import { Volume } from '~/utils';

export const useVolumeUpDown = (callback: (type: Volume) => void, enable = true) => {
  const volumeRef = useRef<number>();
  const audioSessionIsInactiveRef = useRef<boolean>(false);
  const [initVolume, setInitVolume] = useState<number>();

  const init = useCallback(() => {
    if (!enable) {
      return;
    }

    if (Platform.OS === 'ios') {
      VolumeManager.enable(true);
    }

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
  }, [enable]);
  const listener = useCallback(() => {
    if (!enable || typeof initVolume !== 'number') {
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
  }, [enable, initVolume, callback]);
  const reboot = useCallback(() => {
    if (Platform.OS === 'ios') {
      VolumeManager.enable(true);
    }
    if (initVolume !== undefined) {
      VolumeManager.setVolume(initVolume);
    }
  }, [initVolume]);
  const enabledAudioSession = useCallback(
    (status: AppStateStatus) => {
      if (!enable) {
        return;
      }

      if (Platform.OS === 'ios') {
        if (status === 'active') {
          if (audioSessionIsInactiveRef.current) {
            VolumeManager.setActive(true);
            audioSessionIsInactiveRef.current = false;
            reboot();
          }
        } else {
          VolumeManager.setActive(false);
          audioSessionIsInactiveRef.current = true;
        }
      }
    },
    [enable, reboot]
  );

  useFocusEffect(init);
  useFocusEffect(listener);
  useAppState(enabledAudioSession);
};
