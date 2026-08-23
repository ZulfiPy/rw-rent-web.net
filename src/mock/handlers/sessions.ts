import type { SessionResponse, SessionRevocationResponse, SessionsQuery } from '@/api/dto';
import { writeAudit } from '../audit';
import { byDesc, page } from '../paging';
import { notFound, route, type Ctx } from '../transport';
import { conflict } from '../validate';

const ended = (s: SessionResponse) =>
  !s.isActive || !!s.revokedAtUtc || new Date(s.idleExpiresAtUtc).getTime() <= Date.now();

/** isCurrent is self-view-only: an administrator viewing another user never sees the concept. */
const forOther = (s: SessionResponse): SessionResponse => ({ ...s, isCurrent: false });

const rowsFor = (ctx: Ctx, userId: string, hideCurrent: boolean) => {
  const q = ctx.query as SessionsQuery;
  const includeEnded = String(q.IncludeEnded ?? 'false') === 'true';
  const rows = ctx.store.sessions
    .filter((s) => s.applicationUserId === userId)
    .filter((s) => includeEnded || !ended(s))
    .map((s) => (hideCurrent ? forOther(s) : s))
    .sort(byDesc((s) => s.lastSeenAtUtc));
  return page(rows, q);
};

route('GET', '/api/me/sessions', (ctx) => rowsFor(ctx, ctx.me.id, false));

route('GET', '/api/users/{userId}/sessions', (ctx) => rowsFor(ctx, ctx.params.userId as string, true),
  ['Users.ReadDirectory', 'Sessions.ManageOrdinaryCompanyUsers']);

const revokeOne = (ctx: Ctx, userId: string, audited: boolean) => {
  const s = ctx.store.sessions.find((x) => x.id === ctx.params.sessionId && x.applicationUserId === userId);
  if (!s) throw notFound('That session was not found.');
  if (ended(s)) throw conflict('That session has already ended.', 'sessions.already_ended');
  s.isActive = false;
  s.revokedAtUtc = new Date().toISOString();
  s.revocationReason = audited ? 'Revoked by an administrator' : 'Signed out from another session';
  if (audited) {
    writeAudit(ctx.store, {
      eventType: 'Session.RevokedByAdministrator',
      actorUserId: ctx.me.id,
      targetUserId: userId,
      entityType: 'Session',
      entityId: s.id,
    });
  }
};

route('DELETE', '/api/me/sessions/{sessionId}', (ctx) => {
  revokeOne(ctx, ctx.me.id, false);
});

route('DELETE', '/api/users/{userId}/sessions/{sessionId}', (ctx) => {
  revokeOne(ctx, ctx.params.userId as string, true);
}, ['Users.ReadDirectory', 'Sessions.ManageOrdinaryCompanyUsers']);

route('POST', '/api/me/sessions/revoke-others', (ctx): SessionRevocationResponse => {
  const now = new Date().toISOString();
  let revokedCount = 0;
  for (const s of ctx.store.sessions) {
    if (s.applicationUserId !== ctx.me.id || !s.isActive || s.isCurrent) continue;
    s.isActive = false;
    s.revokedAtUtc = now;
    s.revocationReason = 'Signed out from another session';
    revokedCount += 1;
  }
  return { currentSessionRevoked: false, revokedCount };
});

route('POST', '/api/users/{userId}/sessions/revoke-all', (ctx): SessionRevocationResponse => {
  const userId = ctx.params.userId as string;
  const now = new Date().toISOString();
  let revokedCount = 0;
  let currentSessionRevoked = false;
  for (const s of ctx.store.sessions) {
    if (s.applicationUserId !== userId || !s.isActive) continue;
    if (s.isCurrent) currentSessionRevoked = true;
    s.isActive = false;
    s.revokedAtUtc = now;
    s.revocationReason = 'Revoked by an administrator';
    revokedCount += 1;
  }
  if (revokedCount === 0) {
    throw conflict('That user has no active sessions.', 'sessions.none_active');
  }
  writeAudit(ctx.store, {
    eventType: 'Session.AllRevokedByAdministrator',
    actorUserId: ctx.me.id,
    targetUserId: userId,
    entityType: 'ApplicationUser',
    entityId: userId,
    after: { RevokedCount: revokedCount },
  });
  return { currentSessionRevoked, revokedCount };
}, ['Users.ReadDirectory', 'Sessions.ManageOrdinaryCompanyUsers']);
