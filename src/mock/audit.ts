import type { SecurityAuditResponse, Uuid } from '@/api/dto';
import type { MockStore } from './store';
import { newUuid } from './ids';

/**
 * The audit writer, following the backend's rules:
 *
 *  - payload keys are PascalCase exactly as the backend types them; the writer never renames a key
 *    and never converts a value's case;
 *  - enum values are PascalCase strings, supplied by the caller (dto.enumName);
 *  - when both before and after exist, only CHANGED keys survive, and both sides carry the same
 *    key set; a one-sided payload passes through untouched;
 *  - timestamps serialize with an explicit +00:00 offset;
 *  - reason is recorded only where the dialog collects one;
 *  - session revocations caused by a security-state change write no row at all — the caller sets a
 *    revocation reason on the session instead.
 */

export type Payload = Record<string, unknown>;

const RAW_TS = /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/;

/** "2026-08-23T11:57:51.621Z" → "2026-08-23T11:57:51.621+00:00". */
export const rawTs = (v: unknown): unknown =>
  typeof v === 'string' && RAW_TS.test(v) ? `${v.slice(0, -1)}+00:00` : v;

export const payloadJson = (o: Payload | null | undefined): string | null =>
  o ? JSON.stringify(o, (_k, v) => rawTs(v)) : null;

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Changed keys only, identical key sets on both sides. Returns null when nothing changed. */
export function auditDelta(
  before: Payload,
  after: Payload,
): { before: Payload; after: Payload } | null {
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
    (k) => !same(before[k], after[k]),
  );
  if (keys.length === 0) return null;
  const pick = (src: Payload) => {
    const out: Payload = {};
    for (const k of keys) out[k] = k in src ? src[k] : null;
    return out;
  };
  return { before: pick(before), after: pick(after) };
}

export interface AuditInput {
  eventType: string;
  actorUserId: Uuid;
  companyId?: Uuid | null;
  targetUserId?: Uuid | null;
  entityType?: string | null;
  entityId?: Uuid | null;
  /** Only where the dialog collected one. */
  reason?: string | null;
  before?: Payload | null;
  after?: Payload | null;
  occurredAtUtc?: string;
}

export function writeAudit(store: MockStore, input: AuditInput): SecurityAuditResponse | null {
  let before = input.before ?? null;
  let after = input.after ?? null;

  if (before && after) {
    const delta = auditDelta(before, after);
    if (!delta) return null;
    before = delta.before;
    after = delta.after;
  }

  const row: SecurityAuditResponse = {
    id: newUuid(),
    eventType: input.eventType,
    actorUserId: input.actorUserId,
    occurredAtUtc: input.occurredAtUtc ?? new Date().toISOString(),
    companyId: input.companyId ?? store.company?.id ?? null,
    targetUserId: input.targetUserId ?? null,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    reason: input.reason ?? null,
    beforeJson: payloadJson(before),
    afterJson: payloadJson(after),
  };
  store.audit.unshift(row);
  return row;
}
