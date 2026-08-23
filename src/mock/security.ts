import type { SessionResponse, Uuid } from '@/api/dto';
import type { MockStore } from './store';

/**
 * A session row as the store holds it: everything the API returns EXCEPT isActive and isCurrent.
 * Both are computed per request — the backend derives them, so storing either would let a stored
 * flag and the deadlines disagree.
 */
export type SessionRecord = Omit<SessionResponse, 'isActive' | 'isCurrent'>;

/** Not revoked, and both deadlines still ahead. Exactly the backend's rule. */
export const isSessionActive = (s: SessionRecord, now: number = Date.now()): boolean =>
  !s.revokedAtUtc &&
  new Date(s.idleExpiresAtUtc).getTime() > now &&
  new Date(s.absoluteExpiresAtUtc).getTime() > now;

/** The session that authenticated the request, for the given signed-in user. */
export const currentSessionIdFor = (store: MockStore, userId: Uuid): Uuid | null =>
  store.currentSessionByUserId[userId] ?? null;

/**
 * The response projection. `isCurrent` is self-view-only: an administrator listing another user's
 * sessions never receives it as true, because the concept does not exist for them.
 */
export const sessionView = (
  store: MockStore,
  s: SessionRecord,
  selfView: boolean,
): SessionResponse => ({
  ...s,
  isActive: isSessionActive(s),
  isCurrent: selfView && s.id === currentSessionIdFor(store, s.applicationUserId),
});

/**
 * A security-state change ends the target's sessions. The reason is recorded ON the session row —
 * these revocations never write their own audit entry.
 */
export function revokeSessionsFor(
  store: MockStore,
  userId: Uuid,
  reason: string,
  keepCurrent = false,
): number {
  const now = new Date().toISOString();
  const currentId = currentSessionIdFor(store, userId);
  let count = 0;
  for (const s of store.sessions) {
    if (s.applicationUserId !== userId || !isSessionActive(s)) continue;
    if (keepCurrent && s.id === currentId) continue;
    s.revokedAtUtc = now;
    s.revocationReason = reason;
    count += 1;
  }
  const user = store.users.find((u) => u.id === userId);
  if (user) user.securityVersion += 1;
  return count;
}
