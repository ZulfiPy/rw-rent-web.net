import { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { qk } from '@/api';
import { listAuthorizations } from '@/api/authorizations';
import { listCustomers } from '@/api/customers';
import { getDriver } from '@/api/drivers';
import { listAssignments } from '@/api/rentalAssignments';
import { listSecurityAudit } from '@/api/securityAudit';
import { listUsers } from '@/api/users';
import { listVehicles } from '@/api/vehicles';
import {
  AssignmentDriverAuthorizationType, AssignmentStatus,
  type AssignmentDriverAuthorizationResponse, type RentalAssignmentListItemResponse, type Uuid,
} from '@/api/dto';
import { toFailure } from '@/api/problem';
import {
  ASSIGNMENT_STATUS_LABEL, CUSTOMER_TYPE_LABEL, STOP_REASON_LABEL, eventLabel, formatLocal,
  formatUtc,
} from '@/format';
import { useAccess } from '@/permissions/usePermissions';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { Fact, FactGrid } from '@/ui/FactGrid';
import { Panel } from '@/ui/Panel';
import { RecordHeader } from '@/ui/RecordHeader';
import { recordStyles as shell } from '@/ui/RecordTabs';
import { ASSIGNMENT_STATUS_DOT, ASSIGNMENT_STATUS_TONE } from '@/ui/status';
import table from '@/ui/table.module.css';
import { FleetDialogs, type Blocker, type FleetDialogState } from './FleetDialogs';
import styles from './FleetRecord.module.css';

const PICK = { PageSize: 100 } as const;
const cmp = (x: string, y: string) => (x < y ? -1 : x > y ? 1 : 0);

export function DriverRecord() {
  const { driverId = '' } = useParams();
  const { can } = useAccess();
  const [dialog, setDialog] = useState<FleetDialogState | null>(null);

  const record = useQuery({
    queryKey: qk.drivers.detail(driverId),
    queryFn: () => getDriver(driverId),
  });
  const d = record.data;

  const canManage = can('Drivers.Manage');
  const mayReadAuths = can('DriverAuthorizations.Read');
  const mayReadAudit = can('SecurityAudit.ReadCompany');

  const assignments = useQuery({
    queryKey: qk.assignments.list(PICK),
    queryFn: () => listAssignments(PICK),
    enabled: can('RentalAssignments.Read'),
  });
  const rows = assignments.data?.items ?? [];

  /**
   * FOLLOW-UP: authorizations are assignment-scoped in swagger, so a driver's own history fans out
   * one request per assignment. A company-wide `GET /api/authorizations?DriverId=` would collapse it.
   */
  const perAssignment = useQueries({
    queries: (mayReadAuths ? rows : []).map((a) => ({
      queryKey: qk.assignments.authorizations(a.id, { DriverId: driverId }),
      queryFn: () => listAuthorizations(a.id, { DriverId: driverId }),
    })),
  });

  const customers = useQuery({
    queryKey: qk.customers.list(PICK),
    queryFn: () => listCustomers(PICK),
    enabled: can('Customers.Read'),
    staleTime: 60_000,
  });
  const vehicles = useQuery({
    queryKey: qk.vehicles.list(PICK),
    queryFn: () => listVehicles(PICK),
    enabled: can('Vehicles.Read'),
    staleTime: 60_000,
  });
  const audit = useQuery({
    queryKey: qk.audit.list(PICK),
    queryFn: () => listSecurityAudit(PICK),
    enabled: mayReadAudit,
  });
  const actors = useQuery({
    queryKey: qk.users.list(PICK),
    queryFn: () => listUsers(PICK),
    enabled: mayReadAudit && can('Users.ReadDirectory'),
    staleTime: 60_000,
  });

  if (record.error) {
    const failure = toFailure(record.error);
    return (
      <div className={shell.page}>
        <RecordHeader backTo="/drivers" backLabel="Drivers" title="Driver" />
        <EmptyState
          icon={failure.kind === 'forbidden' ? 'lock' : 'badge'}
          title={failure.kind === 'forbidden' ? 'Not available to you' : 'That driver is not available'}
          body={failure.kind === 'forbidden'
            ? 'Reading drivers needs Drivers.Read.'
            : 'message' in failure ? failure.message : 'The record could not be loaded.'}
          onRetry={failure.kind === 'forbidden' ? undefined : () => void record.refetch()}
        />
      </div>
    );
  }

  const name = d ? `${d.firstName} ${d.lastName}` : 'Driver';
  const linked = customers.data?.items.find((c) => c.driverId === driverId) ?? null;
  const assignmentOf = (id: Uuid) => rows.find((a) => a.id === id) ?? null;
  const vehicleOf = (id: Uuid) => vehicles.data?.items.find((v) => v.id === id) ?? null;
  const customerTypeOf = (id: Uuid) => {
    const c = customers.data?.items.find((x) => x.id === id);
    return c ? CUSTOMER_TYPE_LABEL[c.type] : null;
  };

  /** One row per authorization period, open first, then by the most recent boundary. */
  const periods: AssignmentDriverAuthorizationResponse[] = [];
  perAssignment.forEach((q) => {
    for (const z of q.data?.items ?? []) {
      if (z.authorizationType === AssignmentDriverAuthorizationType.NamedDriver) periods.push(z);
    }
  });
  periods.sort((x, y) =>
    (x.stoppedAtUtc ? 1 : 0) - (y.stoppedAtUtc ? 1 : 0)
    || cmp(y.stoppedAtUtc ?? y.authorizedFromUtc ?? '', x.stoppedAtUtc ?? x.authorizedFromUtc ?? '')
    || cmp(y.authorizedFromUtc ?? '', x.authorizedFromUtc ?? ''));

  /** An open named-driver authorization on an active assignment blocks deactivation. */
  const blockers: Blocker[] = periods
    .filter((z) => !z.stoppedAtUtc)
    .map((z) => ({ z, a: assignmentOf(z.rentalAssignmentId) }))
    .filter((x): x is { z: AssignmentDriverAuthorizationResponse; a: RentalAssignmentListItemResponse } =>
      !!x.a && x.a.status === AssignmentStatus.Active)
    .map(({ a }) => ({ label: a.vehiclePlateNumber, state: ASSIGNMENT_STATUS_LABEL[a.status] }));

  const blockedReason = blockers.length
    ? `This driver holds an open named-driver authorization on ${blockers.length} active assignment(s). Stop the authorization first.`
    : null;

  const actorName = (id: Uuid | null | undefined) => {
    const u = actors.data?.items.find((x) => x.id === id);
    return u ? `${u.firstName} ${u.lastName}` : 'Unknown user';
  };

  /**
   * The prototype's driver trail: audited events against this record, newest first, with a synthetic
   * Created row when none is stored. Editing a driver is not an audited operation, so in practice
   * this panel holds the creation and any activation change.
   */
  const trail = (audit.data?.items ?? [])
    .filter((x) => x.entityType === 'Driver' && x.entityId === driverId)
    .slice()
    .sort((x, y) => cmp(y.occurredAtUtc, x.occurredAtUtc));
  const hasCreated = trail.some((x) => x.eventType === 'Driver.Created');

  return (
    <div className={shell.page}>
      <RecordHeader
        backTo="/drivers"
        backLabel="Drivers"
        title={name}
        code={d?.driverLicenseNumber}
        badges={d ? [{
          label: d.isActive ? 'Active' : 'Inactive',
          tone: d.isActive ? 'ok' : 'mute',
          dot: d.isActive ? '50%' : '1px',
        }] : undefined}
        actionsKey={`${d?.isActive}-${canManage}-${blockedReason ?? ''}`}
        headerActions={d && canManage ? (
          <>
            <Button label="Edit driver" icon="edit" tone="primary" onClick={() => setDialog({ kind: 'driver-edit' })} />
            <Button
              label={d.isActive ? 'Deactivate' : 'Activate'}
              icon={d.isActive ? 'toggle_off' : 'toggle_on'}
              blockedReason={d.isActive ? blockedReason : null}
              onClick={() => setDialog({ kind: 'driver-toggle' })}
            />
          </>
        ) : undefined}
      />

      <Panel
        title="Identity"
        actions={d && canManage
          ? <Button label="Edit" icon="edit" small onClick={() => setDialog({ kind: 'driver-edit' })} />
          : undefined}
        note={canManage ? null : 'Read-only: changing drivers requires Fleet Manager.'}
        noteIcon="lock"
      >
        <FactGrid>
          <Fact label="First name">{d?.firstName ?? '—'}</Fact>
          <Fact label="Last name">{d?.lastName ?? '—'}</Fact>
          <Fact label="Personal identifier" mono dim={!d?.personalId}>{d?.personalId ?? 'Not recorded'}</Fact>
          <Fact label="Date of birth" dim={!d?.dateOfBirth}>
            {d?.dateOfBirth ? formatLocal(d.dateOfBirth, 'date') : 'Not recorded'}
          </Fact>
          <Fact label="Driver licence number" mono span={2}>{d?.driverLicenseNumber ?? '—'}</Fact>
        </FactGrid>
      </Panel>

      <Panel title="Contact">
        <FactGrid>
          <Fact label="Email">{d?.email ?? '—'}</Fact>
          <Fact label="Phone" mono>{d?.phoneNumber ?? '—'}</Fact>
          <Fact label="Address" span={2}>{d?.address ?? '—'}</Fact>
        </FactGrid>
      </Panel>

      <Panel
        title="Linked customer"
        description="A private customer may link this driver record for their licence details."
      >
        <FactGrid>
          <Fact label="Customer" dim={!linked}>
            {linked
              ? <Link to={`/customers/${linked.id}`}>{linked.displayName}</Link>
              : 'Not linked to a customer'}
          </Fact>
        </FactGrid>
      </Panel>

      <Panel
        title="Assignments"
        description="Every assignment this driver is or was named on. One row per authorization period, open first."
      >
        {!mayReadAuths ? (
          <EmptyState variant="panel"
            icon="lock"
            title="Not available to you"
            body="Reading driver authorizations needs DriverAuthorizations.Read."
          />
        ) : periods.length === 0 ? (
          <EmptyState variant="panel" icon="assignment_ind" title="Never authorized on an assignment." body="" />
        ) : (
          <div className={table.scroll}>
            <table className={`${table.table} ${styles.assignments}`}>
              <thead>
                <tr>
                  <th scope="col" className={`${table.th} ${styles.colPlate}`}>Plate number</th>
                  <th scope="col" className={`${table.th} ${styles.colCustomer} ${table.foldNarrow}`}>Customer</th>
                  <th scope="col" className={`${table.th} ${styles.colStatus}`}>Assignment status</th>
                  <th scope="col" className={`${table.th} ${styles.colWhen}`}>Authorized from</th>
                  <th scope="col" className={`${table.th} ${styles.colWhen} ${table.foldTablet}`}>Stopped</th>
                  <th scope="col" className={`${table.th} ${styles.colReason} ${table.foldTablet}`}>Stop reason</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((z) => {
                  const a = assignmentOf(z.rentalAssignmentId);
                  const v = a ? vehicleOf(a.vehicleId) : null;
                  const reason = z.stoppedAtUtc
                    ? z.stopReason === null || z.stopReason === undefined
                      ? 'Not recorded'
                      : STOP_REASON_LABEL[z.stopReason]
                    : '—';
                  return (
                    <tr key={z.id} className={table.row}>
                      <td className={table.td}>
                        <span className={table.stack}>
                          {a ? (
                            <Link to={`/rental-assignments/${a.id}`} className={`${table.name} ${table.mono}`}>
                              {a.vehiclePlateNumber}
                            </Link>
                          ) : <span className={table.dim}>—</span>}
                          <span className={table.sub}>{v ? `${v.make} ${v.model}` : ''}</span>
                          <span className={`${table.sub} ${table.showNarrow}`}>
                            {a ? a.customerDisplayName : ''}
                          </span>
                        </span>
                      </td>
                      <td className={`${table.td} ${table.wrap} ${table.foldNarrow}`}>
                        <span className={table.stack}>
                          <span>{a ? a.customerDisplayName : '—'}</span>
                          <span className={table.sub}>
                            {a ? customerTypeOf(a.customerId) ?? '' : ''}
                          </span>
                        </span>
                      </td>
                      <td className={table.td}>
                        {a ? (
                          <Chip tone={ASSIGNMENT_STATUS_TONE[a.status]} dot={ASSIGNMENT_STATUS_DOT[a.status]}>
                            {ASSIGNMENT_STATUS_LABEL[a.status]}
                          </Chip>
                        ) : '—'}
                      </td>
                      <td className={table.td}>
                        <span className={table.stack}>
                          <span className={table.mono}>{formatLocal(z.authorizedFromUtc)}</span>
                          <span className={`${table.sub} ${table.showTablet}`}>
                            {z.stoppedAtUtc ? `stopped ${formatLocal(z.stoppedAtUtc)} · ${reason}` : 'open'}
                          </span>
                        </span>
                      </td>
                      <td className={`${table.td} ${table.foldTablet}`}>
                        {z.stoppedAtUtc
                          ? <span className={table.mono}>{formatLocal(z.stoppedAtUtc)}</span>
                          : <Chip tone="ok" dot="50%">Open</Chip>}
                      </td>
                      <td className={`${table.td} ${table.wrap} ${table.foldTablet}`}>
                        <span className={table.stack}>
                          <span className={z.stoppedAtUtc ? undefined : table.dim}>{reason}</span>
                          {z.note ? <span className={table.sub}>{z.note}</span> : null}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {mayReadAudit ? (
        <Panel
          title="Security audit"
          description="Append-only trail of this driver record. Times in UTC."
        >
          <div className={table.scroll}>
            <table className={`${table.table} ${styles.audit}`}>
              <thead>
                <tr>
                  <th scope="col" className={`${table.th} ${styles.colEvent}`}>Event</th>
                  <th scope="col" className={`${table.th} ${styles.colActor} ${table.foldNarrow}`}>Acting user</th>
                  <th scope="col" className={`${table.th} ${styles.colUtc}`}>When</th>
                  <th scope="col" className={`${table.th} ${styles.colChanged} ${table.foldTablet}`}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {trail.map((x) => (
                  <tr key={x.id} className={table.row}>
                    <td className={`${table.td} ${table.wrap}`}>
                      <span className={table.stack}>
                        <Link to={`/security-audit/${x.id}`} className={table.name}>{eventLabel(x.eventType)}</Link>
                        <span className={`${table.sub} ${table.showNarrow}`}>{actorName(x.actorUserId)}</span>
                        <span className={`${table.sub} ${table.showTablet}`}>{x.reason ?? 'No reason recorded'}</span>
                      </span>
                    </td>
                    <td className={`${table.td} ${table.dim} ${table.foldNarrow}`}>{actorName(x.actorUserId)}</td>
                    <td className={`${table.td} ${table.mono}`}>{formatUtc(x.occurredAtUtc)}</td>
                    <td className={`${table.td} ${table.wrap} ${table.dim} ${table.foldTablet}`}>
                      {x.reason ?? 'No reason recorded'}
                    </td>
                  </tr>
                ))}
                {hasCreated || !d ? null : (
                  <tr className={table.row}>
                    <td className={`${table.td} ${table.wrap}`}>
                      <span className={table.stack}>
                        <span className={table.name}>Created</span>
                        <span className={`${table.sub} ${table.showTablet}`}>Record created</span>
                      </span>
                    </td>
                    <td className={`${table.td} ${table.dim} ${table.foldNarrow}`}>Not recorded</td>
                    <td className={`${table.td} ${table.mono}`}>{formatUtc(d.createdAtUtc)}</td>
                    <td className={`${table.td} ${table.wrap} ${table.dim} ${table.foldTablet}`}>Record created</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      <Panel
        title="Insurance cases"
        description="Claims and policy records involving this driver."
        note="Insurance cases are not part of the current phase. Once the module ships, claims involving this driver appear here alongside the vehicle and assignment they belong to."
        noteIcon="construction"
        noteTone="warn"
      >
        <EmptyState variant="panel" icon="shield" title="Nothing recorded yet" body="" />
      </Panel>

      <Panel title="Record">
        <FactGrid>
          <Fact label="Created" mono dim>{formatLocal(d?.createdAtUtc)}</Fact>
          <Fact label="Last updated" mono={!!d?.updatedAtUtc} dim>
            {d?.updatedAtUtc ? formatLocal(d.updatedAtUtc) : 'Never'}
          </Fact>
          <Fact label="Driver identifier" mono dim span={2}>{d?.id ?? '—'}</Fact>
        </FactGrid>
      </Panel>

      <FleetDialogs
        state={dialog}
        driver={d ?? null}
        blockers={blockers}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}
