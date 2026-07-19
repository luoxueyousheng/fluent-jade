/* React hooks:宿主事件订阅 / 主题状态 / 业务调用 */
import { useEffect, useSyncExternalStore, useCallback } from 'react';
import {
  hasJade, host, inv, parsePayload,
  effectiveDark, getThemeMode, getBackdrop, onThemeChange,
} from './core';

/** 订阅宿主推送事件;卸载自动退订。payload 已做字符串 JSON 兜底解析。 */
export function useJadeEvent<T = unknown>(event: string, cb: (payload: T) => void): void {
  useEffect(() => {
    if (!hasJade) return;
    return window.jade!.on(event, (p) => cb(parsePayload<T>(p)));
  }, [event, cb]);
}

/** 当前明暗/材质状态(applyTheme/applyBackdrop 后自动重渲染) */
export function useTheme(): { dark: boolean; mode: string; backdrop: string } {
  const dark = useSyncExternalStore(onThemeChange, effectiveDark, () => false);
  const mode = useSyncExternalStore(onThemeChange, getThemeMode, () => 'system');
  const backdrop = useSyncExternalStore(onThemeChange, getBackdrop, () => 'mica');
  return { dark, mode, backdrop };
}

/** 稳定引用的 host(fetch 风格);组件依赖数组里用它即可 */
export function useHost(): typeof host {
  return useCallback(host, []) as typeof host;
}

/** @deprecated 用 useHost / 直接 import { host, inv } */
export function useInv(): typeof inv {
  return useCallback(inv, []);
}
