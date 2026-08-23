import { ApiError } from './problem';
import { toSearchParams } from './client';
import type { AntiforgeryTokenResponse } from './dto';
import type { Method, RequestInitLike, Transport } from './transport';

/**
 * The Phase 3 target. Cookie auth, so every request sends credentials; unsafe verbs carry the
 * antiforgery header from GET /api/auth/antiforgery, kept in memory only and refreshed once on a
 * rejected token.
 */
export function createHttpTransport(baseUrl: string): Transport {
  let antiforgery: AntiforgeryTokenResponse | undefined;

  const fetchAntiforgery = async (): Promise<AntiforgeryTokenResponse> => {
    const res = await fetch(`${baseUrl}/api/auth/antiforgery`, { credentials: 'include' });
    if (!res.ok) throw new ApiError(res.status, { title: 'Antiforgery token unavailable' });
    antiforgery = (await res.json()) as AntiforgeryTokenResponse;
    return antiforgery;
  };

  const send = async (method: Method, path: string, init: RequestInitLike | undefined, retry: boolean): Promise<Response> => {
    const qs = toSearchParams(init?.query).toString();
    const headers: Record<string, string> = {};
    if (init?.body !== undefined) headers['Content-Type'] = 'application/json';
    if (method !== 'GET') {
      const token = antiforgery ?? (await fetchAntiforgery());
      headers[token.headerName] = token.requestToken;
    }
    const res = await fetch(`${baseUrl}${path}${qs ? `?${qs}` : ''}`, {
      method,
      credentials: 'include',
      headers,
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    });
    if (res.status === 400 && retry && method !== 'GET') {
      const problem = await res.clone().json().catch(() => ({}));
      if (typeof problem?.code === 'string' && problem.code.includes('antiforgery')) {
        antiforgery = undefined;
        return send(method, path, init, false);
      }
    }
    return res;
  };

  return {
    async request<T>(method: Method, path: string, init?: RequestInitLike): Promise<T> {
      const res = await send(method, path, init, true);
      if (res.status === 204) return undefined as T;
      const text = await res.text();
      const payload = text ? JSON.parse(text) : undefined;
      if (!res.ok) throw new ApiError(res.status, payload ?? { status: res.status, title: res.statusText });
      return payload as T;
    },
  };
}
