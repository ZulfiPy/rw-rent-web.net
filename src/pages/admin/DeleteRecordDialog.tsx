import { useRef, useState } from 'react';
import { qk } from '@/api';
import { deleteRecord } from '@/api/recordDeletions';
import {
  AssignmentStatus, RecordDeletionReason, RecordKind,
  type DeleteRecordRequest, type RecordDeletionResponse,
} from '@/api/dto';
import { isApiError, type Failure } from '@/api/problem';
import {
  DELETION_REASON_LABEL, candidateDescription, deletionConsequences, deletionRefusal, kindNoun,
  type DeletionTarget,
} from '@/format';
import { useActionMutation } from '@/app/useActionMutation';
import { CheckCard } from '@/ui/CheckCard';
import { Dialog, DialogNote, DialogSection, dialogStyles } from '@/ui/Dialog';
import { Field, fieldStyles as f, invalidProps } from '@/ui/Field';

const REASONS = Object.values(RecordDeletionReason);

/** The note's limit, judged by the server on the stored (trimmed) text. */
export const NOTE_MAX = 1000;

export interface DeletionForm {
  reason: RecordDeletionReason | '';
  note: string;
  confirmed: boolean;
}

/**
 * Why Delete permanently is still refused, or null once the form is complete: a reason, a note when
 * the reason is Other, and the tick. The server judges the same request again.
 */
export function deletionFormBlocked(form: DeletionForm): string | null {
  if (!form.reason) return 'A reason is required.';
  const note = form.note.trim();
  if (form.reason === RecordDeletionReason.Other && !note) return 'A note is required when the reason is Other.';
  if (note.length > NOTE_MAX) return 'The note must be at most 1000 characters.';
  if (!form.confirmed) return 'Confirm that you understand this cannot be undone.';
  return null;
}

/**
 * What a deletion of this kind makes stale: the page's own lists, counts and history, the audit,
 * the overview, and that kind's ordinary queries. A rental takes its parts with it and frees its
 * vehicle, so the vehicles, the interruptions and the drivers' authorization histories go too.
 */
export function deletionInvalidates(kind: RecordKind): ReadonlyArray<readonly unknown[]> {
  const page = [qk.recordDeletions.all, qk.audit.all, qk.overview];
  switch (kind) {
    case RecordKind.RentalAssignment:
      return [...page, qk.assignments.all, qk.interruptions.all, qk.vehicles.all, qk.drivers.all];
    case RecordKind.DriverAuthorization:
      return [...page, qk.assignments.all, qk.drivers.all];
    case RecordKind.Interruption:
      return [...page, qk.assignments.all, qk.interruptions.all];
    case RecordKind.Vehicle:
      return [...page, qk.vehicles.all];
    case RecordKind.Customer:
      return [...page, qk.customers.all];
    case RecordKind.Driver:
      return [...page, qk.drivers.all];
  }
}

/**
 * A refusal the data raised after the list was loaded — the record became blocked, or left the
 * list — shown the way a concurrency conflict is: its own sentence, and Refresh. Every other
 * refusal (the fields, the concurrency conflict itself) is the shared reading's; null leaves it so.
 */
export function deletionFailure(kind: RecordKind, error: unknown): Failure | null {
  if (!isApiError(error)) return null;
  const refused = deletionRefusal(kind, error.code);
  return refused ? { kind: 'stale', message: refused.title, detail: refused.detail } : null;
}

/**
 * The delete dialog, modelled on the Company's: the record, a bad-tone banner, what the deletion
 * does, a reason, a note, the explicit tick, and Delete permanently. A record that became blocked or
 * left the list since the page loaded is refused with Refresh, which reloads the list and closes
 * the dialog. `initial` seeds the form (the render tests use it).
 */
export function DeleteRecordDialog({ target, onClose, onDeleted, onRefresh, initial }: {
  target: DeletionTarget;
  onClose: () => void;
  onDeleted: (result: RecordDeletionResponse) => void;
  onRefresh: () => void;
  initial?: Partial<DeletionForm>;
}) {
  const [reason, setReason] = useState<RecordDeletionReason | ''>(initial?.reason ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [confirmed, setConfirmed] = useState(initial?.confirmed ?? false);
  const answer = useRef<RecordDeletionResponse | null>(null);
  const kind = target.kind;

  const m = useActionMutation({
    op: 'record-delete',
    mutationFn: async (body: DeleteRecordRequest) => {
      answer.current = await deleteRecord(body);
      return answer.current;
    },
    invalidate: deletionInvalidates(kind),
    onDone: () => {
      if (answer.current) onDeleted(answer.current);
    },
    refusal: (error) => deletionFailure(kind, error),
  });

  const activeRental = target.kind === RecordKind.RentalAssignment
    && target.value.status === AssignmentStatus.Active;
  const parts = target.kind === RecordKind.RentalAssignment
    ? { authorizations: target.value.authorizationCount, interruptions: target.value.interruptionCount }
    : undefined;
  const blocked = deletionFormBlocked({ reason, note, confirmed });
  const noteRequired = reason === RecordDeletionReason.Other;

  const submit = () => {
    if (blocked || !reason) return;
    m.submit({ kind, recordId: target.value.id, reason, note: note.trim() || null, confirmed: true });
  };

  return (
    <Dialog
      title={`Delete ${kindNoun(kind)}`}
      description={candidateDescription(target)}
      icon="delete_forever"
      tone="bad"
      width={560}
      submitLabel="Delete permanently"
      submitIcon="delete_forever"
      submitTone="danger-solid"
      submitBlocked={blocked}
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={submit}
      onRefresh={onRefresh}
    >
      <DialogNote icon="error" tone="bad" title={activeRental ? 'This rental is active' : 'This cannot be undone'}>
        {activeRental
          ? 'The vehicle is recorded as being with the customer right now. Delete it only if this rental never happened.'
          : 'The record is removed from the database for good.'}
      </DialogNote>

      <ul className={dialogStyles.consequences}>
        {deletionConsequences(kind, parts).map((line) => (
          <li key={line} className={dialogStyles.consequence}>{line}</li>
        ))}
      </ul>

      <DialogSection cols={1}>
        <Field label="Reason" required error={m.fields['reason']}>
          <select
            className={f.control}
            {...invalidProps(m.fields['reason'])}
            value={reason}
            onChange={(e) => setReason(e.target.value ? Number(e.target.value) as RecordDeletionReason : '')}
          >
            <option value="">Select a reason</option>
            {REASONS.map((r) => <option key={r} value={r}>{DELETION_REASON_LABEL[r]}</option>)}
          </select>
        </Field>
        <Field
          label="Note"
          required={noteRequired}
          optional={!noteRequired}
          hint="Stored with the audit entry."
          error={m.fields['note']}
        >
          <textarea
            className={f.control}
            {...invalidProps(m.fields['note'])}
            rows={3}
            maxLength={NOTE_MAX}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
      </DialogSection>

      <CheckCard
        label="I understand this cannot be undone"
        hint="The record and its parts cannot be restored from the app."
        checked={confirmed}
        onChange={setConfirmed}
      />
      {m.fields['confirmed'] ? (
        <span className={f.error}>
          <span data-icon aria-hidden="true" className={f.errorIcon}>error</span>
          {m.fields['confirmed']}
        </span>
      ) : null}
    </Dialog>
  );
}
