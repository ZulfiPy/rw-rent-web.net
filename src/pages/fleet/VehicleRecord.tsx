import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { qk } from '@/api';
import { getVehicle } from '@/api/vehicles';
import { listAssignments } from '@/api/rentalAssignments';
import { CustomerType, VehicleAvailability } from '@/api/dto';
import { toFailure } from '@/api/problem';
import {
  ASSIGNMENT_STATUS_LABEL, BODY_TYPE_LABEL, CUSTOMER_TYPE_LABEL, FUEL_LABEL, GEARBOX_LABEL,
  VEHICLE_AVAILABILITY_LABEL, createdByName, formatLocal, lastChangedByName,
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
import {
  ASSIGNMENT_STATUS_DOT, ASSIGNMENT_STATUS_TONE, VEHICLE_AVAILABILITY_DOT,
  VEHICLE_AVAILABILITY_TONE,
} from '@/ui/status';
import { useRowNav } from '@/ui/rowNav';
import cards from '@/ui/cards.module.css';
import table from '@/ui/table.module.css';
import { FleetDialogs, useAssignmentBlockers, type FleetDialogState } from './FleetDialogs';
import { sortHistory } from './history';
import styles from './FleetRecord.module.css';

const PICK = { PageSize: 100 } as const;

export function VehicleRecord() {
  const { vehicleId = '' } = useParams();
  const rowNav = useRowNav();
  const { can } = useAccess();
  /** Below 768 the rental history is cards; the table itself starts at the portrait tier. */
  const phone = useTier() === 'phone';
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

  /** Availability is the server's (VEHICLE-009); the record shows the same chip as the list. */
  const availability = v
    ? {
      label: VEHICLE_AVAILABILITY_LABEL[v.availability],
      tone: VEHICLE_AVAILABILITY_TONE[v.availability],
      dot: VEHICLE_AVAILABILITY_DOT[v.availability],
      sub: v.availability === VehicleAvailability.Retired
        ? 'Not in the fleet'
        : v.availability === VehicleAvailability.InUse
          ? v.currentCustomerDisplayName ?? null
          : v.availability === VehicleAvailability.Reserved && v.upcomingPlannedStartAtUtc
            ? `${v.upcomingCustomerDisplayName ?? 'Reserved'} · from ${formatLocal(v.upcomingPlannedStartAtUtc)}`
            : null,
    }
    : { label: 'Retired', tone: 'mute' as const, dot: '1px', sub: 'Not in the fleet' };

  const blockedReason = blockers.length
    ? `This vehicle is on ${blockers.length} planned or active assignment(s). Cancel, reassign or end these first.`
    : null;

  /** The assignment row carries its customer's type. */
  const customerType = (a: { customerType: CustomerType }) => CUSTOMER_TYPE_LABEL[a.customerType];

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
        <FactGrid columns={4}>
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
        ) : phone ? (
          <div className={cards.cards}>
            {rows.map((a) => (
              <div key={a.id} className={cards.card}>
                <div className={cards.head}>
                  <span className={cards.heading}>
                    <Link to={`/rental-assignments/${a.id}`} className={`${cards.title} ${cards.cardTitleLink}`}>
                      {a.customerDisplayName}
                    </Link>
                    <span className={cards.sub}>{customerType(a)}</span>
                  </span>
                  <Chip tone={ASSIGNMENT_STATUS_TONE[a.status]} dot={ASSIGNMENT_STATUS_DOT[a.status]}>
                    {ASSIGNMENT_STATUS_LABEL[a.status]}
                  </Chip>
                </div>
                <div className={cards.facts}>
                  <span className={cards.fact}>
                    <span className={cards.factLabel}>Starts</span>
                    <span className={cards.factMono}>{formatLocal(a.startedAtUtc ?? a.plannedStartAtUtc)}</span>
                    <span className={cards.sub}>{a.startedAtUtc ? 'actual' : 'planned'}</span>
                  </span>
                  <span className={`${cards.fact} ${cards.cardFactEnd}`}>
                    <span className={cards.factLabel}>Ends</span>
                    <span className={cards.factMono}>{formatLocal(a.closedAtUtc ?? a.plannedEndAtUtc)}</span>
                    <span className={cards.sub}>{a.closedAtUtc ? 'closed' : 'planned'}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={table.scroll}>
            <table className={`${table.table} ${styles.history}`} data-panel>
              <thead>
                <tr>
                  <th scope="col" className={`${table.th} ${styles.colCustomer}`}>Customer</th>
                  <th scope="col" className={`${table.th} ${styles.colStatus}`}>Status</th>
                  <th scope="col" className={`${table.th} ${styles.colWhen}`}>Starts</th>
                  <th scope="col" className={`${table.th} ${styles.colWhen}`}>Ends</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} {...rowNav(`/rental-assignments/${a.id}`)}>
                    <td className={`${table.td} ${table.wrap}`}>
                      <span className={table.stack}>
                        <Link to={`/rental-assignments/${a.id}`} className={`${table.name} ${table.nameLink}`}>
                          {a.customerDisplayName}
                        </Link>
                        <span className={table.sub}>{customerType(a)}</span>
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
                      </span>
                    </td>
                    <td className={table.td}>
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
          <Fact label="Created" dim sub={v ? formatLocal(v.createdAtUtc) : null}>
            {v ? createdByName(v) : '—'}
          </Fact>
          <Fact label="Last changed" dim sub={v?.updatedAtUtc ? formatLocal(v.updatedAtUtc) : null}>
            {v ? lastChangedByName(v) : '—'}
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
