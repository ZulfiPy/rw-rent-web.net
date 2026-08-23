import type { MockStore } from './store';

/**
 * A security-state change ends the target's sessions. The reason is recorded ON the session row —
 * these revocations never write their own audit entry.
 */
export function revokeSessionsFor(
  store: MockStore,
  userId: string,
  reason: string,
  keepCurrent = false,
): number {
  const now = new Date().toISOString();
  let count = 0;
  for (const s of store.sessions) {
    if (s.applicationUserId !== userId || !s.isActive) continue;
    if (keepCurrent && s.isCurrent) continue;
    s.isActive = false;
    s.revokedAtUtc = now;
    s.revocationReason = reason;
    count += 1;
  }
  const user = store.users.find((u) => u.id === userId);
  if (user) user.securityVersion += 1;
  return count;
}
