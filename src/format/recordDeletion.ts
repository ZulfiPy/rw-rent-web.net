import {
  AssignmentStatus, RecordDeletionBlockReason, RecordKind,
  type CustomerDeletionCandidateResponse, type DriverAuthorizationDeletionCandidateResponse,
  type DriverDeletionCandidateResponse, type InterruptionDeletionCandidateResponse,
  type RecordDeletionBlockResponse, type RecordDeletionReason,
  type RentalAssignmentDeletionCandidateResponse, type VehicleDeletionCandidateResponse,
} from '@/api/dto';
import { formatLocal } from './datetime';
import {
  CUSTOMER_TYPE_LABEL, DELETION_REASON_LABEL, INTERRUPTION_REASON_LABEL, RECORD_KIND_LABEL,
} from './labels';

/**
 * The words of the Delete records page (Follow-up 8), from the handover's copy deck. The server
 * decides whether a record is Ready or Blocked and why; everything here only puts its answer into
 * sentences. Nothing here judges a record.
 */

/** "driver authorization" — the kind inside a sentence. */
export const kindNoun = (kind: RecordKind) => RECORD_KIND_LABEL[kind].toLowerCase();

/** What a collective Business-customer authorization is called where a driver's name stands. */
export const COLLECTIVE_DRIVERS = 'Business customer drivers';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * One block, worded for the row it blocks. The count comes from the server; the noun for a
 * rental-assignment block is the row's own kind.
 */
function blockClause(kind: RecordKind, block: RecordDeletionBlockResponse): string {
  switch (block.reason) {
    case RecordDeletionBlockReason.ReferencedByRentalAssignments:
      return `${plural(block.count, 'rental assignment refers', 'rental assignments refer')} to this ${
        kind === RecordKind.Customer ? 'customer' : 'vehicle'}`;
    case RecordDeletionBlockReason.ReferencedByDriverAuthorizations:
      return `${plural(block.count, 'driver authorization refers', 'driver authorizations refer')} to this driver`;
    case RecordDeletionBlockReason.LinkedFromCustomer:
      return block.count === 1
        ? 'a customer record is linked to this driver record'
        : `${block.count} customer records are linked to this driver record`;
    case RecordDeletionBlockReason.OnlyOpenAuthorizationOfActiveRental:
      return 'an active rental must keep at least one authorization';
    default:
      return '';
  }
}

/**
 * The sentence under a Blocked chip and on its disabled Delete…: every block of the row, joined
 * with "and" (a driver can carry two at once), with a capital letter and no full stop.
 */
export function blockSentence(kind: RecordKind, blocks: readonly RecordDeletionBlockResponse[]): string {
  const text = blocks.map((block) => blockClause(kind, block)).filter(Boolean).join(' and ');
  return text.charAt(0).toUpperCase() + text.slice(1);
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

/**
 * What a deletion does, in the dialog's consequence box. A rental's parts are counted by the server
 * on the row; the other kinds can only be Ready when nothing refers to them, so their second line
 * says so.
 */
export function deletionConsequences(kind: RecordKind, parts?: { authorizations: number; interruptions: number }): string[] {
  switch (kind) {
    case RecordKind.RentalAssignment: {
      const lines = ['The rental assignment is removed permanently.'];
      const a = parts?.authorizations ?? 0;
      const i = parts?.interruptions ?? 0;
      if (a + i > 0) {
        const bits: string[] = [];
        if (a) bits.push(plural(a, 'driver authorization', 'driver authorizations'));
        if (i) bits.push(plural(i, 'interruption', 'interruptions'));
        lines.push(`Its ${bits.join(' and ')} ${a + i === 1 ? 'is' : 'are'} removed with it.`);
      }
      lines.push('The customer, the vehicle and the drivers stay as they are.');
      return [...lines, AUDIT_CONSEQUENCE];
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
    case RecordKind.Driver:
      return [
        'The driver is removed permanently.',
        'No driver authorization and no customer record refer to this driver, so nothing else changes.',
        AUDIT_CONSEQUENCE,
      ];
    default:
      return [
        `The ${kindNoun(kind)} is removed permanently.`,
        `No rental assignment refers to this ${kindNoun(kind)}, so nothing else changes.`,
        AUDIT_CONSEQUENCE,
      ];
  }
}

/**
 * A refusal the data raised after the list was loaded, split into the banner's bold line and the
 * instruction under it: the record gained a reference (`record_deletions.blocked`) or left the list
 * (`record_deletions.not_found`). Null for any other code.
 */
export function deletionRefusal(kind: RecordKind, code: string | undefined): { title: string; detail: string } | null {
  const detail = 'Refresh the list.';
  if (code === 'record_deletions.not_found') return { title: 'This record is no longer in the list.', detail };
  if (code !== 'record_deletions.blocked') return null;
  switch (kind) {
    case RecordKind.Vehicle:
      return { title: 'This vehicle now has a rental assignment.', detail };
    case RecordKind.Customer:
      return { title: 'This customer now has a rental assignment.', detail };
    case RecordKind.Driver:
      return { title: 'This driver is now referenced by another record.', detail };
    case RecordKind.DriverAuthorization:
      return { title: 'This is now the only open authorization of an active rental.', detail };
    default:
      return { title: 'This record gained a reference while the list was open.', detail };
  }
}

/** "Practice or test record — made while teaching a new colleague." — the reason read back. */
export const deletionReasonText = (reason: RecordDeletionReason | null | undefined, note: string | null | undefined) =>
  reason ? `${DELETION_REASON_LABEL[reason]}${note ? ` — ${note}` : ''}` : 'No reason recorded';
