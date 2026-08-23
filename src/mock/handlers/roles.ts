import {
  ApplicationUserRole, enumName, type ChangeRoleExpiryRequest, type GrantRoleRequest,
  type PagedQuery, type RevokeRoleRequest, type RoleAssignmentResponse,
} from '@/api/dto';
import type { Permission } from '@/permissions/permissions';
import { writeAudit } from '../audit';
import { newUuid } from '../ids';
import { byDesc, page } from '../paging';
import { revokeSessionsFor } from '../security';
import { forbidden, notFound, route, type Ctx } from '../transport';
import { conflict, fieldError, requireReason } from '../validate';

const MANAGE_PERMISSION: Partial<Record<ApplicationUserRole, Permission>> = {
  [ApplicationUserRole.Viewer]: 'Roles.ManageViewerFleetManager',
  [ApplicationUserRole.FleetManager]: 'Roles.ManageViewerFleetManager',
  [ApplicationUserRole.CompanyPrincipal]: 'Roles.ManageCompanyPrincipal',
};

const assertManageable = (ctx: Ctx, role: ApplicationUserRole) => {
  const permission = MANAGE_PERMISSION[role];
  if (!permission || !ctx.can(permission)) throw forbidden();
};

const effective = (r: RoleAssignmentResponse) =>
  !r.revokedAtUtc && (!r.expiresAtUtc || new Date(r.expiresAtUtc).getTime() > Date.now());

const recomputeEffectiveRoles = (ctx: Ctx, userId: string) => {
  const user = ctx.store.users.find((u) => u.id === userId);
  if (!user) return;
  user.effectiveRoles = ctx.store.roles
    .filter((r) => r.applicationUserId === userId && effective(r))
    .map((r) => r.role);
};

const findAssignment = (ctx: Ctx): RoleAssignmentResponse => {
  const r = ctx.store.roles.find(
    (x) => x.id === ctx.params.assignmentId && x.applicationUserId === ctx.params.userId,
  );
  if (!r) throw notFound('That role assignment was not found.');
  return r;
};

route('GET', '/api/users/{userId}/roles', (ctx) => {
  const rows = ctx.store.roles
    .filter((r) => r.applicationUserId === ctx.params.userId)
    .map((r) => ({ ...r, isEffective: effective(r) }))
    .sort(byDesc((r) => r.assignedAtUtc + r.id));
  return page(rows, ctx.query as PagedQuery);
}, ['Users.ReadDirectory', 'Roles.ReadHistory']);

route('POST', '/api/users/{userId}/roles', (ctx) => {
  const body = ctx.body as GrantRoleRequest;
  assertManageable(ctx, body.role);
  if (body.expiresAtUtc && new Date(body.expiresAtUtc).getTime() <= Date.now()) {
    throw fieldError({ expiresAtUtc: ['The expiry must be a future date.'] });
  }
  const held = ctx.store.roles.some(
    (r) => r.applicationUserId === ctx.params.userId && r.role === body.role && effective(r),
  );
  if (held) throw conflict('The user already holds this role under an effective assignment.', 'roles.duplicate_grant');

  const row: RoleAssignmentResponse = {
    id: newUuid(),
    applicationUserId: ctx.params.userId as string,
    role: body.role,
    assignedAtUtc: new Date().toISOString(),
    assignedByUserId: ctx.me.id,
    expiresAtUtc: body.expiresAtUtc ?? null,
    revokedAtUtc: null,
    revokedByUserId: null,
    revocationReason: null,
    isEffective: true,
  };
  ctx.store.roles.unshift(row);
  recomputeEffectiveRoles(ctx, row.applicationUserId);
  writeAudit(ctx.store, {
    eventType: 'RoleAssignment.Granted',
    actorUserId: ctx.me.id,
    targetUserId: row.applicationUserId,
    entityType: 'RoleAssignment',
    entityId: row.id,
    after: { Role: enumName(ApplicationUserRole, row.role), ExpiresAtUtc: row.expiresAtUtc },
  });
  return row;
}, ['Users.ReadDirectory']);

route('PUT', '/api/users/{userId}/roles/{assignmentId}/expiry', (ctx) => {
  const row = findAssignment(ctx);
  assertManageable(ctx, row.role);
  if (row.revokedAtUtc) throw conflict('That role assignment is no longer effective.', 'roles.assignment_historical');

  const was = row.expiresAtUtc ?? null;
  const next = (ctx.body as ChangeRoleExpiryRequest)?.expiresAtUtc ?? null;
  if (was === next) return row;

  row.expiresAtUtc = next;
  row.isEffective = effective(row);
  recomputeEffectiveRoles(ctx, row.applicationUserId);
  writeAudit(ctx.store, {
    eventType: 'RoleAssignment.ExpiryChanged',
    actorUserId: ctx.me.id,
    targetUserId: row.applicationUserId,
    entityType: 'RoleAssignment',
    entityId: row.id,
    before: { ExpiresAtUtc: was },
    after: { ExpiresAtUtc: next },
  });
  revokeSessionsFor(ctx.store, row.applicationUserId, 'Role expiry changed');
  return row;
}, ['Users.ReadDirectory']);

route('POST', '/api/users/{userId}/roles/{assignmentId}/revoke', (ctx) => {
  const row = findAssignment(ctx);
  assertManageable(ctx, row.role);
  const reason = requireReason((ctx.body as RevokeRoleRequest)?.reason);
  if (!effective(row)) throw conflict('That role assignment is no longer effective.', 'roles.assignment_not_effective');

  const now = new Date().toISOString();
  row.revokedAtUtc = now;
  row.revokedByUserId = ctx.me.id;
  row.revocationReason = reason;
  row.isEffective = false;
  recomputeEffectiveRoles(ctx, row.applicationUserId);
  writeAudit(ctx.store, {
    eventType: 'RoleAssignment.Revoked',
    actorUserId: ctx.me.id,
    targetUserId: row.applicationUserId,
    entityType: 'RoleAssignment',
    entityId: row.id,
    reason,
    // The service writes Role + RevokedAtUtc on both sides; Role is identical, so the delta drops
    // it and RevokedAtUtc is the only key on the wire. No IsEffective key: effectiveness is derived.
    before: { RevokedAtUtc: null },
    after: { RevokedAtUtc: now },
  });
  revokeSessionsFor(ctx.store, row.applicationUserId, 'Role revoked');
  return row;
}, ['Users.ReadDirectory']);
