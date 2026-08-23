/**
 * The only place instants become text.
 *
 * Operational surfaces render Europe/Tallinn local time in the humanized style. Security audit and
 * Sessions surfaces render UTC "yyyy-MM-dd HH:mm" and declare it once in the panel subtitle, never
 * per cell. Date-only expiry pickers resolve to the END of the chosen day in Europe/Tallinn: the
 * chosen date is the last valid day.
 */
export const TIME_ZONE = 'Europe/Tallinn';

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

/** "2026-08-23 11:57" — the audit and sessions format. The subtitle declares the zone. */
export function formatUtc(iso: string | null | undefined): string {
  if (!iso) return EMPTY;
  return parse(iso).toISOString().slice(0, 16).replace('T', ' ');
}

/** "2026-08-23 11:57 UTC" — for the one-off case with no declaring subtitle. */
export const formatUtcLabelled = (iso: string | null | undefined) =>
  iso ? `${formatUtc(iso)} UTC` : EMPTY;

/** "+03:00" for the given instant in Europe/Tallinn. */
export function zoneOffset(at: Date): string {
  const name = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, timeZoneName: 'longOffset' })
    .formatToParts(at)
    .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+00:00';
  const offset = name.replace('GMT', '');
  return offset === '' ? '+00:00' : offset;
}

/** yyyy-MM-dd → the instant at 23:59:59.999 local on that day, with its offset. */
export function endOfDayLocal(dateOnly: string): string {
  const offset = zoneOffset(new Date(`${dateOnly}T12:00:00Z`));
  return `${dateOnly}T23:59:59.999${offset}`;
}

/** The local calendar date of an instant — seeds a date input from a stored expiry. */
export function toDateOnlyLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const f = zoned(parse(iso));
  return `${f.year}-${pad(f.month)}-${pad(f.day)}`;
}

/** The backend's "must be in the future" check, applied to the resolved instant. */
export const isFuture = (iso: string, now: Date = new Date()) => parse(iso).getTime() > now.getTime();

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
