export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type QueryValue = string | number | boolean | undefined | null;
export type Query = Record<string, QueryValue>;

export interface RequestInitLike {
  query?: Query;
  body?: unknown;
}

export interface Transport {
  request<T>(method: Method, path: string, init?: RequestInitLike): Promise<T>;
}

let active: Transport | undefined;

/** Called once at bootstrap. Phase 3 swaps the mock transport for the http one here and nowhere else. */
export function installTransport(t: Transport): void {
  active = t;
}

export function transport(): Transport {
  if (!active) throw new Error('No transport installed — call installTransport() before any api call.');
  return active;
}
