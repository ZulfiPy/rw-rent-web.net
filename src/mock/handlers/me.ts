import type {
  ChangeOwnPasswordRequest, EmailChangeRequestResponse, LoginResponse, OwnProfileResponse,
  ProfileSecurityChangeResponse, RequestOwnEmailChange, UpdateOwnPhoneRequest,
} from '@/api/dto';
import { writeAudit } from '../audit';
import { revokeSessionsFor } from '../security';
import { notFound, route, type Ctx } from '../transport';
import { fieldError, requireText } from '../validate';

const self = (ctx: Ctx) => {
  const u = ctx.store.users.find((x) => x.id === ctx.me.id);
  if (!u) throw notFound('Your account is missing from the store.');
  return u;
};

const authentication = (ctx: Ctx): LoginResponse => {
  const u = self(ctx);
  const current = ctx.store.sessions.find((s) => s.applicationUserId === u.id && s.isCurrent);
  return {
    userId: u.id,
    sessionId: current?.id ?? '',
    companyId: u.companyId ?? null,
    securityVersion: u.securityVersion,
    expiresAtUtc: current?.idleExpiresAtUtc ?? new Date(Date.now() + 2 * 3_600_000).toISOString(),
  };
};

route('GET', '/api/me', (ctx) => ctx.me);

route('PUT', '/api/me/phone', (ctx): OwnProfileResponse => {
  const u = self(ctx);
  u.phoneNumber = requireText((ctx.body as UpdateOwnPhoneRequest)?.phoneNumber, 'phoneNumber', 'Phone Number', 30);
  u.updatedAtUtc = new Date().toISOString();
  return { id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, phoneNumber: u.phoneNumber };
});

route('POST', '/api/me/password', (ctx): ProfileSecurityChangeResponse => {
  const body = ctx.body as ChangeOwnPasswordRequest;
  if (!body?.currentPassword) throw fieldError({ currentPassword: ["'Current Password' must not be empty."] });
  const next = body?.newPassword ?? '';
  if (next.length < 12) {
    throw fieldError({ newPassword: ['The length of \'New Password\' must be at least 12 characters.'] });
  }
  const u = self(ctx);
  u.updatedAtUtc = new Date().toISOString();
  writeAudit(ctx.store, {
    eventType: 'Authentication.PasswordChanged',
    actorUserId: u.id,
    targetUserId: u.id,
    entityType: 'ApplicationUser',
    entityId: u.id,
  });
  revokeSessionsFor(ctx.store, u.id, 'Password changed', true);
  return { authentication: authentication(ctx) };
});

route('POST', '/api/me/email-change', (ctx): EmailChangeRequestResponse => {
  const body = ctx.body as RequestOwnEmailChange;
  if (!body?.currentPassword) throw fieldError({ currentPassword: ["'Current Password' must not be empty."] });
  requireText(body?.newEmail, 'newEmail', 'New Email', 254);
  const u = self(ctx);
  writeAudit(ctx.store, {
    eventType: 'Authentication.EmailChangeRequested',
    actorUserId: u.id,
    targetUserId: u.id,
    entityType: 'ApplicationUser',
    entityId: u.id,
  });
  return { deliverySucceeded: true };
});

route('POST', '/api/me/email-change/confirm', (ctx): ProfileSecurityChangeResponse => {
  const u = self(ctx);
  writeAudit(ctx.store, {
    eventType: 'Authentication.EmailChanged',
    actorUserId: u.id,
    targetUserId: u.id,
    entityType: 'ApplicationUser',
    entityId: u.id,
  });
  revokeSessionsFor(ctx.store, u.id, 'Login email changed', true);
  return { authentication: authentication(ctx) };
});
