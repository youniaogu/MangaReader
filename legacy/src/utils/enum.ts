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
  /** 翻页模式 */
  Horizontal = 'horizontal',
  /** 条漫模式 */
  Vertical = 'vertical',
  /** 双页模式 */
  Multiple = 'multiple',
}

export enum ReaderDirection {
  /** 从右向左 */
  Left = 'left',
  /** 从左向右 */
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
  WrongResponse = '响应失败: ',
  WrongDataType = '错误的数据格式',
  DDoSRetry = 'KL漫画网站DDoS保护，请重试',
  NotFoundDMZJ = '未找到漫画，请在Webview里登录获取UID后再试',
  AuthFailPICA = '哔咔漫画Token失效，请在Webview里重新获取',
  WithoutPermission = '授权失败',
  PushTaskFail = '推送任务失败',
  CloudflareFail = 'cloudflare认证失败，请在Webview里重新校验',
  AccessSourceFail = '访问资源失败',
  ExecutionJobFail = '执行任务失败',
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
  /** 从小到大 */
  Asc = 'Asc',
  /** 从大到小 */
  Desc = 'Desc',
}

export enum Volume {
  Up = 'Up',
  Down = 'Down',
}

export enum LightSwitch {
  /** 关灯 */
  Off = 'Off',
  /** 开灯 */
  On = 'On',
}

/** 任务类型 */
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

/** 图片加密类型 */
export enum ScrambleType {
  JMC,
  RM5,
}

export enum MultipleSeat {
  /** 第一张 | 第二张 */
  AToB,
  /** 第二张 | 第一张 */
  BToA,
}

export enum Hearing {
  Enable,
  Disabled,
}

export enum Timer {
  Enable,
  Disabled,
}

export enum SafeArea {
  All,
  None,
  X,
  Y,
}

export enum TemplateKey {
  MANGA_ID = 'MANGA_ID',
  MANGA_NAME = 'MANGA_NAME',
  CHAPTER_ID = 'CHAPTER_ID',
  CHAPTER_NAME = 'CHAPTER_NAME',
  AUTHOR = 'AUTHOR',
  SOURCE_ID = 'SOURCE_ID',
  SOURCE_NAME = 'SOURCE_NAME',
  TAG = 'TAG',
  STATUS = 'STATUS',
  HASH = 'HASH',
  TIME = 'TIME',
}

export enum Animated {
  Enable,
  Disabled,
}
