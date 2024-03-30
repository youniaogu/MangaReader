import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageState } from '~/components/ComicImage';

type CacheMap = Record<string, ImageState>;

class Cache {
  private _comicCacheKey: string;
  private _cacheMap: CacheMap = {};

  constructor(identification: string) {
    this._comicCacheKey = `CACHE_${identification}`;
  }

  async initCacheMap() {
    const value = await AsyncStorage.getItem(this._comicCacheKey);
    console.log('readData: ', JSON.stringify(value));
    if (value != null) {
      this._cacheMap = JSON.parse(value);
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
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.includes('CACHE_'));
      // 限制只存50条
      if (cacheKeys.length >= 50) {
        await AsyncStorage.removeItem(cacheKeys[0]);
      }
      console.log('_cacheMap: ', JSON.stringify(this._cacheMap));
      await AsyncStorage.setItem(this._comicCacheKey, JSON.stringify(this._cacheMap));
    } catch (error) {
      console.log('setCache error', error);
    }
  }
}

export default Cache;
