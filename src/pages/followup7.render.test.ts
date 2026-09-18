import { createElement as h, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider, type QueryKey } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, test } from 'vitest';
import { qk } from '@/api';
import {
  AssignmentStatus, CustomerType, SystemAdministratorTransferStatus,
  type CustomerResponse, type PagedResponse, type SecurityAuditResponse,
} from '@/api/dto';
import { AccessProvider } from '@/permissions/usePermissions';
import { Profile } from './account/Profile';
import { SystemAdministrator } from './admin/SystemAdministrator';
import { AuditEntry } from './audit/AuditEntry';
import { SecurityAudit } from './audit/SecurityAudit';
import { AssignmentRecord } from './fleet/AssignmentRecord';
import { CustomerRecord } from './fleet/CustomerRecord';
import { DriverRecord } from './fleet/DriverRecord';
import { FleetDialogs } from './fleet/FleetDialogs';
import { Coverage } from './fleet/NewAssignment';
import { Overview } from './overview/Overview';
import { UserRecord } from './users/UserRecord';

/**
 * Follow-up 7 on the screens themselves, rendered to markup the way the browser receives it: the
 * page component, the real permission provider and router, and a query cache already holding what
 * the API answers. Nothing is fetched. This is how the signed-in surfaces are checked by the run
 * that may not sign in to the app in a browser.
 */
const clients: QueryClient[] = [];
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});

function render(element: ReactElement, { at, route, permissions = [], data = [] }: {
  at: string;
  route: string;
  permissions?: string[];
  data?: Array<[QueryKey, unknown]>;
}): string {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  clients.push(client);
  client.setQueryData(qk.me, {
    id: SIGNE, email: 'signe.priede@rwrent.example', firstName: 'Signe', lastName: 'Priede',
    phoneNumber: '+371 29 118 220', companyId: COMPANY, status: 2, passwordChangedAtUtc: '2026-01-01T00:00:00Z',
    pendingEmail: null, roles: [2], permissions,
  });
  for (const [key, value] of data) client.setQueryData(key, value);
  return renderToStaticMarkup(
    h(QueryClientProvider, { client },
      h(AccessProvider, null,
        h(MemoryRouter, { initialEntries: [at] },
          h(Routes, null, h(Route, { path: route, element }))))),
  );
}

const page = <T>(items: T[]): PagedResponse<T> =>
  ({ items, pageNumber: 1, pageSize: items.length || 1, totalCount: items.length, totalPages: 1 });

const COMPANY = '0b3c9f42-1d58-4a7e-9c30-6f21b8e47d05';
const ARTURS = '9f2b7c41-0001-4a10-8b01-000000000001';
const SIGNE = '9f2b7c41-0002-4a10-8b01-000000000002';
const TOMS = '9f2b7c41-0005-4a10-8b01-000000000005';
const TECHNICAL = '00000000-0000-0000-0000-000000000001';

/** The Principal's directory: their own Company, never the administrator. */
const directory = page([SIGNE, TOMS].map((id, n) => ({
  id, email: `${n}@rwrent.example`, firstName: n ? 'Toms' : 'Signe', lastName: n ? 'Rudzitis' : 'Priede',
  phoneNumber: '+371', companyId: COMPANY, status: 2, emailConfirmed: true, registrationExpiresAtUtc: null,
  effectiveRoles: [n ? 4 : 2], createdAtUtc: '2026-01-01T00:00:00Z',
})));

const entry = (over: Partial<SecurityAuditResponse>): SecurityAuditResponse => ({
  id: 'e0', eventType: 'Company.Updated', actorUserId: SIGNE, actorDisplayName: 'Signe Priede',
  occurredAtUtc: '2026-09-18T10:39:10.839886+00:00', companyId: COMPANY, targetUserId: null,
  targetDisplayName: null, entityType: 'Company', entityId: COMPANY, reason: null,
  beforeJson: null, afterJson: null, ...over,
});

/** The owner's case, the Principal's own sign-out, and the technical actor's recovery entry. */
const activation = entry({
  id: 'e1', eventType: 'Registration.Activated', actorUserId: ARTURS, actorDisplayName: 'Arturs Veidenbaums',
  targetUserId: TOMS, targetDisplayName: 'Toms Rudzitis', entityType: 'ApplicationUser', entityId: TOMS,
  afterJson: JSON.stringify({ Status: 'Active', Roles: [{ Role: 'Viewer', ExpiresAtUtc: '2026-12-31T21:59:59.999Z' }] }),
});
const signOut = entry({
  id: 'e2', eventType: 'Authentication.Logout', occurredAtUtc: '2026-01-15T11:57:00Z',
  targetUserId: SIGNE, targetDisplayName: 'Signe Priede', entityType: 'ApplicationUserSession',
});
const recovery = entry({
  id: 'e3', eventType: 'SystemAdministrator.OfflineRecovery', actorUserId: TECHNICAL, actorDisplayName: null,
  companyId: null, targetUserId: ARTURS, targetDisplayName: 'Arturs Veidenbaums', entityType: 'ApplicationUser',
});

describe('the Security audit list', () => {
  const markup = render(h(SecurityAudit), {
    at: '/security-audit',
    route: '/security-audit',
    permissions: ['SecurityAudit.ReadCompany', 'Users.ReadDirectory'],
    data: [
      [qk.audit.list({ PageNumber: 1, PageSize: 20 }), page([activation, signOut, recovery])],
      [qk.users.list({ PageSize: 100 }), directory],
    ],
  });

  // The page header's description ("… Times in Tallinn time.") is set from an effect, which a
  // server render does not run; the panels below carry their notes inline and are checked there.
  test('reads Tallinn time in both seasons (F7-1)', () => {
    expect(markup).toContain('2026-09-18 13:39');
    expect(markup).toContain('2026-01-15 13:57');
    expect(markup).toContain('>Occurred</th>');
    expect(markup).not.toMatch(/UTC/);
  });

  test('names the administrator for the Principal, without a link they could not open (F7-4)', () => {
    expect(markup).toContain('Arturs Veidenbaums');
    expect(markup).not.toContain(`href="/users/${ARTURS}"`);
  });

  test('links a person the Principal may open', () => {
    expect(markup).toContain(`href="/users/${SIGNE}"`);
    expect(markup).toContain(`href="/users/${TOMS}"`);
    expect(markup).toContain('on Toms Rudzitis');
  });

  test('keeps "System" for the technical actor alone', () => {
    expect(markup.match(/>System</g)).toHaveLength(1);
    expect(markup).toContain('on Arturs Veidenbaums');
    expect(markup).not.toContain('Unknown');
  });
});

describe('the audit entry page', () => {
  const read = (e: SecurityAuditResponse) => render(h(AuditEntry), {
    at: `/security-audit/${e.id}`,
    route: '/security-audit/:entryId',
    permissions: ['SecurityAudit.ReadCompany', 'Users.ReadDirectory'],
    data: [[qk.audit.entry(e.id), e], [qk.users.list({ PageSize: 100 }), directory]],
  });

  test('names the administrator and links the target the Principal may open (F7-4)', () => {
    const markup = read(activation);
    expect(markup).toContain('Arturs Veidenbaums');
    expect(markup).not.toContain(`href="/users/${ARTURS}"`);
    expect(markup).toContain(`href="/users/${TOMS}"`);
    expect(markup).toContain('Toms Rudzitis');
    expect(markup).not.toMatch(/>System</);
  });

  test('reads the occurrence and the payload in Tallinn time, and says so (F7-1)', () => {
    const markup = read(activation);
    expect(markup).toContain('Times in Tallinn time.');
    expect(markup).toContain('2026-09-18 13:39');
    expect(markup).toContain('Viewer — expires 2026-12-31 23:59');
    expect(markup).not.toMatch(/UTC/);
  });

  test('names the technical actor "System"', () => {
    const markup = read(recovery);
    expect(markup).toMatch(/>System</);
    expect(markup).toContain('Arturs Veidenbaums');
  });
});

describe('the Overview\'s activity card', () => {
  const thisYear = new Date().getUTCFullYear();
  const markup = render(h(Overview), {
    at: '/',
    route: '/',
    permissions: ['SecurityAudit.ReadCompany'],
    data: [[
      qk.audit.list({ PageNumber: 1, PageSize: 25 }),
      page([{ ...activation, occurredAtUtc: `${thisYear}-09-18T10:39:10Z` }]),
    ]],
  });

  test('reads Tallinn time and says so (F7-1)', () => {
    expect(markup).toContain('Times in Tallinn time.');
    expect(markup).toContain('18 Sep, 13:39');
    expect(markup).not.toMatch(/UTC/);
  });
});

describe('the System Administrator page', () => {
  const markup = render(h(SystemAdministrator), {
    at: '/system-administrator',
    route: '/system-administrator',
    permissions: ['SystemAdministration.Transfer', 'Users.ReadDirectory'],
    data: [
      [qk.transfers.list({ PageSize: 100 }), page([{
        id: 't1', currentAdministratorUserId: ARTURS, targetUserId: 'u6', isRecovery: false,
        initiatedAtUtc: '2026-09-18T05:00:00Z', expiresAtUtc: '2026-01-19T05:00:00Z',
        cancelledAtUtc: null, acceptedAtUtc: null, targetEmail: 'liga.brice@rwrent.example',
        targetFirstName: 'Liga', targetLastName: 'Brice', status: SystemAdministratorTransferStatus.AwaitingAcceptance,
      }])],
      [qk.users.list({ PageSize: 100 }), page([{
        ...directory.items[0], id: ARTURS, firstName: 'Arturs', lastName: 'Veidenbaums', companyId: null,
        effectiveRoles: [1], createdAtUtc: '2026-01-15T08:00:00Z',
      }])],
    ],
  });

  test('reads the transfer times and the holder\'s start in Tallinn time (F7-1)', () => {
    expect(markup).toContain('Times in Tallinn time.');
    expect(markup).toContain('2026-09-18 08:00');
    expect(markup).toContain('2026-01-19 07:00');
    expect(markup).toContain('2026-01-15 10:00');
    expect(markup).toContain('>Initiated</th>');
    expect(markup).toContain('>Expires</th>');
    expect(markup).not.toMatch(/UTC/);
  });
});

const sessions = page([
  {
    id: 's1', applicationUserId: SIGNE, createdAtUtc: '2026-09-18T05:00:00Z', lastSeenAtUtc: '2026-09-18T10:39:00Z',
    idleExpiresAtUtc: '2026-09-18T12:39:00Z', absoluteExpiresAtUtc: '2026-09-18T17:00:00Z', revokedAtUtc: null,
    revocationReason: null, deviceDescription: 'Firefox on macOS', ipAddress: '127.0.0.1', isCurrent: true, isActive: true,
  },
  {
    id: 's2', applicationUserId: SIGNE, createdAtUtc: '2026-01-15T08:00:00Z', lastSeenAtUtc: '2026-01-15T09:00:00Z',
    idleExpiresAtUtc: '2026-01-15T11:00:00Z', absoluteExpiresAtUtc: '2026-01-15T20:00:00Z',
    revokedAtUtc: '2026-01-15T11:57:00Z', revocationReason: 'Explicit logout', deviceDescription: 'Safari on iOS',
    ipAddress: '127.0.0.1', isCurrent: false, isActive: false,
  },
]);

/** What both sessions tables must read: every instant local, the zone named once. */
function expectLocalSessions(markup: string) {
  expect(markup).toContain('Times in Tallinn time.');
  expect(markup).toContain('2026-09-18 08:00');
  expect(markup).toContain('2026-09-18 13:39');
  expect(markup).toContain('idle until 15:39');
  expect(markup).toContain('2026-01-15 13:57');
  expect(markup).toContain('>Started</th>');
  expect(markup).toContain('>Last seen</th>');
  expect(markup).not.toMatch(/UTC/);
}

describe('the sessions tabs (F7-1)', () => {
  test('on your own profile', () => {
    expectLocalSessions(render(h(Profile), {
      at: '/profile?tab=sessions',
      route: '/profile',
      data: [[qk.meSessions({ IncludeEnded: true, PageSize: 100 }), sessions]],
    }));
  });

  test('on a user\'s record', () => {
    expectLocalSessions(render(h(UserRecord), {
      at: `/users/${TOMS}?tab=sessions`,
      route: '/users/:userId',
      permissions: ['Sessions.ManageOrdinaryCompanyUsers', 'Users.ReadDirectory'],
      data: [
        [qk.users.detail(TOMS), { ...directory.items[1], securityVersion: 1, updatedAtUtc: null, registrationDecisionReason: null }],
        [qk.sessions.ofUser(TOMS, { PageSize: 100, IncludeEnded: true }), sessions],
      ],
    }));
  });
});

describe('the role history on a user\'s record (F7-4)', () => {
  const grant = (id: string, by: string, role: number) => ({
    id, applicationUserId: TOMS, role, assignedAtUtc: '2026-03-01T10:00:00Z', assignedByUserId: by,
    expiresAtUtc: null, revokedAtUtc: null, revokedByUserId: null, revocationReason: null, isEffective: true,
  });
  const markup = render(h(UserRecord), {
    at: `/users/${TOMS}?tab=roles`,
    route: '/users/:userId',
    permissions: ['Roles.ReadHistory', 'Users.ReadDirectory'],
    data: [
      [qk.users.detail(TOMS), { ...directory.items[1], securityVersion: 1, updatedAtUtc: null, registrationDecisionReason: null }],
      [qk.roles.history(TOMS, { PageSize: 100 }), page([grant('r1', ARTURS, 4), grant('r2', SIGNE, 3), grant('r3', TECHNICAL, 1)])],
      [qk.users.list({ PageSize: 100 }), directory],
    ],
  });

  test('a grant by the administrator reads "Outside your company", not "System"', () => {
    expect(markup).toContain('Outside your company');
    expect(markup.match(/>System</g)).toHaveLength(1);
  });

  test('a grant by someone in the directory keeps their name', () => {
    expect(markup).toContain('Priede');
  });
});

describe('the driver\'s audit trail', () => {
  const markup = render(h(DriverRecord), {
    at: '/drivers/d1',
    route: '/drivers/:driverId',
    permissions: ['SecurityAudit.ReadCompany'],
    data: [
      [qk.drivers.detail('d1'), {
        id: 'd1', firstName: 'Janis', lastName: 'Krumins', personalId: '38001010000', dateOfBirth: '1980-01-01',
        address: 'Riga', email: 'janis@example.com', phoneNumber: '+371', driverLicenseNumber: 'LV-1',
        isActive: true, createdAtUtc: '2026-01-15T08:00:00Z', updatedAtUtc: null,
      }],
      [qk.audit.list({ EntityType: 'Driver', EntityId: 'd1', PageSize: 100 }), page([
        entry({ id: 'e4', eventType: 'Driver.Deactivated', actorUserId: ARTURS, actorDisplayName: 'Arturs Veidenbaums', entityType: 'Driver', entityId: 'd1' }),
        entry({ id: 'e5', eventType: 'Driver.Activated', actorUserId: TECHNICAL, actorDisplayName: null, entityType: 'Driver', entityId: 'd1', occurredAtUtc: '2026-01-15T11:57:00Z' }),
      ])],
    ],
  });

  test('names the actors from the entries and reads Tallinn time', () => {
    expect(markup).toContain('Arturs Veidenbaums');
    expect(markup).toMatch(/>System</);
    expect(markup).not.toContain('Unknown user');
    expect(markup).toContain('Times in Tallinn time.');
    expect(markup).toContain('2026-09-18 13:39');
    expect(markup).toContain('2026-01-15 10:00');
    expect(markup).not.toMatch(/UTC/);
  });
});

describe('the assignment record', () => {
  const assignment = {
    id: 'a1', customerId: 'c1', customerDisplayName: 'Maris Ozols', vehicleId: 'v1', vehiclePlateNumber: '400 NDP',
    status: AssignmentStatus.Active, plannedStartAtUtc: '2026-09-01T06:00:00Z', startedAtUtc: '2026-09-01T06:00:00Z',
    plannedEndAtUtc: null, closedAtUtc: null, customerType: CustomerType.PrivateIndividual, vehicleMake: 'Skoda',
    vehicleModel: 'Octavia', openAuthorizationCount: 0, openNamedDrivers: [], hasOpenCollectiveAuthorization: false,
    openInterruptionCount: 0, note: null, cancellationNote: null, vehicleVinCode: 'TSTVIN00000000001',
    customerDriverId: null, concurrencyToken: 'k1', createdAtUtc: '2026-09-01T06:00:00Z', updatedAtUtc: null,
    driverAuthorizations: [], interruptions: [],
  };
  const data: Array<[QueryKey, unknown]> = [
    [qk.assignments.detail('a1'), assignment],
    [qk.audit.list({ RentalAssignmentId: 'a1', PageSize: 100 }), page([
      entry({ id: 'e6', eventType: 'RentalAssignment.TimelineCorrected', actorUserId: ARTURS, actorDisplayName: 'Arturs Veidenbaums', entityType: 'RentalAssignment', entityId: 'a1', reason: 'Handover sheet showed 08:30.' }),
    ])],
  ];

  test('the correction history names the administrator and reads Tallinn time', () => {
    const markup = render(h(AssignmentRecord), {
      at: '/rental-assignments/a1?tab=corrections',
      route: '/rental-assignments/:assignmentId',
      permissions: ['PrivilegedCorrections.Execute', 'RentalAssignments.Read'],
      data,
    });
    expect(markup).toContain('Arturs Veidenbaums');
    expect(markup).toContain('2026-09-18 13:39');
    expect(markup).toContain('>Occurred</th>');
    expect(markup).toContain('Times in Tallinn time.');
    expect(markup).not.toMatch(/UTC/);
  });

  test('the lifecycle panel names the zone instead of pointing at UTC in the audit trail', () => {
    const markup = render(h(AssignmentRecord), {
      at: '/rental-assignments/a1',
      route: '/rental-assignments/:assignmentId',
      permissions: ['PrivilegedCorrections.Execute', 'RentalAssignments.Read'],
      data,
    });
    expect(markup).toContain('Times in Tallinn time.');
    expect(markup).not.toMatch(/UTC/);
  });
});

describe('the customer\'s driver link (F7-2)', () => {
  const customer: CustomerResponse = {
    id: 'c1', type: CustomerType.PrivateIndividual, firstName: 'Janis', lastName: 'Krumins',
    personalId: '38001010000', dateOfBirth: '1980-01-01', companyName: null, registrationCode: null,
    address: 'Riga', email: 'janis@example.com', phoneNumber: '+371', driverId: null,
    isActive: true, createdAtUtc: '2026-01-15T08:00:00Z', updatedAtUtc: null,
  };
  const drivers = page([
    { id: 'd1', firstName: 'Janis', lastName: 'Krumins', email: 'janis@example.com', phoneNumber: '+371',
      personalId: '38001010000', driverLicenseNumber: 'LV-1', address: 'Riga', isActive: true },
    { id: 'd2', firstName: 'Anna', lastName: 'Berzina', email: 'anna@example.com', phoneNumber: '+371',
      personalId: '49002020000', driverLicenseNumber: 'LV-2', address: 'Riga', isActive: true },
  ]);
  const record = (c: CustomerResponse, permissions: string[]) => render(h(CustomerRecord), {
    at: `/customers/${c.id}`,
    route: '/customers/:customerId',
    permissions,
    data: [[qk.customers.detail(c.id), c], [qk.drivers.list({ PageSize: 100 }), drivers]],
  });

  test('the record offers "Link driver record" on the Driver link panel of an unlinked private customer', () => {
    expect(record(customer, ['Customers.Read', 'Customers.Manage', 'Drivers.Read'])).toContain('Link driver record');
  });

  test('and not when the customer is linked, is a business, or may not be changed by the reader', () => {
    expect(record({ ...customer, driverId: 'd1' }, ['Customers.Read', 'Customers.Manage', 'Drivers.Read']))
      .not.toContain('Link driver record');
    expect(record({ ...customer, type: CustomerType.Business, firstName: null, lastName: null, personalId: null,
      companyName: 'Balt Logistics', registrationCode: '40003' }, ['Customers.Read', 'Customers.Manage']))
      .not.toContain('Link driver record');
    expect(record(customer, ['Customers.Read'])).not.toContain('Link driver record');
  });

  const dialog = (c: CustomerResponse) => render(
    h(FleetDialogs, { state: { kind: 'customer-edit', focus: 'driver-link' }, customer: c, onClose: () => {} }),
    {
      at: `/customers/${c.id}`,
      route: '/customers/:customerId',
      permissions: ['Customers.Manage'],
      data: [[qk.drivers.list({ PageSize: 100 }), drivers]],
    },
  );

  test('the customer dialog proposes the driver with the same personal ID, as a choice', () => {
    const markup = dialog(customer);
    expect(markup).toContain('Janis Krumins has the same personal identifier.');
    expect(markup).toContain('Link Janis Krumins');
    // Proposed, not chosen: the link control still reads "Not linked".
    expect(markup).toMatch(/<option value="" selected="">Not linked<\/option>/);
  });

  test('and proposes nothing for another personal ID or an existing link', () => {
    expect(dialog({ ...customer, personalId: '38001019999' })).not.toContain('has the same personal identifier');
    expect(dialog({ ...customer, driverId: 'd2' })).not.toContain('has the same personal identifier');
  });

  const coverage = (driverId: string | null, type: CustomerType = CustomerType.PrivateIndividual) => render(
    h(Coverage, {
      label: 'Who will drive?',
      customer: {
        id: 'c1', type, displayName: 'Janis Krumins', email: 'janis@example.com', phoneNumber: '+371',
        driverId, isActive: true,
      } as never,
      mode: '', setMode: () => {}, named: [], setNamed: () => {}, companyNote: '', setCompanyNote: () => {},
    }),
    { at: '/rental-assignments/new', route: '/rental-assignments/new' },
  );

  /** The label of the "The customer will drive" choice, radio and reason included. */
  const customerChoice = (markup: string) =>
    markup.match(/<label(?:(?!<\/label>).)*The customer will drive(?:(?!<\/label>).)*<\/label>/s)?.[0] ?? '';

  test('the new assignment says the link is missing and links to the customer\'s record', () => {
    const choice = customerChoice(coverage(null));
    expect(choice).toContain('disabled=""');
    expect(choice).toContain('This customer has no linked driver record.');
    expect(choice).toMatch(/<a href="\/customers\/c1"[^>]*>Link one on the customer’s record\.<\/a>/);
    expect(choice).not.toContain('not registered as a driver');
  });

  test('and opens "The customer will drive" once the link exists', () => {
    const choice = customerChoice(coverage('d1'));
    expect(choice).not.toBe('');
    expect(choice).not.toContain('disabled=""');
    expect(choice).not.toContain('no linked driver record');
  });
});
