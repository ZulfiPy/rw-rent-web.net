import { describe, expect, test } from 'vitest';
import { RecordKind } from './dto';
import { codeToField } from './codes';
import { ApiError, toFailure } from './problem';
import { CANDIDATE_PATH } from './recordDeletions';
import { deletionFailure } from '@/pages/admin/DeleteRecordDialog';

/**
 * Follow-up 8: how the Delete records dialog reads the API's refusals. The field refusals go under
 * their inputs through the op's table; a record that became blocked or left the list comes back
 * with Refresh, like the concurrency conflict. The problem bodies are the ones the scratch API gave.
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
    expect(deletionFailure(RecordKind.Vehicle, error)).toBeNull();
    expect(toFailure(error, 'record-delete'))
      .toEqual({ kind: 'field', errors: { note: ['A note is required when the reason is Other.'] } });
  });

  test('a record that became blocked is refused with its own sentence and Refresh', () => {
    const error = refusal(409, {
      title: 'Conflict', detail: 'One rental assignment still refers to this record.', code: 'record_deletions.blocked',
    });
    expect(deletionFailure(RecordKind.Vehicle, error))
      .toEqual({ kind: 'stale', message: 'This vehicle now has a rental assignment.', detail: 'Refresh the list.' });
  });

  test('a record that left the list is refused the same way, although a 404 reaches the app without its code', () => {
    const error = refusal(404, {
      title: 'Not Found', detail: "Vehicle '…' was not found.", code: 'record_deletions.not_found',
    });
    // The shared reading knows no 404 and would give an unworded failure.
    expect(toFailure(error, 'record-delete').kind).toBe('unknown');
    expect(deletionFailure(RecordKind.Driver, error))
      .toEqual({ kind: 'stale', message: 'This record is no longer in the list.', detail: 'Refresh the list.' });
  });

  test('the concurrency conflict keeps the shared stale banner', () => {
    const error = refusal(409, {
      title: 'Conflict', detail: 'The record changed concurrently.', code: 'record_deletions.concurrency_conflict',
    });
    expect(deletionFailure(RecordKind.Vehicle, error)).toBeNull();
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
