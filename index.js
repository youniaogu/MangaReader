import '~/utils/define';
import { AppRegistry, LogBox } from 'react-native';
import { CacheManager } from '@georstat/react-native-image-cache';
import { Dirs } from 'react-native-file-access';
import { name } from './app.json';
import { env } from '~/utils';
import * as packageJson from './package.json';
import App from '~/App';

if (process.env.NODE_ENV === env.DEV) {
  process.env.PROXY = packageJson.proxy;
  process.env.NAME = 'MangaReader';
  process.env.VERSION = 'v' + packageJson.version;
  process.env.PUBLISH_TIME = packageJson.publishTime;
}

CacheManager.config = {
  baseDir: `${Dirs.CacheDir}/images_cache/`,
  cacheLimit: 0,
  sourceAnimationDuration: 300,
  thumbnailAnimationDuration: 300,
};

LogBox.ignoreLogs(['Require cycle:', 'Remote debugger']);
AppRegistry.registerComponent(name, () => App);
