import { ROLE_LABEL } from './labels';
import { formatLocalStamp } from './datetime';
import { ApplicationUserRole } from '@/api/dto';

/**
 * Audit payloads are flat `{ FieldName: scalar|null }` objects carrying changed fields only, with
 * identical keys on both sides; a create has an empty (or null) before. Registration.Activated is
 * the one exception: its `Roles` value is an array of `{ Role, ExpiresAtUtc }` grants.
 *
 * Anything else returns null and the page falls back to showing the raw payload — the parser never
 * guesses at a shape it does not recognise.
 */
export interface DiffRow { label: string; value: string; unchanged: boolean }

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

const parse = (json: string | null | undefined): Record<string, unknown> | null => {
  try {
    const value: unknown = json ? JSON.parse(json) : {};
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

const isScalar = (v: unknown) =>
  v === null || ['string', 'number', 'boolean'].includes(typeof v);

interface Grant { Role: unknown; ExpiresAtUtc?: unknown }

const isGrants = (v: unknown): v is Grant[] =>
  Array.isArray(v) && v.length > 0 &&
  v.every((x) => !!x && typeof x === 'object' && !Array.isArray(x) && 'Role' in (x as object));

const isFlat = (o: Record<string, unknown>) =>
  Object.values(o).every((v) => isScalar(v) || isGrants(v));

/**
 * The payload keys whose API name is not what a reader should see. `RevokedCount` is the number of
 * sessions a person ended at once from their profile (`Session.OthersRevoked`, F7-8).
 */
const FIELD_LABEL: Record<string, string> = {
  RevokedCount: 'Sessions ended',
};

/**
 * "RegistrationExpiresAtUtc" → "Registration Expires At". The payload keeps the API's names; the
 * value is shown in Tallinn time like every other instant (F7-1), so the label no longer claims UTC.
 */
export const auditFieldLabel = (key: string): string =>
  FIELD_LABEL[key] ?? key
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/ Utc$/, '');

const ROLE_NAME: Record<string, string> = {
  SystemAdministrator: ROLE_LABEL[ApplicationUserRole.SystemAdministrator],
  CompanyPrincipal: ROLE_LABEL[ApplicationUserRole.CompanyPrincipal],
  FleetManager: ROLE_LABEL[ApplicationUserRole.FleetManager],
  Viewer: ROLE_LABEL[ApplicationUserRole.Viewer],
};

const show = (v: unknown): string => {
  if (v === undefined || v === null) return '—';
  if (isGrants(v)) {
    return v
      .map((g) => {
        const role = typeof g.Role === 'string' ? ROLE_NAME[g.Role] ?? g.Role : String(g.Role);
        const expiry = typeof g.ExpiresAtUtc === 'string' ? `expires ${formatLocalStamp(g.ExpiresAtUtc)}` : 'no expiry';
        return `${role} — ${expiry}`;
      })
      .join('\n');
  }
  if (typeof v === 'string' && ISO.test(v)) return formatLocalStamp(v);
  return String(v);
};

export function diffRows(
  beforeJson: string | null | undefined,
  afterJson: string | null | undefined,
): DiffRow[] | null {
  const before = parse(beforeJson);
  const after = parse(afterJson);
  if (before === null || after === null) return null;
  if (!isFlat(before) || !isFlat(after)) return null;

  const isCreate = Object.keys(before).length === 0 && Object.keys(after).length > 0;
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];

  return keys.map((key) => {
    const b = show(before[key]);
    const a = show(after[key]);
    return {
      label: auditFieldLabel(key),
      value: isCreate ? a : `${b}  →  ${a}`,
      unchanged: !isCreate && b === a,
    };
  });
}

/* the copy a deletion leaves (the backend's round 7) --------------------------------------- */

/**
 * The six event types a deletion on the Delete records page writes. `Company.Deleted` is not one of
 * them: it keeps its own identity snapshot and renders as before.
 */
export const RECORD_DELETION_EVENTS: readonly string[] = [
  'RentalAssignment.Deleted', 'DriverAuthorization.Deleted', 'Interruption.Deleted',
  'Vehicle.Deleted', 'Customer.Deleted', 'Driver.Deleted',
];

export interface DeletedFact { key: string; label: string; value: string; mono: boolean }

/** What an audit entry of a deletion shows instead of "Recorded values". */
export interface DeletedRecord {
  /** The record's identifying text as the page showed it; null when the copy does not carry one. */
  recordLabel: string | null;
  /** The record's own members; the label, the reason and the note are shown elsewhere. */
  facts: DeletedFact[];
  /** A rental's parts that went with it, one group of facts per part. */
  authorizations: DeletedFact[][];
  interruptions: DeletedFact[][];
}

/** Shown by the entry's own Record fact and Reason panel, so never repeated among the facts. */
const SHOWN_ELSEWHERE = new Set(['RecordLabel', 'DeletionReason', 'DeletionNote']);

/** Who created and who last changed the record, in the order a reader looks for them. */
const WHO_AND_WHEN = ['CreatedAtUtc', 'CreatedByDisplayName', 'UpdatedAtUtc', 'UpdatedByDisplayName'];

const isIdentifier = (key: string) => key === 'Id' || key.endsWith('Id') || key === 'ConcurrencyToken';

/**
 * The database hands the copy back with its keys in its own storage order, which reads as noise.
 * So the facts come in a fixed order instead: the record's own members by name, then who created
 * and who last changed it, then the identifiers, which no reader looks for first.
 */
const rank = (key: string) => (WHO_AND_WHEN.includes(key) ? 1 : isIdentifier(key) ? 2 : 0);

const byReading = (a: string, b: string) =>
  rank(a) - rank(b)
  || (rank(a) === 1 ? WHO_AND_WHEN.indexOf(a) - WHO_AND_WHEN.indexOf(b) : a.localeCompare(b));

/** One flat object's scalar members as facts, or null when a member is not a scalar. */
function factsOf(o: Record<string, unknown>, skip: ReadonlySet<string> = new Set()): DeletedFact[] | null {
  const keys = Object.keys(o).filter((key) => !skip.has(key) && !Array.isArray(o[key]));
  if (keys.some((key) => !isScalar(o[key]))) return null;
  return keys.sort(byReading).map((key) => ({
    key,
    label: auditFieldLabel(key),
    value: show(o[key]),
    mono: isIdentifier(key) || (typeof o[key] === 'string' && ISO.test(o[key] as string)),
  }));
}

/** A rental's parts: an array of flat objects, or null when it is anything else. */
function partsOf(value: unknown): DeletedFact[][] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  const groups: DeletedFact[][] = [];
  for (const part of value) {
    if (!part || typeof part !== 'object' || Array.isArray(part)) return null;
    const facts = factsOf(part as Record<string, unknown>);
    if (!facts) return null;
    groups.push(facts);
  }
  return groups;
}

/**
 * The copy of a deleted record, read from the entry's before-payload. Anything this does not
 * recognise — another event, an empty or unparseable payload, a member that is neither a scalar nor
 * one of a rental's two part lists — answers null, and the entry falls back to the ordinary payload
 * views exactly as before.
 */
export function deletedRecord(eventType: string | null | undefined, beforeJson: string | null | undefined): DeletedRecord | null {
  if (!eventType || !RECORD_DELETION_EVENTS.includes(eventType)) return null;
  const body = parse(beforeJson);
  if (!body || Object.keys(body).length === 0) return null;

  const arrays = Object.keys(body).filter((key) => Array.isArray(body[key]));
  if (arrays.some((key) => key !== 'Authorizations' && key !== 'Interruptions')) return null;

  const facts = factsOf(body, SHOWN_ELSEWHERE);
  const authorizations = partsOf(body['Authorizations']);
  const interruptions = partsOf(body['Interruptions']);
  if (!facts || !authorizations || !interruptions) return null;

  return {
    recordLabel: typeof body['RecordLabel'] === 'string' ? body['RecordLabel'] : null,
    facts,
    authorizations,
    interruptions,
  };
}
