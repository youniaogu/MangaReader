import { delay, race, Effect } from 'redux-saga/effects';
import { ErrorMessage } from './enum';
import { Dimensions } from 'react-native';
import { Dirs } from 'react-native-file-access';
import queryString from 'query-string';
import CryptoJS from 'crypto-js';

export const PATTERN_VERSION = /v?([0-9]+)\.([0-9]+)\.([0-9]+)$/;
export const PATTERN_PUBLISH_TIME = /([0-9]+)-([0-9]+)-([0-9]+)/;
export const coverAspectRatio = 2 / 3;
export const storageKey = {
  favorites: '@favorites',
  dict: '@dict',
  plugin: '@plugin',
  setting: '@setting',
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

export function fixDictShape(dict: RootState['dict']): RootState['dict'] {
  const mangaDict = dict.manga;
  for (let key in mangaDict) {
    const manga = mangaDict[key];
    if (!manga) {
      continue;
    }

    if (!Array.isArray(manga.author)) {
      manga.author = [];
    }
    if (!Array.isArray(manga.tag)) {
      manga.tag = [];
    }
  }

  if (!nonNullable(dict.record)) {
    dict.record = {};
  }
  if (!nonNullable(dict.lastWatch)) {
    dict.lastWatch = {};
  }

  return dict;
}

export function fixSettingShape(setting: RootState['setting']): RootState['setting'] {
  if (!nonNullable(setting.firstPrehandle)) {
    setting.firstPrehandle = true;
  }
  if (!nonNullable(setting.androidDownloadPath)) {
    setting.androidDownloadPath = Dirs.SDCardDir + '/DCIM';
  }

  return setting;
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
          apk: {
            size: apk.size,
            downloadUrl: apk.browser_download_url,
          },
          ipa: {
            size: ipa.size,
            downloadUrl: ipa.browser_download_url,
          },
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

export function matchRestoreShape(data: any): data is BackupData {
  if (
    typeof data === 'object' &&
    typeof data.createTime === 'number' &&
    data.favorites.findIndex((item: any) => typeof item !== 'string') === -1
  ) {
    return true;
  }

  return false;
}

export function nonNullable<T>(v: T | null | undefined): v is T {
  return v !== null && v !== undefined;
}

export function splitWidth({
  width = Dimensions.get('window').width,
  gap = 0,
  maxPartWidth = 210,
  minNumColumns = 3,
}: {
  gap?: number;
  width?: number;
  maxPartWidth?: number;
  minNumColumns?: number;
}) {
  const numColumns = Math.max(Math.floor(width / maxPartWidth), minNumColumns);
  const partWidth = (width - gap * (numColumns + 1)) / numColumns;
  return { width, gap, partWidth, numColumns };
}
