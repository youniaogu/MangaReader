import { Draft, Draft07, JsonError, JsonSchema } from 'json-schema-library';
import { delay, race, Effect } from 'redux-saga/effects';
import { ErrorMessage } from './enum';
import { Platform } from 'react-native';
import CookieManager from '@react-native-cookies/cookies';
import queryString from 'query-string';
import CryptoJS from 'crypto-js';

export const PATTERN_VERSION = /v?([0-9]+)\.([0-9]+)\.([0-9]+)/;
export const PATTERN_PUBLISH_TIME = /([0-9]+)-([0-9]+)-([0-9]+)/;
export const coverAspectRatio = 2 / 3;
export const storageKey = {
  favorites: '@favorites',
  dict: '@dict',
  plugin: '@plugin',
  setting: '@setting',
  mangaIndex: '@mangaIndex',
  chapterIndex: '@chapterIndex',
  taskIndex: '@taskIndex',
  jobIndex: '@jobIndex',
};

export function aspectFill(
  img: { width: number; height: number },
  container: { width: number; height: number }
) {
  const scale = Math.max(container.width / img.width, container.height / img.height);
  const dx = container.width / 2 - (img.width / 2) * scale;
  const dy = container.height / 2 - (img.height / 2) * scale;

  return {
    dx,
    dy,
    dWidth: img.width * scale,
    dHeight: img.height * scale,
    scale,
  };
}

export function aspectFit(
  img: { width: number; height: number },
  container: { width: number; height: number }
) {
  const scale = Math.min(container.width / img.width, container.height / img.height);
  const dx = container.width / 2 - (img.width / 2) * scale;
  const dy = container.height / 2 - (img.height / 2) * scale;

  return {
    dx,
    dy,
    dWidth: img.width * scale,
    dHeight: img.height * scale,
    scale,
  };
}

export function* raceTimeout(fn: Effect, ms: number = 5000) {
  const { result, timeout } = yield race({
    result: fn,
    timeout: delay(ms),
  });

  if (timeout) {
    return { error: new Error(ErrorMessage.Timeout) };
  }

  return { result };
}

export function haveError(payload: any): payload is { error: Error } {
  return payload && payload.error instanceof Error;
}

export function validate<T = any>(data: T, schema?: JsonSchema): data is T {
  const jsonSchema: Draft = new Draft07(schema);
  const errors: JsonError[] = jsonSchema.validate(data);

  if (errors.length > 0) {
    return false;
  }
  return true;
}

export function getLatestRelease(
  data: any[]
): { error: Error; release?: undefined } | { error?: undefined; release?: LatestRelease } {
  try {
    if (!data || !Array.isArray(data)) {
      return { error: new Error(ErrorMessage.WrongDataType) };
    }

    const latest = data.find((item) => {
      return compareVersion(item.tag_name, process.env.VERSION);
    });

    if (!latest) {
      return { release: undefined };
    }

    const [, y, m, d] = latest.published_at.match(PATTERN_PUBLISH_TIME) || [];
    const apk = (latest.assets as any[]).find(
      (item) => item.content_type === 'application/vnd.android.package-archive'
    );
    const ipa = (latest.assets as any[]).find(
      (item) => item.content_type === 'application/octet-stream'
    );

    return {
      release: {
        url: latest.html_url,
        version: latest.tag_name,
        changeLog: latest.body,
        publishTime: `${y}-${m}-${d}`,
        file: {
          apk: { size: apk.size, downloadUrl: apk.browser_download_url },
          ipa: { size: ipa.size, downloadUrl: ipa.browser_download_url },
        },
      },
    };
  } catch {
    return { error: new Error(ErrorMessage.Unknown) };
  }
}

export function compareVersion(prev: string, current: string) {
  const [, A1 = 0, B1 = 0, C1 = 0] = prev.match(PATTERN_VERSION) || [];
  const [, A2 = 0, B2 = 0, C2 = 0] = current.match(PATTERN_VERSION) || [];

  if (Number(A1) > Number(A2)) {
    return true;
  } else if (Number(A1) === Number(A2) && Number(B1) > Number(B2)) {
    return true;
  } else if (Number(A1) === Number(A2) && Number(B1) === Number(B2) && Number(C1) > Number(C2)) {
    return true;
  }

  return false;
}

export function mergeQuery(uri: string, key: string, value: string) {
  const { url, query } = queryString.parseUrl(uri);

  return queryString.stringifyUrl({ url, query: { ...query, [key]: value } });
}

export function AESDecrypt(contentKey: string): string {
  const a = contentKey.substring(0x0, 0x10);
  const b = contentKey.substring(0x10, contentKey.length);

  const c = CryptoJS.enc.Utf8.parse('xxxmanga.woo.key');
  const d = CryptoJS.enc.Utf8.parse(a);

  const e = CryptoJS.enc.Hex.parse(b);
  const f = CryptoJS.enc.Base64.stringify(e);

  return CryptoJS.AES.decrypt(f, c, {
    iv: d,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
    .toString(CryptoJS.enc.Utf8)
    .toString();
}

export function nonNullable<T>(v: T | null | undefined): v is T {
  return v !== null && v !== undefined;
}

export function trycatch<T extends (...args: any) => any>(fn: T, prefix?: string): ReturnType<T> {
  try {
    return fn();
  } catch (error) {
    if (error instanceof Error) {
      return {
        error: new Error(prefix ? `${prefix}${error.message}` : error.message),
      } as ReturnType<T>;
    } else {
      return { error: new Error(ErrorMessage.Unknown) } as ReturnType<T>;
    }
  }
}

export function ellipsis(str: string, len: number = 20, suffix = '...') {
  return str.length > len ? str.substring(0, len) + suffix : str;
}

export function clearAllCookie(url: string) {
  return new Promise<boolean>((res, rej) => {
    if (typeof url !== 'string') {
      rej(new Error('param url not a string type'));
      return;
    }

    if (Platform.OS === 'android') {
      CookieManager.removeSessionCookies().then(res).catch(rej);
    } else if (Platform.OS === 'ios') {
      CookieManager.get(url).then((cookies) => {
        Promise.all(Object.keys(cookies).map((key) => CookieManager.clearByName(url, key)))
          .then(() => res(true))
          .catch(() => res(false));
      });
    }
  });
}

export function getByteSize(str = '', unit: 'B' | 'KB' | 'MB' | 'GB' | 'TB' = 'MB') {
  const size = new Blob([str]).size;
  switch (unit) {
    case 'TB': {
      return (size / 1024 / 1024 / 1024 / 1024).toFixed(2) + unit;
    }
    case 'GB': {
      return (size / 1024 / 1024 / 1024).toFixed(2) + unit;
    }
    case 'MB': {
      return (size / 1024 / 1024).toFixed(2) + unit;
    }
    case 'KB': {
      return (size / 1024).toFixed(2) + unit;
    }
    case 'B':
      return size.toFixed(2) + unit;
  }
}

export function dictToPairs(obj: Record<string, any>): [string, string][] {
  return Object.keys(obj).map((key) => [key, JSON.stringify(obj[key])]);
}

export function pairsToDict(list: KeyValuePair[]) {
  return list.reduce<Record<string, any>>((dict, [key, value]) => {
    dict[key] = nonNullable(value) ? JSON.parse(value) : undefined;
    return dict;
  }, {});
}
