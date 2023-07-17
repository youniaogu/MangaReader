import '~/utils/define';
import { CacheManager } from '@georstat/react-native-image-cache';
import { AppRegistry } from 'react-native';
import { Dirs } from 'react-native-file-access';
import { name } from './app.json';
import App from '~/App';
import * as packageJson from './package.json';

process.env.NAME = name;
process.env.VERSION = 'v' + packageJson.version;
process.env.PUBLISH_TIME = packageJson.publishTime;

CacheManager.config = {
  baseDir: `${Dirs.CacheDir}/images_cache/`,
  cacheLimit: 0,
  sourceAnimationDuration: 500,
  thumbnailAnimationDuration: 500,
};

AppRegistry.registerComponent(name, () => App);
