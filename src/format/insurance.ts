import {
  AtFaultParty, InsuranceCaseDriverSituation, InsuranceCaseParty, InsuranceCaseStatus, InsuranceCaseType,
  InsurerSide,
  type Instant, type InsuranceCaseDriverSuggestionResponse, type InsuranceCaseEventResponse,
  type InsuranceCaseInsurerResponse, type InsuranceCaseRentalResponse,
} from '@/api/dto';
import { formatLocal, toDateOnlyLocal } from './datetime';

/**
 * The words of Insurance cases (Follow-up 17), from the approved prototype's copy deck (handover f).
 * The server decides everything about a case: who it waits for and since when, when it was closed,
 * its rental, who drove as the rental says. What is here only puts its answers into words.
 */

export const CASE_TYPE_LABEL: Record<InsuranceCaseType, string> = {
  [InsuranceCaseType.Usual]: 'Usual',
  [InsuranceCaseType.Casco]: 'Casco',
};

export const CASE_STATUS_LABEL: Record<InsuranceCaseStatus, string> = {
  [InsuranceCaseStatus.Happened]: 'Happened',
  [InsuranceCaseStatus.Reported]: 'Reported',
  [InsuranceCaseStatus.UnderReview]: 'Under review',
  [InsuranceCaseStatus.Repair]: 'Repair',
  [InsuranceCaseStatus.Closed]: 'Closed',
};

export const CASE_PARTY_LABEL: Record<InsuranceCaseParty, string> = {
  [InsuranceCaseParty.Us]: 'Us',
  [InsuranceCaseParty.Driver]: 'The driver',
  [InsuranceCaseParty.Insurer]: 'The insurer',
  [InsuranceCaseParty.SomeoneElse]: 'Someone else',
  [InsuranceCaseParty.Nobody]: 'Nobody',
};

export const AT_FAULT_LABEL: Record<AtFaultParty, string> = {
  [AtFaultParty.OurDriver]: 'Our driver',
  [AtFaultParty.OtherParty]: 'The other party',
  [AtFaultParty.Both]: 'Both',
  [AtFaultParty.NotFound]: 'Not found',
};

/** Every status, every party and every decision in the order the dialogs and filters offer them. */
export const CASE_STATUSES: readonly InsuranceCaseStatus[] = [1, 2, 3, 4, 5];
export const OPEN_STATUSES: readonly InsuranceCaseStatus[] = [1, 2, 3, 4];
export const CASE_PARTIES: readonly InsuranceCaseParty[] = [1, 2, 3, 4, 5];
export const AT_FAULT_PARTIES: readonly AtFaultParty[] = [1, 2, 3, 4];

export const NOT_DECIDED = 'Not decided yet';
export const NOT_REPORTED = 'Not reported';
export const NO_EVENTS = 'No events yet';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * How long, rounded down: under an hour in minutes (at least one), under a day in hours, otherwise
 * in whole days (handover d).
 */
export function durationText(ms: number): string {
  const m = Math.max(0, ms);
  if (m < HOUR) return plural(Math.max(1, Math.floor(m / MINUTE)), 'minute', 'minutes');
  if (m < DAY) return plural(Math.floor(m / HOUR), 'hour', 'hours');
  return plural(Math.floor(m / DAY), 'day', 'days');
}

const since = (iso: Instant, now: Date) => now.getTime() - new Date(iso).getTime();

/** "Us · 2 days", "The insurer · 6 days", "Nobody": who the case waits for, and for how long. */
export function waitText(item: { waitingFor: InsuranceCaseParty; waitingSinceUtc: Instant }, now: Date = new Date()): string {
  const party = CASE_PARTY_LABEL[item.waitingFor];
  return item.waitingFor === InsuranceCaseParty.Nobody ? party : `${party} · ${durationText(since(item.waitingSinceUtc, now))}`;
}

/** "since 05 Sep, 14:40 · 6 days", with no duration while the case waits for nobody. */
export function sinceText(item: { waitingFor: InsuranceCaseParty; waitingSinceUtc: Instant }, now: Date = new Date()): string {
  const at = `since ${formatLocal(item.waitingSinceUtc)}`;
  return item.waitingFor === InsuranceCaseParty.Nobody ? at : `${at} · ${durationText(since(item.waitingSinceUtc, now))}`;
}

/** "Waiting for us · 2 days", the Overview card's right-hand text. */
export const waitingForUsText = (waitingSinceUtc: Instant, now: Date = new Date()) =>
  `Waiting for us · ${durationText(since(waitingSinceUtc, now))}`;

/** Whole days between two Tallinn calendar dates. */
function calendarDays(from: Instant, now: Date): number {
  const a = Date.parse(`${toDateOnlyLocal(from)}T00:00:00Z`);
  const b = Date.parse(`${toDateOnlyLocal(now.toISOString())}T00:00:00Z`);
  return Math.round((b - a) / DAY);
}

/** "Today", "Yesterday", "3 days ago", or "05 Sep" from thirty days on: when a list's last event was. */
export function daysAgoText(iso: Instant, now: Date = new Date()): string {
  const n = calendarDays(iso, now);
  if (n <= 0) return 'Today';
  if (n === 1) return 'Yesterday';
  if (n < 30) return `${n} days ago`;
  return formatLocal(iso, 'dateShort');
}

/** "2 days later", "At the same time": the time between two timeline entries. */
export function laterText(previous: Instant, current: Instant): string {
  const ms = Date.parse(current) - Date.parse(previous);
  return ms < MINUTE ? 'At the same time' : `${durationText(ms)} later`;
}

/** "552 KLM · Rear bumper and boot lid dented": a case as every surface names it. */
export const caseTitle = (c: { vehiclePlate: string; damage: string }) => `${c.vehiclePlate} · ${c.damage}`;

/** "Found" when the time is when the damage was found, "Happened" otherwise. */
export const whenLabel = (c: { timeIsWhenFound: boolean }) => (c.timeIsWhenFound ? 'Found' : 'Happened');

/** "Usual · Happened 05 Sep", the line under a case in the list and on its card. */
export const caseSub = (c: { type: InsuranceCaseType; timeIsWhenFound: boolean; happenedAtUtc: Instant }) =>
  `${CASE_TYPE_LABEL[c.type]} · ${whenLabel(c)} ${formatLocal(c.happenedAtUtc, 'dateShort')}`;

/**
 * The place, marked when only one of the time and the place is the finding's: "(where it was found)"
 * when only the place is, "(where it happened)" when only the time is.
 */
export function placeText(c: { place: string; timeIsWhenFound: boolean; placeIsWhereFound: boolean }): string {
  if (c.placeIsWhereFound && !c.timeIsWhenFound) return `${c.place} (where it was found)`;
  if (!c.placeIsWhereFound && c.timeIsWhenFound) return `${c.place} (where it happened)`;
  return c.place;
}

/** A case's two insurers, each one of the list by its name (round 13), and the side that handles it. */
interface Insurers {
  ourInsurer?: InsuranceCaseInsurerResponse | null;
  ourClaimNumber?: string | null;
  otherInsurer?: InsuranceCaseInsurerResponse | null;
  otherClaimNumber?: string | null;
  handledBy?: InsurerSide | null;
}

/**
 * Who handles a case: the chosen side's insurer with its claim number; "Not decided yet" when an
 * insurer is known and none is chosen; "Not reported" when none is known. `dim` for the last two.
 */
export function handledInfo(c: Insurers): { text: string; sub: string; dim: boolean } {
  if (c.handledBy === InsurerSide.Ours && c.ourInsurer) return { text: c.ourInsurer.name, sub: c.ourClaimNumber ?? '', dim: false };
  if (c.handledBy === InsurerSide.Theirs && c.otherInsurer) return { text: c.otherInsurer.name, sub: c.otherClaimNumber ?? '', dim: false };
  if (c.ourInsurer || c.otherInsurer) return { text: NOT_DECIDED, sub: '', dim: true };
  return { text: NOT_REPORTED, sub: '', dim: true };
}

/** "Meridian Insurance · MI-2026-004411": Handled by folded into one line (the tablet's list). */
export function handledLine(c: Insurers): string {
  const h = handledInfo(c);
  return h.sub ? `${h.text} · ${h.sub}` : h.text;
}

/** The Insurance panel's Handled by: "{insurer} (ours)", "{insurer} (the other party’s)", or the rest. */
export function handledLong(c: Insurers): string {
  if (c.handledBy === InsurerSide.Ours && c.ourInsurer) return `${c.ourInsurer.name} (ours)`;
  if (c.handledBy === InsurerSide.Theirs && c.otherInsurer) return `${c.otherInsurer.name} (the other party’s)`;
  return handledInfo(c).text;
}

export const atFaultText = (atFault: AtFaultParty | null | undefined) => (atFault ? AT_FAULT_LABEL[atFault] : NOT_DECIDED);

/** "Closed 12 Sep". */
export const closedText = (closedAtUtc: Instant | null | undefined) => `Closed ${formatLocal(closedAtUtc, 'dateShort')}`;

/** "7 cases", "1 case". */
export const caseCount = (n: number) => plural(n, 'case', 'cases');

/** "Rental from 28 Aug", with " to 11 Sep" once it has ended. */
export function rentalSub(rental: Pick<InsuranceCaseRentalResponse, 'startedAtUtc' | 'closedAtUtc'>): string {
  const from = `Rental from ${formatLocal(rental.startedAtUtc, 'dateShort')}`;
  return rental.closedAtUtc ? `${from} to ${formatLocal(rental.closedAtUtc, 'dateShort')}` : from;
}

/** What an event changed, as its chips: "Status: Reported", "Waiting for: The insurer". */
export function changeChips(event: Pick<InsuranceCaseEventResponse, 'statusChangedTo' | 'waitingForChangedTo'>): string[] {
  const chips: string[] = [];
  if (event.statusChangedTo) chips.push(`Status: ${CASE_STATUS_LABEL[event.statusChangedTo]}`);
  if (event.waitingForChangedTo) chips.push(`Waiting for: ${CASE_PARTY_LABEL[event.waitingForChangedTo]}`);
  return chips;
}

/** Edit event's read-only line: what the event changed, or that it changed nothing. */
export function changedText(event: Pick<InsuranceCaseEventResponse, 'statusChangedTo' | 'waitingForChangedTo'>): string {
  const chips = changeChips(event);
  return chips.length ? chips.join(' · ') : 'Nothing: the status and who the case waited for stayed as they were.';
}

/** "4 photos, by the entry they belong to.", or nothing without photos. */
export const photosDescription = (n: number) => (n ? `${plural(n, 'photo', 'photos')}, by the entry they belong to.` : undefined);

/** "2.8 MB", "412 KB": a photo's size. */
export function sizeText(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${Math.max(1, Math.round((bytes || 0) / 1024))} KB`;
}

/** "Janis Krumins and Kristine Vitola", "A, B and C". */
function namesText(names: readonly string[]): string {
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0] ?? '';
}

/**
 * The hint under Driver, naming the rental the server found for the car at that moment (handover f).
 * `plate` is the chosen car's, for a car that was not rented then; null asks for the car and time.
 */
export function driverHint(suggestion: InsuranceCaseDriverSuggestionResponse | null | undefined, plate: string | null): string {
  if (!suggestion || !plate) return 'Choose the car and the time, and the driver is filled in from its rental.';
  const rental = suggestion.rental;
  const car = rental?.vehiclePlate ?? plate;
  const who = rental?.customerDisplayName ?? '';
  switch (suggestion.situation) {
    case InsuranceCaseDriverSituation.NotRented:
      return `${car} was not rented at that time, so there is no driver to fill in.`;
    case InsuranceCaseDriverSituation.BusinessCustomerDrivers:
      return `${car} was on the rental for ${who}, driven by the customer’s own drivers, so no driver is filled in.`;
    case InsuranceCaseDriverSituation.NoDriverNamed:
      return `No driver was named on the rental of ${car} for ${who} at that time.`;
    case InsuranceCaseDriverSituation.SeveralDrivers: {
      const names = suggestion.drivers.map((d) => d.displayName);
      return `${namesText(names)} were ${names.length === 2 ? 'both' : 'all'} authorised on the rental of ${car} for ${who} then. Choose who drove.`;
    }
    case InsuranceCaseDriverSituation.OneDriver:
      return `From the rental of ${car} for ${who}`;
  }
}
