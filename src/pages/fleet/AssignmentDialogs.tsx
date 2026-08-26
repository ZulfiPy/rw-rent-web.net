import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/api';
import { listCustomers } from '@/api/customers';
import { listDrivers } from '@/api/drivers';
import { listVehicles } from '@/api/vehicles';
import {
  activateAssignment, cancelAssignment, correctAssignmentParties, correctAssignmentTimeline,
  endAssignment, updateAssignment,
} from '@/api/rentalAssignments';
import { correctAuthorization, startAuthorization, stopAuthorization } from '@/api/authorizations';
import {
  correctInterruption, createInterruption, endInterruption, updateInterruption,
} from '@/api/interruptions';
import {
  AssignmentDriverAuthorizationType, AssignmentStatus, AuthorizationStopReason, BillingImpact,
  CustomerType, InterruptionReason,
  type AssignmentDriverAuthorizationResponse, type AssignmentInterruptionResponse,
  type RentalAssignmentResponse,
} from '@/api/dto';
import {
  AUTHORIZATION_TYPE_LABEL, BILLING_IMPACT_LABEL, INTERRUPTION_REASON_LABEL, STOP_REASON_LABEL,
  fromLocalInput, toLocalInput,
} from '@/format';
import { useActionMutation } from '@/app/useActionMutation';
import { ReseedScope } from '@/app/reseed';
import { Dialog, DialogNote, DialogSection as Section } from '@/ui/Dialog';
import { Field, fieldStyles as f } from '@/ui/Field';

export type AssignmentDialogState =
  | { kind: 'edit' }
  | { kind: 'activate' }
  | { kind: 'end' }
  | { kind: 'cancel' }
  | { kind: 'auth-start' }
  | { kind: 'auth-stop'; authorizationId: string }
  | { kind: 'auth-correct'; authorizationId: string }
  | { kind: 'interruption-create' }
  | { kind: 'interruption-edit'; interruptionId: string }
  | { kind: 'interruption-end'; interruptionId: string }
  | { kind: 'interruption-correct'; interruptionId: string }
  | { kind: 'correct-parties' }
  | { kind: 'correct-timeline' };

/** Every assignment write touches the record, its children, the fleet lists and the audit. */
const INVALIDATE = [
  ['rental-assignments'], ['vehicles'], ['customers'], ['drivers'], ['security-audit'],
] as const;

const PICK = { PageSize: 100 } as const;
const REASON_HINT = 'Recorded in the security audit against this record.';

interface Common {
  assignment: RentalAssignmentResponse;
  onClose: () => void;
}

function ReasonField({ value, error, onChange }: {
  value: string;
  error?: string | undefined;
  onChange: (next: string) => void;
}) {
  return (
    <Field label="Reason" required hint={REASON_HINT} error={error}>
      <textarea
        className={f.control}
        data-invalid={!!error}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

function DateTimeField({ label, value, error, hint, required, optional, onChange }: {
  label: string;
  value: string;
  error?: string | undefined;
  hint?: string;
  required?: boolean;
  optional?: boolean;
  onChange: (next: string) => void;
}) {
  return (
    <Field label={label} error={error} hint={hint} required={required} optional={optional}>
      <input
        type="datetime-local"
        className={f.control}
        data-invalid={!!error}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

function EnumSelect<T extends number>({ label, value, options, labels, error, required, onChange }: {
  label: string;
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  error?: string | undefined;
  required?: boolean;
  onChange: (next: T) => void;
}) {
  return (
    <Field label={label} error={error} required={required}>
      <select
        className={f.control}
        data-invalid={!!error}
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value) as T)}
      >
        {options.map((o) => <option key={o} value={o}>{labels[o]}</option>)}
      </select>
    </Field>
  );
}

const INTERRUPTION_REASONS = Object.values(InterruptionReason);
const BILLING_IMPACTS = Object.values(BillingImpact);
const STOP_REASONS = Object.values(AuthorizationStopReason);

/* lifecycle -------------------------------------------------------------- */

function Edit({ assignment: a, onClose }: Common) {
  const [customerId, setCustomerId] = useState(a.customerId);
  const [vehicleId, setVehicleId] = useState(a.vehicleId);
  const [plannedStart, setPlannedStart] = useState(toLocalInput(a.plannedStartAtUtc));
  const [plannedEnd, setPlannedEnd] = useState(toLocalInput(a.plannedEndAtUtc));
  const [note, setNote] = useState(a.note ?? '');

  const customers = useQuery({ queryKey: qk.customers.list(PICK), queryFn: () => listCustomers(PICK) });
  const vehicles = useQuery({ queryKey: qk.vehicles.list(PICK), queryFn: () => listVehicles(PICK) });

  const m = useActionMutation({
    op: 'assignment-edit',
    mutationFn: () => updateAssignment(a.id, {
      customerId,
      vehicleId,
      plannedStartAtUtc: plannedStart ? fromLocalInput(plannedStart) : null,
      plannedEndAtUtc: plannedEnd ? fromLocalInput(plannedEnd) : null,
      note: note.trim() || null,
    }),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title="Edit assignment"
      icon="edit"
      tone="accent"
      width={680}
      description="Planned dates, the parties and the note. Actual handover and closure are lifecycle events."
      submitLabel="Save changes"
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <Section title="Parties">
      <Field label="Customer" required error={m.fields['customerId']}>
        <select className={f.control} data-invalid={!!m.fields['customerId']} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          {(customers.data?.items ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.displayName}{c.isActive ? '' : ' · inactive'}</option>
          ))}
        </select>
      </Field>
      <Field label="Vehicle" required error={m.fields['vehicleId']}>
        <select className={f.control} data-invalid={!!m.fields['vehicleId']} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
          {(vehicles.data?.items ?? []).map((v) => (
            <option key={v.id} value={v.id}>{v.plateNumber} · {v.make} {v.model}</option>
          ))}
        </select>
      </Field>
      </Section>
      <Section title="Planned timeline">
      <DateTimeField
        label="Planned start"
        value={plannedStart}
        error={m.fields['plannedStartAtUtc']}
        optional={a.status !== AssignmentStatus.Planned}
        onChange={setPlannedStart}
      />
      <DateTimeField
        label="Planned end"
        value={plannedEnd}
        error={m.fields['plannedEndAtUtc']}
        optional
        hint="Leave empty for an open-ended rental."
        onChange={setPlannedEnd}
      />
      </Section>
      <Section title="Note" cols={1}>
      <Field label="Assignment note" optional error={m.fields['note']}>
        <textarea className={f.control} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      </Section>
    </Dialog>
  );
}

function Activate({ assignment: a, onClose }: Common) {
  const [startedAt, setStartedAt] = useState(toLocalInput(new Date().toISOString()));
  const open = a.driverAuthorizations.filter((z) => !z.stoppedAtUtc);
  const m = useActionMutation({
    op: 'assignment-activate',
    mutationFn: () => activateAssignment(a.id, { startedAtUtc: fromLocalInput(startedAt) }),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title="Activate assignment"
      icon="play_circle"
      tone="ok"
      description={`The vehicle is handed over to ${a.customerDisplayName}.`}
      submitLabel="Activate"
      busy={m.busy}
      failure={m.failure}
      info={{
        title: 'One atomic operation',
        body: 'The status, the actual handover time and the coverage check are applied together, or not at all.',
      }}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <Section title="Handover" cols={1}>
        <DateTimeField label="Actual start" required value={startedAt} error={m.fields['startedAtUtc']} onChange={setStartedAt} />
      </Section>
      <DialogNote icon={open.length ? 'group' : 'group_off'}>
        {open.length
          ? `Currently authorized: ${open.map((z) => (z.authorizationType === AssignmentDriverAuthorizationType.BusinessCustomerDrivers ? 'Company-authorized drivers' : 'a named driver')).join(', ')}. A valid authorization already exists, so none is created here.`
          : 'No driver is authorized yet. The api refuses activation until this assignment has coverage.'}
      </DialogNote>
    </Dialog>
  );
}

function End({ assignment: a, onClose }: Common) {
  const [closedAt, setClosedAt] = useState(toLocalInput(new Date().toISOString()));
  const openInts = a.interruptions.filter((i) => !i.endedAtUtc);
  const m = useActionMutation({
    op: 'assignment-end',
    mutationFn: () => endAssignment(a.id, { closedAtUtc: fromLocalInput(closedAt) }),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title="End assignment"
      icon="stop_circle"
      tone="mute"
      width={520}
      description="Closes the assignment. Open driver authorizations are stopped by the backend."
      submitLabel="End assignment"
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
      footnote={openInts.length ? 'End the open interruption before ending this assignment.' : undefined}
    >
      <DateTimeField label="Closed at" required value={closedAt} error={m.fields['closedAtUtc']} onChange={setClosedAt} />
      {openInts.length ? (
        <DialogNote icon="pause_circle">
          {openInts.length > 1
            ? `${openInts.length} interruptions are still open. An interruption belongs to the assignment as a whole, and closure never ends one silently.`
            : 'An interruption is still open. An interruption belongs to the assignment as a whole, and closure never ends one silently.'}
        </DialogNote>
      ) : (
        <DialogNote icon="link_off">
          Every open authorization is stopped with the reason “Assignment ended”. Renting the same
          vehicle again needs a new assignment.
        </DialogNote>
      )}
    </Dialog>
  );
}

function Cancel({ assignment: a, onClose }: Common) {
  const wasPlanned = a.status === AssignmentStatus.Planned;
  const [closedAt, setClosedAt] = useState(toLocalInput(new Date().toISOString()));
  const [noHandover, setNoHandover] = useState(false);
  const [note, setNote] = useState('');
  const m = useActionMutation({
    op: 'assignment-cancel',
    mutationFn: () => cancelAssignment(a.id, {
      closedAtUtc: fromLocalInput(closedAt),
      noPhysicalHandoverOccurred: wasPlanned ? undefined : noHandover,
      note: note.trim() || null,
    }),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title="Cancel assignment"
      icon="cancel"
      tone="bad"
      description={wasPlanned
        ? 'The planned rental is withdrawn. Cancelled is final.'
        : 'Only a mistaken activation may be cancelled — the vehicle must never have left the office.'}
      submitLabel="Cancel assignment"
      submitIcon="cancel"
      submitTone="danger-solid"
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <DateTimeField label="Closed at" required value={closedAt} error={m.fields['closedAtUtc']} onChange={setClosedAt} />
      {wasPlanned ? null : (
        <Field label="Mistaken activation" group>
          <span className={f.choices}>
            <span className={f.choice} data-checked={noHandover}>
              <input type="checkbox" checked={noHandover} onChange={() => setNoHandover((v) => !v)} />
              <span className={f.choiceBody}>
                <span className={f.choiceRow}>No physical handover occurred</span>
              </span>
            </span>
          </span>
        </Field>
      )}
      <Field
        label={wasPlanned ? 'Cancellation note' : 'What happened'}
        hint={wasPlanned ? 'Kept with the record as a separate value.' : 'Required: the correction records why the activation was wrong.'}
        error={m.fields['note']}
        required
      >
        <textarea className={f.control} data-invalid={!!m.fields['note']} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      {wasPlanned ? null : (
        <DialogNote icon="warning">
          The erroneous actual start is cleared, the closing time is recorded and every open
          authorization is stopped. If the vehicle was handed over, end the assignment instead.
        </DialogNote>
      )}
    </Dialog>
  );
}

/* authorizations --------------------------------------------------------- */

function AuthStart({ assignment: a, onClose, businessCustomer }: Common & { businessCustomer: boolean }) {
  const [type, setType] = useState<AssignmentDriverAuthorizationType>(AssignmentDriverAuthorizationType.NamedDriver);
  const [driverId, setDriverId] = useState('');
  const [from, setFrom] = useState(toLocalInput(new Date().toISOString()));
  const [note, setNote] = useState('');
  const drivers = useQuery({ queryKey: qk.drivers.list({ ...PICK, IsActive: true }), queryFn: () => listDrivers({ ...PICK, IsActive: true }) });
  const collective = type === AssignmentDriverAuthorizationType.BusinessCustomerDrivers;

  const m = useActionMutation({
    op: 'auth-start',
    mutationFn: () => startAuthorization(a.id, {
      authorizationType: type,
      driverId: collective ? null : driverId || null,
      authorizedFromUtc: fromLocalInput(from),
      note: note.trim() || null,
    }),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title="Add authorized driver"
      icon="person_add"
      tone="ok"
      width={660}
      description="Authorization is explicit history: it never follows the customer automatically."
      submitLabel="Authorize"
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <Section title="Who will drive?" cols={1}>
      <EnumSelect
        label="Authorization"
        value={type}
        options={businessCustomer
          ? [AssignmentDriverAuthorizationType.NamedDriver, AssignmentDriverAuthorizationType.BusinessCustomerDrivers]
          : [AssignmentDriverAuthorizationType.NamedDriver]}
        labels={AUTHORIZATION_TYPE_LABEL}
        error={m.fields['authorizationType']}
        onChange={setType}
      />
      {collective ? null : (
        <Field label="Driver" required error={m.fields['driverId']}>
          <select className={f.control} data-invalid={!!m.fields['driverId']} value={driverId} onChange={(e) => setDriverId(e.target.value)}>
            <option value="">Select a driver</option>
            {(drivers.data?.items ?? []).map((d) => (
              <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
            ))}
          </select>
        </Field>
      )}
      <DateTimeField label="Authorized from" required value={from} error={m.fields['authorizedFromUtc']} onChange={setFrom} />
      <Field
        label="Note"
        required={collective}
        optional={!collective}
        hint={collective ? 'Required: describe the agreed collective coverage.' : undefined}
        error={m.fields['note']}
      >
        <textarea className={f.control} data-invalid={!!m.fields['note']} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      </Section>
      {collective ? (
        <DialogNote icon="groups">
          One collective authorization replaces individually named drivers rather than adding to them.
        </DialogNote>
      ) : null}
    </Dialog>
  );
}

function AuthStop({ assignment: a, onClose, authorization: z, businessCustomer }: Common & {
  authorization: AssignmentDriverAuthorizationResponse;
  businessCustomer: boolean;
}) {
  const [stoppedAt, setStoppedAt] = useState(toLocalInput(new Date().toISOString()));
  const [reason, setReason] = useState<AuthorizationStopReason>(AuthorizationStopReason.CustomerRequest);
  const [note, setNote] = useState('');
  const [replace, setReplace] = useState(false);
  const [replacementType, setReplacementType] = useState<AssignmentDriverAuthorizationType>(AssignmentDriverAuthorizationType.NamedDriver);
  const [driverId, setDriverId] = useState('');
  const [replacementNote, setReplacementNote] = useState('');
  const drivers = useQuery({ queryKey: qk.drivers.list({ ...PICK, IsActive: true }), queryFn: () => listDrivers({ ...PICK, IsActive: true }) });

  const remaining = a.driverAuthorizations.filter((x) => !x.stoppedAtUtc && x.id !== z.id);
  const lastCoverage = a.status === AssignmentStatus.Active && remaining.length === 0;
  const collectiveReplacement = replacementType === AssignmentDriverAuthorizationType.BusinessCustomerDrivers;

  const m = useActionMutation({
    op: 'auth-stop',
    mutationFn: () => stopAuthorization(a.id, z.id, {
      stoppedAtUtc: fromLocalInput(stoppedAt),
      stopReason: reason,
      note: note.trim() || null,
      replacement: replace || lastCoverage
        ? {
          authorizationType: replacementType,
          driverId: collectiveReplacement ? null : driverId || null,
          note: replacementNote.trim() || null,
        }
        : null,
    }),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title="Stop authorization"
      icon="person_remove"
      tone="warn"
      width={600}
      description="Stopping records the period; it never reopens and never changes the assignment."
      submitLabel="Stop authorization"
      submitTone="warn"
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <Section title="Stop">
      <DateTimeField label="Stopped at" required value={stoppedAt} error={m.fields['stoppedAtUtc']} onChange={setStoppedAt} />
      <EnumSelect
        label="Stop reason"
        required
        value={reason}
        options={STOP_REASONS}
        labels={STOP_REASON_LABEL}
        error={m.fields['stopReason']}
        onChange={setReason}
      />
      <Field
        label="Reason details"
        required={reason === AuthorizationStopReason.Other}
        optional={reason !== AuthorizationStopReason.Other}
        hint={reason === AuthorizationStopReason.Other ? 'Required when the reason is Other.' : undefined}
        error={m.fields['note']}
      >
        <textarea className={f.control} data-invalid={!!m.fields['note']} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      </Section>

      {lastCoverage ? (
        <DialogNote icon="shield">
          This is the last open authorization on an active assignment, so a replacement is part of the
          same operation. Ending the assignment is the only way to stop coverage entirely.
        </DialogNote>
      ) : (
        <Field label="Replacement" group>
          <span className={f.choices}>
            <span className={f.choice} data-checked={replace}>
              <input type="checkbox" checked={replace} onChange={() => setReplace((v) => !v)} />
              <span className={f.choiceBody}>
                <span className={f.choiceRow}>Authorize a replacement in the same operation</span>
              </span>
            </span>
          </span>
        </Field>
      )}

      {replace || lastCoverage ? (
        <Section title="Replacement">
          <EnumSelect
            label="Replacement authorization"
            required
            value={replacementType}
            options={businessCustomer
              ? [AssignmentDriverAuthorizationType.NamedDriver, AssignmentDriverAuthorizationType.BusinessCustomerDrivers]
              : [AssignmentDriverAuthorizationType.NamedDriver]}
            labels={AUTHORIZATION_TYPE_LABEL}
            error={m.fields['authorizationType']}
            onChange={setReplacementType}
          />
          {collectiveReplacement ? null : (
            <Field label="Replacement driver" required error={m.fields['driverId']}>
              <select className={f.control} data-invalid={!!m.fields['driverId']} value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                <option value="">Select a driver</option>
                {(drivers.data?.items ?? []).map((d) => (
                  <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                ))}
              </select>
            </Field>
          )}
          <Field
            label="Replacement note"
            required={collectiveReplacement}
            optional={!collectiveReplacement}
            hint={collectiveReplacement ? 'Required: describe the agreed collective coverage.' : undefined}
          >
            <textarea className={f.control} rows={2} value={replacementNote} onChange={(e) => setReplacementNote(e.target.value)} />
          </Field>
        </Section>
      ) : null}
    </Dialog>
  );
}

function AuthCorrect({ assignment: a, onClose, authorization: z, businessCustomer }: Common & {
  authorization: AssignmentDriverAuthorizationResponse;
  businessCustomer: boolean;
}) {
  const [type, setType] = useState<AssignmentDriverAuthorizationType>(z.authorizationType);
  const [driverId, setDriverId] = useState(z.driverId ?? '');
  const [from, setFrom] = useState(toLocalInput(z.authorizedFromUtc));
  const [stopped, setStopped] = useState(toLocalInput(z.stoppedAtUtc));
  const [stopReason, setStopReason] = useState<AuthorizationStopReason>(z.stopReason ?? AuthorizationStopReason.Replaced);
  const [note, setNote] = useState(z.note ?? '');
  const [reason, setReason] = useState('');
  const drivers = useQuery({ queryKey: qk.drivers.list(PICK), queryFn: () => listDrivers(PICK) });
  const collective = type === AssignmentDriverAuthorizationType.BusinessCustomerDrivers;

  const m = useActionMutation({
    op: 'auth-correct',
    mutationFn: () => correctAuthorization(a.id, z.id, {
      authorizationType: type,
      driverId: collective ? null : driverId || null,
      authorizedFromUtc: fromLocalInput(from),
      stoppedAtUtc: stopped ? fromLocalInput(stopped) : null,
      stopReason: stopped ? stopReason : null,
      note: note.trim() || null,
      concurrencyToken: z.concurrencyToken,
      reason,
    }),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title="Correct authorization"
      icon="shield"
      tone="warn"
      width={580}
      description="A privileged correction of coverage history. The record is never deleted or reopened."
      submitLabel="Save correction"
      submitTone="warn"
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
      footnote="A correction never changes the assignment's own lifecycle."
    >
      <Section title="Corrected values">
      <EnumSelect
        label="Authorization"
        required
        value={type}
        options={businessCustomer
          ? [AssignmentDriverAuthorizationType.NamedDriver, AssignmentDriverAuthorizationType.BusinessCustomerDrivers]
          : [AssignmentDriverAuthorizationType.NamedDriver]}
        labels={AUTHORIZATION_TYPE_LABEL}
        error={m.fields['authorizationType']}
        onChange={setType}
      />
      {collective ? null : (
        <Field label="Driver" required error={m.fields['driverId']}>
          <select className={f.control} data-invalid={!!m.fields['driverId']} value={driverId} onChange={(e) => setDriverId(e.target.value)}>
            <option value="">Select a driver</option>
            {(drivers.data?.items ?? []).map((d) => (
              <option key={d.id} value={d.id}>{d.firstName} {d.lastName}{d.isActive ? '' : ' · inactive'}</option>
            ))}
          </select>
        </Field>
      )}
      <DateTimeField label="Authorized from" value={from} error={m.fields['authorizedFromUtc']} onChange={setFrom} />
      <DateTimeField label="Stopped at" value={stopped} optional error={m.fields['stoppedAtUtc']} onChange={setStopped} hint="Leave empty for an open authorization." />
      {stopped ? (
        <EnumSelect
          label="Stop reason"
          value={stopReason}
          options={STOP_REASONS}
          labels={STOP_REASON_LABEL}
          error={m.fields['stopReason']}
          onChange={setStopReason}
        />
      ) : null}
      <Field label="Note" optional error={m.fields['note']}>
        <textarea className={f.control} data-invalid={!!m.fields['note']} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      </Section>
      <Section title="Audit" cols={1}>
        <ReasonField value={reason} error={m.fields['reason']} onChange={setReason} />
      </Section>
    </Dialog>
  );
}

/* interruptions ---------------------------------------------------------- */

function InterruptionForm({ assignment: a, onClose, interruption, correct }: Common & {
  interruption?: AssignmentInterruptionResponse;
  correct?: boolean;
}) {
  const [startedAt, setStartedAt] = useState(toLocalInput(interruption?.startedAtUtc ?? new Date().toISOString()));
  const [endedAt, setEndedAt] = useState(toLocalInput(interruption?.endedAtUtc));
  const [reasonCode, setReasonCode] = useState<InterruptionReason>(interruption?.reason ?? InterruptionReason.CarRepair);
  const [billing, setBilling] = useState<BillingImpact>(interruption?.billingImpact ?? BillingImpact.NotBillable);
  const [note, setNote] = useState(interruption?.note ?? '');
  const [reason, setReason] = useState('');

  const op = correct ? 'interruption-correct' : interruption ? 'interruption-edit' : 'interruption-create';
  const m = useActionMutation({
    op,
    mutationFn: () => {
      const body = {
        startedAtUtc: fromLocalInput(startedAt),
        endedAtUtc: endedAt ? fromLocalInput(endedAt) : null,
        billingImpact: billing,
        note: note.trim(),
      };
      if (correct && interruption) {
        return correctInterruption(a.id, interruption.id, {
          ...body,
          reasonCode,
          concurrencyToken: interruption.concurrencyToken,
          reason,
        });
      }
      if (interruption) return updateInterruption(a.id, interruption.id, { ...body, reason: reasonCode });
      return createInterruption(a.id, { ...body, reason: reasonCode });
    },
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  const historic = a.status === AssignmentStatus.Ended || a.status === AssignmentStatus.Cancelled;

  return (
    <Dialog
      title={correct ? 'Correct interruption' : interruption ? 'Edit interruption' : historic ? 'Record past interruption' : 'Record interruption'}
      icon={correct ? 'shield' : 'pause_circle'}
      tone={correct ? 'warn' : 'accent'}
      width={640}
      description="A period where normal use paused. The billing impact is recorded per interruption."
      submitLabel={correct ? 'Save correction' : interruption ? 'Save changes' : 'Record interruption'}
      submitTone={correct ? 'warn' : 'primary'}
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
      footnote="An interruption belongs to the assignment as a whole. It stops no authorization and changes no status."
    >
      <Section title="Period">
      <DateTimeField label="Started at" required value={startedAt} error={m.fields['startedAtUtc']} onChange={setStartedAt} />
      <DateTimeField
        label="Ended at"
        value={endedAt}
        optional
        hint={historic ? 'Required on a closed assignment, and no later than its closing time.' : 'Leave empty while the pause is ongoing.'}
        error={m.fields['endedAtUtc']}
        onChange={setEndedAt}
      />
      </Section>
      <Section title="Classification">
      <EnumSelect
        label="Reason"
        required
        value={reasonCode}
        options={INTERRUPTION_REASONS}
        labels={INTERRUPTION_REASON_LABEL}
        error={m.fields['reason'] ?? m.fields['reasonCode']}
        onChange={setReasonCode}
      />
      <EnumSelect
        label="Billing impact"
        required
        value={billing}
        options={BILLING_IMPACTS}
        labels={BILLING_IMPACT_LABEL}
        error={m.fields['billingImpact']}
        onChange={setBilling}
      />
      <Field
        label="Note"
        required
        hint={reasonCode === InterruptionReason.Other
          ? 'Required: explain the reason the predefined values do not cover.'
          : 'Required: every interruption carries a note.'}
        error={m.fields['note']}
      >
        <textarea className={f.control} data-invalid={!!m.fields['note']} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      </Section>
      {correct ? (
        <Section title="Audit" cols={1}>
          <ReasonField value={reason} error={m.fields['reason']} onChange={setReason} />
        </Section>
      ) : null}
    </Dialog>
  );
}

function InterruptionEnd({ assignment: a, onClose, interruption: i }: Common & {
  interruption: AssignmentInterruptionResponse;
}) {
  const [endedAt, setEndedAt] = useState(toLocalInput(new Date().toISOString()));
  const m = useActionMutation({
    op: 'interruption-end',
    mutationFn: () => endInterruption(a.id, i.id, { endedAtUtc: fromLocalInput(endedAt) }),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title="End interruption"
      icon="play_circle"
      tone="ok"
      width={460}
      description={INTERRUPTION_REASON_LABEL[i.reason]}
      submitLabel="End interruption"
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <DateTimeField label="Ended at" required value={endedAt} error={m.fields['endedAtUtc']} onChange={setEndedAt} />
      <DialogNote icon="play_circle">
        Ending the interruption returns the assignment to normal use. The assignment itself can only
        be ended once every interruption is closed.
      </DialogNote>
    </Dialog>
  );
}

/* privileged corrections -------------------------------------------------- */

function CorrectParties({ assignment: a, onClose }: Common) {
  const [customerId, setCustomerId] = useState(a.customerId);
  const [vehicleId, setVehicleId] = useState(a.vehicleId);
  const [reason, setReason] = useState('');
  const customers = useQuery({ queryKey: qk.customers.list(PICK), queryFn: () => listCustomers(PICK) });
  const vehicles = useQuery({ queryKey: qk.vehicles.list(PICK), queryFn: () => listVehicles(PICK) });

  const m = useActionMutation({
    op: 'correct-parties',
    mutationFn: () => correctAssignmentParties(a.id, {
      customerId,
      vehicleId,
      concurrencyToken: a.concurrencyToken,
      reason,
    }),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title="Correct parties"
      icon="shield"
      tone="warn"
      width={620}
      description="Repairs a wrongly recorded customer or vehicle. Overlap, eligibility and coverage rules still apply."
      submitLabel="Save correction"
      submitTone="warn"
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
      footnote="Corrections are not a substitute for lifecycle actions."
    >
      <Section title="Corrected values">
      <Field label="Customer" error={m.fields['customerId']}>
        <select className={f.control} data-invalid={!!m.fields['customerId']} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          {(customers.data?.items ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.displayName}{c.isActive ? '' : ' · inactive'}</option>
          ))}
        </select>
      </Field>
      <Field label="Vehicle" error={m.fields['vehicleId']}>
        <select className={f.control} data-invalid={!!m.fields['vehicleId']} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
          {(vehicles.data?.items ?? []).map((v) => (
            <option key={v.id} value={v.id}>{v.plateNumber} · {v.make} {v.model}</option>
          ))}
        </select>
      </Field>
      </Section>
      <Section title="Audit" cols={1}>
        <ReasonField value={reason} error={m.fields['reason']} onChange={setReason} />
      </Section>
    </Dialog>
  );
}

function CorrectTimeline({ assignment: a, onClose }: Common) {
  const [plannedStart, setPlannedStart] = useState(toLocalInput(a.plannedStartAtUtc));
  const [startedAt, setStartedAt] = useState(toLocalInput(a.startedAtUtc));
  const [plannedEnd, setPlannedEnd] = useState(toLocalInput(a.plannedEndAtUtc));
  const [closedAt, setClosedAt] = useState(toLocalInput(a.closedAtUtc));
  const [note, setNote] = useState(a.note ?? '');
  const [reason, setReason] = useState('');

  const m = useActionMutation({
    op: 'correct-timeline',
    mutationFn: () => correctAssignmentTimeline(a.id, {
      plannedStartAtUtc: plannedStart ? fromLocalInput(plannedStart) : null,
      startedAtUtc: startedAt ? fromLocalInput(startedAt) : null,
      plannedEndAtUtc: plannedEnd ? fromLocalInput(plannedEnd) : null,
      closedAtUtc: closedAt ? fromLocalInput(closedAt) : null,
      note: note.trim() || null,
      concurrencyToken: a.concurrencyToken,
      reason,
    }),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title="Correct timeline"
      icon="shield"
      tone="warn"
      width={680}
      description="Repairs wrongly recorded planned or actual timestamps. Status is never assigned here."
      submitLabel="Save correction"
      submitTone="warn"
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
      footnote="Use Activate, End or Cancel for events that actually happened."
    >
      <Section title="Corrected dates">
      <DateTimeField label="Planned start" value={plannedStart} optional error={m.fields['plannedStartAtUtc']} onChange={setPlannedStart} />
      <DateTimeField label="Actual start" value={startedAt} optional error={m.fields['startedAtUtc']} onChange={setStartedAt} />
      <DateTimeField label="Planned end" value={plannedEnd} optional error={m.fields['plannedEndAtUtc']} onChange={setPlannedEnd} />
      <DateTimeField label="Closed at" value={closedAt} optional error={m.fields['closedAtUtc']} onChange={setClosedAt} />
      </Section>
      <Section title="Audit" cols={1}>
        <Field label="Assignment note" optional error={m.fields['note']}>
          <textarea className={f.control} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <ReasonField value={reason} error={m.fields['reason']} onChange={setReason} />
      </Section>
    </Dialog>
  );
}

/* switch ------------------------------------------------------------------ */

interface DialogsProps {
  state: AssignmentDialogState | null;
  assignment: RentalAssignmentResponse;
  customerType: CustomerType | null;
  onClose: () => void;
}

export function AssignmentDialogs({ state, ...rest }: DialogsProps) {
  if (!state) return null;
  return (
    <ReseedScope>
      <Current state={state} {...rest} />
    </ReseedScope>
  );
}

function Current({ state, assignment, customerType, onClose }: Omit<DialogsProps, 'state'> & {
  state: AssignmentDialogState;
}) {
  const business = customerType === CustomerType.Business;
  const seed = `${assignment.updatedAtUtc ?? ''}|${assignment.concurrencyToken}`;
  const auth = (id: string) => assignment.driverAuthorizations.find((z) => z.id === id);
  const int = (id: string) => assignment.interruptions.find((i) => i.id === id);

  switch (state.kind) {
    case 'edit': return <Edit key={seed} assignment={assignment} onClose={onClose} />;
    case 'activate': return <Activate assignment={assignment} onClose={onClose} />;
    case 'end': return <End assignment={assignment} onClose={onClose} />;
    case 'cancel': return <Cancel assignment={assignment} onClose={onClose} />;
    case 'auth-start': return <AuthStart assignment={assignment} onClose={onClose} businessCustomer={business} />;
    case 'auth-stop': {
      const z = auth(state.authorizationId);
      return z ? <AuthStop assignment={assignment} onClose={onClose} authorization={z} businessCustomer={business} /> : null;
    }
    case 'auth-correct': {
      const z = auth(state.authorizationId);
      return z
        ? <AuthCorrect key={z.concurrencyToken} assignment={assignment} onClose={onClose} authorization={z} businessCustomer={business} />
        : null;
    }
    case 'interruption-create': return <InterruptionForm assignment={assignment} onClose={onClose} />;
    case 'interruption-edit': {
      const i = int(state.interruptionId);
      return i ? <InterruptionForm key={i.concurrencyToken} assignment={assignment} onClose={onClose} interruption={i} /> : null;
    }
    case 'interruption-correct': {
      const i = int(state.interruptionId);
      return i ? <InterruptionForm key={i.concurrencyToken} assignment={assignment} onClose={onClose} interruption={i} correct /> : null;
    }
    case 'interruption-end': {
      const i = int(state.interruptionId);
      return i ? <InterruptionEnd assignment={assignment} onClose={onClose} interruption={i} /> : null;
    }
    case 'correct-parties': return <CorrectParties key={seed} assignment={assignment} onClose={onClose} />;
    case 'correct-timeline': return <CorrectTimeline key={seed} assignment={assignment} onClose={onClose} />;
  }
}
