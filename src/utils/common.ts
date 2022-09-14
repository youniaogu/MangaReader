import { delay, race, Effect } from 'redux-saga/effects';
import { ErrorMessage } from './enum';

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
