import {
  ApplicationUserRole, ApplicationUserStatus, type ApplicationUserResponse, type CompanyResponse,
  type Instant, type RoleAssignmentResponse, type SecurityAuditResponse, type Uuid,
} from '@/api/dto';
import { ID } from './ids';
import { fleet } from './seedFleet';
import { payloadJson } from './audit';
import type { SessionRecord } from './security';
import type { MockStore } from './store';

/**
 * The reviewed prototype's `DB`, ported. Same people, same identifiers, same registration states,
 * same sessions, same audit trail — only the shapes change: ids are uuids, enums are their wire
 * numbers, and a session's isActive/isCurrent are gone because the API computes them per request.
 *
 * Rows the fleet surfaces own (vehicles, customers, drivers, assignments, authorizations,
 * interruptions) live in `seedFleet.ts` and are spread in below.
 */

const H = 3_600_000;
const base = Date.now();
/** Hours from now, exactly as the prototype seeds. */
const at = (hours: number): Instant => new Date(base + hours * H).toISOString();

/**
 * One source of truth for a registration: the applicant's Registered timestamp and their
 * Registration.Submitted audit entry are the same instant, and the deadline is registration + 7 d.
 */
const REG_AT = { u8: -44, u9: -24 * 14 };
/** Activation stamps the record, so an activated user's Last updated is never empty. */
const ACT_AT = { u5: -24 * 70 };

const company = (): CompanyResponse => ({
  id: ID.company,
  name: 'RW-Rent Fleet Services',
  registrationNumber: '40203881204',
  vatNumber: 'LV40203881204',
  legalAddress: 'Brivibas gatve 214, Riga, LV-1039',
  email: 'operations@rwrent.example',
  phoneNumber: '+371 66 120 400',
  createdAtUtc: at(-24 * 300),
  updatedAtUtc: at(-18),
});

const user = (
  id: Uuid,
  firstName: string,
  lastName: string,
  email: string,
  phoneNumber: string,
  status: ApplicationUserStatus,
  effectiveRoles: ApplicationUserRole[],
  extra: Partial<ApplicationUserResponse> = {},
): ApplicationUserResponse => ({
  id,
  email,
  firstName,
  lastName,
  phoneNumber,
  companyId: ID.company,
  status,
  emailConfirmed: true,
  registrationExpiresAtUtc: null,
  effectiveRoles,
  securityVersion: 1,
  createdAtUtc: at(-24 * 300),
  updatedAtUtc: null,
  ...extra,
});

const S = ApplicationUserStatus;
const R = ApplicationUserRole;

const session = (
  id: Uuid,
  applicationUserId: Uuid,
  hours: [created: number, lastSeen: number, idle: number, absolute: number],
  deviceDescription: string,
  ipAddress: string,
  revoked?: { atHours: number; reason: string },
): SessionRecord => ({
  id,
  applicationUserId,
  createdAtUtc: at(hours[0]),
  lastSeenAtUtc: at(hours[1]),
  idleExpiresAtUtc: at(hours[2]),
  absoluteExpiresAtUtc: at(hours[3]),
  revokedAtUtc: revoked ? at(revoked.atHours) : null,
  revocationReason: revoked?.reason ?? null,
  deviceDescription,
  ipAddress,
});

export function seed(): MockStore {
  const users: ApplicationUserResponse[] = [
    user(ID.users.u1, 'Arturs', 'Veidenbaums', 'sysadmin@rwrent.example', '+371 29 000 001', S.Active, [R.SystemAdministrator], {
      securityVersion: 7, createdAtUtc: at(-24 * 400), updatedAtUtc: at(-24 * 20),
    }),
    user(ID.users.u2, 'Signe', 'Priede', 'signe.priede@rwrent.example', '+371 29 118 220', S.Active, [R.CompanyPrincipal], {
      securityVersion: 4, createdAtUtc: at(-24 * 380), updatedAtUtc: at(-24 * 30),
    }),
    user(ID.users.u3, 'Karlis', 'Zvaigzne', 'karlis.zvaigzne@rwrent.example', '+371 26 440 118', S.Active, [R.FleetManager], {
      securityVersion: 2, createdAtUtc: at(-24 * 210), updatedAtUtc: at(-24 * 15),
    }),
    user(ID.users.u4, 'Dita', 'Smite', 'dita.smite@rwrent.example', '+371 25 007 441', S.Active, [R.FleetManager, R.Viewer], {
      securityVersion: 3, createdAtUtc: at(-24 * 160), updatedAtUtc: at(-24 * 8),
    }),
    user(ID.users.u5, 'Toms', 'Rudzitis', 'toms.rudzitis@rwrent.example', '+371 22 118 003', S.Active, [R.Viewer], {
      createdAtUtc: at(-24 * 70), updatedAtUtc: at(ACT_AT.u5),
    }),
    user(ID.users.u6, 'Liga', 'Brice', 'liga.brice@example.com', '+371 28 774 110', S.PendingActivation, [], {
      companyId: null, createdAtUtc: at(-30), updatedAtUtc: at(-26),
    }),
    user(ID.users.u7, 'Gatis', 'Lapsa', 'gatis.lapsa@example.com', '+371 26 118 447', S.PendingActivation, [], {
      companyId: null, createdAtUtc: at(-54), updatedAtUtc: at(-50),
    }),
    user(ID.users.u8, 'Zane', 'Upite', 'zane.upite@example.com', '+371 20 330 118', S.PendingActivation, [], {
      companyId: null, emailConfirmed: false,
      registrationExpiresAtUtc: at(REG_AT.u8 + 24 * 7), createdAtUtc: at(REG_AT.u8),
    }),
    user(ID.users.u9, 'Imants', 'Gailis', 'imants.gailis@example.com', '+371 29 004 118', S.RegistrationRejected, [], {
      companyId: null, securityVersion: 2, createdAtUtc: at(REG_AT.u9), updatedAtUtc: at(-24 * 11),
      registrationDecisionReason:
        'No employment relationship with the Company; requested access on behalf of an external partner.',
    }),
    user(ID.users.u10, 'Baiba', 'Krastina', 'baiba.krastina@example.com', '+371 25 118 990', S.RegistrationExpired, [], {
      companyId: null, emailConfirmed: false,
      registrationExpiresAtUtc: at(-24 * 2), createdAtUtc: at(-24 * 9),
    }),
    // Suspension leaves the account with no effective role.
    user(ID.users.u11, 'Raivis', 'Dumins', 'raivis.dumins@rwrent.example', '+371 22 447 118', S.Suspended, [], {
      securityVersion: 6, createdAtUtc: at(-24 * 250), updatedAtUtc: at(-24 * 5),
    }),
  ];

  const roles: RoleAssignmentResponse[] = [
    { id: ID.roles.r1, applicationUserId: ID.users.u4, role: R.Viewer, assignedAtUtc: at(-24 * 160), assignedByUserId: ID.users.u2, expiresAtUtc: null, revokedAtUtc: null, revokedByUserId: null, revocationReason: null, isEffective: true },
    { id: ID.roles.r2, applicationUserId: ID.users.u4, role: R.FleetManager, assignedAtUtc: at(-24 * 40), assignedByUserId: ID.users.u2, expiresAtUtc: at(24 * 80), revokedAtUtc: null, revokedByUserId: null, revocationReason: null, isEffective: true },
    { id: ID.roles.r3, applicationUserId: ID.users.u4, role: R.FleetManager, assignedAtUtc: at(-24 * 120), assignedByUserId: ID.users.u2, expiresAtUtc: at(-24 * 60), revokedAtUtc: at(-24 * 61), revokedByUserId: ID.users.u2, revocationReason: 'Temporary cover ended.', isEffective: false },
    { id: ID.roles.r3b, applicationUserId: ID.users.u4, role: R.Viewer, assignedAtUtc: at(-24 * 300), assignedByUserId: ID.users.u1, expiresAtUtc: at(-24 * 205), revokedAtUtc: null, revokedByUserId: null, revocationReason: null, isEffective: false },
    { id: ID.roles.r4, applicationUserId: ID.users.u3, role: R.FleetManager, assignedAtUtc: at(-24 * 210), assignedByUserId: ID.users.u1, expiresAtUtc: null, revokedAtUtc: null, revokedByUserId: null, revocationReason: null, isEffective: true },
    { id: ID.roles.r5, applicationUserId: ID.users.u5, role: R.Viewer, assignedAtUtc: at(-24 * 70), assignedByUserId: ID.users.u2, expiresAtUtc: null, revokedAtUtc: null, revokedByUserId: null, revocationReason: null, isEffective: true },
    { id: ID.roles.r6, applicationUserId: ID.users.u2, role: R.CompanyPrincipal, assignedAtUtc: at(-24 * 380), assignedByUserId: ID.users.u1, expiresAtUtc: null, revokedAtUtc: null, revokedByUserId: null, revocationReason: null, isEffective: true },
  ];

  const sessions: SessionRecord[] = [
    session(ID.sessions.s1, ID.users.u2, [-3, -0.05, 1.95, 9], 'Chrome 128 · macOS 15', '85.254.12.44'),
    session(ID.sessions.s15, ID.users.u2, [-4.8, -1.3, 0.7, 7.2], 'Safari 18 · iPad', '85.254.12.44'),
    // Idle deadline already passed: ended without a revocation.
    session(ID.sessions.s2, ID.users.u2, [-7, -5.2, -3.2, 5], 'Safari 18 · iPhone', '85.254.12.44'),
    session(ID.sessions.s3, ID.users.u2, [-30, -28, -26, -18], 'Firefox 130 · Windows 11', '212.93.101.7', {
      atHours: -27, reason: 'Revoked by user from session list',
    }),
    session(ID.sessions.s12, ID.users.u1, [-2.1, -0.08, 1.92, 9.9], 'Firefox 130 · macOS 15', '159.148.71.5'),
    session(ID.sessions.s13, ID.users.u1, [-1.1, -0.5, 1.5, 10.9], 'Safari 18 · iPad', '159.148.71.5'),
    session(ID.sessions.s14, ID.users.u1, [-40, -38.5, -36.5, -28], 'Chrome 128 · Windows 11', '159.148.71.5'),
    session(ID.sessions.s7, ID.users.u3, [-1.2, -0.2, 1.8, 10.8], 'Edge 127 · Windows 11', '212.93.101.19'),
    session(ID.sessions.s10, ID.users.u3, [-4.4, -0.9, 1.1, 7.6], 'Safari 18 · iPhone', '212.93.101.19'),
    session(ID.sessions.s4, ID.users.u4, [-5, -0.6, 1.4, 7], 'Chrome 128 · Windows 11', '85.254.12.61'),
    session(ID.sessions.s5, ID.users.u4, [-1.4, -0.3, 1.7, 10.6], 'Safari 18 · iPad', '85.254.12.61'),
    session(ID.sessions.s6, ID.users.u4, [-26, -25.1, -23.1, -14], 'Chrome 128 · Windows 11', '85.254.12.61'),
    session(ID.sessions.s8, ID.users.u5, [-1.6, -0.4, 1.6, 10.4], 'Chrome 128 · Android 15', '194.8.44.12'),
    session(ID.sessions.s11, ID.users.u5, [-6.2, -1.1, 0.9, 5.8], 'Edge 127 · Windows 11', '194.8.44.12'),
    session(ID.sessions.s9, ID.users.u11, [-24 * 5 - 1, -24 * 5 - 0.4, -24 * 5 + 1.6, -24 * 5 + 11], 'Firefox 130 · Ubuntu 24.04', '159.148.22.4', {
      atHours: -24 * 5 + 0.2, reason: 'Revoked by administrator',
    }),
  ];

  /**
   * Which session authenticated the request, per signed-in user. `isCurrent` is derived from this
   * and never stored on a row; the persona switcher changes who "me" is, so every persona needs one.
   */
  const currentSessionByUserId: Record<Uuid, Uuid> = {
    [ID.users.u1]: ID.sessions.s12,
    [ID.users.u2]: ID.sessions.s1,
    [ID.users.u3]: ID.sessions.s7,
    [ID.users.u4]: ID.sessions.s4,
    [ID.users.u5]: ID.sessions.s8,
  };

  const audit: SecurityAuditResponse[] = [
    {
      id: ID.audit.g1, eventType: 'RentalAssignment.TimelineCorrected', actorUserId: ID.users.u1,
      occurredAtUtc: at(-2.4), companyId: ID.company, targetUserId: null,
      entityType: 'RentalAssignment', entityId: ID.entities.a1,
      reason: 'Handover sheet showed 08:30, system recorded 10:15.',
      beforeJson: payloadJson({ StartedAtUtc: '2026-07-23T10:15:00+00:00' }),
      afterJson: payloadJson({ StartedAtUtc: '2026-07-23T08:30:00+00:00' }),
    },
    {
      id: ID.audit.g2, eventType: 'Registration.Rejected', actorUserId: ID.users.u2,
      occurredAtUtc: at(-24 * 11), companyId: ID.company, targetUserId: ID.users.u9,
      entityType: 'ApplicationUser', entityId: ID.users.u9,
      reason: 'No employment relationship with the Company.',
      beforeJson: payloadJson({ Status: 'PendingActivation' }),
      afterJson: payloadJson({ Status: 'RegistrationRejected' }),
    },
    {
      id: ID.audit.g3, eventType: 'RoleAssignment.Granted', actorUserId: ID.users.u2,
      occurredAtUtc: at(-24 * 40), companyId: ID.company, targetUserId: ID.users.u4,
      entityType: 'RoleAssignment', entityId: ID.roles.r2, reason: null, beforeJson: null,
      afterJson: payloadJson({ Role: 'FleetManager', ExpiresAtUtc: at(24 * 80) }),
    },
    {
      id: ID.audit.g4, eventType: 'ApplicationUser.Suspended', actorUserId: ID.users.u2,
      occurredAtUtc: at(-24 * 5), companyId: ID.company, targetUserId: ID.users.u11,
      entityType: 'ApplicationUser', entityId: ID.users.u11, reason: 'Extended unpaid leave.',
      beforeJson: payloadJson({ Status: 'Active' }),
      afterJson: payloadJson({ Status: 'Suspended' }),
    },
    {
      // The revoke endpoints take no reason and the entry records no payload: isActive is computed,
      // and the fixed revocation reason lives on the session row.
      id: ID.audit.g5, eventType: 'Session.RevokedByAdministrator', actorUserId: ID.users.u2,
      occurredAtUtc: at(-24 * 5 + 0.2), companyId: ID.company, targetUserId: ID.users.u11,
      entityType: 'Session', entityId: ID.sessions.s9, reason: null,
      beforeJson: null, afterJson: null,
    },
    {
      id: ID.audit.g6, eventType: 'Registration.Activated', actorUserId: ID.users.u2,
      occurredAtUtc: at(ACT_AT.u5), companyId: ID.company, targetUserId: ID.users.u5,
      entityType: 'ApplicationUser', entityId: ID.users.u5, reason: null, beforeJson: null,
      afterJson: payloadJson({
        Status: 'Active',
        CompanyId: ID.company,
        Roles: [{ Role: 'Viewer', ExpiresAtUtc: null }],
      }),
    },
    {
      // First name was identical on both sides, so the delta drops it.
      id: ID.audit.g7, eventType: 'ApplicationUser.NameCorrected', actorUserId: ID.users.u2,
      occurredAtUtc: at(-24 * 8), companyId: ID.company, targetUserId: ID.users.u4,
      entityType: 'ApplicationUser', entityId: ID.users.u4,
      reason: 'Legal name change confirmed with identity document.',
      beforeJson: payloadJson({ LastName: 'Krumina' }),
      afterJson: payloadJson({ LastName: 'Smite' }),
    },
    {
      id: ID.audit.g8, eventType: 'DriverAuthorization.Corrected', actorUserId: ID.users.u1,
      occurredAtUtc: at(-24 * 2), companyId: ID.company, targetUserId: null,
      entityType: 'AssignmentDriverAuthorization', entityId: ID.entities.z2,
      reason: 'Wrong stop reason entered at handover.',
      beforeJson: payloadJson({ StopReason: 'Other', Note: null }),
      afterJson: payloadJson({ StopReason: 'Replaced', Note: 'Replaced by contract driver rotation.' }),
    },
    {
      id: ID.audit.g9, eventType: 'Company.Updated', actorUserId: ID.users.u1,
      occurredAtUtc: at(-18), companyId: ID.company, targetUserId: null,
      entityType: 'Company', entityId: ID.company, reason: null,
      beforeJson: payloadJson({ PhoneNumber: '+371 66 120 000' }),
      afterJson: payloadJson({ PhoneNumber: '+371 66 120 400' }),
    },
    {
      id: ID.audit.g10, eventType: 'Authentication.SessionCreated', actorUserId: ID.users.u11,
      occurredAtUtc: at(-24 * 5 - 0.25), companyId: ID.company, targetUserId: ID.users.u11,
      entityType: 'Session', entityId: ID.sessions.s9, reason: null,
      beforeJson: null, afterJson: null,
    },
    {
      id: ID.audit.g11, eventType: 'Registration.Submitted', actorUserId: ID.users.u8,
      occurredAtUtc: at(REG_AT.u8), companyId: ID.company, targetUserId: ID.users.u8,
      entityType: 'ApplicationUser', entityId: ID.users.u8, reason: null, beforeJson: null,
      afterJson: payloadJson({
        Status: 'PendingActivation',
        RegistrationExpiresAtUtc: at(REG_AT.u8 + 24 * 7),
      }),
    },
    {
      id: ID.audit.g12, eventType: 'Registration.Submitted', actorUserId: ID.users.u9,
      occurredAtUtc: at(REG_AT.u9), companyId: ID.company, targetUserId: ID.users.u9,
      entityType: 'ApplicationUser', entityId: ID.users.u9, reason: null, beforeJson: null,
      afterJson: payloadJson({
        Status: 'PendingActivation',
        RegistrationExpiresAtUtc: at(REG_AT.u9 + 24 * 7),
      }),
    },
    {
      id: ID.audit.g13, eventType: 'Authentication.PasswordChanged', actorUserId: ID.users.u3,
      occurredAtUtc: at(-24 * 74), companyId: ID.company, targetUserId: ID.users.u3,
      entityType: 'ApplicationUser', entityId: ID.users.u3, reason: null,
      beforeJson: null, afterJson: null,
    },
  ];

  return {
    version: 'rwrent-20',
    company: company(),
    users,
    roles,
    sessions,
    currentSessionByUserId,
    audit,
    ...fleet(),
    /** The prototype's one open transfer: u1 hands over to u2, initiated 6h ago, 18h left. */
    transfers: [{
      id: ID.transfers.tr1,
      currentAdministratorUserId: ID.users.u1,
      targetUserId: ID.users.u2,
      initiatedAtUtc: at(-6),
      expiresAtUtc: at(18),
      cancelledAtUtc: null,
      acceptedAtUtc: null,
      isRecovery: false,
    }],
  };
}
