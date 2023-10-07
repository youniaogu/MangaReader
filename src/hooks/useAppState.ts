import { AppState, AppStateStatus } from 'react-native';
import { useEffect } from 'react';

export const useAppState = (onChange: (state: AppStateStatus) => void) => {
  useEffect(() => {
    const listener = AppState.addEventListener('change', onChange);
    return listener.remove;
  }, [onChange]);
};
