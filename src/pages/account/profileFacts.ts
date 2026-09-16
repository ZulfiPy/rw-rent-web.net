import { EMPTY, formatLocal } from '@/format';
import type { CurrentUserResponse } from '@/api/dto';

/**
 * The two facts of the Sign-in & security tab that the backend's round 2 made real. Kept as
 * functions so what they say is testable without rendering the tab.
 */

/** The prototype's "Pending change": the address that is waiting, or "None". */
export const pendingEmailFact = (pendingEmail: string | null | undefined): string =>
  pendingEmail ? `${pendingEmail} — awaiting confirmation` : 'None';

/**
 * The prototype's "Last changed". `GET /api/me` always reports the instant — it falls back to the
 * account's registration instant while the first password stands — but a `me` that has not
 * answered yet has nothing, and the panel shows the app's dash for that.
 */
export const passwordChangedFact = (me: CurrentUserResponse | undefined | null): string =>
  me?.passwordChangedAtUtc ? formatLocal(me.passwordChangedAtUtc) : EMPTY;
