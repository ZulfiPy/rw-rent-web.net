import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHttpTransport } from './http';
import { isApiError } from './problem';

const json = (status: number, body: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const antiforgery = () => json(200, { requestToken: 'token-1', headerName: 'X-RWRent-Antiforgery' });

function install(responses: Array<() => Response>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  let index = 0;
  const fetchMock = vi.fn((url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const next = responses[index];
    index += 1;
    if (!next) throw new Error(`No response scripted for call ${index}: ${String(url)}`);
    return Promise.resolve(next());
  });
  vi.stubGlobal('fetch', fetchMock);
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe('http transport', () => {
  it('sends credentials and the query string, and returns the parsed body', async () => {
    const calls = install([() => json(200, { items: [], totalCount: 0 })]);
    const t = createHttpTransport('http://api.test');

    const body = await t.request<{ totalCount: number }>('GET', '/api/users', {
      query: { PageSize: 25, Search: undefined, Statuses: '1,4,5' },
    });

    expect(body.totalCount).toBe(0);
    expect(calls[0]?.url).toBe('http://api.test/api/users?PageSize=25&Statuses=1%2C4%2C5');
    expect(calls[0]?.init.credentials).toBe('include');
    expect(calls[0]?.init.method).toBe('GET');
  });

  it('fetches the antiforgery token once and sends it on every unsafe request', async () => {
    const calls = install([antiforgery, () => json(200, { ok: true }), () => json(204, undefined)]);
    const t = createHttpTransport('http://api.test');

    await t.request('POST', '/api/auth/login', { body: { email: 'a@b.c', password: 'x' } });
    await t.request('DELETE', '/api/me/sessions/1');

    expect(calls).toHaveLength(3);
    expect(calls[0]?.url).toBe('http://api.test/api/auth/antiforgery');
    const headers = calls[1]?.init.headers as Record<string, string>;
    expect(headers['X-RWRent-Antiforgery']).toBe('token-1');
    expect(headers['Content-Type']).toBe('application/json');
    expect(calls[1]?.init.body).toBe('{"email":"a@b.c","password":"x"}');
    // The token is reused; a second unsafe request does not fetch it again.
    expect((calls[2]?.init.headers as Record<string, string>)['X-RWRent-Antiforgery']).toBe('token-1');
  });

  it('refreshes the token once when the API rejects it and retries the request', async () => {
    const calls = install([
      antiforgery,
      () => json(400, { status: 400, title: 'Bad Request', code: 'request.antiforgery_invalid' }),
      () => json(200, { requestToken: 'token-2', headerName: 'X-RWRent-Antiforgery' }),
      () => json(204, undefined),
    ]);
    const t = createHttpTransport('http://api.test');

    await expect(t.request('POST', '/api/me/password', { body: {} })).resolves.toBeUndefined();

    expect(calls).toHaveLength(4);
    expect((calls[1]?.init.headers as Record<string, string>)['X-RWRent-Antiforgery']).toBe('token-1');
    expect((calls[3]?.init.headers as Record<string, string>)['X-RWRent-Antiforgery']).toBe('token-2');
  });

  it('does not retry a plain validation failure and rejects with the problem', async () => {
    install([antiforgery, () => json(400, { status: 400, title: 'One or more validation errors occurred.', errors: { Email: ['Required.'] } })]);
    const t = createHttpTransport('http://api.test');

    const error = await t.request('POST', '/api/registrations', { body: {} }).catch((e: unknown) => e);
    expect(isApiError(error)).toBe(true);
    if (!isApiError(error)) throw new Error('expected an ApiError');
    expect(error.status).toBe(400);
    expect(error.errors?.Email?.[0]).toBe('Required.');
  });

  it('maps a 401 to an ApiError the session handler recognises', async () => {
    install([() => json(401, { status: 401, title: 'Unauthorized', detail: 'Sign in to continue.' })]);
    const t = createHttpTransport('http://api.test');

    const error = await t.request('GET', '/api/me').catch((e: unknown) => e);
    if (!isApiError(error)) throw new Error('expected an ApiError');
    expect(error.status).toBe(401);
    expect(error.message).toBe('Sign in to continue.');
  });

  it('returns undefined for 204 and never parses an empty body', async () => {
    install([antiforgery, () => new Response(null, { status: 204 })]);
    const t = createHttpTransport('http://api.test');
    await expect(t.request('POST', '/api/auth/logout')).resolves.toBeUndefined();
  });
});
