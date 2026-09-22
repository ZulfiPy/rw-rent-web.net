import { describe, expect, test } from 'vitest';
import { matchRoutes } from 'react-router-dom';
import { createCan } from '@/permissions/can';
import { PERMISSIONS, type Permission } from '@/permissions/permissions';
import { NAV_GROUPS, ROUTES } from './routes';

/**
 * The guard and the router, tested together.
 *
 * Follow-up 4 tested the guard's decision as a pure function over the text of an address, across
 * four personas and every destination, and it passed — while the app was wide open, because the
 * router does not match the way that function read. `/System-Administrator` reached the System
 * Administrator page and the lookup, finding no entry spelled that way, required nothing.
 *
 * So these tests ask the real matcher, over the real table, and read the permission off the route
 * it lands on — the same two things the app puts together. There is no second implementation of
 * matching here to agree or disagree with; if react-router ever resolves an address differently,
 * these tests change with it, which is the point.
 */

const ROUTE_OBJECTS = ROUTES.map(({ path }) => ({ path }));

interface Landing {
  /** The pattern the router matched, which is what the app renders. */
  path: string;
  /** The permission that route carries — what the guard is handed. */
  permission: Permission | null;
}

/** Where an address lands: the matched route and the permission it requires. */
function land(address: string): Landing {
  const { pathname } = new URL(address, 'http://localhost');
  const matches = matchRoutes(ROUTE_OBJECTS, pathname);
  expect(matches, `nothing matched ${address}`).not.toBeNull();

  const matched = matches![matches!.length - 1]!.route.path;
  const route = ROUTES.find((candidate) => candidate.path === matched);
  expect(route, `matched ${matched} which is not in the table`).toBeDefined();
  return { path: route!.path, permission: route!.permission };
}

const permissionFor = (address: string) => land(address).permission;

const mayOpen = (address: string, permissions: readonly string[]) => {
  const permission = permissionFor(address);
  return permission === null || createCan(permissions)(permission);
};

/**
 * The four personas as their permission lists arrive from GET /api/me, written out here so the
 * tests describe the gate rather than a catalogue the backend owns (the same shape as `can.test.ts`).
 */
const VIEWER = [
  'Company.Read', 'Users.ReadDirectory', 'Drivers.Read', 'Customers.Read', 'Vehicles.Read',
  'RentalAssignments.Read', 'DriverAuthorizations.Read', 'Interruptions.Read',
];
const FLEET_MANAGER = [
  ...VIEWER,
  'Company.Update', 'Users.ReviewRegistrations', 'Users.ManageRegistrations', 'Users.ActivateViewer',
  'Drivers.Manage', 'Customers.Manage', 'Vehicles.Manage', 'RentalAssignments.Manage',
  'DriverAuthorizations.Manage', 'Interruptions.Manage',
];
const COMPANY_PRINCIPAL = [
  ...FLEET_MANAGER,
  'Users.ActivateFleetManager', 'Users.CorrectName', 'Users.SuspendRestoreOrdinary',
  'Roles.ReadHistory', 'Roles.ManageViewerFleetManager', 'Sessions.ManageOrdinaryCompanyUsers',
  'SecurityAudit.ReadCompany',
];
const SYSTEM_ADMINISTRATOR = [
  ...COMPANY_PRINCIPAL,
  'Company.Create', 'Company.Delete', 'Users.ActivateCompanyPrincipal',
  'Users.SuspendRestoreCompanyPrincipal', 'Roles.ManageCompanyPrincipal', 'Sessions.ManageAnyUser',
  'SecurityAudit.ReadAll', 'SystemAdministration.Transfer', 'PrivilegedCorrections.Execute',
  'Records.Delete', 'Roles.ManageRecordDeleter',
];
/** The Record deleter role alone (the backend's round 9): the right to delete and nothing else. */
const RECORD_DELETER = ['Records.Delete'];

describe('the table is the only source', () => {
  test('every route declares a permission, null said out loud', () => {
    for (const route of ROUTES) {
      expect(Object.hasOwn(route, 'permission'), `${route.path} declares no permission`).toBe(true);
      expect(
        route.permission === null || PERMISSIONS.includes(route.permission),
        `${route.path} names ${route.permission}, which the API does not return`,
      ).toBe(true);
    }
  });

  test('every route has an element and a path, and no path appears twice', () => {
    for (const route of ROUTES) {
      expect(route.element, `${route.path} has no element`).toBeTruthy();
      expect(route.path.length, 'a route with an empty path').toBeGreaterThan(0);
    }
    const paths = ROUTES.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  test('every navigation entry is a route of the table and carries that route’s permission', () => {
    const items = NAV_GROUPS.flatMap((group) => group.items);
    expect(items.length).toBeGreaterThan(0);

    for (const item of items) {
      const route = ROUTES.find((candidate) => candidate.path === item.to);
      expect(route, `the menu offers ${item.to}, which is not a route`).toBeDefined();
      expect(route!.permission, `${item.to} disagrees with its route`).toBe(item.permission);
      expect(route!.nav?.label).toBe(item.label);
    }

    // And nothing the table marks for the navigation is missing from it.
    const offered = new Set(items.map((item) => item.to));
    for (const route of ROUTES) {
      if (route.nav) expect(offered.has(route.path), `${route.path} is not offered`).toBe(true);
    }
  });

  test('the groups keep the prototype’s order', () => {
    expect(NAV_GROUPS.map((group) => group.label)).toEqual([
      'Overview', 'Operations', 'Fleet', 'Business relationships', 'Users & access',
      'Administration',
    ]);
  });
});

describe('the same destination, written differently', () => {
  /*
   * The review of Follow-up 4, verified as a Viewer: each of these rendered the System
   * Administrator page with an enabled Initiate transfer. The router matches without regard to
   * letter case and after decoding; only the old lookup cared how the address was typed.
   */
  test('letter case does not change what a destination needs', () => {
    for (const address of [
      '/system-administrator',
      '/System-Administrator',
      '/SYSTEM-ADMINISTRATOR',
      '/sYsTeM-aDmInIsTrAtOr',
    ]) {
      expect(land(address).path, address).toBe('/system-administrator');
      expect(permissionFor(address), address).toBe('SystemAdministration.Transfer');
      expect(mayOpen(address, VIEWER), address).toBe(false);
    }
  });

  test('a percent-encoded address needs what it decodes to', () => {
    // %73 is 's'; the router decodes before it matches.
    expect(land('/%73ystem-administrator').path).toBe('/system-administrator');
    expect(permissionFor('/%73ystem-administrator')).toBe('SystemAdministration.Transfer');
    expect(mayOpen('/%73ystem-administrator', VIEWER)).toBe(false);

    expect(permissionFor('/%72egistrations')).toBe('Users.ReviewRegistrations');
    expect(permissionFor('/%73ecurity-audit')).toBe('SecurityAudit.ReadCompany');
  });

  test('the other two addresses the review found', () => {
    expect(permissionFor('/REGISTRATIONS')).toBe('Users.ReviewRegistrations');
    expect(mayOpen('/REGISTRATIONS', VIEWER)).toBe(false);

    expect(permissionFor('/Security-Audit')).toBe('SecurityAudit.ReadCompany');
    expect(mayOpen('/Security-Audit', VIEWER)).toBe(false);
  });

  test('a trailing slash changes nothing', () => {
    expect(land('/system-administrator/').path).toBe('/system-administrator');
    expect(permissionFor('/system-administrator/')).toBe('SystemAdministration.Transfer');
    expect(permissionFor('/vehicles/')).toBe('Vehicles.Read');
    expect(permissionFor('/overview/')).toBeNull();
  });

  test('a query changes nothing', () => {
    expect(permissionFor('/security-audit?EventType=Role.Granted')).toBe('SecurityAudit.ReadCompany');
    expect(permissionFor('/SECURITY-AUDIT?EventType=Role.Granted')).toBe('SecurityAudit.ReadCompany');
    expect(permissionFor('/profile?tab=sessions')).toBeNull();
    expect(permissionFor('/registrations?status=1')).toBe('Users.ReviewRegistrations');
  });

  test('extra segments fall through to the redirect, which renders no page', () => {
    // Three segments match no pattern in the table, so the catch-all takes them and sends the
    // person to the Overview. Nothing is rendered behind it, so nothing is to be required.
    for (const address of [
      '/system-administrator/extra',
      '/security-audit/an-entry/anything',
      '/registrations/deeper/still',
    ]) {
      expect(land(address).path, address).toBe('*');
      expect(permissionFor(address), address).toBeNull();
    }
  });

  test('an address that belongs to nothing lands on the redirect too', () => {
    for (const address of ['/', '/nothing-here', '/Nothing-Here']) {
      expect(land(address).path, address).toBe('*');
      expect(permissionFor(address), address).toBeNull();
    }
  });
});

describe('what each destination needs', () => {
  test('the pages open to every signed-in persona need nothing', () => {
    for (const address of [
      '/overview', '/needs-attention', '/tasks', '/insurance-cases', '/profile',
    ]) {
      expect(permissionFor(address), address).toBeNull();
      expect(mayOpen(address, []), address).toBe(true);
    }
  });

  test('a gated destination names the permission it takes', () => {
    expect(permissionFor('/rental-assignments')).toBe('RentalAssignments.Read');
    expect(permissionFor('/vehicles')).toBe('Vehicles.Read');
    expect(permissionFor('/customers')).toBe('Customers.Read');
    expect(permissionFor('/drivers')).toBe('Drivers.Read');
    expect(permissionFor('/users')).toBe('Users.ReadDirectory');
    expect(permissionFor('/registrations')).toBe('Users.ReviewRegistrations');
    expect(permissionFor('/security-audit')).toBe('SecurityAudit.ReadCompany');
    expect(permissionFor('/company')).toBe('Company.Read');
    expect(permissionFor('/system-administrator')).toBe('SystemAdministration.Transfer');
    expect(permissionFor('/delete-records')).toBe('Records.Delete');
  });

  test('a record route takes its list’s permission, in any letter case', () => {
    expect(permissionFor('/vehicles/444-wks')).toBe('Vehicles.Read');
    expect(permissionFor('/Vehicles/444-WKS')).toBe('Vehicles.Read');
    expect(permissionFor('/rental-assignments/2d7b5c86-0001')).toBe('RentalAssignments.Read');
    expect(permissionFor('/users/dita')).toBe('Users.ReadDirectory');
    expect(permissionFor('/security-audit/an-entry')).toBe('SecurityAudit.ReadCompany');
    expect(permissionFor('/Security-Audit/an-entry')).toBe('SecurityAudit.ReadCompany');
    expect(permissionFor('/drivers/janis')).toBe('Drivers.Read');
    expect(permissionFor('/customers/a-business')).toBe('Customers.Read');
  });
});

describe('the tester’s T-001, as the three ordinary roles', () => {
  test('none of the three ordinary roles may open the System Administrator page', () => {
    for (const persona of [VIEWER, FLEET_MANAGER, COMPANY_PRINCIPAL]) {
      expect(mayOpen('/system-administrator', persona)).toBe(false);
      // And not by another spelling either, which is what the review found.
      expect(mayOpen('/System-Administrator', persona)).toBe(false);
      expect(mayOpen('/SYSTEM-ADMINISTRATOR', persona)).toBe(false);
      expect(mayOpen('/%73ystem-administrator', persona)).toBe(false);
    }
    expect(mayOpen('/system-administrator', SYSTEM_ADMINISTRATOR)).toBe(true);
    expect(mayOpen('/SYSTEM-ADMINISTRATOR', SYSTEM_ADMINISTRATOR)).toBe(true);
  });

  test('a Viewer keeps the pages a Viewer reads and is refused the rest', () => {
    for (const address of [
      '/overview', '/needs-attention', '/profile', '/tasks', '/insurance-cases',
      '/rental-assignments', '/rental-assignments/x', '/vehicles', '/vehicles/x',
      '/customers', '/customers/x', '/drivers', '/drivers/x', '/users', '/users/x', '/company',
    ]) {
      expect(mayOpen(address, VIEWER), address).toBe(true);
    }
    for (const address of [
      '/registrations', '/REGISTRATIONS', '/security-audit', '/Security-Audit',
      '/security-audit/x', '/system-administrator',
    ]) {
      expect(mayOpen(address, VIEWER), address).toBe(false);
    }
  });

  test('a Fleet Manager gains the registrations queue and no more', () => {
    expect(mayOpen('/registrations', FLEET_MANAGER)).toBe(true);
    expect(mayOpen('/REGISTRATIONS', FLEET_MANAGER)).toBe(true);
    expect(mayOpen('/security-audit', FLEET_MANAGER)).toBe(false);
    expect(mayOpen('/system-administrator', FLEET_MANAGER)).toBe(false);
  });

  test('a Company Principal gains the audit and still not the administrator page', () => {
    expect(mayOpen('/security-audit', COMPANY_PRINCIPAL)).toBe(true);
    expect(mayOpen('/security-audit/an-entry', COMPANY_PRINCIPAL)).toBe(true);
    expect(mayOpen('/system-administrator', COMPANY_PRINCIPAL)).toBe(false);
  });

  test('only the administrator and a Record deleter may open Delete records, by any spelling (Follow-ups 8 and 10)', () => {
    for (const persona of [VIEWER, FLEET_MANAGER, COMPANY_PRINCIPAL]) {
      expect(mayOpen('/delete-records', persona)).toBe(false);
      expect(mayOpen('/Delete-Records', persona)).toBe(false);
      expect(mayOpen('/%64elete-records', persona)).toBe(false);
    }
    expect(mayOpen('/delete-records', SYSTEM_ADMINISTRATOR)).toBe(true);
    expect(mayOpen('/DELETE-RECORDS', SYSTEM_ADMINISTRATOR)).toBe(true);
    expect(mayOpen('/delete-records', RECORD_DELETER)).toBe(true);
    expect(mayOpen('/Delete-Records', RECORD_DELETER)).toBe(true);
  });

  test('a Record deleter with no other role reaches the ungated pages and Delete records, nothing else (Follow-up 10)', () => {
    const reachable = ROUTES
      .filter((route) => route.path !== '*' && mayOpen(route.path, RECORD_DELETER))
      .map((route) => route.path);
    expect(reachable).toEqual([
      '/overview', '/needs-attention', '/tasks', '/insurance-cases', '/delete-records', '/profile',
    ]);
    const offered = NAV_GROUPS.flatMap((group) => group.items)
      .filter((item) => item.permission !== null && createCan(RECORD_DELETER)(item.permission))
      .map((item) => item.to);
    expect(offered).toEqual(['/delete-records']);
  });

  test('an account with no permission at all reaches only the ungated pages', () => {
    const reachable = ROUTES
      .filter((route) => route.path !== '*' && mayOpen(route.path, []))
      .map((route) => route.path);
    expect(reachable).toEqual([
      '/overview', '/needs-attention', '/tasks', '/insurance-cases', '/profile',
    ]);
  });
});
