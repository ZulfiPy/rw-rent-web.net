import {
  AssignmentStatus, RecordDeletionBlockReason, RecordKind, type DeletableKind,
  type CustomerDeletionCandidateResponse, type DriverAuthorizationDeletionCandidateResponse,
  type DriverDeletionCandidateResponse, type InsuranceCaseDeletionCandidateResponse,
  type InterruptionDeletionCandidateResponse,
  type RecordDeletionBlockResponse, type RecordDeletionReason, type RecordDeletionResponse,
  type RecordDeletionTakes, type RentalAssignmentDeletionCandidateResponse,
  type VehicleDeletionCandidateResponse,
} from '@/api/dto';
import { formatLocal } from './datetime';
import { CASE_STATUS_LABEL, CASE_TYPE_LABEL, closedText } from './insurance';
import {
  CUSTOMER_TYPE_LABEL, DELETION_REASON_LABEL, INTERRUPTION_REASON_LABEL, RECORD_KIND_LABEL,
} from './labels';

/**
 * The words of the Delete records page (Follow-up 8, Follow-up 9 for the backend's round 8,
 * Follow-up 17 for its round 12: a vehicle's insurance cases and a driver's, and Follow-up 19 for its
 * round 14: an insurance case deleted on its own, and the accident links a deletion clears),
 * from the handover's copy deck and the ledger's §9. The server decides whether a record is Ready
 * or Blocked, why, and what a deletion would take along; everything here only puts its answer into
 * sentences. Nothing here judges a record.
 */

/** "driver authorization" — the kind inside a sentence. */
export const kindNoun = (kind: RecordKind) => RECORD_KIND_LABEL[kind].toLowerCase();

/** "driver authorizations": every kind's plural is its noun and an s. */
export const kindNouns = (kind: RecordKind) => `${kindNoun(kind)}s`;

/** What a collective Business-customer authorization is called where a driver's name stands. */
export const COLLECTIVE_DRIVERS = 'Business customer drivers';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * A record of each kind that is not out of use, in the words of the API's Show filter (round 7):
 * out of use is a cancelled or ended rental, a stopped authorization, an ended interruption, an
 * inactive vehicle, customer or driver, and since round 14 a closed insurance case.
 */
const IN_USE: Record<DeletableKind, [one: string, many: string]> = {
  [RecordKind.RentalAssignment]: ['planned or active rental assignment', 'planned or active rental assignments'],
  [RecordKind.DriverAuthorization]: ['open driver authorization', 'open driver authorizations'],
  [RecordKind.Interruption]: ['open interruption', 'open interruptions'],
  [RecordKind.Vehicle]: ['active vehicle', 'active vehicles'],
  [RecordKind.Customer]: ['active customer', 'active customers'],
  [RecordKind.Driver]: ['active driver', 'active drivers'],
  [RecordKind.InsuranceCase]: ['open insurance case', 'open insurance cases'],
};

/**
 * The empty list under "Out of use" (Follow-up 11, F11-3): how many records of the kind Everything
 * holds, from the server's counts, or undefined while they are not known. With nothing out of use,
 * each of them is one in use. Null when Everything holds none either, so the page offers no switch.
 */
export function outOfUseEmpty(kind: DeletableKind, everything: number | undefined): string | null {
  if (everything === 0) return null;
  if (everything === undefined) return 'Everything lists the records still in use.';
  const [one, many] = IN_USE[kind];
  return `${plural(everything, one, many)} ${everything === 1 ? 'is' : 'are'} under Everything.`;
}

/** "a vehicle", "a customer": the row's own kind inside a block sentence. */
const referredNoun = (kind: RecordKind) => (kind === RecordKind.Customer ? 'customer' : 'vehicle');

/**
 * One block, worded for the row it blocks (§9, 2). The count comes from the server; the records in
 * the way, linked beside the sentence, are running rentals or, since round 12, a vehicle's open
 * insurance cases, in the API's own words for that reason. An open case itself (round 14) names no
 * record: the row is the case, and it opens it.
 */
function blockClause(kind: RecordKind, block: RecordDeletionBlockResponse): string {
  switch (block.reason) {
    case RecordDeletionBlockReason.OnlyOpenAuthorizationOfActiveRental:
      return 'an active rental must keep at least one authorization';
    case RecordDeletionBlockReason.RentalIsRunning:
      return 'this rental is running. End it first; then it can be deleted';
    case RecordDeletionBlockReason.HasRunningRental:
      return block.count === 1
        ? `a running rental refers to this ${referredNoun(kind)}. End it first`
        : `${block.count} running rentals refer to this ${referredNoun(kind)}. End them first`;
    case RecordDeletionBlockReason.DriverHoldsOnlyOpenAuthorizationOfRunningRental:
      return block.count === 1
        ? 'this driver holds the only open authorization of a running rental'
        : `this driver holds the only open authorization of ${block.count} running rentals`;
    case RecordDeletionBlockReason.HasOpenInsuranceCase:
      return block.count === 1
        ? 'one of its insurance cases is open. Close it first; then the vehicle can be deleted with its cases'
        : `${block.count} of its insurance cases are open. Close them first; then the vehicle can be deleted with its cases`;
    case RecordDeletionBlockReason.InsuranceCaseIsOpen:
      return 'this insurance case is open. Close it first; then it can be deleted';
    default:
      return '';
  }
}

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * The sentence under a Blocked chip and on its disabled Delete: every block of the row, each with
 * a capital letter, with no full stop at the end. Round 8 gives a record one block at most; should
 * one ever carry two, they read as two sentences.
 */
export function blockSentence(kind: RecordKind, blocks: readonly RecordDeletionBlockResponse[]): string {
  return blocks.map((block) => blockClause(kind, block)).filter(Boolean).map(capital).join('. ');
}

/** "2 events, 1 note and 2 photos": the words joined, the last one with "and". */
const listed = (bits: readonly string[]) => (bits.length > 1 ? `${bits.slice(0, -1).join(', ')} and ${bits.at(-1)}` : bits[0] ?? '');

/** What goes with an insurance case deleted on its own (round 14), each only when not zero. */
type CaseParts = Pick<RecordDeletionTakes, 'insuranceCaseEvents' | 'insuranceCaseNotes' | 'insuranceCasePhotos'>;

function casePartsList(takes: CaseParts): string[] {
  const bits: string[] = [];
  if (takes.insuranceCaseEvents) bits.push(plural(takes.insuranceCaseEvents, 'event', 'events'));
  if (takes.insuranceCaseNotes) bits.push(plural(takes.insuranceCaseNotes, 'note', 'notes'));
  if (takes.insuranceCasePhotos) bits.push(plural(takes.insuranceCasePhotos, 'photo', 'photos'));
  return bits;
}

/**
 * "2 rental assignments, 3 driver authorizations, 1 interruption and 2 insurance cases", or a case's
 * "2 events, 1 note and 2 photos" — only the counts that are not zero. An API before round 12 sends
 * no insurance cases, and one before round 14 no events, notes or photos; they count as none.
 */
function recordsList(takes: Pick<RecordDeletionTakes, 'rentalAssignments' | 'driverAuthorizations' | 'interruptions' | 'insuranceCases'> & CaseParts): string {
  const bits: string[] = [];
  if (takes.rentalAssignments) bits.push(plural(takes.rentalAssignments, 'rental assignment', 'rental assignments'));
  if (takes.driverAuthorizations) bits.push(plural(takes.driverAuthorizations, 'driver authorization', 'driver authorizations'));
  if (takes.interruptions) bits.push(plural(takes.interruptions, 'interruption', 'interruptions'));
  if (takes.insuranceCases) bits.push(insuranceCases(takes.insuranceCases));
  return listed([...bits, ...casePartsList(takes)]);
}

const customerRecords = (n: number) => plural(n, 'customer record', 'customer records');
const insuranceCases = (n: number) => plural(n, 'insurance case', 'insurance cases');

/**
 * What a deletion takes along, from the server's `takes` (§9, 2): the records that go, then the
 * links it clears, each only when not zero, or that nothing else goes. Like the block sentence, no
 * full stop at the end. A case's accident links (round 14) are cleared by a case's deletion and by
 * a car's: the cases naming it, or naming one of the car's cases from another car.
 */
export function takesSentence(takes: RecordDeletionTakes): string {
  const lines: string[] = [];
  const records = recordsList(takes);
  if (records) lines.push(`Takes ${records} with it`);
  if (takes.customerLinksCleared) lines.push(`Clears the driver link of ${customerRecords(takes.customerLinksCleared)}`);
  if (takes.insuranceCaseDriversCleared) lines.push(`Clears the driver of ${insuranceCases(takes.insuranceCaseDriversCleared)}`);
  if (takes.accidentLinksCleared) lines.push(`Clears the accident link of ${insuranceCases(takes.accidentLinksCleared)}`);
  return lines.length ? lines.join('. ') : 'Nothing else goes with it';
}

const day = (iso: string | null | undefined) => formatLocal(iso, 'dateShort');

/** "12 Aug → 11 Sep", or "12 Aug → open" while there is no end. */
export const deletionPeriod = (from: string | null | undefined, to: string | null | undefined) =>
  `${day(from)} → ${to ? day(to) : 'open'}`;

/** "2 authorizations · 1 interruption", or empty for a rental with neither. */
export function partsText(authorizations: number, interruptions: number): string {
  const bits: string[] = [];
  if (authorizations) bits.push(plural(authorizations, 'authorization', 'authorizations'));
  if (interruptions) bits.push(plural(interruptions, 'interruption', 'interruptions'));
  return bits.join(' · ');
}

const state = (active: boolean) => (active ? 'Active' : 'Inactive');

/** A rental's period: the actual dates where there are some, the planned ones otherwise. */
export const rentalPeriod = (r: RentalAssignmentDeletionCandidateResponse) =>
  deletionPeriod(r.startedAtUtc ?? r.plannedStartAtUtc, r.closedAtUtc ?? r.plannedEndAtUtc);

export const authorizationDriver = (a: DriverAuthorizationDeletionCandidateResponse) =>
  a.driverDisplayName ?? COLLECTIVE_DRIVERS;

/** One candidate row together with its kind: what the dialog is opened for. */
export type DeletionTarget =
  | { kind: typeof RecordKind.RentalAssignment; value: RentalAssignmentDeletionCandidateResponse }
  | { kind: typeof RecordKind.DriverAuthorization; value: DriverAuthorizationDeletionCandidateResponse }
  | { kind: typeof RecordKind.Interruption; value: InterruptionDeletionCandidateResponse }
  | { kind: typeof RecordKind.Vehicle; value: VehicleDeletionCandidateResponse }
  | { kind: typeof RecordKind.Customer; value: CustomerDeletionCandidateResponse }
  | { kind: typeof RecordKind.Driver; value: DriverDeletionCandidateResponse }
  | { kind: typeof RecordKind.InsuranceCase; value: InsuranceCaseDeletionCandidateResponse };

/** The dialog's description line: the record, as a person recognises it, and where it stands. */
export function candidateDescription(row: DeletionTarget): string {
  switch (row.kind) {
    case RecordKind.RentalAssignment: {
      const r = row.value;
      const where = r.status === AssignmentStatus.Ended ? `Ended ${day(r.closedAtUtc)}`
        : r.status === AssignmentStatus.Cancelled ? `Cancelled ${day(r.closedAtUtc)}`
          : r.status === AssignmentStatus.Active ? `Active since ${day(r.startedAtUtc)}`
            : `Planned from ${day(r.plannedStartAtUtc)}`;
      return `${r.recordLabel} · ${where}`;
    }
    case RecordKind.DriverAuthorization: {
      const a = row.value;
      const where = a.stoppedAtUtc ? `Stopped ${day(a.stoppedAtUtc)}` : `Open since ${day(a.authorizedFromUtc)}`;
      return `${authorizationDriver(a)} · ${a.rentalAssignmentLabel} · ${where}`;
    }
    case RecordKind.Interruption: {
      const i = row.value;
      return `${INTERRUPTION_REASON_LABEL[i.reason]} · ${i.rentalAssignmentLabel} · ${deletionPeriod(i.startedAtUtc, i.endedAtUtc)}`;
    }
    case RecordKind.Vehicle: {
      const v = row.value;
      return `${v.plateNumber} · ${v.make} ${v.model} ${v.year} · ${state(v.isActive)}`;
    }
    case RecordKind.Customer: {
      const c = row.value;
      return `${c.displayName} · ${CUSTOMER_TYPE_LABEL[c.type]} · ${state(c.isActive)}`;
    }
    case RecordKind.Driver: {
      const d = row.value;
      return `${d.firstName} ${d.lastName} · ${d.driverLicenseNumber} · ${state(d.isActive)}`;
    }
    case RecordKind.InsuranceCase: {
      // "Closed 12 Sep" once closed; an open case never reaches the dialog, but reads by its status.
      const c = row.value;
      return `${c.recordLabel} · ${CASE_TYPE_LABEL[c.type]} · ${c.closedAtUtc ? closedText(c.closedAtUtc) : CASE_STATUS_LABEL[c.status]}`;
    }
  }
}

/** The line every kind's dialog ends its consequences with. */
export const AUDIT_CONSEQUENCE =
  'One entry stays in the security audit: you, the time, your reason and a copy of the deleted record.';

/** A rental's own parts: "Its 2 driver authorizations and 1 interruption are removed with it." */
function partsLine(takes: RecordDeletionTakes): string | null {
  const a = takes.driverAuthorizations;
  const i = takes.interruptions;
  if (a + i === 0) return null;
  const bits: string[] = [];
  if (a) bits.push(plural(a, 'driver authorization', 'driver authorizations'));
  if (i) bits.push(plural(i, 'interruption', 'interruptions'));
  return `Its ${bits.join(' and ')} ${a + i === 1 ? 'is' : 'are'} removed with it.`;
}

/**
 * The rentals a vehicle or a customer takes: "Its 2 rental assignments, with 3 driver
 * authorizations and 1 interruption, are removed with it."
 */
function rentalsLine(takes: RecordDeletionTakes): string {
  const rentals = plural(takes.rentalAssignments, 'rental assignment', 'rental assignments');
  const parts = recordsList({ rentalAssignments: 0, driverAuthorizations: takes.driverAuthorizations, interruptions: takes.interruptions, insuranceCases: 0 });
  return `Its ${rentals}${parts ? `, with ${parts},` : ''} ${takes.rentalAssignments === 1 ? 'is' : 'are'} removed with it.`;
}

const NOTHING_ELSE = 'Nothing else goes with it.';

/** A vehicle's insurance cases (round 12): "Its 2 insurance cases, with their events, notes and photos, are removed with it." */
function casesLine(n: number): string {
  return n === 1
    ? 'Its 1 insurance case, with its events, notes and photos, is removed with it.'
    : `Its ${n} insurance cases, with their events, notes and photos, are removed with it.`;
}

/** The cases of other cars that named one of a deleted vehicle's cases as the same accident (round 14). */
function otherCarsLinksLine(n: number): string {
  return n === 1
    ? 'The accident link of 1 insurance case of another car is cleared; that case stays.'
    : `The accident links of ${n} insurance cases of other cars are cleared; those cases stay.`;
}

/** A case's own events, notes and photos (round 14): "Its 2 events, 1 note and 2 photos are removed with it." */
function casePartsLine(takes: CaseParts): string | null {
  const bits = casePartsList(takes);
  if (!bits.length) return null;
  const n = (takes.insuranceCaseEvents ?? 0) + (takes.insuranceCaseNotes ?? 0) + (takes.insuranceCasePhotos ?? 0);
  return `Its ${listed(bits)} ${n === 1 ? 'is' : 'are'} removed with it.`;
}

/** The cases that named a deleted case as the same accident (round 14): they lose that link and stay. */
function namingCasesLine(n: number): string {
  return n === 1
    ? 'The 1 insurance case that names it as the same accident loses that link and stays.'
    : `The ${n} insurance cases that name it as the same accident lose that link and stay.`;
}

/**
 * What a deletion does, in the dialog's consequence box (§9, 4), built from the row's `takes` with
 * exact counts. Every kind ends with the audit line.
 */
export function deletionConsequences(kind: DeletableKind, takes: RecordDeletionTakes): string[] {
  const noun = kindNoun(kind);
  switch (kind) {
    case RecordKind.RentalAssignment: {
      const parts = partsLine(takes);
      return [
        'The rental assignment is removed permanently.',
        ...(parts ? [parts] : []),
        'The customer, the vehicle and the drivers stay as they are.',
        AUDIT_CONSEQUENCE,
      ];
    }
    case RecordKind.DriverAuthorization:
      return [
        'The driver authorization is removed permanently.',
        'The rental assignment, the driver and every other authorization on it stay as they are.',
        AUDIT_CONSEQUENCE,
      ];
    case RecordKind.Interruption:
      return [
        'The interruption is removed permanently.',
        'The rental assignment, its authorizations and its other interruptions stay as they are.',
        AUDIT_CONSEQUENCE,
      ];
    case RecordKind.Vehicle:
    case RecordKind.Customer: {
      // The record being deleted is one side of every rental it takes; only the other sides stay.
      const others = kind === RecordKind.Vehicle ? 'customers and drivers' : 'vehicles and drivers';
      // A vehicle's insurance cases go with it (round 12); a customer has none. Since round 14 the
      // cases of other cars that name one of them lose that link.
      const cases = kind === RecordKind.Vehicle ? takes.insuranceCases ?? 0 : 0;
      const links = kind === RecordKind.Vehicle ? takes.accidentLinksCleared ?? 0 : 0;
      return [
        `The ${noun} is removed permanently.`,
        ...(takes.rentalAssignments
          ? [rentalsLine(takes), `The ${others} of ${takes.rentalAssignments === 1 ? 'that rental' : 'those rentals'} stay as they are.`]
          : []),
        ...(cases ? [casesLine(cases)] : []),
        ...(links ? [otherCarsLinksLine(links)] : []),
        ...(takes.rentalAssignments || cases || links ? [] : [NOTHING_ELSE]),
        AUDIT_CONSEQUENCE,
      ];
    }
    case RecordKind.Driver: {
      const a = takes.driverAuthorizations;
      const links = takes.customerLinksCleared;
      const lines = ['The driver is removed permanently.'];
      if (a) {
        lines.push(a === 1
          ? 'Their 1 driver authorization is removed from the rental it was on; that rental stays.'
          : `Their ${a} driver authorizations are removed from the rentals they were on; those rentals stay.`);
      }
      if (links) {
        lines.push(links === 1
          ? 'The link of 1 customer record to this driver is cleared; the customer stays.'
          : `The links of ${links} customer records to this driver are cleared; the customers stay.`);
      }
      // Round 12: the driver is cleared from their insurance cases, which stay.
      const cases = takes.insuranceCaseDriversCleared ?? 0;
      if (cases) {
        lines.push(cases === 1
          ? 'The driver is cleared from 1 insurance case; the case stays.'
          : `The driver is cleared from ${cases} insurance cases; the cases stay.`);
      }
      if (!a && !links && !cases) lines.push(NOTHING_ELSE);
      return [...lines, AUDIT_CONSEQUENCE];
    }
    case RecordKind.InsuranceCase: {
      // Round 14: a closed case goes with its events, notes and photos; the cases naming it stay.
      const parts = casePartsLine(takes);
      const links = takes.accidentLinksCleared ?? 0;
      return [
        'The insurance case is removed permanently.',
        parts ?? NOTHING_ELSE,
        'Its car, driver, insurers and every other case stay as they are.',
        ...(links ? [namingCasesLine(links)] : []),
        AUDIT_CONSEQUENCE,
      ];
    }
  }
}

/**
 * The hint under "I understand this cannot be undone" (§9, 4): the record and what goes with it,
 * with the numbers. A cleared link is not a record, so it is not among them.
 */
export function cannotBeRestored(kind: RecordKind, takes: RecordDeletionTakes): string {
  const records = recordsList(takes);
  return records
    ? `This ${kindNoun(kind)} and the ${records} cannot be restored from the app.`
    : `This ${kindNoun(kind)} cannot be restored from the app.`;
}

/**
 * What went with a deleted record, from the deletion's answer (§9, 5), for the confirmation line:
 * "2 rental assignments, 3 driver authorizations and 1 interruption went with it." and the cleared
 * links; null when nothing went.
 */
export function wentWith(done: RecordDeletionResponse): string | null {
  const lines: string[] = [];
  const records = recordsList({
    rentalAssignments: done.deletedRentalAssignmentCount,
    driverAuthorizations: done.deletedAuthorizationCount,
    interruptions: done.deletedInterruptionCount,
    insuranceCases: done.deletedInsuranceCaseCount ?? 0,
    insuranceCaseEvents: done.deletedInsuranceCaseEventCount ?? 0,
    insuranceCaseNotes: done.deletedInsuranceCaseNoteCount ?? 0,
    insuranceCasePhotos: done.deletedInsuranceCasePhotoCount ?? 0,
  });
  if (records) lines.push(`${capital(records)} went with it.`);
  if (done.clearedCustomerLinkCount) {
    lines.push(`The driver link of ${customerRecords(done.clearedCustomerLinkCount)} was cleared.`);
  }
  if (done.clearedInsuranceCaseDriverCount) {
    lines.push(`The driver of ${insuranceCases(done.clearedInsuranceCaseDriverCount)} was cleared.`);
  }
  if (done.clearedAccidentLinkCount) {
    lines.push(`The accident link of ${insuranceCases(done.clearedAccidentLinkCount)} was cleared.`);
  }
  return lines.length ? lines.join(' ') : null;
}

/**
 * A refusal the data raised after the list was loaded, split into the banner's bold line and the
 * instruction under it (§9, 6). A record that became blocked (`record_deletions.blocked`) is worded
 * by the server itself: the bold line is the API's own sentence for the reason. A record that left
 * the list (`record_deletions.not_found`) keeps the app's words. Null for any other code.
 */
export function deletionRefusal(code: string | undefined, apiDetail?: string | null): { title: string; detail: string } | null {
  const detail = 'Refresh the list.';
  if (code === 'record_deletions.not_found') return { title: 'This record is no longer in the list.', detail };
  if (code !== 'record_deletions.blocked') return null;
  return { title: apiDetail?.trim() || 'This record can no longer be deleted.', detail };
}

/** "Practice or test record — made while teaching a new colleague." — the reason read back. */
export const deletionReasonText = (reason: RecordDeletionReason | null | undefined, note: string | null | undefined) =>
  reason ? `${DELETION_REASON_LABEL[reason]}${note ? ` — ${note}` : ''}` : 'No reason recorded';
