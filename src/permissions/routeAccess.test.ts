import { describe, expect, test } from 'vitest';
import { PERMISSIONS } from './permissions';
import { ROUTE_PERMISSIONS, isRouteAllowed, routePermission } from './routeAccess';

/**
 * The four personas as their permission lists arrive from GET /api/me, written out here so the test
 * describes the gate rather than a catalogue the backend owns (the same shape as `can.test.ts`).
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
];

describe('a destination needs the permission its menu item needs', () => {
  test('the pages open to every signed-in persona need none', () => {
    for (const path of ['/overview', '/needs-attention', '/tasks', '/insurance-cases', '/profile']) {
      expect(routePermission(path)).toBeNull();
      expect(isRouteAllowed(path, [])).toBe(true);
    }
  });

  test('a gated destination names the permission it takes', () => {
    expect(routePermission('/rental-assignments')).toBe('RentalAssignments.Read');
    expect(routePermission('/vehicles')).toBe('Vehicles.Read');
    expect(routePermission('/customers')).toBe('Customers.Read');
    expect(routePermission('/drivers')).toBe('Drivers.Read');
    expect(routePermission('/users')).toBe('Users.ReadDirectory');
    expect(routePermission('/registrations')).toBe('Users.ReviewRegistrations');
    expect(routePermission('/security-audit')).toBe('SecurityAudit.ReadCompany');
    expect(routePermission('/company')).toBe('Company.Read');
    expect(routePermission('/system-administrator')).toBe('SystemAdministration.Transfer');
  });

  test('a record route takes its list’s permission', () => {
    expect(routePermission('/vehicles/444-wks')).toBe('Vehicles.Read');
    expect(routePermission('/rental-assignments/2d7b5c86-0001')).toBe('RentalAssignments.Read');
    expect(routePermission('/users/dita')).toBe('Users.ReadDirectory');
    expect(routePermission('/security-audit/an-entry')).toBe('SecurityAudit.ReadCompany');
    expect(routePermission('/drivers/janis')).toBe('Drivers.Read');
    expect(routePermission('/customers/a-business')).toBe('Customers.Read');
  });

  test('a trailing slash and a deeper path answer the same as the section', () => {
    expect(routePermission('/vehicles/')).toBe('Vehicles.Read');
    expect(routePermission('/security-audit/an-entry/anything')).toBe('SecurityAudit.ReadCompany');
  });

  test('an address that belongs to no section needs none, because the router redirects it', () => {
    // A guard that refused these would replace the redirect to the Overview with a lock nobody can
    // act on.
    expect(routePermission('/')).toBeNull();
    expect(routePermission('/nothing-here')).toBeNull();
    expect(routePermission('/sign-in')).toBeNull();
  });

  test('every permission named in the table is one the API really returns', () => {
    for (const [, permission] of ROUTE_PERMISSIONS) {
      if (permission !== null) {
        expect(PERMISSIONS).toContain(permission);
      }
    }
  });
});

describe('the tester’s T-001, as the three ordinary roles', () => {
  /**
   * The finding: typing `/system-administrator` gave all three a complete page. The guard is the
   * fix, and it has to keep every other destination they legitimately reach.
   */
  test('none of the three ordinary roles may open the System Administrator page', () => {
    for (const persona of [VIEWER, FLEET_MANAGER, COMPANY_PRINCIPAL]) {
      expect(isRouteAllowed('/system-administrator', persona)).toBe(false);
    }
    expect(isRouteAllowed('/system-administrator', SYSTEM_ADMINISTRATOR)).toBe(true);
  });

  test('a Viewer keeps the pages a Viewer reads and is refused the rest', () => {
    for (const path of [
      '/overview', '/needs-attention', '/profile', '/tasks', '/insurance-cases',
      '/rental-assignments', '/rental-assignments/x', '/vehicles', '/vehicles/x',
      '/customers', '/customers/x', '/drivers', '/drivers/x', '/users', '/users/x', '/company',
    ]) {
      expect(isRouteAllowed(path, VIEWER), path).toBe(true);
    }
    for (const path of [
      '/registrations', '/security-audit', '/security-audit/x', '/system-administrator',
    ]) {
      expect(isRouteAllowed(path, VIEWER), path).toBe(false);
    }
  });

  test('a Fleet Manager gains the registrations queue and no more', () => {
    expect(isRouteAllowed('/registrations', FLEET_MANAGER)).toBe(true);
    expect(isRouteAllowed('/security-audit', FLEET_MANAGER)).toBe(false);
    expect(isRouteAllowed('/system-administrator', FLEET_MANAGER)).toBe(false);
  });

  test('a Company Principal gains the audit and still not the administrator page', () => {
    expect(isRouteAllowed('/security-audit', COMPANY_PRINCIPAL)).toBe(true);
    expect(isRouteAllowed('/security-audit/an-entry', COMPANY_PRINCIPAL)).toBe(true);
    expect(isRouteAllowed('/system-administrator', COMPANY_PRINCIPAL)).toBe(false);
  });

  test('an account with no permission at all reaches only the ungated pages', () => {
    const allowed = ROUTE_PERMISSIONS.filter(([path]) => isRouteAllowed(path, [])).map(([p]) => p);
    expect(allowed).toEqual([
      '/overview', '/needs-attention', '/tasks', '/insurance-cases', '/profile',
    ]);
  });
});
