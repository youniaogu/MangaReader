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
  DDoSRetry = 'KL漫画网站DDoS保护，请重试',
  AuthFailDMZJ = '动漫之家Cookies失败，请在Webview里重新登录',
  AuthFailPICA = '哔咔漫画Token失效，请在Webview里重新获取',
  WithoutPermission = '授权失败',
  PushTaskFail = '推送任务失败',
  CloudflareFail = 'cloudflare认证失败，请在Webview里重新校验',
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
  Download = 'download',
  Export = 'export',
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
  Download,
  Export,
}

export enum PositionX {
  Left,
  Mid,
  Right,
}

export enum PositionY {
  Top,
  Mid,
  Bottom,
}

export enum PositionXY {
  TopLeft,
  TopMid,
  TopRight,
  MidLeft,
  Center,
  MidRight,
  BottomLeft,
  BottomMid,
  BottomRight,
}
