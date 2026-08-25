import { beforeEach, describe, expect, test } from 'vitest';
import './handlers';
import { createMockTransport } from './transport';
import { getStore, resetStore } from './store';
import { ID } from './ids';
import { installTransport, transport } from '@/api/transport';
import { setDevState } from '@/dev/devState';
import type { CompanyResponse, SystemAdministratorTransferResponse } from '@/api/dto';

/** u1 holds the System Administrator role: the only persona that may transfer it. */
beforeEach(() => {
  resetStore();
  setDevState({ personaId: 'u1', nextFailure: 'none' });
  installTransport(createMockTransport());
});

const post = <T>(path: string, body: unknown) => transport().request<T>('POST', path, { body });
const put = <T>(path: string, body: unknown) => transport().request<T>('PUT', path, { body });
const get = <T>(path: string) => transport().request<T>('GET', path, {});

const failure = async (run: () => Promise<unknown>) => {
  try {
    await run();
  } catch (e) {
    return e as { status?: number; problem?: { code?: string; errors?: Record<string, string[]> } };
  }
  throw new Error('the request was expected to be refused');
};

const base = '/api/system-administrator/transfers';
const list = () => get<{ items: SystemAdministratorTransferResponse[] }>(base);
const emailOf = (id: string) => getStore().users.find((u) => u.id === id)?.email ?? '';
const cancelSeeded = () => post(`${base}/${ID.transfers.tr1}/cancel`, { reason: 'Clearing the seeded transfer.' });

describe('system administrator transfer', () => {
  test('the seeded transfer is pending and blocks a second one', async () => {
    const refused = await failure(() => post(base, {
      targetEmail: emailOf(ID.users.u3),
      currentPassword: 'whatever',
      reason: 'Handing over administration.',
    }));
    expect(refused.status).toBe(409);
    expect(refused.problem?.code).toBe('system_administrator.transfer_pending');
    expect((await list()).items.filter((t) => !t.cancelledAtUtc && !t.acceptedAtUtc)).toHaveLength(1);
  });

  test('cancelling records the reason and closes the transfer', async () => {
    await cancelSeeded();
    const t = (await list()).items.find((x) => x.id === ID.transfers.tr1);
    expect(t?.cancelledAtUtc).toBeTruthy();
    const entry = getStore().audit[0];
    expect(entry?.eventType).toBe('SystemAdministrator.TransferCancelled');
    expect(entry?.reason).toBe('Clearing the seeded transfer.');
    expect(entry?.entityId).toBe(ID.transfers.tr1);
  });

  test('a cancel reason under three characters is refused on its own input', async () => {
    const refused = await failure(() => post(`${base}/${ID.transfers.tr1}/cancel`, { reason: 'no' }));
    expect(refused.problem?.errors?.['Reason']?.[0]).toContain('at least 3 characters');
  });

  test('resend rotates the expiry and audits the rotation', async () => {
    const before = (await list()).items.find((x) => x.id === ID.transfers.tr1)?.expiresAtUtc;
    await post(`${base}/${ID.transfers.tr1}/resend`, { currentPassword: 'secret' });
    const after = (await list()).items.find((x) => x.id === ID.transfers.tr1)?.expiresAtUtc;
    expect(after).not.toBe(before);
    expect(getStore().audit[0]?.eventType).toBe('SystemAdministrator.TransferConfirmationRotated');
  });

  test('resend without a password is refused on the password input', async () => {
    const refused = await failure(() => post(`${base}/${ID.transfers.tr1}/resend`, {}));
    expect(refused.problem?.errors?.['CurrentPassword']?.[0]).toContain('must not be empty');
  });

  test('an unknown target is refused on the email input', async () => {
    await cancelSeeded();
    const refused = await failure(() => post(base, {
      targetEmail: 'nobody@example.com',
      currentPassword: 'secret',
      reason: 'Handing over administration.',
    }));
    expect(refused.problem?.errors?.['TargetEmail']?.[0]).toContain('cannot receive the transfer');
  });

  test('initiating names the target, stays pending and audits the reason', async () => {
    await cancelSeeded();
    const created = await post<SystemAdministratorTransferResponse>(base, {
      targetEmail: emailOf(ID.users.u2),
      currentPassword: 'secret',
      reason: 'Handing over administration.',
    });
    expect(created.targetUserId).toBe(ID.users.u2);
    expect(created.acceptedAtUtc).toBeNull();
    expect(created.cancelledAtUtc).toBeNull();
    const entry = getStore().audit[0];
    expect(entry?.eventType).toBe('SystemAdministrator.TransferInitiated');
    expect(entry?.targetUserId).toBe(ID.users.u2);
    expect(entry?.reason).toBe('Handing over administration.');
  });
});

describe('company profile', () => {
  test('editing the Company audits before and after with changed keys only', async () => {
    const before = await get<CompanyResponse>('/api/companies');
    await put(`/api/companies/${before.id}`, { ...before, name: 'RW-Rent Fleet Services OU' });
    const entry = getStore().audit[0];
    expect(entry?.eventType).toBe('Company.Updated');
    const after = JSON.parse(entry?.afterJson ?? '{}') as Record<string, string>;
    expect(Object.keys(after)).toEqual(['Name']);
    expect(after['Name']).toBe('RW-Rent Fleet Services OU');
  });

  test('the Company cannot be deleted while it is referenced', async () => {
    const co = await get<CompanyResponse>('/api/companies');
    const refused = await failure(() => transport().request('DELETE', `/api/companies/${co.id}`, {}));
    expect(refused.status).toBe(409);
    expect(refused.problem?.code).toBe('company.referenced');
  });
});
