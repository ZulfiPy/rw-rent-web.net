import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { qk } from '@/api';
import { getAssignment } from '@/api/rentalAssignments';
import { getCustomer } from '@/api/customers';
import { getVehicle } from '@/api/vehicles';
import { listDrivers } from '@/api/drivers';
import { listSecurityAudit } from '@/api/securityAudit';
import { listUsers } from '@/api/users';
import {
  AssignmentDriverAuthorizationType, AssignmentStatus, CustomerType, type Uuid,
} from '@/api/dto';
import { toFailure } from '@/api/problem';
import {
  ASSIGNMENT_STATUS_LABEL, AUTHORIZATION_TYPE_LABEL, BILLING_IMPACT_LABEL, CUSTOMER_TYPE_LABEL,
  INTERRUPTION_REASON_LABEL, STOP_REASON_LABEL, eventLabel, formatLocal, formatUtc,
} from '@/format';
import { useNarrow } from '@/app/useViewport';
import { useAccess } from '@/permissions/usePermissions';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { Fact, FactGrid } from '@/ui/FactGrid';
import { Panel } from '@/ui/Panel';
import { RecordHeader, HeaderFact } from '@/ui/RecordHeader';
import { RecordBanner, RecordTabs, recordStyles as shell, type RecordTab } from '@/ui/RecordTabs';
import { ASSIGNMENT_STATUS_DOT, ASSIGNMENT_STATUS_TONE } from '@/ui/status';
import table from '@/ui/table.module.css';
import { AssignmentDialogs, type AssignmentDialogState } from './AssignmentDialogs';
import styles from './AssignmentRecord.module.css';

type TabId = 'summary' | 'coverage' | 'interruptions' | 'corrections';

const PICK = { PageSize: 100 } as const;

export function AssignmentRecord() {
  const { assignmentId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { can } = useAccess();
  const compact = useNarrow();
  const [dialog, setDialog] = useState<AssignmentDialogState | null>(null);

  const record = useQuery({
    queryKey: qk.assignments.detail(assignmentId),
    queryFn: () => getAssignment(assignmentId),
  });
  const a = record.data;

  const customer = useQuery({
    queryKey: qk.customers.detail(a?.customerId ?? ''),
    queryFn: () => getCustomer(a?.customerId ?? ''),
    enabled: !!a?.customerId && can('Customers.Read'),
  });
  const vehicle = useQuery({
    queryKey: qk.vehicles.detail(a?.vehicleId ?? ''),
    queryFn: () => getVehicle(a?.vehicleId ?? ''),
    enabled: !!a?.vehicleId && can('Vehicles.Read'),
  });
  const drivers = useQuery({
    queryKey: qk.drivers.list(PICK),
    queryFn: () => listDrivers(PICK),
    enabled: can('Drivers.Read'),
    staleTime: 60_000,
  });

  const canCorrect = can('PrivilegedCorrections.Execute');
  const canManage = can('RentalAssignments.Manage');
  const canAuth = can('DriverAuthorizations.Manage');
  const canInt = can('Interruptions.Manage');

  /** FOLLOW-UP: the audit list has no EntityId filter, so this page's history is filtered here. */
  const audit = useQuery({
    queryKey: qk.audit.list(PICK),
    queryFn: () => listSecurityAudit(PICK),
    enabled: canCorrect,
  });
  const actors = useQuery({
    queryKey: qk.users.list(PICK),
    queryFn: () => listUsers(PICK),
    enabled: canCorrect && can('Users.ReadDirectory'),
    staleTime: 60_000,
  });

  if (record.error) {
    const failure = toFailure(record.error);
    return (
      <div className={shell.page}>
        <RecordHeader backTo="/rental-assignments" backLabel="Rental assignments" title="Rental assignment" />
        <EmptyState
          icon={failure.kind === 'forbidden' ? 'lock' : 'assignment'}
          title={failure.kind === 'forbidden' ? 'Not available to you' : 'That assignment is not available'}
          body={failure.kind === 'forbidden'
            ? 'Reading rental assignments needs RentalAssignments.Read.'
            : 'message' in failure ? failure.message : 'The record could not be loaded.'}
          onRetry={failure.kind === 'forbidden' ? undefined : () => void record.refetch()}
        />
      </div>
    );
  }

  const auths = a?.driverAuthorizations ?? [];
  const ints = a?.interruptions ?? [];
  const openAuths = auths.filter((z) => !z.stoppedAtUtc);
  const openInts = ints.filter((i) => !i.endedAtUtc);
  const planned = a?.status === AssignmentStatus.Planned;
  const active = a?.status === AssignmentStatus.Active;
  const historic = a?.status === AssignmentStatus.Ended || a?.status === AssignmentStatus.Cancelled;
  const business = customer.data?.type === CustomerType.Business;

  const driverName = (id: Uuid | null | undefined) => {
    const d = drivers.data?.items.find((x) => x.id === id);
    return d ? `${d.firstName} ${d.lastName}` : null;
  };
  const actorName = (id: Uuid | null | undefined) => {
    const u = actors.data?.items.find((x) => x.id === id);
    return u ? `${u.firstName} ${u.lastName}` : 'System';
  };

  const tabs: Array<RecordTab<TabId>> = [
    { id: 'summary', label: 'Summary', icon: 'description' },
    { id: 'coverage', label: 'Authorized drivers', icon: 'group', count: auths.length },
    { id: 'interruptions', label: 'Interruptions', icon: 'pause_circle', count: ints.length },
    ...(canCorrect ? [{ id: 'corrections' as const, label: 'Corrections', icon: 'shield' }] : []),
  ];
  const wanted = params.get('tab') as TabId | null;
  const tab: TabId = tabs.some((t) => t.id === wanted) ? (wanted as TabId) : 'summary';
  const selectTab = (next: TabId) => {
    const merged = new URLSearchParams(params);
    if (next === 'summary') merged.delete('tab');
    else merged.set('tab', next);
    setParams(merged, { replace: true });
  };

  const history = (audit.data?.items ?? []).filter(
    (x) => x.entityId === a?.id
      || auths.some((z) => z.id === x.entityId)
      || ints.some((i) => i.id === x.entityId),
  );

  return (
    <div className={shell.page}>
      <RecordHeader
        backTo="/rental-assignments"
        backLabel="Rental assignments"
        title="Rental assignment"
        pageId={a?.id}
        chip={a ? {
          label: ASSIGNMENT_STATUS_LABEL[a.status],
          tone: ASSIGNMENT_STATUS_TONE[a.status],
          dot: ASSIGNMENT_STATUS_DOT[a.status],
        } : undefined}
        actions={a && canManage ? (
          <>
            {planned ? (
              <Button label="Activate" icon="play_circle" tone="primary" small onClick={() => setDialog({ kind: 'activate' })} />
            ) : null}
            {active ? (
              <Button
                label="End assignment"
                icon="stop_circle"
                tone="primary"
                small
                blockedReason={openInts.length ? 'End the open interruption before ending this assignment.' : null}
                onClick={() => setDialog({ kind: 'end' })}
              />
            ) : null}
            {planned || active ? (
              <Button label="Cancel" icon="cancel" tone="danger" small onClick={() => setDialog({ kind: 'cancel' })} />
            ) : null}
          </>
        ) : undefined}
      >
        <HeaderFact label="Plate number" value={a?.vehiclePlateNumber ?? '—'} mono />
        <HeaderFact
          label="Vehicle"
          value={vehicle.data ? `${vehicle.data.make} ${vehicle.data.model}` : '—'}
        />
        <HeaderFact label="Customer" value={a?.customerDisplayName ?? '—'} />
        <HeaderFact label="Open authorizations" value={String(openAuths.length)} mono />
        <HeaderFact label="Open interruptions" value={String(openInts.length)} mono />
      </RecordHeader>

      {openInts.length ? (
        <RecordBanner
          tone="bad"
          icon="pause_circle"
          title={openInts.length > 1 ? `${openInts.length} interruptions are open` : 'An interruption is open'}
          body={active
            ? 'Normal use is paused. This assignment cannot be ended until every open interruption has been ended.'
            : 'Normal use is paused. Close the interruption once the vehicle is back in service so billing reflects reality.'}
        />
      ) : null}

      <RecordTabs tabs={tabs} active={tab} onSelect={selectTab} />

      {tab === 'summary' ? (
        <>
          <Panel
            title="Parties"
            description="Who holds the vehicle under this assignment."
            actions={canManage && !historic
              ? <Button label="Edit" icon="edit" small onClick={() => setDialog({ kind: 'edit' })} />
              : undefined}
          >
            <FactGrid>
              <Fact
                label="Customer"
                to={a ? `/customers/${a.customerId}` : undefined}
                sub={customer.data ? CUSTOMER_TYPE_LABEL[customer.data.type] : null}
              >
                {a?.customerDisplayName ?? '—'}
              </Fact>
              <Fact label="Vehicle">
                {vehicle.data ? `${vehicle.data.make} ${vehicle.data.model}` : '—'}
              </Fact>
              <Fact label="Plate number" mono to={a ? `/vehicles/${a.vehicleId}` : undefined}>
                {a?.vehiclePlateNumber ?? '—'}
              </Fact>
              <Fact label="VIN" mono dim>{vehicle.data?.vinCode ?? '—'}</Fact>
            </FactGrid>
          </Panel>

          <Panel
            title="Lifecycle"
            description="Local time. Original UTC values are shown in the audit trail."
            note={!canManage
              ? 'Read-only: lifecycle changes require Fleet Manager.'
              : active && openInts.length
                ? 'End the open interruption before ending this assignment. An interruption belongs to the assignment as a whole, not to one driver authorization.'
                : null}
            noteIcon={canManage ? 'warning' : 'lock'}
          >
            <FactGrid>
              <Fact label="Status">{a ? ASSIGNMENT_STATUS_LABEL[a.status] : '—'}</Fact>
              <Fact label="Planned start" mono dim={!a?.plannedStartAtUtc}>{formatLocal(a?.plannedStartAtUtc)}</Fact>
              <Fact label="Actual start" mono dim={!a?.startedAtUtc}>{formatLocal(a?.startedAtUtc)}</Fact>
              <Fact label="Planned end" mono dim={!a?.plannedEndAtUtc}>{formatLocal(a?.plannedEndAtUtc)}</Fact>
              <Fact
                label={a?.status === AssignmentStatus.Cancelled ? 'Cancelled' : 'Closed'}
                mono
                dim={!a?.closedAtUtc}
              >
                {formatLocal(a?.closedAtUtc)}
              </Fact>
              <Fact label="Created" mono dim>{formatLocal(a?.createdAtUtc)}</Fact>
              <Fact label="Last updated" mono={!!a?.updatedAtUtc} dim>
                {a?.updatedAtUtc ? formatLocal(a.updatedAtUtc) : 'Never'}
              </Fact>
            </FactGrid>
          </Panel>

          <Panel
            title="Notes"
            description="The assignment note and any cancellation note are kept as separate values."
          >
            <FactGrid>
              <Fact label="Assignment note" dim={!a?.note} span="full">
                {a?.note ?? 'No note recorded'}
              </Fact>
            </FactGrid>
          </Panel>
        </>
      ) : null}

      {tab === 'coverage' ? (
        <Panel
          title="Authorized drivers"
          description="Named drivers, or collective authorization for a business customer. One mode at a time, and authorization does not follow the customer automatically."
          actions={canAuth && (planned || active)
            ? <Button label="Add authorized driver" icon="person_add" tone="primary" small onClick={() => setDialog({ kind: 'auth-start' })} />
            : undefined}
          note={!canAuth
            ? 'Read-only: authorization changes require Fleet Manager.'
            : business
              ? 'This is a business customer, so Add authorized driver also offers Company-authorized drivers — one collective authorization that replaces individually named drivers rather than adding to them.'
              : null}
          noteIcon={canAuth ? 'info' : 'lock'}
        >
          {auths.length === 0 ? (
            <EmptyState variant="panel"
              icon="group_off"
              title="No authorized drivers"
              body="This vehicle cannot be handed over until at least one driver is authorized for this rental. A Planned assignment may still be saved without a driver."
            />
          ) : (
            <div className={table.scroll}>
              <table className={`${table.table} ${styles.coverage}`}>
                <thead>
                  <tr>
                    <th scope="col" className={`${table.th} ${styles.colAuth}`}>Authorization</th>
                    <th scope="col" className={`${table.th} ${styles.wide}`}>Driver</th>
                    <th scope="col" className={`${table.th} ${styles.colWhen}`}>From</th>
                    <th scope="col" className={`${table.th} ${styles.colWhen} ${table.foldTablet}`}>Stopped</th>
                    <th scope="col" className={`${table.th} ${styles.colReason} ${table.foldNarrow}`}>Stop reason</th>
                    <th scope="col" className={`${table.th} ${table.right} ${styles.colActions}`}>
                      <span className={table.srOnly}>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auths.map((z) => {
                    const named = z.authorizationType === AssignmentDriverAuthorizationType.NamedDriver;
                    return (
                      <tr key={z.id} className={table.row}>
                        <td className={table.td}>
                          <Chip tone={named ? 'info' : 'mute'} dot={named ? '50%' : '2px'}>
                            {AUTHORIZATION_TYPE_LABEL[z.authorizationType]}
                          </Chip>
                        </td>
                        <td className={`${table.td} ${table.wrap}`}>
                          <span className={table.stack}>
                            <span className={table.name}>
                              {named ? driverName(z.driverId) ?? 'Named driver' : 'Company-authorized drivers'}
                            </span>
                            {z.note ? <span className={table.sub}>{z.note}</span> : null}
                            <span className={`${table.sub} ${table.showNarrow}`}>
                              {z.stopReason ? STOP_REASON_LABEL[z.stopReason] : 'Open authorization'}
                            </span>
                          </span>
                        </td>
                        <td className={table.td}>
                          <span className={table.stack}>
                            <span className={table.mono}>{formatLocal(z.authorizedFromUtc)}</span>
                            <span className={`${table.sub} ${table.showTablet}`}>
                              {z.stoppedAtUtc ? `to ${formatLocal(z.stoppedAtUtc)}` : 'Open'}
                            </span>
                          </span>
                        </td>
                        <td className={`${table.td} ${table.foldTablet}`}>
                          {z.stoppedAtUtc
                            ? <span className={table.mono}>{formatLocal(z.stoppedAtUtc)}</span>
                            : <Chip tone="ok" dot="50%">Open</Chip>}
                        </td>
                        <td className={`${table.td} ${table.wrap} ${table.foldNarrow} ${z.stopReason ? '' : table.dim}`}>
                          {z.stopReason ? STOP_REASON_LABEL[z.stopReason] : '—'}
                        </td>
                        <td className={table.td}>
                          <span className={table.actionsCell}>
                            {canAuth && !z.stoppedAtUtc ? (
                              <Button label="Stop" icon="person_remove" tone="warn" small row compact={compact} onClick={() => setDialog({ kind: 'auth-stop', authorizationId: z.id })} />
                            ) : null}
                            {canCorrect ? (
                              <Button label="Correct" icon="shield" small row compact={compact} onClick={() => setDialog({ kind: 'auth-correct', authorizationId: z.id })} />
                            ) : null}
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
      ) : null}

      {tab === 'interruptions' ? (
        <Panel
          title="Interruptions"
          description="Periods where normal use paused. An interruption belongs to the assignment as a whole, and the billing impact is recorded per interruption."
          actions={canInt ? (
            <Button
              label={historic ? 'Record past interruption' : 'Record interruption'}
              icon="add"
              tone="primary"
              small
              blockedReason={planned ? 'Available once the vehicle has been handed over' : null}
              onClick={() => setDialog({ kind: 'interruption-create' })}
            />
          ) : undefined}
          note={!canInt
            ? 'Read-only: recording interruptions requires Fleet Manager.'
            : planned
              ? 'Record interruption is disabled because the vehicle has not been handed over yet. It becomes available when the assignment is activated.'
              : openInts.length
                ? 'Every open interruption must be ended before the assignment itself can be ended.'
                : null}
          noteIcon={canInt ? 'info' : 'lock'}
        >
          {ints.length === 0 ? (
            <EmptyState variant="panel"
              icon={planned ? 'schedule' : 'check_circle'}
              title="No interruptions recorded"
              body={planned
                ? 'Interruptions can be recorded after the vehicle has been handed over and the assignment is Active.'
                : historic
                  ? 'This assignment ran without a recorded pause. Only a closed historical interruption can be added now.'
                  : 'This assignment has run without a recorded pause.'}
            />
          ) : (
            <div className={table.scroll}>
              <table className={`${table.table} ${styles.interruptions}`}>
                <thead>
                  <tr>
                    <th scope="col" className={`${table.th} ${styles.colPeriod}`}>Period</th>
                    <th scope="col" className={`${table.th} ${styles.colReason}`}>Reason</th>
                    <th scope="col" className={`${table.th} ${styles.colBilling} ${table.foldNarrow}`}>Billing impact</th>
                    <th scope="col" className={`${table.th} ${styles.wide} ${table.foldTablet}`}>Note</th>
                    <th scope="col" className={`${table.th} ${table.right} ${styles.colActions}`}>
                      <span className={table.srOnly}>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ints.map((i) => (
                    <tr key={i.id} className={table.row}>
                      <td className={table.td}>
                        <span className={table.stack}>
                          <span className={table.mono}>{formatLocal(i.startedAtUtc)}</span>
                          <span className={i.endedAtUtc ? table.subMono : table.sub}>
                            {i.endedAtUtc ? `to ${formatLocal(i.endedAtUtc)}` : 'ongoing'}
                          </span>
                        </span>
                      </td>
                      <td className={`${table.td} ${table.wrap}`}>
                        <span className={table.stack}>
                          <Chip
                            tone={i.endedAtUtc ? 'mute' : 'bad'}
                            dot={i.endedAtUtc ? '1px' : '50% 50% 50% 0'}
                          >
                            {INTERRUPTION_REASON_LABEL[i.reason]}
                          </Chip>
                          <span className={`${table.sub} ${table.showNarrow}`}>
                            {BILLING_IMPACT_LABEL[i.billingImpact]}
                          </span>
                          <span className={`${table.sub} ${table.showTablet}`}>{i.note}</span>
                        </span>
                      </td>
                      <td className={`${table.td} ${table.dim} ${table.foldNarrow}`}>
                        {BILLING_IMPACT_LABEL[i.billingImpact]}
                      </td>
                      <td className={`${table.td} ${table.wrap} ${table.dim} ${table.foldTablet}`}>{i.note}</td>
                      <td className={table.td}>
                        <span className={table.actionsCell}>
                          {canInt && !i.endedAtUtc ? (
                            <Button label="End" icon="play_circle" tone="ok" small row compact={compact} onClick={() => setDialog({ kind: 'interruption-end', interruptionId: i.id })} />
                          ) : null}
                          {canInt ? (
                            <Button label="Edit" icon="edit" small row compact={compact} onClick={() => setDialog({ kind: 'interruption-edit', interruptionId: i.id })} />
                          ) : null}
                          {canCorrect ? (
                            <Button label="Correct" icon="shield" small row compact={compact} onClick={() => setDialog({ kind: 'interruption-correct', interruptionId: i.id })} />
                          ) : null}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      ) : null}

      {tab === 'corrections' ? (
        <>
          <Panel
            title="Privileged corrections"
            description="Rewrite recorded data when it was entered wrongly. Every correction is audited with a reason."
            actions={
              <>
                <Button label="Correct parties" icon="swap_horiz" tone="warn" small onClick={() => setDialog({ kind: 'correct-parties' })} />
                <Button label="Correct timeline" icon="schedule" tone="warn" small onClick={() => setDialog({ kind: 'correct-timeline' })} />
              </>
            }
            note="Corrections are not a substitute for lifecycle actions. Use Activate, End or Cancel for events that actually happened."
            noteIcon="warning"
          >
            <FactGrid>
              <Fact
                label="Concurrency token"
                mono
                hint="Sent with each correction; a stale token returns 409 Conflict."
              >
                {a?.concurrencyToken ?? '—'}
              </Fact>
              <Fact label="Last updated" mono={!!a?.updatedAtUtc} dim>
                {a?.updatedAtUtc ? formatLocal(a.updatedAtUtc) : 'Never'}
              </Fact>
            </FactGrid>
          </Panel>

          <Panel
            title="Correction history"
            description="Audit entries recorded against this assignment and its children. Times in UTC."
          >
            {history.length === 0 ? (
              <EmptyState variant="panel"
                icon="history"
                title="No corrections recorded"
                body="Nothing has been rewritten on this assignment."
              />
            ) : (
              <div className={table.scroll}>
                <table className={`${table.table} ${styles.history}`}>
                  <thead>
                    <tr>
                      <th scope="col" className={`${table.th} ${styles.colEvent}`}>Event</th>
                      <th scope="col" className={`${table.th} ${styles.colActor} ${table.foldNarrow}`}>Actor</th>
                      <th scope="col" className={`${table.th} ${styles.colUtc}`}>Occurred (UTC)</th>
                      <th scope="col" className={`${table.th} ${styles.wide} ${table.foldTablet}`}>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((x) => (
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
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      ) : null}

      {a ? (
        <AssignmentDialogs
          state={dialog}
          assignment={a}
          customerType={customer.data?.type ?? null}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </div>
  );
}
