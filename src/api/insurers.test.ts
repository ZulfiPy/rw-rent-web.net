import { afterEach, describe, expect, test } from 'vitest';
import { activateInsurer, createInsurer, deactivateInsurer, getInsurer, listInsurers, updateInsurer } from './insurers';
import { installTransport, type Method, type RequestInitLike } from './transport';

/**
 * The six operations of the insurers the company keeps (the backend's round 13, Follow-up 18), as the
 * transport receives them: the list with its one filter, one insurer, and the four writes, each JSON
 * but the two that put an insurer out of use or back, which carry no body.
 */
const sent: Array<{ method: Method; path: string; init?: RequestInitLike }> = [];
installTransport({
  async request<T>(method: Method, path: string, init?: RequestInitLike) {
    sent.push({ method, path, ...(init ? { init } : {}) });
    return undefined as T;
  },
});
afterEach(() => { sent.length = 0; });

describe('the insurers’ operations (F18-2a)', () => {
  test('the list: every insurer, or those in use or out of use by IsActive', async () => {
    await listInsurers();
    await listInsurers({ IsActive: true });
    await listInsurers({ IsActive: false });
    expect(sent.map((s) => [s.method, s.path, s.init?.query])).toEqual([
      ['GET', '/api/insurers', {}],
      ['GET', '/api/insurers', { IsActive: true }],
      ['GET', '/api/insurers', { IsActive: false }],
    ]);
  });

  test('one insurer; add; edit with its token; out of use and back in use with no body', async () => {
    await getInsurer('i-1');
    await createInsurer({ name: 'Pilot Insurance AS', email: 'claims@pilot-insurance.example', phoneNumber: null });
    await updateInsurer('i-1', { name: 'Pilot Insurance Group', email: null, phoneNumber: '+372 600 7700', concurrencyToken: 't-1' });
    await deactivateInsurer('i-1');
    await activateInsurer('i-1');
    expect(sent.map((s) => [s.method, s.path, s.init?.body])).toEqual([
      ['GET', '/api/insurers/i-1', undefined],
      ['POST', '/api/insurers', { name: 'Pilot Insurance AS', email: 'claims@pilot-insurance.example', phoneNumber: null }],
      ['PUT', '/api/insurers/i-1', { name: 'Pilot Insurance Group', email: null, phoneNumber: '+372 600 7700', concurrencyToken: 't-1' }],
      ['POST', '/api/insurers/i-1/deactivate', undefined],
      ['POST', '/api/insurers/i-1/activate', undefined],
    ]);
  });
});
