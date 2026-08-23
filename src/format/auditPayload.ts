import { ROLE_LABEL } from './labels';
import { formatUtc } from './datetime';
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

/** "RegistrationExpiresAtUtc" → "Registration Expires At (UTC)". */
export const auditFieldLabel = (key: string): string =>
  key
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/^./, (c) => c.toUpperCase())
    .replace(' Utc', ' (UTC)');

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
        const expiry = typeof g.ExpiresAtUtc === 'string' ? `expires ${formatUtc(g.ExpiresAtUtc)}` : 'no expiry';
        return `${role} — ${expiry}`;
      })
      .join('\n');
  }
  if (typeof v === 'string' && ISO.test(v)) return formatUtc(v);
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
