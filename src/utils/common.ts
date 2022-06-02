export const coverAspectRatio = 210 / 297;
export const storageKey = {
  favorites: '@favorites',
  dict: '@dict',
  plugin: '@plugin',
};

export const PATTERN_MANGA_ID = /^https:\/\/m\.manhuagui\.com\/comic\/[0-9]+(?=\/$|$)/g;
export const PATTERN_CHAPTER_ID =
  /^https:\/\/m\.manhuagui\.com\/comic\/[0-9]+\/[0-9]+(?=\.html|$)/g;
export const PATTERN_SCRIPT = /^window\["\\x65\\x76\\x61\\x6c"\].+(?=$)/g;
export const PATTERN_READER_DATA = /^SMH\.reader\(.+(?=\)\.preInit\(\);)/g;

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
