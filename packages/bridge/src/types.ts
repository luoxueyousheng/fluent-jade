/* 公共类型与约定常量 —— JadeView 宿主契约(仅 Windows 桌面 WebView) */

/** 运行环境(Preload 注入 __JV_ENV 或 env 通道) */
export interface JadeEnv {
  os: string;
  arch: string;
  win11: boolean;
}

export interface JadeDialogAPI {
  showMessageBox(opts: {
    title?: string; message?: string; detail?: string;
    buttons?: string[]; defaultId?: number; cancelId?: number; type?: string;
  }): Promise<{ response: number }>;
  showErrorBox(title: string, content: string): void;
  showOpenDialog(opts?: { title?: string; properties?: string[] }): Promise<{ canceled: boolean; filePaths: string[] }>;
  showSaveDialog(opts?: { title?: string; defaultPath?: string }): Promise<{ canceled: boolean; filePath: string }>;
}

/** 宿主注入的 window.jade 最小面 */
export interface JadeHost {
  invoke(channel: string, payload?: unknown, opts?: { timeout?: number }): Promise<unknown>;
  on(event: string, cb: (payload: unknown) => void): () => void;
  dialog?: JadeDialogAPI;
  setWindowBackdrop?(id: number, type: string): void;
  setWindowTheme?(id: number, theme: string): unknown;
  setWebviewZoom?(id: number, level: number): void;
  setWindowProgress?(id: number, progress: number, state: number): void;
  minimizeWindow?(): void;
  toggleMaximizeWindow?(): void;
  closeWindow?(): void;
  _isMock?: boolean;
}

declare global {
  interface Window {
    jade?: JadeHost;
    __JV_ENV?: Partial<JadeEnv>;
  }
}

/** 宿主 → 前端 toast 事件负载(UI 层渲染) */
export interface ToastPayload {
  level?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  duration?: number;
  id?: string;
  action?: { label: string; command: string };
}

/** auto / ready 内置通道名(可经 configure.channels 覆盖) */
export const BridgeChannels = {
  env: 'env',
  setTheme: 'set-theme',
  applyTitlebar: 'apply-titlebar',
  setBackdrop: 'set-backdrop',
} as const;

export type BridgeChannelKey = keyof typeof BridgeChannels;

/** host / host.json 标准错误码 */
export const HostErrorCode = {
  NO_HOST: 'NO_HOST',
  ABORTED: 'ABORTED',
  HOST_ERROR: 'HOST_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const;

export type HostErrorCodeName = (typeof HostErrorCode)[keyof typeof HostErrorCode];

/** 窗口材质 */
export type BackdropType = 'mica' | 'micaAlt' | 'acrylic' | 'none' | (string & {});

/** 主题模式 */
export type ThemeMode = 'light' | 'dark' | 'system';

export interface BridgeConfig {
  /** 默认超时毫秒 */
  timeout: number;
  channels: {
    env: string;
    setTheme: string;
    applyTitlebar: string;
    setBackdrop: string;
    [key: string]: string;
  };
  /** 全局错误兜底(如 Toast);业务 try/catch 时 host.json 默认 silent */
  onError: ((channel: string, err: unknown) => void) | null;
  onLog: ((text: string, ok: boolean) => void) | null;
  solidColor: (dark: boolean) => string;
}

export interface InitResult {
  hasJade: boolean;
  ENV: JadeEnv;
  hasBackdrop: boolean;
}

export interface InitOptions extends Partial<BridgeConfig> {
  /** 支持材质时自动应用;false 关闭。默认 'mica' */
  backdrop?: BackdropType | false;
}

export interface HostCallOptions {
  timeout?: number;
  signal?: AbortSignal;
  /** true:失败不回调 onError(由调用方处理)。host.json 默认 true */
  silent?: boolean;
}

export class HostError extends Error {
  readonly channel: string;
  readonly code: string;
  readonly cause: unknown;
  constructor(channel: string, message: string, code: string = HostErrorCode.HOST_ERROR, cause?: unknown) {
    super(message);
    this.name = 'HostError';
    this.channel = channel;
    this.code = code;
    this.cause = cause;
  }
}

export interface HostResponse<T = unknown> {
  ok: boolean;
  data: T | null;
  error: HostError | null;
  channel: string;
  ms: number;
}
