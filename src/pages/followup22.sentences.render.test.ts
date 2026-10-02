import { createElement as h, type ReactElement } from 'react';
import { afterEach, describe, expect, test } from 'vitest';
import { ApiError, GENERIC_REFUSAL, toFailure } from '@/api/problem';
import { CustomerType, type CustomerResponse, type SessionResponse } from '@/api/dto';
import { Profile } from './account/Profile';
import { AssignmentDialogs } from './fleet/AssignmentDialogs';
import { FleetDialogs } from './fleet/FleetDialogs';
import { Vehicles } from './fleet/Vehicles';
import { UserDialogs } from './users/UserDialogs';
import { clearRenders, renderPage } from './followup7b.support';
import { historyHolder, tomsBefore } from './followup10.support';
import { inUseRental, plannedRental } from './followup11.support';

/**
 * Follow-up 22, F22-4: the sentences that named the API, the backend or an endpoint, each rendered
 * where a person meets it, in the words §22 gives or, for those found by reading the rest of the app,
 * in the same plain way. `followup22.words.test.ts` holds the whole list and reads every text of the
 * app; this file looks at the dialogs and pages themselves.
 */
afterEach(clearRenders);

/** Something the API or the browser says of itself, which none of these places may show. */
const TECHNICAL = /\bAPI\b|backend|endpoint|payload|\bHTTP\b/i;

describe('F22-4: the sentences, where a person meets them', () => {
  test('a refusal with no message of its own', () => {
    expect(GENERIC_REFUSAL).toBe('This change was refused because the record no longer accepts it.');
    expect(toFailure(new ApiError(409, { status: 409 }))).toEqual({ kind: 'conflict', message: GENERIC_REFUSAL, code: undefined });
  });

  /** One of Toms's sessions, as the API lists it. */
  const session: SessionResponse = {
    id: '5e550000-0000-4000-8000-000000000001', applicationUserId: tomsBefore.id,
    createdAtUtc: '2026-09-21T07:00:00+00:00', lastSeenAtUtc: '2026-09-21T08:00:00+00:00',
    idleExpiresAtUtc: '2026-09-21T10:00:00+00:00', absoluteExpiresAtUtc: '2026-09-21T19:00:00+00:00',
    revokedAtUtc: null, revocationReason: null, deviceDescription: 'Safari on macOS', ipAddress: '203.0.113.7',
    isCurrent: false, isActive: true,
  };
  const userDialog = (state: Parameters<typeof UserDialogs>[0]['state']) => renderPage(
    h(UserDialogs, { state, user: tomsBefore, roles: historyHolder.items, sessions: [session], onClose: () => {} }),
    { at: '/', route: '/', permissions: ['Users.SuspendRestoreOrdinary', 'Sessions.ManageOrdinaryCompanyUsers'] });

  test('suspending a user, and ending one of their sessions', () => {
    const suspend = userDialog({ kind: 'suspend' });
    expect(suspend).toContain('Signing in stops immediately and every active session ends. No reason is asked for here, so none is recorded.');
    expect(suspend).not.toMatch(TECHNICAL);
    const revoke = userDialog({ kind: 'session-revoke', sessionId: session.id });
    expect(revoke).toContain('The session ends at once and is recorded as “Revoked by administrator”. No reason is asked for here, so the audit entry records none.');
    expect(revoke).not.toMatch(TECHNICAL);
  });

  const rentalDialog = (state: Parameters<typeof AssignmentDialogs>[0]['state'], rental = inUseRental) => renderPage(
    h(AssignmentDialogs, { state, assignment: rental, customerType: rental.customerType, onClose: () => {} }),
    { at: '/', route: '/', permissions: ['RentalAssignments.Manage'] });

  test('ending a rental, and activating one nobody may drive yet', () => {
    const end = rentalDialog({ kind: 'end' });
    expect(end).toContain('Closes the assignment. Open driver authorizations are stopped with it.');
    expect(end).not.toMatch(TECHNICAL);
    const unauthorised = { ...plannedRental, driverAuthorizations: [] };
    const activate = rentalDialog({ kind: 'activate' }, unauthorised);
    expect(activate).toContain('No driver is authorized yet. Activation is refused until this assignment has coverage.');
    expect(activate).not.toMatch(TECHNICAL);
  });

  test('a vehicle’s year, among the list’s further filters', () => {
    const markup = renderPage(h(Vehicles), { at: '/vehicles?more=1', route: '/vehicles', permissions: ['Vehicles.Read'] });
    expect(markup).toContain('>Manufacturing year<');
    expect(markup).toContain('>Exact year, 1900 or later.<');
    expect(markup).not.toMatch(TECHNICAL);
  });

  test('a business customer’s linked driver', () => {
    const business: CustomerResponse = {
      id: 'c-business', type: CustomerType.Business, companyName: 'Baltic Freight SIA', registrationNumber: '40003000001',
      address: 'Ropazu 14, Riga, LV-1039', email: 'office@balticfreight.example', phoneNumber: '+371 29 118 004',
      isActive: true, createdAtUtc: '2026-09-01T08:00:00+00:00', createdByDisplayName: 'Dita Smite', concurrencyToken: '00000000-0000-4000-8000-0000000000c1',
    } as CustomerResponse;
    const markup = renderPage(h(FleetDialogs as (props: Record<string, unknown>) => ReactElement, { state: { kind: 'customer-edit' }, customer: business, onClose: () => {} }),
      { at: '/', route: '/', permissions: ['Customers.Manage'] });
    expect(markup).toContain('>Linked driver<');
    expect(markup).toContain('A business customer cannot be linked to a driver.');
    expect(markup).not.toMatch(TECHNICAL);
  });

  test('the Profile’s Access panel', () => {
    const markup = renderPage(h(Profile), { at: '/profile', route: '/profile', permissions: ['Vehicles.Read'] });
    expect(markup).toContain('Your roles and what they allow, as they are right now.');
    expect(markup).not.toMatch(TECHNICAL);
  });
});
