import { extendTheme } from 'native-base';

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
  },
  config: {
    initialColorMode: 'light',
  },
});
