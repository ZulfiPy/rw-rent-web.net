import {
  ApplicationUserRole, ApplicationUserStatus, type ApplicationUserResponse, type CompanyResponse,
  type RoleAssignmentResponse, type SecurityAuditResponse, type SessionResponse,
} from '@/api/dto';
import { ID, newUuid } from './ids';
import { payloadJson } from './audit';
import type { MockStore } from './store';

/**
 * PHASE A FIXTURE. Shaped exactly like the reviewed prototype's `DB`, but trimmed to the security
 * surfaces the A-phase tests exercise. Deliverable B replaces this file with the full
 * version-tagged port (users, fleet, customers, drivers, assignments, authorizations,
 * interruptions) from RW-Rent.dc.html.
 */

const H = 3_600_000;
const base = Date.now();
/** Hours from now, as the prototype seeds. */
const at = (hours: number) => new Date(base + hours * H).toISOString();

const company = (): CompanyResponse => ({
  id: ID.company,
  name: 'RW-Rent Fleet Services',
  registrationNumber: '40203881204',
  vatNumber: 'LV40203881204',
  legalAddress: 'Brivibas gatve 214, Riga, LV-1039',
  email: 'operations@rwrent.example',
  phoneNumber: '+371 67 200 140',
  createdAtUtc: at(-24 * 400),
  updatedAtUtc: at(-18),
});

const user = (
  id: string,
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
  companyId: status === ApplicationUserStatus.PendingActivation ? null : ID.company,
  status,
  emailConfirmed: true,
  registrationExpiresAtUtc: null,
  effectiveRoles,
  securityVersion: 1,
  createdAtUtc: at(-24 * 300),
  updatedAtUtc: null,
  ...extra,
});

export function seed(): MockStore {
  const users: ApplicationUserResponse[] = [
    user(ID.users.sysadmin, 'Aivars', 'Rudzitis', 'aivars.rudzitis@rwrent.example', '+371 29 100 001', ApplicationUserStatus.Active, [ApplicationUserRole.SystemAdministrator]),
    user(ID.users.principal, 'Dace', 'Pumpure', 'dace.pumpure@rwrent.example', '+371 29 100 002', ApplicationUserStatus.Active, [ApplicationUserRole.CompanyPrincipal]),
    user(ID.users.fleet, 'Gatis', 'Zvaigzne', 'gatis.zvaigzne@rwrent.example', '+371 29 100 004', ApplicationUserStatus.Active, [ApplicationUserRole.FleetManager], { updatedAtUtc: at(-24 * 8) }),
    user(ID.users.viewer, 'Sanita', 'Grinberga', 'sanita.grinberga@rwrent.example', '+371 29 100 005', ApplicationUserStatus.Active, [ApplicationUserRole.Viewer]),
    user(ID.users.suspended, 'Toms', 'Skujins', 'toms.skujins@rwrent.example', '+371 29 100 011', ApplicationUserStatus.Suspended, [ApplicationUserRole.Viewer], { updatedAtUtc: at(-24 * 5) }),
    user(ID.users.pendingConfirmed, 'Elina', 'Bergmane', 'elina.bergmane@example.com', '+371 29 100 008', ApplicationUserStatus.PendingActivation, [], { createdAtUtc: at(-30) }),
    user(ID.users.pendingUnconfirmed, 'Rihards', 'Dumins', 'rihards.dumins@example.com', '+371 29 100 009', ApplicationUserStatus.PendingActivation, [], {
      emailConfirmed: false,
      createdAtUtc: at(-24 * 2),
      registrationExpiresAtUtc: at(24 * 5),
    }),
    user(ID.users.rejected, 'Marta', 'Silava', 'marta.silava@example.com', '+371 29 100 010', ApplicationUserStatus.RegistrationRejected, [], {
      createdAtUtc: at(-24 * 12),
      updatedAtUtc: at(-24 * 11),
      registrationDecisionReason: 'No employment relationship with the Company.',
    }),
  ];

  const roles: RoleAssignmentResponse[] = [
    { id: newUuid(), applicationUserId: ID.users.sysadmin, role: ApplicationUserRole.SystemAdministrator, assignedAtUtc: at(-24 * 400), assignedByUserId: ID.users.sysadmin, expiresAtUtc: null, revokedAtUtc: null, revokedByUserId: null, revocationReason: null, isEffective: true },
    { id: newUuid(), applicationUserId: ID.users.principal, role: ApplicationUserRole.CompanyPrincipal, assignedAtUtc: at(-24 * 380), assignedByUserId: ID.users.sysadmin, expiresAtUtc: null, revokedAtUtc: null, revokedByUserId: null, revocationReason: null, isEffective: true },
    { id: newUuid(), applicationUserId: ID.users.fleet, role: ApplicationUserRole.FleetManager, assignedAtUtc: at(-24 * 40), assignedByUserId: ID.users.principal, expiresAtUtc: at(24 * 120), revokedAtUtc: null, revokedByUserId: null, revocationReason: null, isEffective: true },
    { id: newUuid(), applicationUserId: ID.users.fleet, role: ApplicationUserRole.Viewer, assignedAtUtc: at(-24 * 200), assignedByUserId: ID.users.principal, expiresAtUtc: null, revokedAtUtc: at(-24 * 40), revokedByUserId: ID.users.principal, revocationReason: 'Superseded by the Fleet Manager grant.', isEffective: false },
    { id: newUuid(), applicationUserId: ID.users.viewer, role: ApplicationUserRole.Viewer, assignedAtUtc: at(-24 * 90), assignedByUserId: ID.users.principal, expiresAtUtc: null, revokedAtUtc: null, revokedByUserId: null, revocationReason: null, isEffective: true },
  ];

  const session = (
    applicationUserId: string,
    hours: number,
    device: string,
    ip: string,
    over: Partial<SessionResponse> = {},
  ): SessionResponse => ({
    id: newUuid(),
    applicationUserId,
    createdAtUtc: at(hours),
    lastSeenAtUtc: at(hours + 0.5),
    idleExpiresAtUtc: at(hours + 2.5),
    absoluteExpiresAtUtc: at(hours + 12),
    revokedAtUtc: null,
    revocationReason: null,
    deviceDescription: device,
    ipAddress: ip,
    isCurrent: false,
    isActive: true,
    ...over,
  });

  const sessions: SessionResponse[] = [
    session(ID.users.sysadmin, -0.4, 'Chrome on macOS', '81.198.44.12', { isCurrent: true }),
    session(ID.users.principal, -1.2, 'Safari on iPhone', '81.198.44.90'),
    session(ID.users.fleet, -3, 'Edge on Windows', '85.254.11.203'),
    session(ID.users.fleet, -26, 'Chrome on Android', '85.254.11.77', {
      isActive: false,
      revokedAtUtc: null,
      lastSeenAtUtc: at(-24),
      idleExpiresAtUtc: at(-22),
    }),
    session(ID.users.suspended, -24 * 5 - 0.25, 'Firefox on Windows', '85.254.9.14', {
      isActive: false,
      revokedAtUtc: at(-24 * 5 + 0.2),
      revocationReason: 'Account suspended',
    }),
  ];

  const audit: SecurityAuditResponse[] = [
    {
      id: newUuid(), eventType: 'Registration.Rejected', actorUserId: ID.users.principal,
      occurredAtUtc: at(-24 * 11), companyId: ID.company, targetUserId: ID.users.rejected,
      entityType: 'ApplicationUser', entityId: ID.users.rejected,
      reason: 'No employment relationship with the Company.',
      beforeJson: payloadJson({ Status: 'PendingActivation' }),
      afterJson: payloadJson({ Status: 'RegistrationRejected' }),
    },
    {
      id: newUuid(), eventType: 'ApplicationUser.Suspended', actorUserId: ID.users.principal,
      occurredAtUtc: at(-24 * 5), companyId: ID.company, targetUserId: ID.users.suspended,
      entityType: 'ApplicationUser', entityId: ID.users.suspended, reason: null,
      beforeJson: payloadJson({ Status: 'Active' }),
      afterJson: payloadJson({ Status: 'Suspended' }),
    },
    {
      id: newUuid(), eventType: 'Session.RevokedByAdministrator', actorUserId: ID.users.principal,
      occurredAtUtc: at(-24 * 5 + 0.2), companyId: ID.company, targetUserId: ID.users.suspended,
      entityType: 'Session', entityId: sessions[4]?.id ?? null, reason: null,
      beforeJson: null, afterJson: null,
    },
    {
      id: newUuid(), eventType: 'RoleAssignment.Granted', actorUserId: ID.users.principal,
      occurredAtUtc: at(-24 * 40), companyId: ID.company, targetUserId: ID.users.fleet,
      entityType: 'RoleAssignment', entityId: roles[2]?.id ?? null, reason: null,
      beforeJson: null,
      afterJson: payloadJson({ Role: 'FleetManager', ExpiresAtUtc: at(24 * 120) }),
    },
    {
      id: newUuid(), eventType: 'ApplicationUser.NameCorrected', actorUserId: ID.users.principal,
      occurredAtUtc: at(-24 * 8), companyId: ID.company, targetUserId: ID.users.fleet,
      entityType: 'ApplicationUser', entityId: ID.users.fleet,
      reason: 'Legal name change recorded from the marriage certificate.',
      beforeJson: payloadJson({ LastName: 'Zvaigznitis' }),
      afterJson: payloadJson({ LastName: 'Zvaigzne' }),
    },
    {
      id: newUuid(), eventType: 'Company.Updated', actorUserId: ID.users.sysadmin,
      occurredAtUtc: at(-18), companyId: ID.company, targetUserId: null,
      entityType: 'Company', entityId: ID.company, reason: null,
      beforeJson: payloadJson({ PhoneNumber: '+371 67 200 100' }),
      afterJson: payloadJson({ PhoneNumber: '+371 67 200 140' }),
    },
  ];

  return {
    version: 'rwrent-19',
    company: company(),
    users,
    roles,
    sessions,
    audit,
    vehicles: [],
    customers: [],
    drivers: [],
    assignments: [],
    authorizations: [],
    interruptions: [],
    transfers: [],
  };
}
