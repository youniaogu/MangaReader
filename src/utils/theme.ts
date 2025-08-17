import { extendTheme } from 'native-base';
import { useAppSelector } from '~/redux';
import { LightSwitch } from '~/utils/enum';

export const customTheme = extendTheme({
  colors: {
    purple: {
      50: '#f2e3ff',
      100: '#d3b2ff',
      200: '#b47fff',
      300: '#964dff',
      400: '#781aff',
      500: '#5f00e6',
      600: '#4a00b4',
      700: '#350082',
      800: '#200050',
      900: '#0d0020',
    },
    transparent: 'transparent',
  },
  config: {
    initialColorMode: 'light',
  },
  shadows: {
    icon: {
      shadowColor: 'black',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,

      textShadowOffset: {
        width: 0,
        height: 1,
      },
      textShadowRadius: 5,
      elevation: 2,
    },
  },
});

export function useThemeColor<T = string>(lightValue: T, darkValue: T): T {
  const light = useAppSelector((state) => state.setting.light);
  return light === LightSwitch.On ? lightValue : darkValue;
}
