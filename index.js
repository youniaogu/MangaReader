import '~/utils/define';
import { AppRegistry, LogBox } from 'react-native';
import { CacheManager } from '@georstat/react-native-image-cache';
import { Dirs } from 'react-native-file-access';
import { proxy } from './package.json';
import { name } from './app.json';
import { env } from '~/utils';
import App from '~/App';

CacheManager.config = {
  baseDir: `${Dirs.CacheDir}/images_cache/`,
  cacheLimit: 0,
  sourceAnimationDuration: 300,
  thumbnailAnimationDuration: 300,
};

if (process.env.NODE_ENV === env.DEV) {
  process.env.PROXY = proxy;
}

LogBox.ignoreLogs(['Require cycle:', 'Remote debugger']);
AppRegistry.registerComponent(name, () => App);
