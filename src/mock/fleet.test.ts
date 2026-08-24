import { beforeEach, describe, expect, test } from 'vitest';
import './handlers';
import { createMockTransport } from './transport';
import { getStore, resetStore } from './store';
import { ID } from './ids';
import { installTransport, transport } from '@/api/transport';
import { setDevState } from '@/dev/devState';
import {
  AssignmentDriverAuthorizationType, AssignmentStatus, AuthorizationStopReason,
  BillingImpact, InterruptionReason,
  type AssignmentDriverAuthorizationResponse, type AssignmentInterruptionResponse,
  type RentalAssignmentResponse,
} from '@/api/dto';

/** u1 is the System Administrator: the only persona that may execute a privileged correction. */
beforeEach(() => {
  resetStore();
  setDevState({ personaId: 'u1', nextFailure: 'none' });
  installTransport(createMockTransport());
});

const get = (id: string) =>
  transport().request<RentalAssignmentResponse>('GET', `/api/rental-assignments/${id}`, {});
const post = <T>(path: string, body: unknown) => transport().request<T>('POST', path, { body });
const put = <T>(path: string, body: unknown) => transport().request<T>('PUT', path, { body });

const failure = async (run: () => Promise<unknown>) => {
  try {
    await run();
  } catch (e) {
    return e as { status?: number; problem?: { code?: string; errors?: Record<string, string[]> } };
  }
  throw new Error('the request was expected to be refused');
};

const A = ID.assignments;
const Z = ID.authorizations;
const I = ID.interruptions;

describe('assignment lifecycle', () => {
  test('the record composes its authorizations and interruptions per read', async () => {
    const a = await get(A.a1);
    expect(a.driverAuthorizations.map((z) => z.id)).toContain(Z.z1);
    expect(a.interruptions.map((i) => i.id)).toContain(I.i1);
  });

  test('an assignment with an open interruption cannot be ended (INTERRUPT-011)', async () => {
    const refused = await failure(() => post(`/api/rental-assignments/${A.a3}/end`, {
      closedAtUtc: new Date().toISOString(),
    }));
    expect(refused.status).toBe(409);
    expect(refused.problem?.code).toBe('rental_assignments.interruption_open');
    expect((await get(A.a3)).status).toBe(AssignmentStatus.Active);
  });

  test('ending stops every open authorization with AssignmentEnded (AUTH-007)', async () => {
    const closedAtUtc = new Date().toISOString();
    await post(`/api/rental-assignments/${A.a2}/end`, { closedAtUtc });
    const a = await get(A.a2);
    expect(a.status).toBe(AssignmentStatus.Ended);
    expect(a.driverAuthorizations.every((z) => !!z.stoppedAtUtc)).toBe(true);
    expect(a.driverAuthorizations[0]?.stopReason).toBe(AuthorizationStopReason.AssignmentEnded);
  });

  test('activation is refused without authorization coverage (ASSIGN-012)', async () => {
    const refused = await failure(() => post(`/api/rental-assignments/${A.a4}/activate`, {
      startedAtUtc: new Date().toISOString(),
    }));
    expect(refused.problem?.code).toBe('rental_assignments.no_authorization_coverage');
    expect((await get(A.a4)).status).toBe(AssignmentStatus.Planned);
  });

  test('an active assignment is only cancellable as a mistaken activation (ASSIGN-013)', async () => {
    const refused = await failure(() => post(`/api/rental-assignments/${A.a2}/cancel`, {
      closedAtUtc: new Date().toISOString(),
    }));
    expect(refused.problem?.code).toBe('rental_assignments.handover_occurred');

    await post(`/api/rental-assignments/${A.a2}/cancel`, {
      closedAtUtc: new Date().toISOString(),
      noPhysicalHandoverOccurred: true,
      note: 'Activated against the wrong assignment.',
    });
    const a = await get(A.a2);
    expect(a.status).toBe(AssignmentStatus.Cancelled);
    expect(a.startedAtUtc).toBeNull();
  });
});

describe('driver authorizations', () => {
  test('named and collective authorizations are mutually exclusive (AUTH-003)', async () => {
    const refused = await failure(() => post(`/api/rental-assignments/${A.a1}/authorizations`, {
      authorizationType: AssignmentDriverAuthorizationType.BusinessCustomerDrivers,
      authorizedFromUtc: new Date().toISOString(),
      note: 'Framework agreement clause 4.2.',
    }));
    expect(refused.problem?.code).toBe('assignment_authorizations.named_and_collective_exclusive');
  });

  test('the collective form is refused for a private customer (AUTH-009)', async () => {
    const refused = await failure(() => post(`/api/rental-assignments/${A.a2}/authorizations`, {
      authorizationType: AssignmentDriverAuthorizationType.BusinessCustomerDrivers,
      authorizedFromUtc: new Date().toISOString(),
      note: 'Not allowed here.',
    }));
    expect(refused.problem?.code).toBe('assignment_authorizations.collective_requires_business');
  });

  test('the last coverage on an active assignment needs a replacement (AUTH-007)', async () => {
    const refused = await failure(() => post(
      `/api/rental-assignments/${A.a2}/authorizations/${Z.z3}/stop`,
      { stoppedAtUtc: new Date().toISOString(), stopReason: AuthorizationStopReason.CustomerRequest },
    ));
    expect(refused.problem?.code).toBe('assignment_authorizations.coverage_required');

    await post(`/api/rental-assignments/${A.a2}/authorizations/${Z.z3}/stop`, {
      stoppedAtUtc: new Date().toISOString(),
      stopReason: AuthorizationStopReason.Replaced,
      replacement: {
        authorizationType: AssignmentDriverAuthorizationType.NamedDriver,
        driverId: ID.drivers.d1,
      },
    });
    const a = await get(A.a2);
    expect(a.driverAuthorizations.filter((z) => !z.stoppedAtUtc).length).toBe(1);
  });
});

describe('interruptions', () => {
  test('an interruption cannot start before the actual handover (INTERRUPT-012)', async () => {
    const a = await get(A.a1);
    const before = new Date(new Date(a.startedAtUtc as string).getTime() - 3_600_000).toISOString();
    const refused = await failure(() => post(`/api/rental-assignments/${A.a1}/interruptions`, {
      startedAtUtc: before,
      reason: InterruptionReason.CarRepair,
      billingImpact: BillingImpact.NotBillable,
      note: 'Too early to be valid.',
    }));
    expect(refused.problem?.code).toBe('assignment_interruptions.before_assignment_start');
  });

  test('a note is required (INTERRUPT-006)', async () => {
    const refused = await failure(() => post(`/api/rental-assignments/${A.a1}/interruptions`, {
      startedAtUtc: new Date().toISOString(),
      reason: InterruptionReason.CarRepair,
      billingImpact: BillingImpact.NotBillable,
      note: '  ',
    }));
    expect(refused.status).toBe(400);
    expect(Object.keys(refused.problem?.errors ?? {})).toContain('Note');
  });

  test('ending an interruption unblocks ending the assignment', async () => {
    await post(`/api/rental-assignments/${A.a3}/interruptions/${I.i2}/end`, {
      endedAtUtc: new Date().toISOString(),
    });
    await post(`/api/rental-assignments/${A.a3}/end`, { closedAtUtc: new Date().toISOString() });
    expect((await get(A.a3)).status).toBe(AssignmentStatus.Ended);
  });
});

describe('privileged corrections', () => {
  test('a stale concurrency token is refused with the contractual code (CORRECTION-003)', async () => {
    const refused = await failure(() => put(`/api/rental-assignments/${A.a1}/corrections/timeline`, {
      plannedStartAtUtc: new Date().toISOString(),
      concurrencyToken: '00000000-0000-4000-8000-000000000000',
      reason: 'Timeline entered against the wrong rental.',
    }));
    expect(refused.status).toBe(409);
    expect(refused.problem?.code).toBe('rental_assignments.concurrency_conflict');
  });

  test('a timeline correction audits changed keys only, PascalCase, with an offset', async () => {
    const a = await get(A.a1);
    const nextEnd = new Date(new Date(a.plannedEndAtUtc as string).getTime() + 86_400_000).toISOString();
    await put(`/api/rental-assignments/${A.a1}/corrections/timeline`, {
      plannedStartAtUtc: a.plannedStartAtUtc,
      startedAtUtc: a.startedAtUtc,
      plannedEndAtUtc: nextEnd,
      closedAtUtc: a.closedAtUtc,
      note: a.note,
      concurrencyToken: a.concurrencyToken,
      reason: 'Planned return date was typed a day early.',
    });

    const entry = getStore().audit[0];
    expect(entry?.eventType).toBe('RentalAssignment.TimelineCorrected');
    expect(entry?.entityId).toBe(A.a1);
    expect(entry?.reason).toBe('Planned return date was typed a day early.');
    const before = JSON.parse(entry?.beforeJson ?? '{}') as Record<string, string>;
    const after = JSON.parse(entry?.afterJson ?? '{}') as Record<string, string>;
    expect(Object.keys(before)).toEqual(['PlannedEndAtUtc']);
    expect(Object.keys(after)).toEqual(['PlannedEndAtUtc']);
    expect(after['PlannedEndAtUtc']).toMatch(/\+00:00$/);
  });

  test('a correction rotates the token, so the same payload cannot be replayed', async () => {
    const a = await get(A.a1);
    const body = {
      customerId: ID.customers.cu3,
      concurrencyToken: a.concurrencyToken,
      reason: 'Assignment recorded against the wrong customer.',
    };
    await put(`/api/rental-assignments/${A.a1}/corrections/parties`, body);
    const replay = await failure(() => put(`/api/rental-assignments/${A.a1}/corrections/parties`, body));
    expect(replay.problem?.code).toBe('rental_assignments.concurrency_conflict');
  });

  test('an authorization correction names the authorization, not the assignment', async () => {
    const a = await get(A.a1);
    const z = a.driverAuthorizations.find((x) => x.id === Z.z2) as AssignmentDriverAuthorizationResponse;
    await put(`/api/rental-assignments/${A.a1}/authorizations/${Z.z2}/correction`, {
      authorizationType: z.authorizationType,
      driverId: z.driverId,
      authorizedFromUtc: z.authorizedFromUtc,
      stoppedAtUtc: z.stoppedAtUtc,
      stopReason: AuthorizationStopReason.CustomerRequest,
      note: z.note,
      concurrencyToken: z.concurrencyToken,
      reason: 'The stop reason was recorded wrongly.',
    });
    const entry = getStore().audit[0];
    expect(entry?.eventType).toBe('DriverAuthorization.Corrected');
    expect(entry?.entityId).toBe(Z.z2);
    const after = JSON.parse(entry?.afterJson ?? '{}') as Record<string, string>;
    expect(after['StopReason']).toBe('CustomerRequest');
  });

  test('an interruption correction stays inside the assignment window', async () => {
    const a = await get(A.a1);
    const i = a.interruptions.find((x) => x.id === I.i1) as AssignmentInterruptionResponse;
    const refused = await failure(() => put(
      `/api/rental-assignments/${A.a1}/interruptions/${I.i1}/correction`,
      {
        startedAtUtc: i.startedAtUtc,
        endedAtUtc: i.startedAtUtc,
        reasonCode: i.reason,
        billingImpact: i.billingImpact,
        note: i.note,
        concurrencyToken: i.concurrencyToken,
        reason: 'Testing the window.',
      },
    ));
    expect(refused.problem?.code).toBe('assignment_interruptions.ended_before_start');
  });
});
