import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { qk } from '@/api';
import { getCustomer } from '@/api/customers';
import { listDrivers } from '@/api/drivers';
import { listAssignments } from '@/api/rentalAssignments';
import { listVehicles } from '@/api/vehicles';
import { CustomerType } from '@/api/dto';
import { toFailure } from '@/api/problem';
import { ASSIGNMENT_STATUS_LABEL, CUSTOMER_TYPE_LABEL, formatLocal } from '@/format';
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
import { FleetDialogs, useAssignmentBlockers, type FleetDialogState } from './FleetDialogs';
import { sortHistory } from './history';
import styles from './FleetRecord.module.css';

const PICK = { PageSize: 100 } as const;

export function CustomerRecord() {
  const { customerId = '' } = useParams();
  const { can } = useAccess();
  const [dialog, setDialog] = useState<FleetDialogState | null>(null);

  const record = useQuery({
    queryKey: qk.customers.detail(customerId),
    queryFn: () => getCustomer(customerId),
  });
  const c = record.data;

  const canManage = can('Customers.Manage');
  const mayReadAssignments = can('RentalAssignments.Read');
  const business = c?.type === CustomerType.Business;

  const drivers = useQuery({
    queryKey: qk.drivers.list(PICK),
    queryFn: () => listDrivers(PICK),
    enabled: !!c?.driverId && can('Drivers.Read'),
    staleTime: 60_000,
  });
  const history = useQuery({
    queryKey: qk.assignments.list({ ...PICK, CustomerId: customerId }),
    queryFn: () => listAssignments({ ...PICK, CustomerId: customerId }),
    enabled: !!customerId && mayReadAssignments,
  });
  const vehicles = useQuery({
    queryKey: qk.vehicles.list(PICK),
    queryFn: () => listVehicles(PICK),
    enabled: mayReadAssignments && can('Vehicles.Read'),
    staleTime: 60_000,
  });

  const blockers = useAssignmentBlockers('customerId', customerId, !!c?.isActive && canManage);

  if (record.error) {
    const failure = toFailure(record.error);
    return (
      <div className={shell.page}>
        <RecordHeader backTo="/customers" backLabel="Customers" title="Customer" />
        <EmptyState
          icon={failure.kind === 'forbidden' ? 'lock' : 'contacts'}
          title={failure.kind === 'forbidden' ? 'Not available to you' : 'That customer is not available'}
          body={failure.kind === 'forbidden'
            ? 'Reading customers needs Customers.Read.'
            : 'message' in failure ? failure.message : 'The record could not be loaded.'}
          onRetry={failure.kind === 'forbidden' ? undefined : () => void record.refetch()}
        />
      </div>
    );
  }

  const name = !c
    ? 'Customer'
    : business
      ? c.companyName ?? 'Business customer'
      : `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || 'Customer';

  const linked = drivers.data?.items.find((d) => d.id === c?.driverId) ?? null;
  const rows = sortHistory(history.data?.items ?? []);
  const vehicleOf = (id: string) => vehicles.data?.items.find((v) => v.id === id) ?? null;

  const blockedReason = blockers.length
    ? `This customer is responsible for ${blockers.length} planned or active assignment(s). End or cancel these first.`
    : null;

  return (
    <div className={shell.page}>
      <RecordHeader
        backTo="/customers"
        backLabel="Customers"
        title={name}
        code={c ? (business ? `Reg. ${c.registrationCode ?? '—'}` : c.personalId ?? '—') : undefined}
        badges={c ? [
          { label: CUSTOMER_TYPE_LABEL[c.type], tone: business ? 'info' : 'mute', dot: business ? '2px' : '50%' },
          { label: c.isActive ? 'Active' : 'Inactive', tone: c.isActive ? 'ok' : 'mute', dot: c.isActive ? '50%' : '1px' },
        ] : undefined}
        actionsKey={`${c?.isActive}-${canManage}-${blockedReason ?? ''}`}
        headerActions={c && canManage ? (
          <>
            <Button label="Edit customer" icon="edit" tone="primary" onClick={() => setDialog({ kind: 'customer-edit' })} />
            <Button
              label={c.isActive ? 'Deactivate' : 'Activate'}
              icon={c.isActive ? 'toggle_off' : 'toggle_on'}
              blockedReason={c.isActive ? blockedReason : null}
              onClick={() => setDialog({ kind: 'customer-toggle' })}
            />
          </>
        ) : undefined}
      />

      <Panel
        title="Identity"
        actions={c && canManage
          ? <Button label="Edit" icon="edit" small onClick={() => setDialog({ kind: 'customer-edit' })} />
          : undefined}
        note={canManage ? null : 'Read-only: changing customers requires Fleet Manager.'}
        noteIcon="lock"
      >
        <FactGrid>
          {business ? (
            <>
              <Fact label="Business name">{c?.companyName ?? '—'}</Fact>
              <Fact label="Registration code" mono>{c?.registrationCode ?? '—'}</Fact>
              <Fact label="Customer type">{c ? CUSTOMER_TYPE_LABEL[c.type] : '—'}</Fact>
            </>
          ) : (
            <>
              <Fact label="First name">{c?.firstName ?? '—'}</Fact>
              <Fact label="Last name">{c?.lastName ?? '—'}</Fact>
              <Fact label="Personal identifier" mono dim={!c?.personalId}>{c?.personalId ?? 'Not recorded'}</Fact>
              <Fact label="Date of birth" dim={!c?.dateOfBirth}>
                {c?.dateOfBirth ? formatLocal(c.dateOfBirth, 'date') : 'Not recorded'}
              </Fact>
              <Fact label="Customer type">{c ? CUSTOMER_TYPE_LABEL[c.type] : '—'}</Fact>
            </>
          )}
        </FactGrid>
      </Panel>

      <Panel title="Contact">
        <FactGrid>
          <Fact label="Email">{c?.email ?? '—'}</Fact>
          <Fact label="Phone" mono>{c?.phoneNumber ?? '—'}</Fact>
          <Fact label="Address" span={2}>{c?.address ?? '—'}</Fact>
        </FactGrid>
      </Panel>

      <Panel
        title="Driver link"
        description="A driver link records licence details. It does not by itself allow the customer to drive an assignment."
        note={business
          ? 'Driving permission for a business customer is granted per assignment — through named drivers or company-authorized drivers.'
          : !linked
            ? 'Link a Driver record holding their licence details, then name that driver on the assignment authorization. The link alone does not grant driving permission.'
            : null}
      >
        <FactGrid>
          <Fact label="Linked driver record" dim={!linked}>
            {linked ? (
              <Link to={`/drivers/${linked.id}`}>{linked.firstName} {linked.lastName}</Link>
            ) : business ? 'Not applicable for business customers' : 'Not linked'}
          </Fact>
        </FactGrid>
      </Panel>

      <Panel
        title="Assignments"
        description="Every rental assignment this customer is responsible for. Active first, then planned by nearest start."
      >
        {!mayReadAssignments ? (
          <EmptyState
            icon="lock"
            title="Not available to you"
            body="Reading rental assignments needs RentalAssignments.Read."
          />
        ) : rows.length === 0 ? (
          <EmptyState icon="assignment" title="No assignments yet." body="" />
        ) : (
          <div className={table.scroll}>
            <table className={`${table.table} ${styles.assignments}`}>
              <thead>
                <tr>
                  <th scope="col" className={`${table.th} ${styles.colPlate}`}>Plate number</th>
                  <th scope="col" className={`${table.th} ${styles.colStatus}`}>Status</th>
                  <th scope="col" className={`${table.th} ${styles.colWhen}`}>Starts</th>
                  <th scope="col" className={`${table.th} ${styles.colWhen} ${table.foldNarrow}`}>Ends</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const v = vehicleOf(a.vehicleId);
                  return (
                    <tr key={a.id} className={table.row}>
                      <td className={table.td}>
                        <span className={table.stack}>
                          <Link to={`/rental-assignments/${a.id}`} className={`${table.name} ${table.mono}`}>
                            {a.vehiclePlateNumber}
                          </Link>
                          <span className={table.sub}>{v ? `${v.make} ${v.model}` : ''}</span>
                        </span>
                      </td>
                      <td className={table.td}>
                        <Chip tone={ASSIGNMENT_STATUS_TONE[a.status]} dot={ASSIGNMENT_STATUS_DOT[a.status]}>
                          {ASSIGNMENT_STATUS_LABEL[a.status]}
                        </Chip>
                      </td>
                      <td className={table.td}>
                        <span className={table.stack}>
                          <span className={table.mono}>{formatLocal(a.startedAtUtc ?? a.plannedStartAtUtc)}</span>
                          <span className={table.sub}>{a.startedAtUtc ? 'actual' : 'planned'}</span>
                          <span className={`${table.subMono} ${table.showNarrow}`}>
                            {formatLocal(a.closedAtUtc ?? a.plannedEndAtUtc)}
                          </span>
                        </span>
                      </td>
                      <td className={`${table.td} ${table.foldNarrow}`}>
                        <span className={table.stack}>
                          <span className={`${table.mono} ${table.dim}`}>
                            {formatLocal(a.closedAtUtc ?? a.plannedEndAtUtc)}
                          </span>
                          <span className={table.sub}>{a.closedAtUtc ? 'closed' : 'planned'}</span>
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

      <Panel title="Record">
        <FactGrid>
          <Fact label="Created" mono dim>{formatLocal(c?.createdAtUtc)}</Fact>
          <Fact label="Last updated" mono={!!c?.updatedAtUtc} dim>
            {c?.updatedAtUtc ? formatLocal(c.updatedAtUtc) : 'Never'}
          </Fact>
          <Fact label="Customer identifier" mono dim span={2}>{c?.id ?? '—'}</Fact>
        </FactGrid>
      </Panel>

      <FleetDialogs
        state={dialog}
        customer={c ?? null}
        blockers={blockers}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}
