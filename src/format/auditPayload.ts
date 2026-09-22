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

/* the copy a deletion leaves (the backend's rounds 7 and 8) ------------------------------- */

/**
 * The six event types a deletion on the Delete records page writes. `Company.Deleted` is not one of
 * them: it keeps its own identity snapshot and renders as before.
 */
export const RECORD_DELETION_EVENTS: readonly string[] = [
  'RentalAssignment.Deleted', 'DriverAuthorization.Deleted', 'Interruption.Deleted',
  'Vehicle.Deleted', 'Customer.Deleted', 'Driver.Deleted',
];

/**
 * An authorization that went with a deleted driver (round 8), written against the rental it
 * belonged to. Its copy is flat and names the driver in `DeletedWithRecordLabel`.
 */
export const REMOVED_WITH_DRIVER_EVENT = 'DriverAuthorization.RemovedWithDriver';

export interface DeletedFact { key: string; label: string; value: string; mono: boolean }

/** One rental that went with a deleted vehicle or customer, with its own parts. */
export interface DeletedRental {
  recordLabel: string | null;
  facts: DeletedFact[];
  authorizations: DeletedFact[][];
  interruptions: DeletedFact[][];
}

/** A customer record whose link to a deleted driver was cleared; the customer stays. */
export interface ClearedLink { customerId: string; displayName: string }

/** What an audit entry of a deletion shows instead of "Recorded values". */
export interface DeletedRecord {
  /** The record's identifying text as the page showed it; null when the copy does not carry one. */
  recordLabel: string | null;
  /** For an authorization that went with a deleted driver: that driver's label; null otherwise. */
  removedWith: string | null;
  /** The record's own members; the label, the reason and the note are shown elsewhere. */
  facts: DeletedFact[];
  /** A rental's parts, or a driver's authorizations, that went with it: one group of facts each. */
  authorizations: DeletedFact[][];
  interruptions: DeletedFact[][];
  /** The rentals that went with a deleted vehicle or customer, each with its own parts. */
  rentals: DeletedRental[];
  /** The customer records whose link to a deleted driver was cleared. */
  clearedLinks: ClearedLink[];
}

/** Shown by the entry's own Record and Removed-with facts and its Reason panel, never among the facts. */
const SHOWN_ELSEWHERE = new Set(['RecordLabel', 'DeletionReason', 'DeletionNote', 'DeletedWithRecordLabel']);

/** The arrays a deletion's copy may carry (round 8); anything else falls back. */
const PART_LISTS = ['Authorizations', 'Interruptions'];
const COPY_LISTS = [...PART_LISTS, 'RentalAssignments', 'ClearedCustomerLinks'];

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

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const labelOf = (o: Record<string, unknown>) => (typeof o['RecordLabel'] === 'string' ? o['RecordLabel'] : null);

/**
 * The rentals that went with a vehicle or a customer: flat copies, each opening with its own label
 * and carrying its own two part lists; null when it is anything else.
 */
function rentalsOf(value: unknown): DeletedRental[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  const rentals: DeletedRental[] = [];
  for (const rental of value) {
    if (!isObject(rental)) return null;
    if (Object.keys(rental).some((key) => Array.isArray(rental[key]) && !PART_LISTS.includes(key))) return null;
    const facts = factsOf(rental, SHOWN_ELSEWHERE);
    const authorizations = partsOf(rental['Authorizations']);
    const interruptions = partsOf(rental['Interruptions']);
    if (!facts || !authorizations || !interruptions) return null;
    rentals.push({ recordLabel: labelOf(rental), facts, authorizations, interruptions });
  }
  return rentals;
}

/** The customer links a driver's deletion cleared, or null when the list is anything else. */
function linksOf(value: unknown): ClearedLink[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  const links: ClearedLink[] = [];
  for (const link of value) {
    if (!isObject(link) || typeof link['CustomerId'] !== 'string' || typeof link['CustomerDisplayName'] !== 'string') return null;
    links.push({ customerId: link['CustomerId'], displayName: link['CustomerDisplayName'] });
  }
  return links;
}

/**
 * The copy of a deleted record, read from the entry's before-payload: the six `*.Deleted` events
 * (a rental's parts, round 8's rentals of a vehicle or a customer, a driver's authorizations and
 * cleared customer links), and round 8's flat copy of an authorization that went with its driver.
 * Anything this does not recognise — another event, an empty or unparseable payload, a member that
 * is neither a scalar nor one of the known lists in its known shape — answers null, and the entry
 * falls back to the ordinary payload views exactly as before.
 */
export function deletedRecord(eventType: string | null | undefined, beforeJson: string | null | undefined): DeletedRecord | null {
  const removedWithDriver = eventType === REMOVED_WITH_DRIVER_EVENT;
  if (!eventType || !(removedWithDriver || RECORD_DELETION_EVENTS.includes(eventType))) return null;
  const body = parse(beforeJson);
  if (!body || Object.keys(body).length === 0) return null;

  const lists = removedWithDriver ? [] : COPY_LISTS;
  if (Object.keys(body).some((key) => Array.isArray(body[key]) && !lists.includes(key))) return null;

  const facts = factsOf(body, SHOWN_ELSEWHERE);
  const authorizations = partsOf(body['Authorizations']);
  const interruptions = partsOf(body['Interruptions']);
  const rentals = rentalsOf(body['RentalAssignments']);
  const clearedLinks = linksOf(body['ClearedCustomerLinks']);
  if (!facts || !authorizations || !interruptions || !rentals || !clearedLinks) return null;

  const removedWith = typeof body['DeletedWithRecordLabel'] === 'string' ? body['DeletedWithRecordLabel'] : null;
  if (removedWithDriver && !removedWith) return null;

  return {
    recordLabel: labelOf(body),
    removedWith: removedWithDriver ? removedWith : null,
    facts,
    authorizations,
    interruptions,
    rentals,
    clearedLinks,
  };
}
