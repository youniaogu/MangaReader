import { MMKV } from 'react-native-mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mmkv = new MMKV(); // 也可分实例: new MMKV({ id: 'persist' });

const useMMKV = true; // 启用MMKV

export type KeyValuePair = [string, string | null];

export const Storage = {
  async getItem(key: string) {
    if (useMMKV) {
      return mmkv.getString(key) ?? null;
    }
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    if (useMMKV) {
      mmkv.set(key, value);
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    if (useMMKV) {
      mmkv.delete(key);
      return;
    }
    return AsyncStorage.removeItem(key);
  },
  async multiGet(keys: string[]): Promise<readonly KeyValuePair[]> {
    if (useMMKV) {
      return keys.map((k): KeyValuePair => [k, mmkv.getString(k) ?? null]);
    }
    return AsyncStorage.multiGet(keys);
  },
  async multiSet(pairs: [string, string][]) {
    if (useMMKV) {
      pairs.forEach(([k, v]) => mmkv.set(k, v));
      return;
    }
    return AsyncStorage.multiSet(pairs);
  },
  async multiRemove(keys: string[]) {
    if (useMMKV) {
      keys.forEach((k) => mmkv.delete(k));
      return;
    }
    return AsyncStorage.multiRemove(keys);
  },
  async getAllKeys() {
    if (useMMKV) {
      return mmkv.getAllKeys();
    }
    return AsyncStorage.getAllKeys();
  },
  async clear() {
    if (useMMKV) {
      mmkv.clearAll();
      return;
    }
    return AsyncStorage.clear();
  },
};
