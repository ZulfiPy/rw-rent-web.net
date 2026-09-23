import { useRef, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { qk } from '@/api';
import { listCustomers } from '@/api/customers';
import { listDrivers } from '@/api/drivers';
import { listVehicles } from '@/api/vehicles';
import { createAssignment } from '@/api/rentalAssignments';
import {
  AssignmentDriverAuthorizationType, AssignmentStatus, CustomerType, VehicleAvailability,
  type CustomerListItemResponse, type InitialAuthorizationRequest, type VehicleListItemResponse,
} from '@/api/dto';
import { fromLocalInput } from '@/format';
import { useActionMutation } from '@/app/useActionMutation';
import { ReseedScope } from '@/app/reseed';
import { Dialog, DialogSection as Section, dialogStyles as section } from '@/ui/Dialog';
import { Field, fieldStyles as f, invalidProps } from '@/ui/Field';
import { customerDriveBlock } from './driverLink';
import styles from './NewAssignment.module.css';

/** A fleet write moves the lists, the records that reference them, and the open-work counts. */
const INVALIDATE = [
  ['rental-assignments'], ['vehicles'], ['customers'], ['drivers'], ['overview'],
] as const;

const PICK = { PageSize: 100 } as const;

/** The prototype's `driveMode`: one coverage mode at a time, or none while Planned. */
export type Mode = '' | 'customer' | 'named' | 'company';

const LOCK_COMPANY_HINT = 'Collective authorization for this business customer’s drivers. '
  + 'One mode at a time — either named drivers or this.';

/**
 * The prototype's "Who will drive?" block: three coverage modes, each with its reason when the
 * customer or the assignment refuses it, and the named-driver picker under the middle one.
 * Exported for its render test.
 */
export function Coverage({ label, customer, mode, setMode, named, setNamed, companyNote, setCompanyNote, noteError, coverageError }: {
  label: string;
  customer: CustomerListItemResponse | null;
  mode: Mode;
  setMode: (next: Mode) => void;
  named: string[];
  setNamed: (next: string[]) => void;
  companyNote: string;
  setCompanyNote: (next: string) => void;
  noteError?: string | undefined;
  coverageError?: string | undefined;
}) {
  const [pick, setPick] = useState('');
  const business = customer?.type === CustomerType.Business;
  const linked = !!customer?.driverId;

  const drivers = useQuery({
    queryKey: qk.drivers.list({ ...PICK, IsActive: true }),
    queryFn: () => listDrivers({ ...PICK, IsActive: true }),
    staleTime: 60_000,
  });
  const roster = (drivers.data?.items ?? []).filter((d) => d.isActive);
  const options = roster.filter((d) => !named.includes(d.id));
  const chosen = named
    .map((id) => roster.find((d) => d.id === id) ?? null)
    .filter((d): d is NonNullable<typeof d> => !!d);

  const allowed: Record<Exclude<Mode, ''>, boolean> = {
    customer: !business && linked,
    named: true,
    company: !!business,
  };
  /* A private customer without a driver link is told where to add one (F7-2): the note links to
     the customer's record, whose Driver link panel opens the edit dialog on that section. */
  const block = customerDriveBlock(customer);
  const reason: Record<Exclude<Mode, ''>, ReactNode> = {
    customer: block?.link ? (
      <span>
        {block.message} <Link to={block.link.to}>{block.link.label}</Link>
      </span>
    ) : block?.message ?? '',
    named: '',
    company: 'Available only for business customers.',
  };

  const choices: Array<{ key: Exclude<Mode, ''>; label: string; hint: string }> = [
    {
      key: 'customer',
      label: 'The customer will drive',
      hint: 'Creates a named-driver authorization for the customer.',
    },
    {
      key: 'named',
      label: 'Select another driver',
      hint: 'Name one or more drivers from the active driver records.',
    },
    { key: 'company', label: 'Company-authorized drivers', hint: LOCK_COMPANY_HINT },
  ];

  const choose = (next: Mode) => {
    setMode(next);
    setPick('');
    if (next !== 'named') setNamed([]);
    if (next !== 'company') setCompanyNote('');
  };

  return (
    <div className={section.section}>
      <p className={section.sectionTitle}>{label}</p>
      <span className={f.choices}>
        {choices.map((c) => {
          const open = allowed[c.key];
          const checked = mode === c.key;
          return (
            <label
              key={c.key}
              className={f.choice}
              data-checked={checked}
              style={open ? undefined : { opacity: .55, cursor: 'not-allowed' }}
            >
              <input
                type="radio"
                name="drive-mode"
                {...invalidProps(checked ? coverageError : undefined)}
                checked={checked}
                disabled={!open}
                onChange={() => choose(c.key)}
              />
              <span className={f.choiceBody}>
                <span className={f.choiceRow}>{c.label}</span>
                <span className={styles.choiceHint}>{c.hint}</span>
                {open ? null : (
                  <span className={styles.choiceReason}>
                    <span data-icon aria-hidden="true" className={styles.choiceReasonIcon}>lock</span>
                    {reason[c.key]}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </span>

      {coverageError ? (
        <span role="alert" className={f.error}>
          <span data-icon aria-hidden="true" className={f.errorIcon}>error</span>
          {coverageError}
        </span>
      ) : null}

      {mode === 'named' ? (
        <div className={styles.picker}>
          <span className={styles.pickerLabel}>Named drivers</span>
          <div className={styles.pickerRow}>
            <span className={styles.search}>
              <span data-icon aria-hidden="true" className={styles.searchIcon}>search</span>
              <span className={styles.searchValue}>
                {options.find((d) => d.id === pick)
                  ? `${options.find((d) => d.id === pick)?.firstName} ${options.find((d) => d.id === pick)?.lastName}`
                  : 'Search active drivers'}
              </span>
              <span data-icon aria-hidden="true" className={styles.searchCaret}>expand_more</span>
              <select
                className={styles.searchSelect}
                aria-label="Search active drivers"
                value={pick}
                onChange={(e) => setPick(e.target.value)}
              >
                <option value="">Search active drivers</option>
                {options.map((d) => (
                  <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                ))}
              </select>
            </span>
            <button
              type="button"
              className={styles.add}
              disabled={!pick}
              onClick={() => { if (pick) { setNamed([...named, pick]); setPick(''); } }}
            >
              <span data-icon aria-hidden="true" className={styles.addIcon}>add</span>Add
            </button>
          </div>

          {chosen.length ? (
            <div className={styles.chosen}>
              {chosen.map((d) => (
                <div key={d.id} className={styles.chosenRow}>
                  <span data-icon aria-hidden="true" className={styles.chosenIcon}>badge</span>
                  <span className={styles.chosenBody}>
                    <span className={styles.chosenName}>{d.firstName} {d.lastName}</span>
                    <span className={styles.chosenSub}>{d.email}</span>
                  </span>
                  <button
                    type="button"
                    className={styles.remove}
                    aria-label={`Remove ${d.firstName} ${d.lastName}`}
                    onClick={() => setNamed(named.filter((id) => id !== d.id))}
                  >
                    <span data-icon aria-hidden="true">close</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <span className={styles.pickerEmpty}>No driver named yet. Choose a driver and press Add.</span>
          )}
          <span className={styles.pickerHint}>
            Drivers already named on this assignment are removed from the list, so the same driver
            cannot be authorized twice.
          </span>
        </div>
      ) : null}

      <div className={section.grid} data-cols="1">
        {mode === 'company' ? (
          <Field
            label="Why collective authorization applies"
            required
            hint="Required. For example the framework agreement clause that authorizes the customer’s drivers."
            error={noteError}
          >
            <textarea
              className={f.control}
              {...invalidProps(noteError)}
              rows={2}
              value={companyNote}
              onChange={(e) => setCompanyNote(e.target.value)}
            />
          </Field>
        ) : mode ? (
          <Field label="Authorized from">
            <p className={section.static}>Same as the actual start recorded above</p>
          </Field>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The chosen vehicle, when the new assignment would start Active while that vehicle is in use; null
 * otherwise. Only the vehicle list's own `availability` is read (VEHICLE-009, the server's): the API
 * still decides, and refuses such an assignment with `rental_assignments.vehicle_already_active`.
 */
export function vehicleInUse(
  vehicle: VehicleListItemResponse | null | undefined,
  initialStatus: AssignmentStatus,
): VehicleListItemResponse | null {
  return initialStatus === AssignmentStatus.Active && vehicle?.availability === VehicleAvailability.InUse
    ? vehicle
    : null;
}

/**
 * The warning under the Vehicle field (Follow-up 11, F11-2): who has the vehicle, and a link to
 * that rental. It blocks nothing.
 */
export function VehicleInUse({ vehicle }: { vehicle: VehicleListItemResponse }) {
  const who = vehicle.currentCustomerDisplayName;
  const rental = vehicle.currentAssignmentId
    ? <Link to={`/rental-assignments/${vehicle.currentAssignmentId}`}>that rental</Link>
    : 'that rental';
  return <>This vehicle is in use{who ? ` by ${who}` : ''}. End {rental} first, or plan this one.</>;
}

/** What the form starts from; the render tests seed it. */
export interface NewAssignmentForm {
  customerId: string;
  vehicleId: string;
  initialStatus: AssignmentStatus;
  mode: Mode;
  named: string[];
}

/**
 * The prototype's `assignment-create`: parties, the initial lifecycle state, the timeline that state
 * implies, driver coverage and the assignment note. A Planned assignment may be saved without a
 * driver; an Active one may not, and the footnote says so before the button refuses. An Active one
 * on a vehicle in use is warned about under the Vehicle field before anything is sent.
 */
export function NewAssignment({ onClose, initial }: { onClose: () => void; initial?: Partial<NewAssignmentForm> }) {
  const navigate = useNavigate();
  const created = useRef<string | null>(null);

  const [customerId, setCustomerId] = useState(initial?.customerId ?? '');
  const [vehicleId, setVehicleId] = useState(initial?.vehicleId ?? '');
  const [initialStatus, setInitialStatus] = useState<AssignmentStatus>(initial?.initialStatus ?? AssignmentStatus.Planned);
  const [plannedStart, setPlannedStart] = useState('');
  const [startedAt, setStartedAt] = useState('');
  const [plannedEnd, setPlannedEnd] = useState('');
  const [note, setNote] = useState('');
  const [mode, setMode] = useState<Mode>(initial?.mode ?? '');
  const [named, setNamed] = useState<string[]>(initial?.named ?? []);
  const [companyNote, setCompanyNote] = useState('');

  const customers = useQuery({ queryKey: qk.customers.list(PICK), queryFn: () => listCustomers(PICK) });
  const vehicles = useQuery({ queryKey: qk.vehicles.list(PICK), queryFn: () => listVehicles(PICK) });

  const planned = initialStatus === AssignmentStatus.Planned;
  const customer = (customers.data?.items ?? []).find((c) => c.id === customerId) ?? null;
  const inUse = vehicleInUse((vehicles.data?.items ?? []).find((v) => v.id === vehicleId), initialStatus);
  const business = customer?.type === CustomerType.Business;

  /** The prototype's `driverChoiceValid`: the chosen mode has everything it needs. */
  const coverage = mode === 'customer'
    ? !business && !!customer?.driverId
    : mode === 'named'
      ? named.length > 0
      : mode === 'company'
        ? !!business && companyNote.trim().length > 0
        : false;

  const from = fromLocalInput(planned ? plannedStart : startedAt);
  const authorizations = (): InitialAuthorizationRequest[] => {
    if (!coverage || !from) return [];
    if (mode === 'company') {
      return [{
        authorizationType: AssignmentDriverAuthorizationType.BusinessCustomerDrivers,
        driverId: null,
        authorizedFromUtc: from,
        note: companyNote.trim(),
      }];
    }
    if (mode === 'customer') {
      return customer?.driverId
        ? [{
          authorizationType: AssignmentDriverAuthorizationType.NamedDriver,
          driverId: customer.driverId,
          authorizedFromUtc: from,
          note: 'Customer driving personally.',
        }]
        : [];
    }
    return named.map((driverId) => ({
      authorizationType: AssignmentDriverAuthorizationType.NamedDriver,
      driverId,
      authorizedFromUtc: from,
      note: null,
    }));
  };

  const m = useActionMutation({
    op: 'assignment-create',
    mutationFn: async () => {
      const row = await createAssignment({
        customerId,
        vehicleId,
        initialStatus,
        plannedStartAtUtc: planned && plannedStart ? fromLocalInput(plannedStart) : null,
        startedAtUtc: !planned && startedAt ? fromLocalInput(startedAt) : null,
        plannedEndAtUtc: plannedEnd ? fromLocalInput(plannedEnd) : null,
        note: note.trim() || null,
        initialAuthorizations: authorizations(),
      });
      created.current = row.id;
      return row;
    },
    invalidate: INVALIDATE,
    onDone: () => {
      const id = created.current;
      onClose();
      // The prototype opens the record it just created.
      if (id) navigate(`/rental-assignments/${id}`);
    },
  });

  return (
    <Dialog
      title="New rental assignment"
      icon="assignment"
      tone="accent"
      width={700}
      description={planned
        ? 'A planned assignment needs a planned start and no actual start.'
        : 'An active assignment needs an actual start and at least one authorized driver.'}
      submitLabel="Create assignment"
      submitBlocked={!planned && !coverage
        ? 'An active assignment needs at least one authorized driver.'
        : null}
      busy={m.busy}
      failure={m.failure}
      footnote={planned
        ? 'A Planned assignment may be saved without a driver. One is required before it can be activated.'
        : coverage ? undefined : 'An active assignment needs at least one authorized driver.'}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <Section title="Parties">
        <Field label="Customer" required error={m.fields['customerId']}>
          <select
            className={f.control}
            {...invalidProps(m.fields['customerId'])}
            value={customerId}
            onChange={(e) => { setCustomerId(e.target.value); setMode(''); setNamed([]); setCompanyNote(''); }}
          >
            <option value="">Select a customer</option>
            {(customers.data?.items ?? []).filter((c) => c.isActive).map((c) => (
              <option key={c.id} value={c.id}>{c.displayName}</option>
            ))}
          </select>
        </Field>
        <Field
          label="Vehicle"
          required
          warning={inUse ? <VehicleInUse vehicle={inUse} /> : undefined}
          error={m.fields['vehicleId']}
        >
          <select
            className={f.control}
            {...invalidProps(m.fields['vehicleId'])}
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          >
            <option value="">Select a vehicle</option>
            {(vehicles.data?.items ?? []).filter((v) => v.isActive).map((v) => (
              <option key={v.id} value={v.id}>{v.plateNumber} · {v.make} {v.model}</option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="Lifecycle" cols={1}>
        <Field label="Initial status" required error={m.fields['initialStatus']}>
          <select
            className={f.control}
            {...invalidProps(m.fields['initialStatus'])}
            value={String(initialStatus)}
            onChange={(e) => setInitialStatus(Number(e.target.value) as AssignmentStatus)}
          >
            <option value={String(AssignmentStatus.Planned)}>Planned — not handed over yet</option>
            <option value={String(AssignmentStatus.Active)}>Active — vehicle already with the customer</option>
          </select>
        </Field>
      </Section>

      <Section title="Timeline">
        {planned ? (
          <Field label="Planned start" required error={m.fields['plannedStartAtUtc']}>
            <input
              type="datetime-local"
              className={f.control}
              {...invalidProps(m.fields['plannedStartAtUtc'])}
              value={plannedStart}
              onChange={(e) => setPlannedStart(e.target.value)}
            />
          </Field>
        ) : (
          <Field label="Actual start" required error={m.fields['startedAtUtc']}>
            <input
              type="datetime-local"
              className={f.control}
              {...invalidProps(m.fields['startedAtUtc'])}
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
            />
          </Field>
        )}
        <Field
          label="Planned end"
          hint={planned ? 'Must be later than the planned start.' : undefined}
          error={m.fields['plannedEndAtUtc']}
        >
          <input
            type="datetime-local"
            className={f.control}
            {...invalidProps(m.fields['plannedEndAtUtc'])}
            value={plannedEnd}
            onChange={(e) => setPlannedEnd(e.target.value)}
          />
        </Field>
      </Section>

      <Coverage
        label={planned ? 'Who will drive? (optional while Planned)' : 'Who will drive?'}
        customer={customer}
        mode={mode}
        setMode={setMode}
        named={named}
        setNamed={setNamed}
        companyNote={companyNote}
        setCompanyNote={setCompanyNote}
        noteError={m.fields['initialAuthorizations[].note']}
        coverageError={m.fields['driverId'] ?? m.fields['authorizationType'] ?? m.fields['authorizedFromUtc']}
      />

      <Section title="Note" cols={1}>
        <Field
          label="Assignment note"
          hint="General operational information about the assignment."
          error={m.fields['note']}
        >
          <textarea
            className={f.control}
            {...invalidProps(m.fields['note'])}
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
      </Section>
    </Dialog>
  );
}

/** The list header's write, mounted through `ReseedScope` like every other dialog. */
export function NewAssignmentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <ReseedScope>
      <NewAssignment onClose={onClose} />
    </ReseedScope>
  );
}
