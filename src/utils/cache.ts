import { FileSystem, Dirs } from 'react-native-file-access';
import { ImageState } from '~/components/ComicImage';

type CacheMap = Record<string, ImageState>;

class Cache {
  private _basePath = `${Dirs.DocumentDir}/@cache`; // 或者Dirs.CacheDir？
  private _path: string;
  private _cacheMap: CacheMap = {};

  constructor(identification: string) {
    this._path = `${this._basePath}/${identification}.json`;
  }

  async initCacheMap() {
    try {
      const dirExists = await FileSystem.exists(this._basePath);
      if (!dirExists) {
        await FileSystem.mkdir(this._basePath);
      }
      const exists = await FileSystem.exists(this._path);
      if (exists) {
        const content = await FileSystem.readFile(this._path);
        this._cacheMap = JSON.parse(content);
      } else {
        await FileSystem.writeFile(this._path, JSON.stringify({}));
      }
    } catch (error) {
      console.error('An error in initCacheMap:', error);
    }
  }

  getImageState(uri: string) {
    return this._cacheMap[uri];
  }

  setImageState(uri: string, state: ImageState) {
    this._cacheMap[uri] = state;
  }

  async storeCacheMap() {
    try {
      await FileSystem.writeFile(this._path, JSON.stringify(this._cacheMap));
    } catch (error) {
      console.error('An error in storeCacheMap:', error);
    }
  }

  // 清除缓存
  static async clearCache() {
    const basePath = `${Dirs.DocumentDir}/@cache`;
    try {
      const dirExists = await FileSystem.exists(basePath);
      if (dirExists) {
        await FileSystem.unlink(basePath);
      }
    } catch (error) {
      console.error('An error in clearCache:', error);
    }
  }
}

export default Cache;
