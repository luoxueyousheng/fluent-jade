/* 业务调用:fetch 风格 host / host.json;旧 inv 兼容 */
import { cfg } from './config';
import {
  HostError, HostErrorCode,
  type HostCallOptions, type HostResponse,
} from './types';

export const hasJade =
  typeof window !== 'undefined' && typeof window.jade !== 'undefined';

/** jade 事件/应答 payload:字符串则尝试 JSON 解析 */
export function parsePayload<T = unknown>(p: unknown): T {
  if (typeof p === 'string') {
    try { return JSON.parse(p) as T; } catch { return p as T; }
  }
  return p as T;
}

function toHostError(channel: string, e: unknown): HostError {
  if (e instanceof HostError) return e;
  const anyE = e as { code?: string; message?: string; name?: string } | null;
  const msg = String(anyE?.message ?? e ?? '宿主调用失败');
  let code = String(anyE?.code ?? HostErrorCode.HOST_ERROR);
  if (anyE?.name === 'AbortError') code = HostErrorCode.ABORTED;
  if (/timeout|超时/i.test(msg) && code === HostErrorCode.HOST_ERROR) code = HostErrorCode.TIMEOUT;
  return new HostError(channel, msg, code, e);
}

function raceAbort<T>(p: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return p;
  if (signal.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'));
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
    signal.addEventListener('abort', onAbort, { once: true });
    p.then(
      (v) => { signal.removeEventListener('abort', onAbort); resolve(v); },
      (e) => { signal.removeEventListener('abort', onAbort); reject(e); },
    );
  });
}

async function hostCall<T = unknown>(
  channel: string,
  payload: unknown = {},
  opts: HostCallOptions = {},
): Promise<HostResponse<T>> {
  const t0 = performance.now();
  const timeout = opts.timeout ?? cfg.timeout;
  if (!hasJade) {
    const error = new HostError(channel, 'jade 对象不可用(不在宿主内运行)', HostErrorCode.NO_HOST);
    if (!opts.silent) cfg.onError?.(channel, error);
    return { ok: false, data: null, error, channel, ms: 0 };
  }
  try {
    const raw = await raceAbort(
      window.jade!.invoke(channel, payload, { timeout }),
      opts.signal,
    );
    const data = parsePayload<T>(raw);
    const ms = Math.round(performance.now() - t0);
    cfg.onLog?.(
      `host('${channel}') ${ms}ms → ${typeof data === 'string' ? data : JSON.stringify(data)}`,
      true,
    );
    return { ok: true, data, error: null, channel, ms };
  } catch (e) {
    const error = toHostError(channel, e);
    const ms = Math.round(performance.now() - t0);
    cfg.onLog?.(`host('${channel}') 失败 ${ms}ms: ${error.message}`, false);
    if (!opts.silent) cfg.onError?.(channel, error);
    return { ok: false, data: null, error, channel, ms };
  }
}

/** 成功返回 data;失败抛 HostError(默认 silent,由调用方 try/catch) */
export async function hostJson<T = unknown>(
  channel: string,
  payload: unknown = {},
  opts: HostCallOptions = {},
): Promise<T> {
  const r = await hostCall<T>(channel, payload, { ...opts, silent: opts.silent ?? true });
  if (!r.ok) throw r.error ?? new HostError(channel, '宿主调用失败', HostErrorCode.HOST_ERROR);
  return r.data as T;
}

/**
 * fetch 风格宿主调用
 * @example
 * const r = await host('load_users', { q });
 * if (r.ok) use(r.data);
 * const data = await host.json('load_users', { q });
 */
export const host: {
  <T = unknown>(channel: string, payload?: unknown, opts?: HostCallOptions): Promise<HostResponse<T>>;
  json: typeof hostJson;
} = Object.assign(hostCall, { json: hostJson });

/** @deprecated 新代码用 host / host.json。失败返回 null 并触发 onError */
export async function inv<T = unknown>(channel: string, payload: unknown = {}): Promise<T | null> {
  const r = await hostCall<T>(channel, payload);
  return r.ok ? (r.data as T) : null;
}
