import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageState } from '~/components/ComicImage';
import { trycatch, limitProperties } from './common';

type CacheMap = Record<string, ImageState>;

class Cache {
  private comicCacheKey = 'comic_cache_key';
  private _cacheMap: CacheMap = {};
  private _identification: string;
  private _allCacheMap: Record<string, CacheMap> = {};

  constructor(identification: string) {
    this._identification = identification;
    this._initCacheMap();
  }

  private _initCacheMap() {
    const fn = async () => {
      const value = await AsyncStorage.getItem(this.comicCacheKey);
      if (value != null) {
        this._allCacheMap = JSON.parse(value);
        this._cacheMap = this._allCacheMap[this._identification] || {};
      }
    };
    trycatch(fn, 'Cache read error: The error message is ');
  }

  getImageState(uri: string) {
    return this._cacheMap[uri];
  }

  setImageState(uri: string, state: ImageState) {
    this._cacheMap[uri] = state;
  }

  storeCacheMap() {
    const fn = async () => {
      // 只缓存50条数据
      const storeData = limitProperties(this._allCacheMap, 50);
      storeData[this._identification] = this._cacheMap;
      AsyncStorage.setItem(this.comicCacheKey, JSON.stringify(storeData));
    };
    trycatch(fn, 'Cache store error: The error message is ');
  }
}

export default Cache;
