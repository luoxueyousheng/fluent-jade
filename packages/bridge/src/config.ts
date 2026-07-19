/* 运行时配置(模块内单例) */
import { BridgeChannels, type BridgeConfig } from './types';

export const cfg: BridgeConfig = {
  timeout: 8000,
  channels: { ...BridgeChannels },
  onError: null,
  onLog: null,
  solidColor: (dark) => (dark ? '#202020FF' : '#F3F3F3FF'),
};

/** 覆盖超时 / 通道名 / 错误与日志回调 */
export function configure(options: Partial<BridgeConfig>): void {
  const { channels, ...rest } = options;
  Object.assign(cfg, rest);
  if (channels) Object.assign(cfg.channels, channels);
}
