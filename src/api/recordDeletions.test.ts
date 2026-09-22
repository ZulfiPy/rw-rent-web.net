import { describe, expect, test } from 'vitest';
import { RecordKind } from './dto';
import { codeToField } from './codes';
import { ApiError, toFailure } from './problem';
import { CANDIDATE_PATH } from './recordDeletions';
import { deletionFailure, deletionInvalidates } from '@/pages/admin/DeleteRecordDialog';
import { qk } from './queryKeys';
import { runningVehicleRefusal } from '@/pages/followup9.support';

/**
 * Follow-ups 8 and 9: how the Delete records dialog reads the API's refusals. The field refusals go
 * under their inputs through the op's table; a record that became blocked or left the list comes
 * back with Refresh, like the concurrency conflict — a blocked one in the API's own words since
 * round 8. The problem bodies are the ones the scratch API gave.
 */

const refusal = (status: number, body: Record<string, unknown>) =>
  new ApiError(status, { type: `https://httpstatuses.com/${status}`, status, ...body });

describe('the dialog’s refusals', () => {
  test('the four field refusals name the dialog’s own inputs', () => {
    expect(codeToField('record_deletions.reason_required', 'record-delete')).toBe('reason');
    expect(codeToField('record_deletions.note_required', 'record-delete')).toBe('note');
    expect(codeToField('record_deletions.note_too_long', 'record-delete')).toBe('note');
    expect(codeToField('record_deletions.confirmation_required', 'record-delete')).toBe('confirmed');
    // Nothing a person types is the kind or the record's identifier: those stay form-level.
    expect(codeToField('record_deletions.kind_invalid', 'record-delete')).toBeUndefined();
    expect(codeToField('record_deletions.record_id_required', 'record-delete')).toBeUndefined();
  });

  test('a note the API refuses lands under the note', () => {
    const error = refusal(400, {
      title: 'One or more validation errors occurred.',
      detail: 'A note is required when the reason is Other.',
      errors: { Note: ['A note is required when the reason is Other.'] },
      code: 'record_deletions.note_required',
    });
    expect(deletionFailure(error)).toBeNull();
    expect(toFailure(error, 'record-delete'))
      .toEqual({ kind: 'field', errors: { note: ['A note is required when the reason is Other.'] } });
  });

  test('a record that became blocked is refused in the API’s own sentence for its reason, with Refresh', () => {
    const { status, ...body } = runningVehicleRefusal;
    const error = refusal(status!, body);
    expect(deletionFailure(error)).toEqual({
      kind: 'stale',
      message: 'One of its rental assignments is running (Active). End it first; then the record can be deleted with its rentals.',
      detail: 'Refresh the list.',
    });
  });

  test('a record that left the list is refused the same way, although a 404 reaches the app without its code', () => {
    const error = refusal(404, {
      title: 'Not Found', detail: "Vehicle '…' was not found.", code: 'record_deletions.not_found',
    });
    // The shared reading knows no 404 and would give an unworded failure.
    expect(toFailure(error, 'record-delete').kind).toBe('unknown');
    expect(deletionFailure(error))
      .toEqual({ kind: 'stale', message: 'This record is no longer in the list.', detail: 'Refresh the list.' });
  });

  test('the concurrency conflict keeps the shared stale banner', () => {
    const error = refusal(409, {
      title: 'Conflict', detail: 'The record changed concurrently.', code: 'record_deletions.concurrency_conflict',
    });
    expect(deletionFailure(error)).toBeNull();
    expect(toFailure(error, 'record-delete').kind).toBe('stale');
  });
});

describe('the lists', () => {
  test('each kind reads its own candidate list', () => {
    expect(CANDIDATE_PATH).toEqual({
      [RecordKind.RentalAssignment]: 'rental-assignments',
      [RecordKind.DriverAuthorization]: 'driver-authorizations',
      [RecordKind.Interruption]: 'interruptions',
      [RecordKind.Vehicle]: 'vehicles',
      [RecordKind.Customer]: 'customers',
      [RecordKind.Driver]: 'drivers',
    });
  });
});

describe('what a deletion makes stale (Follow-up 9)', () => {
  test('a cascade makes stale what went with the record, and the people whose histories listed it', () => {
    const stale = (kind: RecordKind) => deletionInvalidates(kind).map((key) => key.join('/'));
    const has = (kind: RecordKind, ...keys: (readonly unknown[])[]) =>
      expect(stale(kind)).toEqual(expect.arrayContaining(keys.map((key) => key.join('/'))));
    // A vehicle or a customer takes rentals, their authorizations and interruptions; the drivers'
    // histories listed those authorizations.
    has(RecordKind.Vehicle, qk.vehicles.all, qk.assignments.all, qk.interruptions.all, qk.drivers.all);
    has(RecordKind.Customer, qk.customers.all, qk.assignments.all, qk.interruptions.all, qk.drivers.all);
    // A driver takes authorizations off rentals and clears a customer's link.
    has(RecordKind.Driver, qk.drivers.all, qk.customers.all, qk.assignments.all);
    for (const kind of Object.values(RecordKind)) {
      has(kind, qk.recordDeletions.all, qk.audit.all, qk.overview);
    }
  });
});
