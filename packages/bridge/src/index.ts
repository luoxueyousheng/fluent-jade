/* @fluent-jade/bridge 公共 API
 *
 * 接入:
 *   import '@fluent-jade/bridge/auto'
 *   const { hasJade } = await ready()
 *
 * 业务:
 *   const data = await host.json('channel', body)
 *   useJadeEvent('progress', handler)
 */

// —— 类型 / 常量 ——
export type {
  JadeEnv,
  JadeHost,
  JadeDialogAPI,
  ToastPayload,
  BridgeConfig,
  BridgeChannelKey,
  BackdropType,
  ThemeMode,
  InitOptions,
  InitResult,
  HostCallOptions,
  HostResponse,
  HostErrorCodeName,
} from './types';
export { BridgeChannels, HostErrorCode, HostError } from './types';

// —— 生命周期 ——
export { hasJade, ENV, configure, ready, ensureInit } from './lifecycle';

// —— 业务调用 ——
export { host, hostJson, inv } from './host';

// —— 主题 / 材质 ——
export { setThemeMode, applyBackdrop, getThemeMode, getBackdrop, effectiveDark } from './theme';

// —— React hooks ——
export { useJadeEvent, useHostEvent, useTheme, useHost, useInv } from './hooks';
