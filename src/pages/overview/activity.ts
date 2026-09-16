import type { SecurityAuditResponse } from '@/api/dto';

/**
 * The Overview's "Recent security activity" card (owner decision, 2026-09-16). A database that has
 * been signed in and out of a few times has nothing but session events in its newest rows, where
 * the reviewed card showed a mix, so the card reads a larger page and drops the two routine
 * authentication events. Nothing else is filtered, and the audit page itself still shows
 * everything.
 */
export const ROUTINE_EVENT_TYPES = ['Authentication.SessionCreated', 'Authentication.Logout'] as const;

/** How many rows the card shows once the routine events are out. */
export const ACTIVITY_ROWS = 5;

const routine = new Set<string>(ROUTINE_EVENT_TYPES);

export const isRoutineEvent = (eventType: string): boolean => routine.has(eventType);

/**
 * The rows the card renders: the newest entries that are not routine, at most five. Fewer than
 * five is what it shows when the page holds fewer — it never pads and never asks for more.
 */
export function activityRows<T extends Pick<SecurityAuditResponse, 'eventType'>>(
  entries: readonly T[],
  limit: number = ACTIVITY_ROWS,
): T[] {
  return entries.filter((entry) => !isRoutineEvent(entry.eventType)).slice(0, limit);
}
