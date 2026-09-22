import {
  AssignmentStatus, RecordDeletionBlockReason, RecordKind,
  type CustomerDeletionCandidateResponse, type DriverAuthorizationDeletionCandidateResponse,
  type DriverDeletionCandidateResponse, type InterruptionDeletionCandidateResponse,
  type RecordDeletionBlockResponse, type RecordDeletionReason, type RecordDeletionResponse,
  type RecordDeletionTakes, type RentalAssignmentDeletionCandidateResponse,
  type VehicleDeletionCandidateResponse,
} from '@/api/dto';
import { formatLocal } from './datetime';
import {
  CUSTOMER_TYPE_LABEL, DELETION_REASON_LABEL, INTERRUPTION_REASON_LABEL, RECORD_KIND_LABEL,
} from './labels';

/**
 * The words of the Delete records page (Follow-up 8, and Follow-up 9 for the backend's round 8),
 * from the handover's copy deck and the ledger's §9. The server decides whether a record is Ready
 * or Blocked, why, and what a deletion would take along; everything here only puts its answer into
 * sentences. Nothing here judges a record.
 */

/** "driver authorization" — the kind inside a sentence. */
export const kindNoun = (kind: RecordKind) => RECORD_KIND_LABEL[kind].toLowerCase();

/** What a collective Business-customer authorization is called where a driver's name stands. */
export const COLLECTIVE_DRIVERS = 'Business customer drivers';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "a vehicle", "a customer": the row's own kind inside a block sentence. */
const referredNoun = (kind: RecordKind) => (kind === RecordKind.Customer ? 'customer' : 'vehicle');

/**
 * One block, worded for the row it blocks (§9, 2). The count comes from the server; the records in
 * the way are always running rentals, linked beside the sentence.
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

/** "2 rental assignments, 3 driver authorizations and 1 interruption" — only the counts that are not zero. */
function recordsList(takes: Pick<RecordDeletionTakes, 'rentalAssignments' | 'driverAuthorizations' | 'interruptions'>): string {
  const bits: string[] = [];
  if (takes.rentalAssignments) bits.push(plural(takes.rentalAssignments, 'rental assignment', 'rental assignments'));
  if (takes.driverAuthorizations) bits.push(plural(takes.driverAuthorizations, 'driver authorization', 'driver authorizations'));
  if (takes.interruptions) bits.push(plural(takes.interruptions, 'interruption', 'interruptions'));
  return bits.length > 1 ? `${bits.slice(0, -1).join(', ')} and ${bits.at(-1)}` : bits[0] ?? '';
}

const customerRecords = (n: number) => plural(n, 'customer record', 'customer records');

/**
 * What a deletion takes along, from the server's `takes` (§9, 2): the records that go, then the
 * customer links it clears, each only when not zero, or that nothing else goes. Like the block
 * sentence, no full stop at the end.
 */
export function takesSentence(takes: RecordDeletionTakes): string {
  const lines: string[] = [];
  const records = recordsList(takes);
  if (records) lines.push(`Takes ${records} with it`);
  if (takes.customerLinksCleared) lines.push(`Clears the driver link of ${customerRecords(takes.customerLinksCleared)}`);
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
  | { kind: typeof RecordKind.Driver; value: DriverDeletionCandidateResponse };

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
  const parts = recordsList({ rentalAssignments: 0, driverAuthorizations: takes.driverAuthorizations, interruptions: takes.interruptions });
  return `Its ${rentals}${parts ? `, with ${parts},` : ''} ${takes.rentalAssignments === 1 ? 'is' : 'are'} removed with it.`;
}

const NOTHING_ELSE = 'Nothing else goes with it.';

/**
 * What a deletion does, in the dialog's consequence box (§9, 4), built from the row's `takes` with
 * exact counts. Every kind ends with the audit line.
 */
export function deletionConsequences(kind: RecordKind, takes: RecordDeletionTakes): string[] {
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
      return [
        `The ${noun} is removed permanently.`,
        ...(takes.rentalAssignments
          ? [rentalsLine(takes), `The ${others} of ${takes.rentalAssignments === 1 ? 'that rental' : 'those rentals'} stay as they are.`]
          : [NOTHING_ELSE]),
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
      if (!a && !links) lines.push(NOTHING_ELSE);
      return [...lines, AUDIT_CONSEQUENCE];
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
  });
  if (records) lines.push(`${capital(records)} went with it.`);
  if (done.clearedCustomerLinkCount) {
    lines.push(`The driver link of ${customerRecords(done.clearedCustomerLinkCount)} was cleared.`);
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
