import { beforeEach, describe, expect, test } from 'vitest';
import './handlers';
import { auditDelta, payloadJson, writeAudit } from './audit';
import { getStore, resetStore } from './store';
import { createMockTransport } from './transport';
import { ID } from './ids';
import { installTransport } from '@/api';
import { ApplicationUserRole } from '@/api/dto';
import { activateUser, rejectRegistration, reopenRegistration, suspendUser } from '@/api/users';
import { revokeUserSession } from '@/api/sessions';
import { listRoleHistory, revokeRole } from '@/api/roles';
import { setDevState } from '@/dev/devState';

const parse = (json: string | null | undefined) => (json ? JSON.parse(json) : null);
const latest = (eventType: string) => getStore().audit.find((r) => r.eventType === eventType);

beforeEach(() => {
  resetStore();
  setDevState({ personaId: 'u2', nextFailure: 'none' });
  installTransport(createMockTransport());
});

describe('payload serialization', () => {
  test('keys stay PascalCase and timestamps carry an explicit offset', () => {
    const json = payloadJson({ Status: 'PendingActivation', ExpiresAtUtc: '2026-08-23T11:57:51.621Z' });
    expect(json).toBe('{"Status":"PendingActivation","ExpiresAtUtc":"2026-08-23T11:57:51.621+00:00"}');
  });

  test('null payloads pass through as null', () => {
    expect(payloadJson(null)).toBeNull();
  });
});

describe('delta rules', () => {
  test('keeps changed keys only, with identical key sets on both sides', () => {
    const delta = auditDelta(
      { FirstName: 'Gatis', LastName: 'Zvaigznitis' },
      { FirstName: 'Gatis', LastName: 'Zvaigzne' },
    );
    expect(delta).toEqual({ before: { LastName: 'Zvaigznitis' }, after: { LastName: 'Zvaigzne' } });
  });

  test('a key missing from one side is recorded as null, not dropped', () => {
    const delta = auditDelta({ ExpiresAtUtc: '2026-01-01T00:00:00Z' }, {});
    expect(delta).toEqual({ before: { ExpiresAtUtc: '2026-01-01T00:00:00Z' }, after: { ExpiresAtUtc: null } });
  });

  test('nothing changed writes no row at all', () => {
    const store = getStore();
    const before = store.audit.length;
    const row = writeAudit(store, {
      eventType: 'ApplicationUser.NameCorrected',
      actorUserId: ID.users.principal,
      before: { LastName: 'Same' },
      after: { LastName: 'Same' },
    });
    expect(row).toBeNull();
    expect(store.audit.length).toBe(before);
  });

  test('a one-sided payload is never deltaed', () => {
    const row = writeAudit(getStore(), {
      eventType: 'RoleAssignment.Granted',
      actorUserId: ID.users.principal,
      after: { Role: 'Viewer', ExpiresAtUtc: null },
    });
    expect(row?.beforeJson).toBeNull();
    expect(parse(row?.afterJson)).toEqual({ Role: 'Viewer', ExpiresAtUtc: null });
  });
});

describe('mutations write the payloads the reviewed prototype shows', () => {
  test('activation is after-only, with Roles as an array of grants', async () => {
    await activateUser(ID.users.pendingConfirmed, {
      roles: [{ role: ApplicationUserRole.Viewer, expiresAtUtc: null }],
    });
    const row = latest('Registration.Activated');
    expect(row?.beforeJson).toBeNull();
    expect(parse(row?.afterJson)).toEqual({
      Status: 'Active',
      CompanyId: ID.company,
      Roles: [{ Role: 'Viewer', ExpiresAtUtc: null }],
    });
    expect(row?.reason).toBeNull();
  });

  test('rejection records the typed reason and the status delta only', async () => {
    await rejectRegistration(ID.users.pendingConfirmed, { reason: 'No employment relationship.' });
    const row = latest('Registration.Rejected');
    expect(row?.reason).toBe('No employment relationship.');
    expect(parse(row?.beforeJson)).toEqual({ Status: 'PendingActivation' });
    expect(parse(row?.afterJson)).toEqual({ Status: 'RegistrationRejected' });
  });

  test('reopening a confirmed registration leaves the expiry null on both sides', async () => {
    await rejectRegistration(ID.users.pendingConfirmed, { reason: 'Rejected in error.' });
    await reopenRegistration(ID.users.pendingConfirmed, { reason: 'Rejected in error.' });
    const row = latest('Registration.Reopened');
    expect(parse(row?.beforeJson)).toEqual({ Status: 'RegistrationRejected' });
    expect(parse(row?.afterJson)).toEqual({ Status: 'PendingActivation' });
  });

  test('reopening an unconfirmed registration records the new seven-day deadline', async () => {
    await rejectRegistration(ID.users.pendingUnconfirmed, { reason: 'Submitted by mistake.' });
    await reopenRegistration(ID.users.pendingUnconfirmed, { reason: 'Applicant asked to continue.' });
    const row = latest('Registration.Reopened');
    const after = parse(row?.afterJson);
    expect(after.Status).toBe('PendingActivation');
    expect(after.RegistrationExpiresAtUtc).toMatch(/\+00:00$/);
  });

  test('suspension audits the status change and revokes sessions without extra audit rows', async () => {
    const rows = () => getStore().audit.length;
    const before = rows();
    await suspendUser(ID.users.fleet);
    expect(rows()).toBe(before + 1);
    const row = latest('ApplicationUser.Suspended');
    expect(row?.reason).toBeNull();
    expect(parse(row?.beforeJson)).toEqual({ Status: 'Active' });
    const sessions = getStore().sessions.filter((s) => s.applicationUserId === ID.users.fleet);
    expect(sessions.some((s) => s.revocationReason === 'Account suspended')).toBe(true);
  });

  test('a role revocation records RevokedAtUtc on both sides and nothing else', async () => {
    const history = await listRoleHistory(ID.users.fleet, { PageSize: 100 });
    const row = history.items.find((r) => r.isEffective && r.role === ApplicationUserRole.FleetManager);
    await revokeRole(ID.users.fleet, row?.id as string, { reason: 'Left the fleet team.' });
    const entry = latest('RoleAssignment.Revoked');
    expect(entry?.reason).toBe('Left the fleet team.');
    expect(parse(entry?.beforeJson)).toEqual({ RevokedAtUtc: null });
    const after = parse(entry?.afterJson);
    expect(Object.keys(after)).toEqual(['RevokedAtUtc']);
    expect(after.RevokedAtUtc).toMatch(/\+00:00$/);
  });

  test('an explicit session revocation does write its own row', async () => {
    const session = getStore().sessions.find((s) => s.applicationUserId === ID.users.fleet && s.isActive);
    await revokeUserSession(ID.users.fleet, session?.id as string);
    const row = latest('Session.RevokedByAdministrator');
    expect(row?.entityType).toBe('Session');
    expect(row?.beforeJson).toBeNull();
    expect(row?.afterJson).toBeNull();
  });
});
