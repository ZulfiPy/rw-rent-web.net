/**
 * The only place instants become text.
 *
 * Every surface a person reads renders Europe/Tallinn local time: operational surfaces in the
 * humanized style, and the audit, session and transfer surfaces in the compact "yyyy-MM-dd HH:mm"
 * stamp their columns were laid out for (`formatLocalStamp`). Where a page used to say "UTC" it now
 * names the zone once, in `LOCAL_TIME_NOTE`, never per cell. The API keeps speaking UTC: nothing
 * this module hands it changes. Date-only expiry pickers resolve to the END of the chosen day in
 * Europe/Tallinn: the chosen date is the last valid day.
 *
 * Until Follow-up 7 the audit and session surfaces rendered UTC, inherited from the prototype, and
 * the owner's first check on real data read every audit entry three hours earlier than the clock on
 * the wall (F7-1). The UTC helpers below are no longer used by any surface.
 */
export const TIME_ZONE = 'Europe/Tallinn';

/** The one note that names the zone, where a page used to say "All times UTC". */
export const LOCAL_TIME_NOTE = 'Times in Tallinn time.';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const EMPTY = '—';

const H = 3_600_000;
const D = 24 * H;

type Fields = { year: number; month: number; day: number; hour: number; minute: number };

const zoned = (d: Date): Fields => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d);
  const at = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? '0');
  return { year: at('year'), month: at('month'), day: at('day'), hour: at('hour'), minute: at('minute') };
};

const pad = (n: number) => String(n).padStart(2, '0');
const parse = (iso: string) => new Date(iso);

export type LocalMode = 'datetime' | 'date' | 'dateShort';

/** "23 Aug, 14:05" · "23 Aug 2025" · "23 Aug" — year appended only when it is not the current one. */
export function formatLocal(iso: string | null | undefined, mode: LocalMode = 'datetime'): string {
  if (!iso) return EMPTY;
  const f = zoned(parse(iso));
  const thisYear = zoned(new Date()).year;
  const day = `${pad(f.day)} ${MONTHS[f.month - 1]}`;
  if (mode === 'date') return `${day} ${f.year}`;
  const year = f.year === thisYear ? '' : ` ${f.year}`;
  if (mode === 'dateShort') return day + year;
  return `${day}${year}, ${pad(f.hour)}:${pad(f.minute)}`;
}

/**
 * "2026-08-23 14:57" — the audit, sessions and transfers stamp, in Europe/Tallinn. The same shape
 * `formatUtc` gave those columns, so they keep their widths; the page's note names the zone.
 */
export function formatLocalStamp(iso: string | null | undefined): string {
  if (!iso) return EMPTY;
  const f = zoned(parse(iso));
  return `${f.year}-${pad(f.month)}-${pad(f.day)} ${pad(f.hour)}:${pad(f.minute)}`;
}

/** "2026-08-23 11:57" — the stamp in UTC. No surface renders it since F7-1. */
export function formatUtc(iso: string | null | undefined): string {
  if (!iso) return EMPTY;
  return parse(iso).toISOString().slice(0, 16).replace('T', ' ');
}

/** "2026-08-23 11:57 UTC" — for the one-off case with no declaring subtitle. */
export const formatUtcLabelled = (iso: string | null | undefined) =>
  iso ? `${formatUtc(iso)} UTC` : EMPTY;

/**
 * "24 Aug, 05:22" — the humanized UTC shape the prototype uses where a card's subtitle has already
 * declared the zone. The year appears only when it is not the current one.
 */
export function formatUtcHuman(iso: string | null | undefined): string {
  if (!iso) return EMPTY;
  const d = parse(iso);
  const year = d.getUTCFullYear();
  const stamp = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  const suffix = year === new Date().getUTCFullYear() ? '' : ` ${year}`;
  return `${stamp}${suffix}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** "+03:00" for the given instant in Europe/Tallinn. */
export function zoneOffset(at: Date): string {
  const name = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, timeZoneName: 'longOffset' })
    .formatToParts(at)
    .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+00:00';
  const offset = name.replace('GMT', '');
  return offset === '' ? '+00:00' : offset;
}

/**
 * yyyy-MM-dd → the instant at 00:00:00.000 local on that day, in UTC; a filter's lower bound.
 *
 * In UTC for the same reason as `fromLocalInput`: Npgsql accepts a `DateTimeOffset` only at offset
 * zero, and that holds for a query parameter exactly as it holds for a stored value. The instant is
 * resolved through the zone's offset for that day and then rendered with a `Z`.
 */
export function startOfDayLocal(dateOnly: string): string {
  const offset = zoneOffset(new Date(`${dateOnly}T12:00:00Z`));
  return new Date(`${dateOnly}T00:00:00.000${offset}`).toISOString();
}

/**
 * yyyy-MM-dd → the instant at 23:59:59.999 local on that day, in UTC. The chosen date is the last
 * valid day of an expiry, so the bound is its final millisecond; `toDateOnlyLocal` gives the same
 * day back from it.
 */
export function endOfDayLocal(dateOnly: string): string {
  const offset = zoneOffset(new Date(`${dateOnly}T12:00:00Z`));
  return new Date(`${dateOnly}T23:59:59.999${offset}`).toISOString();
}

/** The local calendar date of an instant — seeds a date input from a stored expiry. */
export function toDateOnlyLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const f = zoned(parse(iso));
  return `${f.year}-${pad(f.month)}-${pad(f.day)}`;
}

/** The backend's "must be in the future" check, applied to the resolved instant. */
export const isFuture = (iso: string, now: Date = new Date()) => parse(iso).getTime() > now.getTime();

/** yyyy-MM-ddTHH:mm in Europe/Tallinn — seeds a datetime-local input from a stored instant. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const f = zoned(parse(iso));
  return `${f.year}-${pad(f.month)}-${pad(f.day)}T${pad(f.hour)}:${pad(f.minute)}`;
}

/**
 * The instant a datetime-local value names in Europe/Tallinn, in UTC.
 *
 * It used to be written with the zone's own offset (`…T08:01:00.000+03:00`), which names the same
 * instant but is not what the API can store: every one of these values lands in a
 * `timestamp with time zone` column, and Npgsql writes a `DateTimeOffset` only at offset zero. The
 * lifecycle dialogs — activate, end, cancel, authorize, stop, the interruptions and the
 * corrections — therefore failed with a 500 (found in the joint check of 2026-09-16). The instant
 * is resolved exactly as before, through the zone's offset for that day, and then rendered in UTC,
 * which is also what every `…AtUtc` field promises.
 *
 * `startOfDayLocal` and `endOfDayLocal` report UTC too. They were left carrying the offset at
 * first, on the assumption that a bound the API only compares would be tolerated; it is not —
 * Npgsql refuses a non-zero offset as a query parameter just as it refuses one on a stored value
 * (found in the review of 2026-09-16). Every instant this module hands the API is UTC.
 */
export function fromLocalInput(value: string): string {
  if (!value) return '';
  const offset = zoneOffset(new Date(`${value.slice(0, 10)}T12:00:00Z`));
  return new Date(`${value}:00.000${offset}`).toISOString();
}

/** A datetime-local control, or a date-only expiry control whose date is its last valid day. */
export type InstantControl = 'datetime' | 'date';

/**
 * What to send for a control that was prefilled from a stored instant: the stored instant itself,
 * byte for byte, while the control still shows what it was prefilled with; the control's value,
 * converted as `fromLocalInput` (or `endOfDayLocal` for a date) always did, once the person has
 * changed it; `null` when they emptied it.
 *
 * The tester's T-009. A datetime-local control shows minutes and the stored instants carry seconds —
 * the seeded ones microseconds. Every dialog that prefilled an instant turned it into minutes and
 * back, so saving a correction without touching a single date sent four changed instants. The
 * timeline correction of a seeded assignment then answered `409 corrections.timeline_invalid`,
 * because the rounded history no longer lined up with its authorizations and interruptions, and no
 * field was marked because the person had not changed any. An instant the person did not touch is
 * not theirs to change.
 */
export function fromPrefilledInput(
  value: string,
  stored: string | null | undefined,
  control: InstantControl = 'datetime',
): string | null {
  if (!value) return null;
  const shown = control === 'date' ? toDateOnlyLocal : toLocalInput;
  if (stored && value === shown(stored)) return stored;
  return control === 'date' ? endOfDayLocal(value) : fromLocalInput(value);
}

export function relative(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return EMPTY;
  const ms = now.getTime() - parse(iso).getTime();
  const a = Math.abs(ms);
  const lead = ms < 0 ? 'in ' : '';
  const tail = ms < 0 ? '' : ' ago';
  if (a < 60_000) return 'just now';
  if (a < H) return `${lead}${Math.round(a / 60_000)} min${tail}`;
  if (a < D) return `${lead}${Math.round(a / H)} h${tail}`;
  if (a < 30 * D) return `${lead}${Math.round(a / D)} d${tail}`;
  return formatLocal(iso, 'dateShort');
}
