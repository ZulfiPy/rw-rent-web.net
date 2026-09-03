import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { qk } from '@/api';
import { getVehicle } from '@/api/vehicles';
import { listAssignments } from '@/api/rentalAssignments';
import { listCustomers } from '@/api/customers';
import { AssignmentStatus } from '@/api/dto';
import { toFailure } from '@/api/problem';
import {
  ASSIGNMENT_STATUS_LABEL, BODY_TYPE_LABEL, CUSTOMER_TYPE_LABEL, FUEL_LABEL, GEARBOX_LABEL,
  formatLocal,
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
import { FleetDialogs, useAssignmentBlockers, type FleetDialogState } from './FleetDialogs';
import { sortHistory } from './history';
import styles from './FleetRecord.module.css';

const PICK = { PageSize: 100 } as const;

export function VehicleRecord() {
  const { vehicleId = '' } = useParams();
  const { can } = useAccess();
  const [dialog, setDialog] = useState<FleetDialogState | null>(null);

  const record = useQuery({
    queryKey: qk.vehicles.detail(vehicleId),
    queryFn: () => getVehicle(vehicleId),
  });
  const v = record.data;

  const canManage = can('Vehicles.Manage');
  const mayReadAssignments = can('RentalAssignments.Read');

  const history = useQuery({
    queryKey: qk.assignments.list({ ...PICK, VehicleId: vehicleId }),
    queryFn: () => listAssignments({ ...PICK, VehicleId: vehicleId }),
    enabled: !!vehicleId && mayReadAssignments,
  });
  const customers = useQuery({
    queryKey: qk.customers.list(PICK),
    queryFn: () => listCustomers(PICK),
    enabled: mayReadAssignments && can('Customers.Read'),
    staleTime: 60_000,
  });

  const blockers = useAssignmentBlockers('vehicleId', vehicleId, !!v?.isActive && canManage);

  if (record.error) {
    const failure = toFailure(record.error);
    return (
      <div className={shell.page}>
        <RecordHeader backTo="/vehicles" backLabel="Vehicles" title="Vehicle" />
        <EmptyState
          icon={failure.kind === 'forbidden' ? 'lock' : 'directions_car'}
          title={failure.kind === 'forbidden' ? 'Not available to you' : 'That vehicle is not available'}
          body={failure.kind === 'forbidden'
            ? 'Reading vehicles needs Vehicles.Read.'
            : 'message' in failure ? failure.message : 'The record could not be loaded.'}
          onRetry={failure.kind === 'forbidden' ? undefined : () => void record.refetch()}
        />
      </div>
    );
  }

  const rows = sortHistory(history.data?.items ?? []);
  const holder = rows.find((a) => a.status === AssignmentStatus.Active);
  const next = rows.find((a) => a.status === AssignmentStatus.Planned);

  /** The prototype's availability(): retired, in use, reserved, otherwise available. */
  const availability = !v || !v.isActive
    ? { label: 'Retired', tone: 'mute' as const, dot: '1px', sub: 'Not in the fleet' }
    : holder
      ? { label: 'In use', tone: 'info' as const, dot: '50%', sub: holder.customerDisplayName }
      : next?.plannedStartAtUtc
        ? {
          label: 'Reserved',
          tone: 'warn' as const,
          dot: '2px',
          sub: `${next.customerDisplayName} · from ${formatLocal(next.plannedStartAtUtc)}`,
        }
        : { label: mayReadAssignments ? 'Available' : 'In the fleet', tone: 'ok' as const, dot: '50%', sub: null };

  const blockedReason = blockers.length
    ? `This vehicle is on ${blockers.length} planned or active assignment(s). Cancel, reassign or end these first.`
    : null;

  const customerType = (id: string) => {
    const c = customers.data?.items.find((x) => x.id === id);
    return c ? CUSTOMER_TYPE_LABEL[c.type] : null;
  };

  return (
    <div className={shell.page}>
      <RecordHeader
        backTo="/vehicles"
        backLabel="Vehicles"
        title={v?.plateNumber ?? 'Vehicle'}
        mono
        description={v ? `${v.make} ${v.model} · ${v.year}` : undefined}
        badges={v ? [
          { label: v.isActive ? 'Active' : 'Inactive', tone: v.isActive ? 'ok' : 'mute', dot: v.isActive ? '50%' : '1px' },
          { label: availability.label, tone: availability.tone, dot: availability.dot },
        ] : undefined}
        actionsKey={`${v?.isActive}-${canManage}-${blockedReason ?? ''}`}
        headerActions={v && canManage ? (
          <>
            <Button label="Edit vehicle" icon="edit" tone="primary" onClick={() => setDialog({ kind: 'vehicle-edit' })} />
            <Button
              label={v.isActive ? 'Deactivate' : 'Activate'}
              icon={v.isActive ? 'toggle_off' : 'toggle_on'}
              blockedReason={v.isActive ? blockedReason : null}
              onClick={() => setDialog({ kind: 'vehicle-toggle' })}
            />
          </>
        ) : undefined}
      />

      <Panel
        title="Specifications"
        actions={v && canManage
          ? <Button label="Edit" icon="edit" small onClick={() => setDialog({ kind: 'vehicle-edit' })} />
          : undefined}
        note={canManage ? null : 'Read-only: changing vehicles requires Fleet Manager.'}
        noteIcon="lock"
      >
        <FactGrid>
          <Fact label="Make">{v?.make ?? '—'}</Fact>
          <Fact label="Model">{v?.model ?? '—'}</Fact>
          <Fact label="Year" mono>{v?.year ?? '—'}</Fact>
          <Fact label="Body type">{v ? BODY_TYPE_LABEL[v.bodyType] : '—'}</Fact>
          <Fact label="Gearbox">{v ? GEARBOX_LABEL[v.gearboxType] : '—'}</Fact>
          <Fact label="Fuel">{v ? FUEL_LABEL[v.fuelType] : '—'}</Fact>
          <Fact label="Colour">{v?.color ?? '—'}</Fact>
          <Fact label="VIN code" mono>{v?.vinCode ?? '—'}</Fact>
        </FactGrid>
      </Panel>

      <Panel
        title="Rental history"
        description="Every rental assignment recorded against this vehicle. Active first, then planned by nearest start."
      >
        {!mayReadAssignments ? (
          <EmptyState variant="panel"
            icon="lock"
            title="Not available to you"
            body="Reading rental assignments needs RentalAssignments.Read."
          />
        ) : rows.length === 0 ? (
          <EmptyState variant="panel" icon="assignment" title="No rental history." body="" />
        ) : (
          <div className={table.scroll}>
            <table className={`${table.table} ${styles.history}`}>
              <thead>
                <tr>
                  <th scope="col" className={`${table.th} ${styles.colCustomer}`}>Customer</th>
                  <th scope="col" className={`${table.th} ${styles.colStatus}`}>Status</th>
                  <th scope="col" className={`${table.th} ${styles.colWhen}`}>Starts</th>
                  <th scope="col" className={`${table.th} ${styles.colWhen} ${table.foldNarrow}`}>Ends</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className={table.row}>
                    <td className={`${table.td} ${table.wrap}`}>
                      <span className={table.stack}>
                        <Link to={`/rental-assignments/${a.id}`} className={table.name}>
                          {a.customerDisplayName}
                        </Link>
                        <span className={table.sub}>{customerType(a.customerId) ?? ''}</span>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Record">
        <FactGrid>
          <Fact label="Created" mono dim>{formatLocal(v?.createdAtUtc)}</Fact>
          <Fact label="Last updated" mono={!!v?.updatedAtUtc} dim>
            {v?.updatedAtUtc ? formatLocal(v.updatedAtUtc) : 'Never'}
          </Fact>
          <Fact label="Vehicle identifier" mono dim span={2}>{v?.id ?? '—'}</Fact>
        </FactGrid>
      </Panel>

      <FleetDialogs
        state={dialog}
        vehicle={v ?? null}
        blockers={blockers}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}
