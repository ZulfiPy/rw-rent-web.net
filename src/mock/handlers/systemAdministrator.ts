import type {
  CancelSystemAdministratorTransferRequest, InitiateSystemAdministratorTransferRequest,
  SystemAdministratorTransferResponse,
} from '@/api/dto';
import { ApplicationUserRole, ApplicationUserStatus } from '@/api/dto';
import { writeAudit } from '../audit';
import { newUuid } from '../ids';
import { conflict, fieldError, requireReason } from '../validate';
import { notFound, route, type Ctx } from '../transport';

/**
 * The protected transfer of the single System Administrator account. Nothing here is ordinary
 * Company administration: the operation is password-confirmed, completes only when the named
 * account accepts with a single-use link, and every step is audited.
 */

const H = 3_600_000;
const nowIso = () => new Date().toISOString();
const isOpen = (t: SystemAdministratorTransferResponse) => !t.cancelledAtUtc && !t.acceptedAtUtc;
const openOne = (ctx: Ctx) => ctx.store.transfers.find(isOpen);

/** The mock has no password store; the backend's check is mirrored as "must not be empty". */
const requirePassword = (value: unknown) => {
  if (typeof value !== 'string' || !value) {
    throw fieldError({ currentPassword: ["'Current Password' must not be empty."] });
  }
};

const transferOr404 = (ctx: Ctx) => {
  const found = ctx.store.transfers.find((t) => t.id === ctx.params.transferId);
  if (!found) throw notFound('Transfer not found.');
  return found;
};

/**
 * FOLLOW-UP: mock-only. Swagger exposes initiate, resend, cancel and accept but no read, and the
 * reviewed screen lists every transfer with its state. Served here in stored order (the prototype's
 * `db.transfers`); the wiring phase points `listTransfers()` at the real read when it exists.
 */
route('GET', '/api/system-administrator/transfers', (ctx) =>
  ({ items: ctx.store.transfers }), ['SystemAdministration.Transfer']);

route('POST', '/api/system-administrator/transfers', (ctx) => {
  const body = ctx.body as InitiateSystemAdministratorTransferRequest;
  requirePassword(body?.currentPassword);
  const reason = requireReason(body?.reason);

  if (openOne(ctx)) {
    throw conflict(
      'A transfer is already pending. Cancel it before initiating another.',
      'system_administrator.transfer_pending',
    );
  }

  const email = (body?.targetEmail ?? '').trim().toLowerCase();
  const target = ctx.store.users.find((u) => u.email.toLowerCase() === email);
  const eligible = !!target
    && target.id !== ctx.me.id
    && target.emailConfirmed
    && target.status === ApplicationUserStatus.Active
    && !target.effectiveRoles.includes(ApplicationUserRole.SystemAdministrator);
  if (!eligible) throw fieldError({ targetEmail: ['That account cannot receive the transfer.'] });

  const created: SystemAdministratorTransferResponse = {
    id: newUuid(),
    currentAdministratorUserId: ctx.me.id,
    targetUserId: target!.id,
    initiatedAtUtc: nowIso(),
    // The confirmation link is short-lived; 24h is the mock's window.
    expiresAtUtc: new Date(Date.now() + 24 * H).toISOString(),
    cancelledAtUtc: null,
    acceptedAtUtc: null,
    isRecovery: false,
  };
  ctx.store.transfers.unshift(created);
  writeAudit(ctx.store, {
    eventType: 'SystemAdministrator.TransferInitiated',
    actorUserId: ctx.me.id,
    entityType: 'SystemAdministratorTransfer',
    entityId: created.id,
    targetUserId: created.targetUserId,
    reason,
    after: { TargetUserId: created.targetUserId, ExpiresAtUtc: created.expiresAtUtc },
  });
  return created;
}, ['SystemAdministration.Transfer']);

route('POST', '/api/system-administrator/transfers/{transferId}/resend', (ctx) => {
  const t = transferOr404(ctx);
  requirePassword((ctx.body as { currentPassword?: string })?.currentPassword);
  if (!isOpen(t)) {
    throw conflict(
      'The transfer was accepted moments ago and can no longer be resent.',
      'system_administrator.transfer_not_open',
    );
  }
  const before = { ExpiresAtUtc: t.expiresAtUtc };
  t.expiresAtUtc = new Date(Date.now() + 24 * H).toISOString();
  writeAudit(ctx.store, {
    eventType: 'SystemAdministrator.TransferConfirmationRotated',
    actorUserId: ctx.me.id,
    entityType: 'SystemAdministratorTransfer',
    entityId: t.id,
    targetUserId: t.targetUserId,
    before,
    after: { ExpiresAtUtc: t.expiresAtUtc },
  });
  return t;
}, ['SystemAdministration.Transfer']);

route('POST', '/api/system-administrator/transfers/{transferId}/cancel', (ctx) => {
  const t = transferOr404(ctx);
  const reason = requireReason((ctx.body as CancelSystemAdministratorTransferRequest)?.reason);
  if (!isOpen(t)) {
    throw conflict(
      'The transfer was accepted moments ago and can no longer be cancelled.',
      'system_administrator.transfer_not_open',
    );
  }
  t.cancelledAtUtc = nowIso();
  writeAudit(ctx.store, {
    eventType: 'SystemAdministrator.TransferCancelled',
    actorUserId: ctx.me.id,
    entityType: 'SystemAdministratorTransfer',
    entityId: t.id,
    targetUserId: t.targetUserId,
    reason,
    after: { CancelledAtUtc: t.cancelledAtUtc },
  });
  return t;
}, ['SystemAdministration.Transfer']);
