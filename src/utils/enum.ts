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

/**
 * @description enum mode of Reader component
 * @enum {number}
 */
export enum ReaderMode {
  Horizontal,
  Vertical,
}
