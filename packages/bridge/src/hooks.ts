/* React hooks */
import { useEffect, useSyncExternalStore, useCallback } from 'react';
import { hasJade, host, inv, parsePayload } from './host';
import { effectiveDark, getBackdrop, getThemeMode, onThemeChange } from './theme';

/** 订阅宿主推送;卸载自动退订 */
export function useJadeEvent<T = unknown>(event: string, cb: (payload: T) => void): void {
  useEffect(() => {
    if (!hasJade) return;
    return window.jade!.on(event, (p) => cb(parsePayload<T>(p)));
  }, [event, cb]);
}

/** @deprecated 别名,与 useJadeEvent 相同 */
export const useHostEvent = useJadeEvent;

/** 明暗 / 材质(切换后自动重渲染) */
export function useTheme(): { dark: boolean; mode: string; backdrop: string } {
  const dark = useSyncExternalStore(onThemeChange, effectiveDark, () => false);
  const mode = useSyncExternalStore(onThemeChange, getThemeMode, () => 'system');
  const backdrop = useSyncExternalStore(onThemeChange, getBackdrop, () => 'mica');
  return { dark, mode, backdrop };
}

/** 组件内稳定 host 引用 */
export function useHost(): typeof host {
  return useCallback(host, []) as typeof host;
}

/** @deprecated 用 useHost 或 import { host, inv } */
export function useInv(): typeof inv {
  return useCallback(inv, []);
}
