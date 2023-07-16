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
 * @description enum layoutmode of Reader component
 * @enum {number}
 */
export enum LayoutMode {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export enum ReaderDirection {
  Left = 'left',
  Right = 'right',
}

export enum ErrorMessage {
  Unknown = '未知错误~',
  NoMore = '没有更多~',
  PluginMissing = '缺少插件~',
  Timeout = '超时~',
  RequestTimeout = '请求超时~',
  NoSupport = '插件不支持',
  MissingChapterInfo = '缺少章节信息~',
  SyncFail = '同步数据失败～',
  WrongResponse = '响应失败: ',
  WrongDataType = '错误的数据格式',
  DDoSRetry = '网站DDoS保护，请再试一次',
  CookieInvalid = 'Cookie失效，请重新获取',
  WithoutPermission = '授权失败',
  IOSNotSupportWebp = '暂不支持.webp格式下载',
  TokenInvalid = 'Token失效，请重新获取',
}

export enum Orientation {
  Portrait = 'portrait',
  Landscape = 'landscape',
}

export enum BackupRestore {
  Clipboard = 'clipboard',
  Qrcode = 'Qrcode',
  Picture = 'Picture',
}

export enum ChapterOptions {
  Multiple = 'multiple',
  Prefetch = 'prefetch',
  Download = 'download',
}

export enum Sequence {
  Asc = 'Asc',
  Desc = 'Desc',
}

export enum Volume {
  Up = 'Up',
  Down = 'Down',
}

export enum LightSwitch {
  Off = 'Off',
  On = 'On',
}

export enum TaskType {
  Prefetch,
  Download,
}
