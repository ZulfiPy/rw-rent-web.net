import { describe, expect, test } from 'vitest';
import { actionState, createCan } from './can';
import { permsOf, type RoleName } from '@/mock/personas';

const canFor = (role: RoleName) => createCan(permsOf(role));

describe('the persona matrix', () => {
  test('each role inherits everything below it', () => {
    expect(canFor('FleetManager')('Vehicles.Read')).toBe(true);
    expect(canFor('CompanyPrincipal')('Vehicles.Manage')).toBe(true);
    expect(canFor('SystemAdministrator')('SecurityAudit.ReadCompany')).toBe(true);
  });

  test('a Viewer holds read permissions only', () => {
    const can = canFor('Viewer');
    expect(can('Vehicles.Read')).toBe(true);
    expect(can('Vehicles.Manage')).toBe(false);
    expect(can('Users.ReviewRegistrations')).toBe(false);
  });

  test('role administration starts at Company Principal', () => {
    expect(canFor('FleetManager')('Roles.ReadHistory')).toBe(false);
    expect(canFor('CompanyPrincipal')('Roles.ReadHistory')).toBe(true);
    expect(canFor('CompanyPrincipal')('Roles.ManageCompanyPrincipal')).toBe(false);
    expect(canFor('SystemAdministrator')('Roles.ManageCompanyPrincipal')).toBe(true);
  });

  test('privileged corrections belong to the System Administrator alone', () => {
    expect(canFor('CompanyPrincipal')('PrivilegedCorrections.Execute')).toBe(false);
    expect(canFor('SystemAdministrator')('PrivilegedCorrections.Execute')).toBe(true);
  });

  test('an empty permission list gates everything off', () => {
    expect(createCan([])('Company.Read')).toBe(false);
  });
});

describe('hide by permission, disable with reason', () => {
  test('a permission the persona can never hold hides the action', () => {
    expect(actionState(canFor('Viewer'), 'Users.CorrectName')).toEqual({ visible: false });
  });

  test('a permitted action with no blocker renders enabled', () => {
    expect(actionState(canFor('CompanyPrincipal'), 'Users.CorrectName')).toEqual({
      visible: true,
      disabled: false,
    });
  });

  test('a state-blocked action the persona could perform renders disabled with its reason', () => {
    expect(
      actionState(canFor('CompanyPrincipal'), 'Users.SuspendRestoreOrdinary', 'The user is already suspended.'),
    ).toEqual({ visible: true, disabled: true, reason: 'The user is already suspended.' });
  });

  test('a blocker never promotes a hidden action into a disabled one', () => {
    expect(actionState(canFor('Viewer'), 'Users.SuspendRestoreOrdinary', 'The user is already suspended.')).toEqual({
      visible: false,
    });
  });
});
