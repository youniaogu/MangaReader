import { ErrorMessage, MangaStatus, ScrambleType } from './enum';
import { Draft, Draft07, JsonError, JsonSchema } from 'json-schema-library';
import { delay, race, Effect } from 'redux-saga/effects';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';
import CookieManager from '@react-native-cookies/cookies';
import queryString from 'query-string';
import CryptoJS from 'crypto-js';
import base64 from 'base-64';
import md5 from 'blueimp-md5';

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

export function validate<T = any>(
  data: T,
  schema?: JsonSchema,
  initData?: Record<string, any>
): data is T {
  const jsonSchema: Draft = new Draft07(schema);
  const errors: JsonError[] = jsonSchema.validate(data);

  if (nonNullable(initData) && errors.length > 0) {
    errors.forEach((error) => {
      if (error.code !== 'required-property-error') {
        return;
      }

      let initDataRef = initData;
      const { value, key, pointer } = error.data as Record<string, any>;
      const keys: string[] = pointer.split('/').slice(1);

      keys.forEach(
        (jsonKey) => (initDataRef = nonNullable(initDataRef) ? initDataRef[jsonKey] : undefined)
      );
      value[key] = nonNullable(initDataRef) ? initDataRef[key] : undefined;
    });

    return validate(data, schema);
  }

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
      CookieManager.get(url, true).then((cookies) => {
        Promise.all(Object.keys(cookies).map((key) => CookieManager.clearByName(url, key, true)))
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
    dict[key] = nonNullable(value) && value !== '' ? JSON.parse(value) : undefined;
    return dict;
  }, {});
}

function getChapterId(uri: string) {
  const [, id] = uri.match(/\/([0-9]+)\//) || [];
  return Number(id);
}
function getPicIndex(uri: string) {
  const [, index] = uri.match(/\/([0-9]+)\./) || [];
  return index;
}
function getSplitNum(id: number, index: string) {
  var a = 10;
  if (id >= 268850) {
    const str = md5(id + index);
    const nub = str.substring(str.length - 1).charCodeAt(0) % (id >= 421926 ? 8 : 10);

    switch (nub) {
      case 0:
        a = 2;
        break;
      case 1:
        a = 4;
        break;
      case 2:
        a = 6;
        break;
      case 3:
        a = 8;
        break;
      case 4:
        a = 10;
        break;
      case 5:
        a = 12;
        break;
      case 6:
        a = 14;
        break;
      case 7:
        a = 16;
        break;
      case 8:
        a = 18;
        break;
      case 9:
        a = 20;
    }
  }
  return a;
}
export function unscrambleJMC(uri: string, width: number, height: number) {
  const step = [];
  const id = getChapterId(uri);
  const index = getPicIndex(uri);
  const numSplit = getSplitNum(id, index);
  const perheight = height % numSplit;

  for (let i = 0; i < numSplit; i++) {
    let sHeight = Math.floor(height / numSplit);
    let dy = sHeight * i;
    const sy = height - sHeight * (i + 1) - perheight;

    if (i === 0) {
      sHeight += perheight;
    } else {
      dy += perheight;
    }

    step.push({
      sx: 0,
      sy,
      sWidth: width,
      sHeight,
      dx: 0,
      dy,
      dWidth: width,
      dHeight: sHeight,
    });
  }

  return step;
}

export function unscrambleRM5(uri: string, width: number, height: number) {
  const step = [];
  const list = uri.split('/');
  const id = list[list.length - 1].replace('.jpg', '');

  const buffer = Buffer.from(CryptoJS.MD5(base64.decode(id)).toString(), 'hex');
  const nub = buffer[buffer.length - 1];
  const numSplit = (nub % 10) + 5;
  const perheight = height % numSplit;

  for (let i = 0; i < numSplit; i++) {
    let sHeight = Math.floor(height / numSplit);
    let dy = sHeight * i;
    const sy = height - sHeight * (i + 1) - perheight;

    if (i === 0) {
      sHeight += perheight;
    } else {
      dy += perheight;
    }

    step.push({
      sx: 0,
      sy,
      sWidth: width,
      sHeight,
      dx: 0,
      dy,
      dWidth: width,
      dHeight: sHeight,
    });
  }

  return step;
}

export function unscramble(uri: string, width: number, height: number, type = ScrambleType.JMC) {
  switch (type) {
    case ScrambleType.RM5: {
      return unscrambleRM5(uri, width, height);
    }
    case ScrambleType.JMC:
    default: {
      return unscrambleJMC(uri, width, height);
    }
  }
}

export function emptyFn() {}

export function statusToLabel(status: MangaStatus) {
  switch (status) {
    case MangaStatus.Serial: {
      return '连载中';
    }
    case MangaStatus.End: {
      return '已完结';
    }
    default:
      return '未知';
  }
}
