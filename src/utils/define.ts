import LZString from 'lz-string';

export enum LoadStatus {
  Default,
  Pending,
  Fulfilled,
  Rejected,
}
export enum UpdateStatus {
  Unknow,
  Serial,
  End,
}

export enum env {
  DEV = 'development',
  PROD = 'production',
}

// eslint-disable-next-line no-extend-native
String.prototype.splic = function (f: string): string[] {
  return LZString.decompressFromBase64(this.toString())?.split(f) || [];
};

window.env = env;
window.LoadStatus = LoadStatus;
window.UpdateStatus = UpdateStatus;
