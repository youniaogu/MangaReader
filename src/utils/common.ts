import { delay, race, Effect } from 'redux-saga/effects';
import { ErrorMessage } from './enum';
import queryString from 'query-string';

export const PATTERN_VERSION = /v?([0-9]+)\.([0-9]+)\.([0-9]+)$/;
export const PATTERN_PUBLISH_TIME = /([0-9]+)-([0-9]+)-([0-9]+)/;
export const coverAspectRatio = 210 / 297;
export const storageKey = {
  favorites: '@favorites',
  dict: '@dict',
  plugin: '@plugin',
  setting: '@setting',
};

export function isManga(item: Manga | undefined | null): item is Manga {
  if (item) {
    return true;
  }
  return false;
}
export function isChapter(item: Chapter | undefined | null): item is Chapter {
  if (item) {
    return true;
  }
  return false;
}

export function scaleToFill(
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

export function scaleToFit(
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

  return dict;
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
