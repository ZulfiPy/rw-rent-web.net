import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { qk } from '@/api';
import { listCustomers } from '@/api/customers';
import { getDriver, listDriverAuthorizations } from '@/api/drivers';
import { listSecurityAudit } from '@/api/securityAudit';
import { listUsers } from '@/api/users';
import {
  AssignmentStatus,
  type DriverAuthorizationHistoryItemResponse, type Uuid,
} from '@/api/dto';
import { toFailure } from '@/api/problem';
import {
  ASSIGNMENT_STATUS_LABEL, CUSTOMER_TYPE_LABEL, STOP_REASON_LABEL, eventLabel, formatLocal,
  formatUtc,
} from '@/format';
import { useTier } from '@/app/useViewport';
import { useAccess } from '@/permissions/usePermissions';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { Fact, FactGrid } from '@/ui/FactGrid';
import { Panel } from '@/ui/Panel';
import { RecordHeader } from '@/ui/RecordHeader';
import { recordStyles as shell } from '@/ui/RecordTabs';
import { ASSIGNMENT_STATUS_DOT, ASSIGNMENT_STATUS_TONE } from '@/ui/status';
import { useRowNav } from '@/ui/rowNav';
import cards from '@/ui/cards.module.css';
import table from '@/ui/table.module.css';
import { FleetDialogs, type Blocker, type FleetDialogState } from './FleetDialogs';
import styles from './FleetRecord.module.css';

const PICK = { PageSize: 100 } as const;
/** One page holds a driver's whole authorization history in this dataset. */
const HISTORY = { PageSize: 100 } as const;
const cmp = (x: string, y: string) => (x < y ? -1 : x > y ? 1 : 0);

export function DriverRecord() {
  const { driverId = '' } = useParams();
  const rowNav = useRowNav();
  /** Below 768 the assignments table is cards, as the customer record's assignments are. */
  const phone = useTier() === 'phone';
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

  /**
   * The driver's own authorization history: one request, newest first, each row carrying the
   * assignment's status and its vehicle and customer. Nothing is read per assignment.
   */
  const authorizations = useQuery({
    queryKey: qk.drivers.authorizations(driverId, HISTORY),
    queryFn: () => listDriverAuthorizations(driverId, HISTORY),
    enabled: !!driverId && mayReadAuths,
  });

  const customers = useQuery({
    queryKey: qk.customers.list(PICK),
    queryFn: () => listCustomers(PICK),
    enabled: can('Customers.Read'),
    staleTime: 60_000,
  });
  /** This record's own entries, filtered on the server by entity type and identifier. */
  const auditQuery = { EntityType: 'Driver', EntityId: driverId, PageSize: 100 };
  const audit = useQuery({
    queryKey: qk.audit.list(auditQuery),
    queryFn: () => listSecurityAudit(auditQuery),
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
  /* The customers query resolves after the driver, so a linked driver must not read as "Not linked
     to a customer" in between — that state is only for a loaded list holding no link. */
  const linked = customers.data?.items.find((c) => c.driverId === driverId) ?? null;
  const linkPending = !customers.data;

  /** One row per authorization period, open first, then by the most recent boundary. */
  const periods = [...(authorizations.data?.items ?? [])];
  periods.sort((x, y) =>
    (x.stoppedAtUtc ? 1 : 0) - (y.stoppedAtUtc ? 1 : 0)
    || cmp(y.stoppedAtUtc ?? y.authorizedFromUtc ?? '', x.stoppedAtUtc ?? x.authorizedFromUtc ?? '')
    || cmp(y.authorizedFromUtc ?? '', x.authorizedFromUtc ?? ''));

  /** An open named-driver authorization on an active assignment blocks deactivation. */
  const blockers: Blocker[] = periods
    .filter((z) => !z.stoppedAtUtc && z.assignmentStatus === AssignmentStatus.Active)
    .map((z) => ({
      label: z.vehiclePlateNumber,
      state: ASSIGNMENT_STATUS_LABEL[z.assignmentStatus],
    }));

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
  const trail = [...(audit.data?.items ?? [])]
    .sort((x, y) => cmp(y.occurredAtUtc, x.occurredAtUtc));
  const hasCreated = trail.some((x) => x.eventType === 'Driver.Created');

  const reasonOf = (z: DriverAuthorizationHistoryItemResponse) => z.stoppedAtUtc
    ? z.stopReason === null || z.stopReason === undefined
      ? 'Not recorded'
      : STOP_REASON_LABEL[z.stopReason]
    : '\u2014';

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
        <FactGrid columns={5}>
          <Fact label="First name">{d?.firstName ?? '—'}</Fact>
          <Fact label="Last name">{d?.lastName ?? '—'}</Fact>
          <Fact label="Personal identifier" mono dim={!d?.personalId}>{d?.personalId ?? 'Not recorded'}</Fact>
          <Fact label="Date of birth" dim={!d?.dateOfBirth}>
            {d?.dateOfBirth ? formatLocal(d.dateOfBirth, 'date') : 'Not recorded'}
          </Fact>
          <Fact label="Licence number" mono>{d?.driverLicenseNumber ?? '—'}</Fact>
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
          <Fact label="Customer" dim={!linked} to={linked ? `/customers/${linked.id}` : undefined}>
            {linked ? linked.displayName : linkPending ? '—' : 'Not linked to a customer'}
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
        ) : phone ? (
          <div className={cards.cards}>
            {periods.map((z) => (
                <div key={z.id} className={cards.card}>
                  <div className={cards.facts}>
                    <span className={cards.fact}>
                      <span className={cards.factLabel}>Vehicle</span>
                      <Link
                        to={`/rental-assignments/${z.rentalAssignmentId}`}
                        className={`${cards.title} ${cards.cardPlate} ${cards.cardTitleLink}`}
                      >
                        {z.vehiclePlateNumber}
                      </Link>
                      <span className={cards.sub}>{`${z.vehicleMake} ${z.vehicleModel}`}</span>
                    </span>
                    <span className={`${cards.fact} ${cards.cardFactEnd}`}>
                      <span className={cards.factLabel}>Customer</span>
                      <Link to={`/customers/${z.customerId}`} className={`${table.name} ${table.nameLink}`}>
                        {z.customerDisplayName}
                      </Link>
                      <span className={cards.sub}>{CUSTOMER_TYPE_LABEL[z.customerType]}</span>
                    </span>
                    <span className={`${cards.fact} ${cards.cardFactStart}`}>
                      <span className={cards.factLabel}>Authorization</span>
                      {z.stoppedAtUtc ? (
                        <>
                          <Chip tone="mute" dot="1px">Stopped</Chip>
                          <span className={cards.sub}>{reasonOf(z)}</span>
                        </>
                      ) : <Chip tone="ok" dot="50%">Open</Chip>}
                    </span>
                    <span className={`${cards.fact} ${cards.cardFactEnd}`}>
                      <span className={cards.factLabel}>Assignment status</span>
                      <Chip
                        tone={ASSIGNMENT_STATUS_TONE[z.assignmentStatus]}
                        dot={ASSIGNMENT_STATUS_DOT[z.assignmentStatus]}
                      >
                        {ASSIGNMENT_STATUS_LABEL[z.assignmentStatus]}
                      </Chip>
                    </span>
                    <span className={cards.fact}>
                      <span className={cards.factLabel}>Authorized from</span>
                      <span className={cards.factMono}>{formatLocal(z.authorizedFromUtc)}</span>
                    </span>
                    {z.stoppedAtUtc ? (
                      <span className={`${cards.fact} ${cards.cardFactEnd}`}>
                        <span className={cards.factLabel}>Stopped</span>
                        <span className={cards.factMono}>{formatLocal(z.stoppedAtUtc)}</span>
                      </span>
                    ) : null}
                    {z.note ? (
                      <span className={`${cards.fact} ${cards.cardFactFull}`}>
                        <span className={cards.factLabel}>Note</span>
                        <span className={cards.factValue}>{z.note}</span>
                      </span>
                    ) : null}
                  </div>
                </div>
            ))}
          </div>
        ) : (
          <div className={table.scroll}>
            <table className={`${table.table} ${styles.assignments}`} data-panel>
              <thead>
                <tr>
                  <th scope="col" className={`${table.th} ${styles.colPlate}`}>Plate number</th>
                  <th scope="col" className={`${table.th} ${styles.colCustomer} ${table.foldPhone}`}>Customer</th>
                  <th scope="col" className={`${table.th} ${styles.colStatus}`}>Assignment status</th>
                  <th scope="col" className={`${table.th} ${styles.colWhen}`}>Authorized from</th>
                  <th scope="col" className={`${table.th} ${styles.colWhen} ${table.foldTablet}`}>Stopped</th>
                  <th scope="col" className={`${table.th} ${styles.colReason} ${table.foldTablet}`}>Stop reason</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((z) => {
                  const reason = reasonOf(z);
                  return (
                    <tr key={z.id} {...rowNav(`/rental-assignments/${z.rentalAssignmentId}`)}>
                      <td className={table.td}>
                        <span className={table.stack}>
                          <Link
                            to={`/rental-assignments/${z.rentalAssignmentId}`}
                            className={`${table.monoName} ${table.nameLink}`}
                          >
                            {z.vehiclePlateNumber}
                          </Link>
                          <span className={table.sub}>{`${z.vehicleMake} ${z.vehicleModel}`}</span>
                          <span className={`${table.sub} ${table.showPhone}`}>
                            {z.customerDisplayName}
                          </span>
                        </span>
                      </td>
                      <td className={`${table.td} ${table.wrap} ${table.foldPhone}`}>
                        <span className={table.stack}>
                          <Link to={`/customers/${z.customerId}`} className={`${table.name} ${table.nameLink}`}>
                            {z.customerDisplayName}
                          </Link>
                          <span className={table.sub}>{CUSTOMER_TYPE_LABEL[z.customerType]}</span>
                        </span>
                      </td>
                      <td className={table.td}>
                        <Chip
                          tone={ASSIGNMENT_STATUS_TONE[z.assignmentStatus]}
                          dot={ASSIGNMENT_STATUS_DOT[z.assignmentStatus]}
                        >
                          {ASSIGNMENT_STATUS_LABEL[z.assignmentStatus]}
                        </Chip>
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
            <table className={`${table.table} ${styles.audit}`} data-panel>
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
