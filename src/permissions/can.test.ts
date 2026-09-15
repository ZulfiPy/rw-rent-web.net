import { describe, expect, test } from 'vitest';
import { actionState, createCan } from './can';

/**
 * The permission strings the API returns in GET /api/me. The app never derives them from a role
 * name — these lists stand for what four typical accounts arrive with, written out here so the
 * test describes the gate rather than a catalogue the backend owns.
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

describe('the permission gate', () => {
  test('a permission the account holds opens its action', () => {
    expect(createCan(FLEET_MANAGER)('Vehicles.Read')).toBe(true);
    expect(createCan(COMPANY_PRINCIPAL)('Vehicles.Manage')).toBe(true);
    expect(createCan(SYSTEM_ADMINISTRATOR)('SecurityAudit.ReadCompany')).toBe(true);
  });

  test('a read-only account holds read permissions only', () => {
    const can = createCan(VIEWER);
    expect(can('Vehicles.Read')).toBe(true);
    expect(can('Vehicles.Manage')).toBe(false);
    expect(can('Users.ReviewRegistrations')).toBe(false);
  });

  test('role administration is not in a fleet manager list', () => {
    expect(createCan(FLEET_MANAGER)('Roles.ReadHistory')).toBe(false);
    expect(createCan(COMPANY_PRINCIPAL)('Roles.ReadHistory')).toBe(true);
    expect(createCan(COMPANY_PRINCIPAL)('Roles.ManageCompanyPrincipal')).toBe(false);
    expect(createCan(SYSTEM_ADMINISTRATOR)('Roles.ManageCompanyPrincipal')).toBe(true);
  });

  test('privileged corrections need their own permission', () => {
    expect(createCan(COMPANY_PRINCIPAL)('PrivilegedCorrections.Execute')).toBe(false);
    expect(createCan(SYSTEM_ADMINISTRATOR)('PrivilegedCorrections.Execute')).toBe(true);
  });

  test('an empty permission list gates everything off', () => {
    expect(createCan([])('Company.Read')).toBe(false);
  });
});

describe('hide by permission, disable with reason', () => {
  test('a permission the account does not hold hides the action', () => {
    expect(actionState(createCan(VIEWER), 'Users.CorrectName')).toEqual({ visible: false });
  });

  test('a permitted action with no blocker renders enabled', () => {
    expect(actionState(createCan(COMPANY_PRINCIPAL), 'Users.CorrectName')).toEqual({
      visible: true,
      disabled: false,
    });
  });

  test('a state-blocked action the account could perform renders disabled with its reason', () => {
    expect(
      actionState(createCan(COMPANY_PRINCIPAL), 'Users.SuspendRestoreOrdinary', 'The user is already suspended.'),
    ).toEqual({ visible: true, disabled: true, reason: 'The user is already suspended.' });
  });

  test('a blocker never promotes a hidden action into a disabled one', () => {
    expect(actionState(createCan(VIEWER), 'Users.SuspendRestoreOrdinary', 'The user is already suspended.')).toEqual({
      visible: false,
    });
  });
});
