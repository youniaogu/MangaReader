import LZString from 'lz-string';

// eslint-disable-next-line no-extend-native
String.prototype.splic = function (f: string): string[] {
  return LZString.decompressFromBase64(this.toString())?.split(f) || [];
};
