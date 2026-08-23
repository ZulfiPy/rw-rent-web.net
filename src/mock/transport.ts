import { ApiError } from '@/api/problem';
import type { Method, Query, RequestInitLike, Transport } from '@/api/transport';
import type { Permission } from '@/permissions/permissions';
import { createCan, type Can } from '@/permissions/can';
import { consumeNextFailure } from '@/dev/devState';
import { simulateFailure } from './failures';
import { getStore, type MockStore } from './store';
import { currentUser } from './currentUser';
import type { CurrentUserResponse } from '@/api/dto';

export interface Ctx {
  params: Record<string, string>;
  query: Query;
  body: unknown;
  store: MockStore;
  me: CurrentUserResponse;
  can: Can;
}

interface Route {
  method: Method;
  template: string;
  requires?: Permission[];
  handler: (ctx: Ctx) => unknown;
}

const routes: Route[] = [];

/** Handler modules call this at import time. `requires` produces the 403 an over-offered action earns. */
export function route(
  method: Method,
  template: string,
  handler: (ctx: Ctx) => unknown,
  requires?: Permission[],
): void {
  routes.push({ method, template, handler, requires });
}

/** Route literals are compared case-insensitively, as ASP.NET routing binds them. */
const match = (template: string, path: string): Record<string, string> | null => {
  const t = template.split('/');
  const p = path.split('/');
  if (t.length !== p.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < t.length; i += 1) {
    const seg = t[i] as string;
    const val = p[i] as string;
    if (seg.startsWith('{') && seg.endsWith('}')) params[seg.slice(1, -1)] = decodeURIComponent(val);
    else if (seg.toLowerCase() !== val.toLowerCase()) return null;
  }
  return params;
};

/**
 * Query keys bind case-insensitively too, so a handler reading `query.PageNumber` also sees
 * `?pagenumber=2`. Own keys are returned verbatim; anything else falls back to a lowercased lookup.
 */
const bindQuery = (query: Query): Query => {
  const index = new Map<string, unknown>();
  for (const [k, v] of Object.entries(query as Record<string, unknown>)) index.set(k.toLowerCase(), v);
  return new Proxy({ ...(query as Record<string, unknown>) }, {
    get: (target, prop, receiver) =>
      typeof prop === 'string' && !Object.prototype.hasOwnProperty.call(target, prop)
        ? index.get(prop.toLowerCase())
        : Reflect.get(target, prop, receiver),
    has: (target, prop) =>
      typeof prop === 'string' ? index.has(prop.toLowerCase()) : Reflect.has(target, prop),
  }) as Query;
};

export const notFound = (detail = 'The record was not found.') =>
  new ApiError(404, { status: 404, title: 'Not Found', detail, code: 'resource.not_found' });

export const forbidden = () =>
  new ApiError(403, { status: 403, title: 'Forbidden', detail: 'You are not permitted to do this.', code: 'authorization.forbidden' });

/** Latency makes the loading states visible in the browser; tests run without it. */
const LATENCY_MS = import.meta.env?.MODE === 'test' ? 0 : 140;

export function createMockTransport(): Transport {
  return {
    async request<T>(method: Method, path: string, init?: RequestInitLike): Promise<T> {
      const hit = routes
        .map((r) => (r.method === method ? { r, params: match(r.template, path) } : null))
        .find((x): x is { r: Route; params: Record<string, string> } => !!x && x.params !== null);
      if (!hit) throw notFound(`No mock route for ${method} ${path}`);

      const store = getStore();
      const me = currentUser(store);
      const can = createCan(me.permissions);
      if (hit.r.requires && !hit.r.requires.every((p) => can(p))) throw forbidden();

      if (method !== 'GET') simulateFailure(consumeNextFailure(), method, hit.r.template);
      await new Promise((r) => setTimeout(r, LATENCY_MS));

      return hit.r.handler({ params: hit.params, query: bindQuery(init?.query ?? {}), body: init?.body, store, me, can }) as T;
    },
  };
}
