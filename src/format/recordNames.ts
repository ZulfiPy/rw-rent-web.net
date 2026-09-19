import type { Instant } from '@/api/dto';
import { SYSTEM_ACTOR } from './auditNames';

/**
 * Who created a record and who last changed it (F7-6).
 *
 * The owner, checking the app on real data, found that daily work left no visible trace of who did
 * it: the database stores the people, the API handed the app only the instants. Since the
 * backend's round 6 every record response names both people itself (`createdByDisplayName`,
 * `updatedByDisplayName`, AUDIT-010), whether or not the reader may open their user record, so the
 * record pages read the names from the record.
 *
 * A record always has a creator, so a creator without a name is the technical actor, the one actor
 * with no human behind it: "System", exactly as on the audit pages (F7-4). A record that was never
 * changed has no last changer and says so; one changed last by the technical actor is "System".
 */
export const NOT_CHANGED = 'Not changed since it was created';

export interface NamedRecord {
  createdByDisplayName?: string | null;
  updatedAtUtc?: Instant | null;
  updatedByDisplayName?: string | null;
}

/** The record's creator: their name, or "System" for the technical actor. */
export const createdByName = (record: Pick<NamedRecord, 'createdByDisplayName'>): string =>
  record.createdByDisplayName ?? SYSTEM_ACTOR;

/** The record's last changer: their name, "System" for the technical actor, or never changed. */
export const lastChangedByName = (record: NamedRecord): string =>
  record.updatedAtUtc ? record.updatedByDisplayName ?? SYSTEM_ACTOR : NOT_CHANGED;

/** The secondary line an authorization or interruption row carries: who recorded it. */
export const recordedBy = (record: Pick<NamedRecord, 'createdByDisplayName'>): string =>
  `Recorded by ${createdByName(record)}`;
