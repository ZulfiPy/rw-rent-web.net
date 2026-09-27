export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type QueryValue = string | number | boolean | undefined | null;

/**
 * What a request's query object has to look like by the time it reaches a transport: string keys,
 * values a query string can carry. The typed query DTOs (UsersQuery, SecurityAuditQuery, …) satisfy
 * this on their own — they are declared as type aliases, so TypeScript grants them an implicit index
 * signature and each one arrives with its own property types intact. Nothing is widened, and no call
 * site casts.
 */
export type Query = Record<string, QueryValue>;

/**
 * Compile-time guard for that arrangement: AssertQuery<T> fails if T stops being assignable to
 * Query — which is what happens the moment a query DTO is redeclared as an interface, since an
 * interface gets no implicit index signature. src/api/client.ts lists every query DTO through it, so
 * the error names the offending type in one place instead of surfacing at every call site.
 */
export type AssertQuery<Q extends Query> = Q;

export interface RequestInitLike {
  query?: Query;
  body?: unknown;
  /**
   * A `multipart/form-data` body instead of JSON (Follow-up 17): an insurance case's registration and
   * a new event carry their photos this way. The browser writes the boundary, so no Content-Type is
   * set for it.
   */
  form?: FormData;
}

export interface Transport {
  request<T>(method: Method, path: string, init?: RequestInitLike): Promise<T>;
}

let active: Transport | undefined;
let resourceBase = '';

/** Called once at bootstrap. Phase 3 swaps the mock transport for the http one here and nowhere else. */
export function installTransport(t: Transport): void {
  active = t;
}

export function transport(): Transport {
  if (!active) throw new Error('No transport installed — call installTransport() before any api call.');
  return active;
}

/** Where the API answers, for what the browser reads by address itself: a photo's picture in an img. */
export function installResourceBase(baseUrl: string): void {
  resourceBase = baseUrl;
}

/** The full address of an API path the browser loads on its own; the bare path before bootstrap. */
export const resourceUrl = (path: string) => `${resourceBase}${path}`;
