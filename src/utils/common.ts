import { delay, race, Effect } from 'redux-saga/effects';

/**
 * @description enum of any async status
 * @enum {number}
 */
export enum AsyncStatus {
  Default,
  Pending,
  Fulfilled,
  Rejected,
}

/**
 * @description enum of manga serial status
 * @enum {number}
 */
export enum MangaStatus {
  Unknown,
  Serial,
  End,
}

/**
 * @description enum of nodejs env
 * @enum {number}
 */
export enum env {
  DEV = 'development',
  PROD = 'production',
}

export const coverAspectRatio = 210 / 297;
export const storageKey = {
  favorites: '@favorites',
  dict: '@dict',
  plugin: '@plugin',
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
  };
}

export function* raceTimeout(fn: Effect, ms: number = 5000) {
  const { result, timeout } = yield race({
    result: fn,
    timeout: delay(ms),
  });

  if (timeout) {
    return { error: new Error('Timeouts') };
  }

  return { result };
}
