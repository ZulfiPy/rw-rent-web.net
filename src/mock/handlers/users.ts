import {
  ApplicationUserRole, ApplicationUserStatus, enumName,
  type ActivateApplicationUserRequest, type ApplicationUserListItemResponse,
  type ApplicationUserResponse, type CorrectApplicationUserNameRequest,
  type RegistrationDecisionRequest, type UsersQuery,
} from '@/api/dto';
import type { Permission } from '@/permissions/permissions';
import { writeAudit } from '../audit';
import { newUuid } from '../ids';
import { page, contains } from '../paging';
import { revokeSessionsFor } from '../security';
import { forbidden, notFound, route, type Ctx } from '../transport';
import { codedValidation, conflict, fieldError, requireReason, requireText } from '../validate';

/** Registration lifecycle states, as a list of the enum's own type: `includes` takes any status. */
const LIFECYCLE: ApplicationUserStatus[] = [
  ApplicationUserStatus.PendingActivation,
  ApplicationUserStatus.RegistrationRejected,
  ApplicationUserStatus.RegistrationExpired,
];

/**
 * Directory visibility, matching the backend: the admitted directory is Active + Suspended;
 * registration reviewers additionally see lifecycle records.
 */
const visibleTo = (ctx: Ctx) => (u: ApplicationUserResponse) =>
  !LIFECYCLE.includes(u.status) || ctx.can('Users.ReviewRegistrations');

const listItem = (u: ApplicationUserResponse): ApplicationUserListItemResponse => ({
  id: u.id,
  email: u.email,
  firstName: u.firstName,
  lastName: u.lastName,
  phoneNumber: u.phoneNumber,
  companyId: u.companyId ?? null,
  status: u.status,
  emailConfirmed: u.emailConfirmed,
  registrationExpiresAtUtc: u.registrationExpiresAtUtc ?? null,
  effectiveRoles: u.effectiveRoles,
});

const find = (ctx: Ctx): ApplicationUserResponse => {
  const u = ctx.store.users.find((x) => x.id === ctx.params.userId);
  if (!u || !visibleTo(ctx)(u)) throw notFound('That user is not in your directory.');
  return u;
};

const isProtectedAdministrator = (u: ApplicationUserResponse) =>
  u.effectiveRoles.includes(ApplicationUserRole.SystemAdministrator);

const ACTIVATION_PERMISSION: Partial<Record<ApplicationUserRole, Permission>> = {
  [ApplicationUserRole.Viewer]: 'Users.ActivateViewer',
  [ApplicationUserRole.FleetManager]: 'Users.ActivateFleetManager',
  [ApplicationUserRole.CompanyPrincipal]: 'Users.ActivateCompanyPrincipal',
};

const touch = (u: ApplicationUserResponse) => {
  u.updatedAtUtc = new Date().toISOString();
};

route('GET', '/api/users', (ctx) => {
  const q = ctx.query as UsersQuery;
  const rows = ctx.store.users
    .filter(visibleTo(ctx))
    .filter((u) => (q.Status ? u.status === Number(q.Status) : true))
    .filter((u) => (q.Role ? u.effectiveRoles.includes(Number(q.Role) as ApplicationUserRole) : true))
    .filter((u) =>
      !q.Search ||
      contains(u.firstName, q.Search) || contains(u.lastName, q.Search) ||
      contains(u.email, q.Search) || contains(u.phoneNumber, q.Search))
    // Server order: first name, last name, then id. SortBy is accepted and ignored.
    .sort((a, b) => `${a.firstName}${a.lastName}${a.id}`.localeCompare(`${b.firstName}${b.lastName}${b.id}`))
    .map(listItem);
  return page(rows, q);
}, ['Users.ReadDirectory']);

route('GET', '/api/users/{userId}', (ctx) => find(ctx), ['Users.ReadDirectory']);

route('PUT', '/api/users/{userId}/name', (ctx) => {
  const u = find(ctx);
  const body = ctx.body as CorrectApplicationUserNameRequest;
  const firstName = requireText(body.firstName, 'firstName', 'First Name', 100);
  const lastName = requireText(body.lastName, 'lastName', 'Last Name', 100);
  const reason = requireReason(body.reason);
  if (isProtectedAdministrator(u)) throw forbidden();
  if (firstName === u.firstName && lastName === u.lastName) {
    throw fieldError({ lastName: ['The corrected name must differ from the recorded one.'] });
  }

  const before = { FirstName: u.firstName, LastName: u.lastName };
  u.firstName = firstName;
  u.lastName = lastName;
  touch(u);
  writeAudit(ctx.store, {
    eventType: 'ApplicationUser.NameCorrected',
    actorUserId: ctx.me.id,
    targetUserId: u.id,
    entityType: 'ApplicationUser',
    entityId: u.id,
    reason,
    before,
    after: { FirstName: u.firstName, LastName: u.lastName },
  });
  return u;
}, ['Users.ReadDirectory', 'Users.CorrectName']);

route('POST', '/api/users/{userId}/activate', (ctx) => {
  const u = find(ctx);
  const body = ctx.body as ActivateApplicationUserRequest;
  const grants = body?.roles ?? [];

  if (grants.length === 0) throw fieldError({ roles: ["'Roles' must not be empty."] });
  if (new Set(grants.map((g) => g.role)).size !== grants.length) {
    throw codedValidation('Role values must be unique.', 'users.activation_roles_duplicate');
  }
  for (const g of grants) {
    const permission = ACTIVATION_PERMISSION[g.role];
    if (!permission || !ctx.can(permission)) throw forbidden();
    // Stricter than Change expiry: an initial grant's expiry must be in the future.
    if (g.expiresAtUtc && new Date(g.expiresAtUtc).getTime() <= Date.now()) {
      throw codedValidation('The expiry must be a future date.', 'users.activation_role_expiry_invalid');
    }
  }
  if (u.status !== ApplicationUserStatus.PendingActivation) {
    throw conflict('The registration is no longer awaiting a decision.', 'users.activation_invalid_state');
  }
  if (!u.emailConfirmed) {
    throw conflict('The registration email is not confirmed yet.', 'users.activation_email_unconfirmed');
  }

  const now = new Date().toISOString();
  u.status = ApplicationUserStatus.Active;
  u.companyId = ctx.store.company?.id ?? null;
  u.effectiveRoles = grants.map((g) => g.role);
  u.registrationExpiresAtUtc = null;
  touch(u);

  for (const g of grants) {
    ctx.store.roles.unshift({
      id: newUuid(),
      applicationUserId: u.id,
      role: g.role,
      assignedAtUtc: now,
      assignedByUserId: ctx.me.id,
      expiresAtUtc: g.expiresAtUtc ?? null,
      revokedAtUtc: null,
      revokedByUserId: null,
      revocationReason: null,
      isEffective: true,
    });
  }

  // The one after-only payload with a nested value. Roles render one grant per line.
  writeAudit(ctx.store, {
    eventType: 'Registration.Activated',
    actorUserId: ctx.me.id,
    targetUserId: u.id,
    entityType: 'ApplicationUser',
    entityId: u.id,
    after: {
      Status: 'Active',
      CompanyId: u.companyId,
      Roles: grants.map((g) => ({
        Role: enumName(ApplicationUserRole, g.role),
        ExpiresAtUtc: g.expiresAtUtc ?? null,
      })),
    },
  });
  return u;
}, ['Users.ReadDirectory', 'Users.ManageRegistrations']);

const decision = (kind: 'reject' | 'reopen') => (ctx: Ctx) => {
  const u = find(ctx);
  const reason = requireReason((ctx.body as RegistrationDecisionRequest)?.reason);

  if (kind === 'reject' && u.status !== ApplicationUserStatus.PendingActivation) {
    throw conflict('The registration is no longer awaiting a decision.', 'users.rejection_invalid_state');
  }
  if (kind === 'reopen' && u.status !== ApplicationUserStatus.RegistrationRejected) {
    throw conflict('The registration is no longer in a state that can be reopened.', 'users.reopen_invalid_state');
  }

  const wasStatus = enumName(ApplicationUserStatus, u.status);
  const wasExpiry = u.registrationExpiresAtUtc ?? null;

  if (kind === 'reject') {
    u.status = ApplicationUserStatus.RegistrationRejected;
    u.registrationExpiresAtUtc = null;
  } else {
    u.status = ApplicationUserStatus.PendingActivation;
    // A confirmed email needs no new window; an unconfirmed one gets a fresh seven days.
    u.registrationExpiresAtUtc = u.emailConfirmed
      ? null
      : new Date(Date.now() + 7 * 24 * 3_600_000).toISOString();
  }
  u.registrationDecisionReason = reason;
  touch(u);

  writeAudit(ctx.store, {
    eventType: kind === 'reject' ? 'Registration.Rejected' : 'Registration.Reopened',
    actorUserId: ctx.me.id,
    targetUserId: u.id,
    entityType: 'ApplicationUser',
    entityId: u.id,
    reason,
    before: { Status: wasStatus, RegistrationExpiresAtUtc: wasExpiry },
    after: {
      Status: enumName(ApplicationUserStatus, u.status),
      RegistrationExpiresAtUtc: u.registrationExpiresAtUtc ?? null,
    },
  });
  return u;
};

route('POST', '/api/users/{userId}/reject-registration', decision('reject'), ['Users.ReadDirectory', 'Users.ManageRegistrations']);
route('POST', '/api/users/{userId}/reopen-registration', decision('reopen'), ['Users.ReadDirectory', 'Users.ManageRegistrations']);

const lifecycle = (kind: 'suspend' | 'restore') => (ctx: Ctx) => {
  const u = find(ctx);
  if (isProtectedAdministrator(u)) throw forbidden();
  const isPrincipal = u.effectiveRoles.includes(ApplicationUserRole.CompanyPrincipal);
  const permission: Permission = isPrincipal
    ? 'Users.SuspendRestoreCompanyPrincipal'
    : 'Users.SuspendRestoreOrdinary';
  if (!ctx.can(permission)) throw forbidden();

  if (kind === 'suspend' && u.status !== ApplicationUserStatus.Active) {
    throw conflict('The user is already suspended.', 'users.suspend_invalid_state');
  }
  if (kind === 'restore' && u.status !== ApplicationUserStatus.Suspended) {
    throw conflict('The user is not suspended.', 'users.restore_invalid_state');
  }

  const before = { Status: enumName(ApplicationUserStatus, u.status) };
  u.status = kind === 'suspend' ? ApplicationUserStatus.Suspended : ApplicationUserStatus.Active;
  touch(u);
  // No reason: the endpoint takes no body and the backend audits none.
  writeAudit(ctx.store, {
    eventType: kind === 'suspend' ? 'ApplicationUser.Suspended' : 'ApplicationUser.Restored',
    actorUserId: ctx.me.id,
    targetUserId: u.id,
    entityType: 'ApplicationUser',
    entityId: u.id,
    before,
    after: { Status: enumName(ApplicationUserStatus, u.status) },
  });
  if (kind === 'suspend') revokeSessionsFor(ctx.store, u.id, 'Account suspended');
  return u;
};

route('POST', '/api/users/{userId}/suspend', lifecycle('suspend'), ['Users.ReadDirectory']);
route('POST', '/api/users/{userId}/restore', lifecycle('restore'), ['Users.ReadDirectory']);
