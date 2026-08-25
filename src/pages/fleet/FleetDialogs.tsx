import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/api';
import { listAssignments } from '@/api/rentalAssignments';
import {
  activateCustomer, createCustomer, deactivateCustomer, updateCustomer,
} from '@/api/customers';
import {
  activateDriver, createDriver, deactivateDriver, listDrivers, updateDriver,
} from '@/api/drivers';
import { activateVehicle, createVehicle, deactivateVehicle, updateVehicle } from '@/api/vehicles';
import {
  AssignmentStatus, BodyType, CustomerType, FuelType, GearboxType,
  type CustomerResponse, type DriverResponse, type VehicleResponse,
} from '@/api/dto';
import {
  ASSIGNMENT_STATUS_LABEL, BODY_TYPE_LABEL, CUSTOMER_TYPE_LABEL, FUEL_LABEL, GEARBOX_LABEL,
} from '@/format';
import { useActionMutation } from '@/app/useActionMutation';
import { ReseedScope } from '@/app/reseed';
import { Dialog, DialogNote } from '@/ui/Dialog';
import { Field, fieldStyles as f } from '@/ui/Field';
import styles from './FleetDialogs.module.css';

/**
 * Every write a fleet record offers. The forms are the prototype's dialogs field for field; the
 * three toggles are its `*-toggle` confirmations, including the blocked case where the record is
 * still on a planned or active assignment.
 */
export type FleetDialogState =
  | { kind: 'vehicle-create' }
  | { kind: 'vehicle-edit' }
  | { kind: 'vehicle-toggle' }
  | { kind: 'customer-create' }
  | { kind: 'customer-edit' }
  | { kind: 'customer-toggle' }
  | { kind: 'driver-create' }
  | { kind: 'driver-edit' }
  | { kind: 'driver-toggle' };

/** A fleet write moves the lists, the records that reference them, and the open-work counts. */
const INVALIDATE = [
  ['vehicles'], ['customers'], ['drivers'], ['rental-assignments'], ['overview'],
] as const;

const PICK = { PageSize: 100 } as const;
const BODY_TYPES = Object.values(BodyType);
const GEARBOXES = Object.values(GearboxType);
const FUELS = Object.values(FuelType);

function Text({ label, value, error, hint, optional, mono, maxLength, type = 'text', onChange }: {
  label: string;
  value: string;
  error?: string | undefined;
  hint?: string;
  optional?: boolean;
  mono?: boolean;
  maxLength?: number;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date';
  onChange: (next: string) => void;
}) {
  return (
    <Field label={label} error={error} hint={hint} optional={optional}>
      <input
        type={type}
        className={`${f.control} ${mono ? f.mono : ''}`}
        data-invalid={!!error}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

function EnumSelect<T extends number>({ label, value, options, labels, error, onChange }: {
  label: string;
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  error?: string | undefined;
  onChange: (next: T) => void;
}) {
  return (
    <Field label={label} error={error}>
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

/** The prototype's `SEC`: a titled group whose fields sit in their own column layout. */
function Section({ title, cols = 2, note, children }: {
  title?: string;
  cols?: 1 | 2 | 3;
  note?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.section}>
      {title ? <p className={styles.sectionTitle}>{title}</p> : null}
      <div className={styles.grid} data-cols={cols}>{children}</div>
      {note ? <DialogNote>{note}</DialogNote> : null}
    </div>
  );
}

/* vehicle ---------------------------------------------------------------- */

function VehicleForm({ vehicle, onClose }: { vehicle: VehicleResponse | null; onClose: () => void }) {
  const editing = !!vehicle;
  const [plateNumber, setPlate] = useState(vehicle?.plateNumber ?? '');
  const [vinCode, setVin] = useState(vehicle?.vinCode ?? '');
  const [make, setMake] = useState(vehicle?.make ?? '');
  const [model, setModel] = useState(vehicle?.model ?? '');
  const [year, setYear] = useState(String(vehicle?.year ?? 2025));
  const [color, setColor] = useState(vehicle?.color ?? '');
  const [bodyType, setBody] = useState<BodyType>(vehicle?.bodyType ?? BodyType.Sedan);
  const [gearboxType, setGearbox] = useState<GearboxType>(vehicle?.gearboxType ?? GearboxType.Automatic);
  const [fuelType, setFuel] = useState<FuelType>(vehicle?.fuelType ?? FuelType.Diesel);

  const body = () => ({
    plateNumber: plateNumber.trim(),
    vinCode: vinCode.trim(),
    make: make.trim(),
    model: model.trim(),
    year: Number(year),
    bodyType,
    gearboxType,
    fuelType,
    color: color.trim(),
  });

  const m = useActionMutation({
    op: editing ? 'vehicle-edit' : 'vehicle-create',
    mutationFn: () => (vehicle ? updateVehicle(vehicle.id, body()) : createVehicle(body())),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title={editing ? 'Edit vehicle' : 'Add vehicle'}
      description="All fields are required."
      submitLabel={editing ? 'Save changes' : 'Create vehicle'}
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <Section title="Identification">
        <Text label="Plate number" value={plateNumber} error={m.fields.plateNumber} mono maxLength={20} onChange={setPlate} />
        <Text
          label="VIN code"
          value={vinCode}
          error={m.fields.vinCode}
          hint="Exactly as issued; maximum 17 characters."
          mono
          maxLength={17}
          onChange={setVin}
        />
      </Section>
      <Section title="Vehicle">
        <Text label="Make" value={make} error={m.fields.make} maxLength={100} onChange={setMake} />
        <Text label="Model" value={model} error={m.fields.model} maxLength={100} onChange={setModel} />
        <Text label="Manufacturing year" value={year} error={m.fields.year} hint="1900 or later." type="number" onChange={setYear} />
        <Text label="Colour" value={color} error={m.fields.color} maxLength={50} onChange={setColor} />
      </Section>
      <Section title="Specification" cols={3}>
        <EnumSelect label="Body type" value={bodyType} options={BODY_TYPES} labels={BODY_TYPE_LABEL} error={m.fields.bodyType} onChange={setBody} />
        <EnumSelect label="Gearbox" value={gearboxType} options={GEARBOXES} labels={GEARBOX_LABEL} error={m.fields.gearboxType} onChange={setGearbox} />
        <EnumSelect label="Fuel" value={fuelType} options={FUELS} labels={FUEL_LABEL} error={m.fields.fuelType} onChange={setFuel} />
      </Section>
    </Dialog>
  );
}

/* customer --------------------------------------------------------------- */

function CustomerForm({ customer, onClose }: { customer: CustomerResponse | null; onClose: () => void }) {
  const editing = !!customer;
  const [type, setType] = useState<CustomerType>(customer?.type ?? CustomerType.PrivateIndividual);
  const [firstName, setFirst] = useState(customer?.firstName ?? '');
  const [lastName, setLast] = useState(customer?.lastName ?? '');
  const [personalId, setPersonalId] = useState(customer?.personalId ?? '');
  const [dateOfBirth, setDob] = useState(customer?.dateOfBirth ?? '');
  const [companyName, setCompany] = useState(customer?.companyName ?? '');
  const [registrationCode, setRegCode] = useState(customer?.registrationCode ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [phoneNumber, setPhone] = useState(customer?.phoneNumber ?? '');
  const [address, setAddress] = useState(customer?.address ?? '');
  const [driverId, setDriverId] = useState(customer?.driverId ?? '');

  const business = type === CustomerType.Business;
  const drivers = useQuery({
    queryKey: qk.drivers.list(PICK),
    queryFn: () => listDrivers(PICK),
    enabled: !business,
    staleTime: 60_000,
  });

  const shared = () => ({
    firstName: business ? null : firstName.trim() || null,
    lastName: business ? null : lastName.trim() || null,
    personalId: business ? null : personalId.trim() || null,
    dateOfBirth: business ? null : dateOfBirth || null,
    companyName: business ? companyName.trim() || null : null,
    registrationCode: business ? registrationCode.trim() || null : null,
    address: address.trim(),
    email: email.trim(),
    phoneNumber: phoneNumber.trim(),
    driverId: business ? null : driverId || null,
  });

  const m = useActionMutation({
    op: editing ? 'customer-edit' : 'customer-create',
    mutationFn: () => (customer
      ? updateCustomer(customer.id, shared())
      : createCustomer({ type, ...shared() })),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title={editing ? 'Edit customer' : 'Add customer'}
      description="Identity fields depend on the customer type."
      submitLabel={editing ? 'Save changes' : 'Create customer'}
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <Section cols={1}>
        {editing ? (
          <Field label="Customer type" hint="Set at creation.">
            <p className={styles.static}>{CUSTOMER_TYPE_LABEL[type]}</p>
          </Field>
        ) : (
          <EnumSelect
            label="Customer type"
            value={type}
            options={Object.values(CustomerType)}
            labels={CUSTOMER_TYPE_LABEL}
            error={m.fields.type}
            onChange={setType}
          />
        )}
      </Section>

      {business ? (
        <Section title="Business identity">
          <Text label="Business name" value={companyName} error={m.fields.companyName} maxLength={200} onChange={setCompany} />
          <Text label="Registration code" value={registrationCode} error={m.fields.registrationCode} mono maxLength={50} onChange={setRegCode} />
        </Section>
      ) : (
        <Section title="Personal identity" note="Provide at least one of personal identifier or date of birth.">
          <Text label="First name" value={firstName} error={m.fields.firstName} maxLength={100} onChange={setFirst} />
          <Text label="Last name" value={lastName} error={m.fields.lastName} maxLength={100} onChange={setLast} />
          <Text label="Personal identifier" value={personalId} error={m.fields.personalId} optional mono maxLength={50} onChange={setPersonalId} />
          <Text label="Date of birth" value={dateOfBirth} error={m.fields.dateOfBirth} optional type="date" onChange={setDob} />
        </Section>
      )}

      <Section title="Contact">
        <Text label="Email" value={email} error={m.fields.email} type="email" maxLength={254} onChange={setEmail} />
        <Text label="Phone number" value={phoneNumber} error={m.fields.phoneNumber} type="tel" maxLength={30} onChange={setPhone} />
        <Field label="Address" error={m.fields.address}>
          <textarea
            className={f.control}
            data-invalid={!!m.fields.address}
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Driver link" cols={1}>
        {business ? (
          <Field label="Linked driver" hint="The API rejects a driver link on a business customer.">
            <p className={styles.static}>Not applicable for business customers</p>
          </Field>
        ) : (
          <Field
            label="Linked driver record"
            optional
            error={m.fields.driverId}
            hint="Optional and unique. Required before this person can drive personally, but it does not by itself grant driving permission — the driver must still be named on an assignment authorization."
          >
            <select
              className={f.control}
              data-invalid={!!m.fields.driverId}
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
            >
              <option value="">Not linked</option>
              {(drivers.data?.items ?? [])
                .filter((d) => d.isActive)
                .map((d) => (
                  <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                ))}
            </select>
          </Field>
        )}
      </Section>
    </Dialog>
  );
}

/* driver ----------------------------------------------------------------- */

function DriverForm({ driver, onClose }: { driver: DriverResponse | null; onClose: () => void }) {
  const editing = !!driver;
  const [firstName, setFirst] = useState(driver?.firstName ?? '');
  const [lastName, setLast] = useState(driver?.lastName ?? '');
  const [personalId, setPersonalId] = useState(driver?.personalId ?? '');
  const [dateOfBirth, setDob] = useState(driver?.dateOfBirth ?? '');
  const [driverLicenseNumber, setLicence] = useState(driver?.driverLicenseNumber ?? '');
  const [email, setEmail] = useState(driver?.email ?? '');
  const [phoneNumber, setPhone] = useState(driver?.phoneNumber ?? '');
  const [address, setAddress] = useState(driver?.address ?? '');

  const body = () => ({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    personalId: personalId.trim() || null,
    dateOfBirth: dateOfBirth || null,
    address: address.trim(),
    email: email.trim(),
    phoneNumber: phoneNumber.trim(),
    driverLicenseNumber: driverLicenseNumber.trim(),
  });

  const m = useActionMutation({
    op: editing ? 'driver-edit' : 'driver-create',
    mutationFn: () => (driver ? updateDriver(driver.id, body()) : createDriver(body())),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title={editing ? 'Edit driver' : 'Add driver'}
      submitLabel={editing ? 'Save changes' : 'Create driver'}
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <Section title="Identity" note="Provide at least one of personal identifier or date of birth.">
        <Text label="First name" value={firstName} error={m.fields.firstName} maxLength={100} onChange={setFirst} />
        <Text label="Last name" value={lastName} error={m.fields.lastName} maxLength={100} onChange={setLast} />
        <Text label="Personal identifier" value={personalId} error={m.fields.personalId} optional mono maxLength={50} onChange={setPersonalId} />
        <Text label="Date of birth" value={dateOfBirth} error={m.fields.dateOfBirth} optional type="date" onChange={setDob} />
      </Section>
      <Section title="Licence" cols={1}>
        <Text label="Driver licence number" value={driverLicenseNumber} error={m.fields.driverLicenseNumber} mono maxLength={50} onChange={setLicence} />
      </Section>
      <Section title="Contact">
        <Text label="Email" value={email} error={m.fields.email} type="email" maxLength={254} onChange={setEmail} />
        <Text label="Phone number" value={phoneNumber} error={m.fields.phoneNumber} type="tel" maxLength={30} onChange={setPhone} />
        <Field label="Address" error={m.fields.address}>
          <textarea
            className={f.control}
            data-invalid={!!m.fields.address}
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Field>
      </Section>
    </Dialog>
  );
}

/* activate / deactivate -------------------------------------------------- */

type ToggleKind = 'vehicle' | 'customer' | 'driver';

const TOGGLE_TAIL: Record<ToggleKind, string[]> = {
  vehicle: [
    'Cancel, reassign or end these assignments first.',
    'Deactivating a vehicle never changes an assignment.',
  ],
  customer: [
    'End or cancel these assignments first.',
    'Deactivating a customer never changes an assignment.',
  ],
  driver: [
    'Stop each authorization explicitly on the assignment page. If it is the last open one, stop it with a replacement driver.',
    'An interruption does not lift the block — only stopping the authorization does.',
  ],
};

/**
 * What the block reads against: a vehicle or customer is held by its planned and active
 * assignments, a driver by the open named-driver authorizations on active ones.
 */
export interface Blocker { label: string; state: string }

function Toggle({ kind, id, label, isActive, blockers, onClose }: {
  kind: ToggleKind;
  id: string;
  label: string;
  isActive: boolean;
  blockers: Blocker[];
  onClose: () => void;
}) {
  const call = {
    vehicle: { on: activateVehicle, off: deactivateVehicle },
    customer: { on: activateCustomer, off: deactivateCustomer },
    driver: { on: activateDriver, off: deactivateDriver },
  }[kind];

  const m = useActionMutation({
    op: `${kind}-toggle`,
    mutationFn: () => (isActive ? call.off(id) : call.on(id)),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  const blocked = isActive && blockers.length > 0;
  const lead = kind === 'customer'
    ? `This customer is responsible for ${blockers.length} planned or active assignment(s):`
    : kind === 'vehicle'
      ? `This vehicle is on ${blockers.length} planned or active assignment(s):`
      : `This driver holds an open named-driver authorization on ${blockers.length} active assignment(s):`;

  const consequences = blocked
    ? [lead, ...blockers.map((b) => `${b.label} — ${b.state}`), ...TOGGLE_TAIL[kind]]
    : isActive
      ? ['Existing assignments and history are untouched.', 'The record stays visible with an Inactive state.']
      : [];

  return (
    <Dialog
      title={`${isActive ? 'Deactivate' : 'Activate'} ${kind}`}
      description={`${label} ${isActive ? 'will stop being selectable for new assignments.' : 'becomes selectable again.'}`}
      submitLabel={isActive ? 'Deactivate' : 'Activate'}
      submitTone={isActive ? 'danger' : 'primary'}
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      {isActive ? null : <DialogNote>Existing assignments and history are unchanged.</DialogNote>}
      {consequences.length ? (
        <ul className={styles.consequences}>
          {consequences.map((c) => <li key={c} className={styles.consequence}>{c}</li>)}
        </ul>
      ) : null}
    </Dialog>
  );
}

/**
 * The blockers a vehicle or customer toggle reads. The driver's are the authorizations its own
 * record already holds, so it passes them in.
 */
export function useAssignmentBlockers(field: 'vehicleId' | 'customerId', id: string, enabled: boolean) {
  const planned = useQuery({
    queryKey: qk.assignments.list({ ...PICK, Status: AssignmentStatus.Planned }),
    queryFn: () => listAssignments({ ...PICK, Status: AssignmentStatus.Planned }),
    enabled,
  });
  const active = useQuery({
    queryKey: qk.assignments.list({ ...PICK, Status: AssignmentStatus.Active }),
    queryFn: () => listAssignments({ ...PICK, Status: AssignmentStatus.Active }),
    enabled,
  });
  const rows = [...(active.data?.items ?? []), ...(planned.data?.items ?? [])].filter(
    (a) => a[field] === id,
  );
  return rows.map((a): Blocker => ({
    label: field === 'vehicleId' ? a.customerDisplayName : a.vehiclePlateNumber,
    state: ASSIGNMENT_STATUS_LABEL[a.status],
  }));
}

export function FleetDialogs({ state, vehicle, customer, driver, blockers, onClose }: {
  state: FleetDialogState | null;
  vehicle?: VehicleResponse | null;
  customer?: CustomerResponse | null;
  driver?: DriverResponse | null;
  blockers?: Blocker[];
  onClose: () => void;
}) {
  if (!state) return null;

  const body = (() => {
    switch (state.kind) {
      case 'vehicle-create':
        return <VehicleForm vehicle={null} onClose={onClose} />;
      case 'vehicle-edit':
        return vehicle ? <VehicleForm vehicle={vehicle} onClose={onClose} /> : null;
      case 'customer-create':
        return <CustomerForm customer={null} onClose={onClose} />;
      case 'customer-edit':
        return customer ? <CustomerForm customer={customer} onClose={onClose} /> : null;
      case 'driver-create':
        return <DriverForm driver={null} onClose={onClose} />;
      case 'driver-edit':
        return driver ? <DriverForm driver={driver} onClose={onClose} /> : null;
      case 'vehicle-toggle':
        return vehicle ? (
          <Toggle
            kind="vehicle"
            id={vehicle.id}
            label={vehicle.plateNumber}
            isActive={vehicle.isActive}
            blockers={blockers ?? []}
            onClose={onClose}
          />
        ) : null;
      case 'customer-toggle':
        return customer ? (
          <Toggle
            kind="customer"
            id={customer.id}
            label={customer.type === CustomerType.Business
              ? customer.companyName ?? 'Customer'
              : `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || 'Customer'}
            isActive={customer.isActive}
            blockers={blockers ?? []}
            onClose={onClose}
          />
        ) : null;
      case 'driver-toggle':
        return driver ? (
          <Toggle
            kind="driver"
            id={driver.id}
            label={`${driver.firstName} ${driver.lastName}`}
            isActive={driver.isActive}
            blockers={blockers ?? []}
            onClose={onClose}
          />
        ) : null;
      default:
        return null;
    }
  })();

  return body ? <ReseedScope>{body}</ReseedScope> : null;
}
