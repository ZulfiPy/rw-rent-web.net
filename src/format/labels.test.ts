import { describe, expect, it } from 'vitest';
import { ApplicationUserRole, SystemAdministratorTransferStatus, VehicleAvailability } from '@/api/dto';
import {
  AUDIT_EVENT_LABELS, AUDIT_EVENT_TYPES, ENTITY_LABEL, ROLE_LABEL, TRANSFER_STATUS_LABEL,
  VEHICLE_AVAILABILITY_LABEL, entityLabel, eventLabel, primaryRoleLabel, rolesLabel,
} from './labels';

/**
 * Every event type the backend writes, read out of its source once (RWRentApi, the audit writer's
 * call sites). The app labels all of them: an audit row must never render blank or raw.
 */
const BACKEND_EVENT_TYPES = [
  'ApplicationUser.NameCorrected', 'ApplicationUser.Restored', 'ApplicationUser.Suspended',
  'Authentication.EmailChangeRequested', 'Authentication.EmailChanged', 'Authentication.Logout',
  'Authentication.PasswordChanged', 'Authentication.PasswordResetCompleted',
  'Authentication.SessionCreated',
  'Company.Created', 'Company.Deleted', 'Company.Updated',
  'Customer.Deleted', 'Driver.Deleted',
  'DriverAuthorization.Corrected', 'DriverAuthorization.Deleted', 'DriverAuthorization.RemovedWithDriver',
  'Interruption.Corrected', 'Interruption.Deleted',
  'Registration.Activated', 'Registration.EmailConfirmationRotated', 'Registration.EmailConfirmed',
  'Registration.Expired', 'Registration.Rejected', 'Registration.Reopened',
  'Registration.Restarted', 'Registration.Submitted',
  'RentalAssignment.Cancelled', 'RentalAssignment.Deleted', 'RentalAssignment.PartiesCorrected',
  'RentalAssignment.TimelineCorrected',
  'RoleAssignment.ExpiryChanged', 'RoleAssignment.Granted', 'RoleAssignment.Revoked',
  'Session.AllRevokedByAdministrator', 'Session.OthersRevoked', 'Session.Revoked',
  'Session.RevokedByAdministrator',
  'SystemAdministrator.Bootstrapped', 'SystemAdministrator.OfflineRecovery',
  'SystemAdministrator.TransferAccepted', 'SystemAdministrator.TransferCancelled',
  'SystemAdministrator.TransferConfirmationRotated', 'SystemAdministrator.TransferInitiated',
  'Vehicle.Deleted',
];

/** The entity type strings the audit history stores, which are the backend's own entity names. */
const BACKEND_ENTITY_TYPES = [
  'ApplicationUser', 'ApplicationUserRoleAssignment', 'ApplicationUserSession',
  'AssignmentDriverAuthorization', 'AssignmentInterruption', 'Company', 'Customer', 'Driver',
  'RegistrationEmailConfirmationChallenge', 'RentalAssignment', 'SystemAdministratorTransfer',
  'Vehicle',
];

describe('audit vocabulary', () => {
  it('labels every event type the backend writes', () => {
    const missing = BACKEND_EVENT_TYPES.filter((type) => !AUDIT_EVENT_LABELS[type]);
    expect(missing).toEqual([]);
  });

  it('offers every one of them in the event filter', () => {
    const missing = BACKEND_EVENT_TYPES.filter((type) => !AUDIT_EVENT_TYPES.includes(type));
    expect(missing).toEqual([]);
  });

  it('labels the cancellation entry the backend now writes', () => {
    expect(eventLabel('RentalAssignment.Cancelled')).toBe('Rental assignment · Cancelled');
  });

  it('labels a person\'s own session revocations, which the backend writes since its round 6 (F7-8)', () => {
    expect(eventLabel('Session.Revoked')).toBe('Session · Revoked');
    expect(eventLabel('Session.OthersRevoked')).toBe('Session · Others revoked');
    expect(AUDIT_EVENT_TYPES).toEqual(expect.arrayContaining(['Session.Revoked', 'Session.OthersRevoked']));
  });

  it('names every entity type the audit history stores', () => {
    // A name the app has not been taught renders as itself; this asserts each one is taught.
    const unlabelled = BACKEND_ENTITY_TYPES.filter((type) => !ENTITY_LABEL[type]);
    expect(unlabelled).toEqual([]);
    expect(entityLabel('ApplicationUserSession')).toBe('Session');
    expect(entityLabel('ApplicationUserRoleAssignment')).toBe('Role assignment');
    expect(entityLabel('AssignmentInterruption')).toBe('Interruption');
  });

  it('renders an unknown string as itself rather than blank', () => {
    expect(entityLabel('SomethingNew')).toBe('SomethingNew');
    expect(eventLabel('Something.New')).toBe('Something · New');
    expect(entityLabel(null)).toBe('—');
    expect(eventLabel(undefined)).toBe('—');
  });
});

describe('the two new enums', () => {
  it('labels every vehicle availability', () => {
    expect(Object.values(VehicleAvailability).every((v) => !!VEHICLE_AVAILABILITY_LABEL[v])).toBe(true);
    expect(VEHICLE_AVAILABILITY_LABEL[VehicleAvailability.InUse]).toBe('In use');
  });

  it('labels every transfer status, the expired one included', () => {
    expect(Object.values(SystemAdministratorTransferStatus)
      .every((v) => !!TRANSFER_STATUS_LABEL[v])).toBe(true);
    expect(TRANSFER_STATUS_LABEL[SystemAdministratorTransferStatus.Expired]).toBe('Expired');
  });
});

describe('the Record deleter role (Follow-up 10)', () => {
  it('is named "Record deleter" wherever roles are named', () => {
    expect(ROLE_LABEL[ApplicationUserRole.RecordDeleter]).toBe('Record deleter');
    expect(rolesLabel([ApplicationUserRole.RecordDeleter, ApplicationUserRole.Viewer])).toBe('Record deleter, Viewer');
  });

  it('ranks below Viewer: a Viewer who may also delete is, in one word, a Viewer', () => {
    expect(primaryRoleLabel([ApplicationUserRole.RecordDeleter, ApplicationUserRole.Viewer])).toBe('Viewer');
    expect(primaryRoleLabel([ApplicationUserRole.Viewer, ApplicationUserRole.RecordDeleter])).toBe('Viewer');
    expect(primaryRoleLabel([ApplicationUserRole.RecordDeleter])).toBe('Record deleter');
    expect(primaryRoleLabel([ApplicationUserRole.RecordDeleter, ApplicationUserRole.FleetManager])).toBe('Fleet Manager');
  });
});
