import { newUuid } from '../ids';
import { route } from '../transport';

/**
 * The authentication family is Phase 3 work; only the sign-out the rail offers is registered here,
 * so the button does what it says in mock mode: the persona's current session ends.
 */
route('POST', '/api/auth/logout', (ctx) => {
  const sessionId = ctx.store.currentSessionByUserId[ctx.me.id];
  const current = ctx.store.sessions.find((s) => s.id === sessionId);
  if (current && !current.revokedAtUtc) {
    current.revokedAtUtc = new Date().toISOString();
    current.revocationReason = 'Signed out';
  }
  delete ctx.store.currentSessionByUserId[ctx.me.id];
  return { id: newUuid() };
});
