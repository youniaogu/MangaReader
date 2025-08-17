import { useColorMode } from 'native-base';
import { useAppSelector } from '~/redux';
import { useEffect } from 'react';
import { LightSwitch } from '~/utils';

export default function ThemeBridge() {
  const { setColorMode } = useColorMode();
  const light = useAppSelector((s) => s.setting.light);

  useEffect(() => {
    setColorMode(light === LightSwitch.On ? 'light' : 'dark');
  }, [light, setColorMode]);

  return null;
}
