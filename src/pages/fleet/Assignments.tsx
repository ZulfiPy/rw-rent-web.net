import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { qk } from '@/api';
import { listCustomers } from '@/api/customers';
import { listAssignments } from '@/api/rentalAssignments';
import { listVehicles } from '@/api/vehicles';
import { AssignmentStatus, type RentalAssignmentsQuery } from '@/api/dto';
import { toFailure } from '@/api/problem';
import { ASSIGNMENT_STATUS_LABEL, endOfDayLocal, formatLocal, relative, startOfDayLocal } from '@/format';
import { useTier } from '@/app/useViewport';
import { useAccess } from '@/permissions/usePermissions';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import {
  ClearFilters, MoreDate, MoreFiltersRow, MoreSelect, SearchInput, SelectFilter, type FilterOption,
} from '@/ui/Filters';
import { PageHeader } from '@/ui/PageHeader';
import { Pagination } from '@/ui/Pagination';
import { ASSIGNMENT_STATUS_DOT, ASSIGNMENT_STATUS_TONE } from '@/ui/status';
import cards from '@/ui/cards.module.css';
import filters from '@/ui/Filters.module.css';
import list from '@/ui/list.module.css';
import table from '@/ui/table.module.css';
import { NewAssignmentDialog } from './NewAssignment';
import styles from './Assignments.module.css';

const DEFAULT_PAGE_SIZE = 20;

const STATUS_OPTIONS: FilterOption[] = [
  { value: '', label: 'All statuses' },
  { value: String(AssignmentStatus.Active), label: 'Active' },
  { value: String(AssignmentStatus.Planned), label: 'Planned' },
  { value: String(AssignmentStatus.Ended), label: 'Ended' },
  { value: String(AssignmentStatus.Cancelled), label: 'Cancelled' },
];

const when = (instant?: string | null) => (instant ? formatLocal(instant) : null);

export function Assignments() {
  const [params, setParams] = useSearchParams();
  const { can } = useAccess();
  const phone = useTier() === 'phone';
  const canManage = can('RentalAssignments.Manage');
  const [creating, setCreating] = useState(false);

  const search = params.get('search') ?? '';
  const status = params.get('status') ?? '';
  const customer = params.get('customer') ?? '';
  const vehicle = params.get('vehicle') ?? '';
  /** The prototype's four date bounds: planned start from/to and actual start from/to. */
  const plannedFrom = params.get('plannedFrom') ?? '';
  const plannedTo = params.get('plannedTo') ?? '';
  const startedFrom = params.get('startedFrom') ?? '';
  const startedTo = params.get('startedTo') ?? '';
  const extra = [customer, vehicle, plannedFrom, plannedTo, startedFrom, startedTo];
  const more = params.get('more') === '1' || extra.some((v) => v !== '');
  const pageNumber = Math.max(1, Number(params.get('page') ?? 1));
  const pageSize = Number(params.get('size') ?? DEFAULT_PAGE_SIZE);

  const patch = (next: Record<string, string>) => {
    const merged = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value === '') merged.delete(key);
      else merged.set(key, value);
    }
    if (!('page' in next)) merged.delete('page');
    setParams(merged, { replace: true });
  };

  /** Closing the extra-filters row clears what only that row can set. */
  const closedExtras = {
    customer: '', vehicle: '', plannedFrom: '', plannedTo: '', startedFrom: '', startedTo: '',
  };

  const anyFilter = !!search || !!status || extra.some((v) => v !== '');
  const clear = () => patch({ search: '', status: '', ...closedExtras });

  const query: RentalAssignmentsQuery = {
    PageNumber: pageNumber,
    PageSize: pageSize,
    ...(search ? { Search: search } : {}),
    ...(status ? { Status: Number(status) as AssignmentStatus } : {}),
    ...(customer ? { CustomerId: customer } : {}),
    ...(vehicle ? { VehicleId: vehicle } : {}),
    // A date-only bound resolves to the edge of the chosen local day, as every date picker here does.
    ...(plannedFrom ? { PlannedFromUtc: startOfDayLocal(plannedFrom) } : {}),
    ...(plannedTo ? { PlannedToUtc: endOfDayLocal(plannedTo) } : {}),
    ...(startedFrom ? { StartedFromUtc: startOfDayLocal(startedFrom) } : {}),
    ...(startedTo ? { StartedToUtc: endOfDayLocal(startedTo) } : {}),
  };

  const assignments = useQuery({
    queryKey: qk.assignments.list(query),
    queryFn: () => listAssignments(query),
    placeholderData: keepPreviousData,
  });

  // The party filters are named lists, so they need the directories behind them.
  const customerList = useQuery({
    queryKey: qk.customers.list({ PageSize: 100 }),
    queryFn: () => listCustomers({ PageSize: 100 }),
    enabled: more && can('Customers.Read'),
    staleTime: 60_000,
  });
  const vehicleList = useQuery({
    queryKey: qk.vehicles.list({ PageSize: 100 }),
    queryFn: () => listVehicles({ PageSize: 100 }),
    enabled: more && can('Vehicles.Read'),
    staleTime: 60_000,
  });

  const page = assignments.data;
  const failure = assignments.error ? toFailure(assignments.error) : null;

  return (
    <>
      <PageHeader
        title="Rental assignments"
        description="Every vehicle handover, its authorized drivers and its interruptions."
        actionsKey={String(canManage)}
        actions={canManage ? (
          <Button label="New assignment" icon="add" tone="primary" onClick={() => setCreating(true)} />
        ) : undefined}
      />

      <section className={list.panel}>
        <div className={filters.toolbar}>
          <SearchInput
            value={search}
            placeholder="Plate, VIN or customer name"
            maxLength={50}
            onChange={(next) => patch({ search: next })}
          />
          <SelectFilter
            value={status}
            options={STATUS_OPTIONS}
            label="Status"
            onChange={(next) => patch({ status: next })}
          />
          <button
            type="button"
            className={filters.moreButton}
            aria-expanded={more}
            onClick={() => patch({ more: more ? '' : '1', ...(more ? closedExtras : {}) })}
          >
            <span data-icon aria-hidden="true" className={filters.moreIcon}>tune</span>
            {more ? 'Fewer filters' : 'More filters'}
          </button>
          <span className={filters.spacer} />
          {anyFilter ? <ClearFilters onClear={clear} /> : null}
          <span className={filters.count}>
            {page ? `${page.totalCount} record${page.totalCount === 1 ? '' : 's'}` : ''}
          </span>
        </div>

        {more ? (
          <MoreFiltersRow>
            {can('Customers.Read') ? (
              <MoreSelect
                value={customer}
                options={[
                  { value: '', label: 'Any customer' },
                  ...(customerList.data?.items ?? []).map((c) => ({ value: c.id, label: c.displayName })),
                ]}
                label="Customer"
                onChange={(next) => patch({ customer: next })}
              />
            ) : null}
            {can('Vehicles.Read') ? (
              <MoreSelect
                value={vehicle}
                options={[
                  { value: '', label: 'Any vehicle' },
                  ...(vehicleList.data?.items ?? []).map((v) => ({ value: v.id, label: `${v.plateNumber} · ${v.make} ${v.model}` })),
                ]}
                label="Vehicle"
                onChange={(next) => patch({ vehicle: next })}
              />
            ) : null}
            <MoreDate
              label="Planned start from"
              value={plannedFrom}
              onChange={(next) => patch({ plannedFrom: next })}
            />
            <MoreDate
              label="Planned start to"
              value={plannedTo}
              hint="Must not precede the lower bound."
              onChange={(next) => patch({ plannedTo: next })}
            />
            <MoreDate
              label="Actual start from"
              value={startedFrom}
              onChange={(next) => patch({ startedFrom: next })}
            />
            <MoreDate
              label="Actual start to"
              value={startedTo}
              onChange={(next) => patch({ startedTo: next })}
            />
          </MoreFiltersRow>
        ) : null}

        {failure ? (
          <EmptyState
            icon={failure.kind === 'forbidden' ? 'lock' : 'error'}
            title={failure.kind === 'forbidden' ? 'Not available to you' : 'The list could not be loaded'}
            body={
              failure.kind === 'forbidden'
                ? 'Reading rental assignments needs RentalAssignments.Read.'
                : 'message' in failure ? failure.message : 'The request was refused.'
            }
            onRetry={failure.kind === 'forbidden' ? undefined : () => void assignments.refetch()}
          />
        ) : page && page.items.length === 0 ? (
          <EmptyState
            icon="assignment"
            title={anyFilter ? 'No assignments match' : 'No assignments yet'}
            body={anyFilter
              ? 'Widen the filters to see more of the timeline.'
              : 'A handover appears here once an assignment is created.'}
          />
        ) : phone ? (
          <div className={cards.cards}>
            {page?.items.map((a) => (
              <div key={a.id} className={cards.card}>
                <div className={cards.head}>
                  <span className={cards.heading}>
                    <Link to={`/rental-assignments/${a.id}`} className={cards.title}>{a.customerDisplayName}</Link>
                    <span className={cards.sub}>{a.vehiclePlateNumber}</span>
                  </span>
                  <Chip tone={ASSIGNMENT_STATUS_TONE[a.status]} dot={ASSIGNMENT_STATUS_DOT[a.status]}>
                    {ASSIGNMENT_STATUS_LABEL[a.status]}
                  </Chip>
                </div>
                <div className={cards.facts}>
                  <span className={cards.fact}>
                    <span className={cards.factLabel}>Planned start</span>
                    <span className={cards.factMono}>{when(a.plannedStartAtUtc) ?? 'Not set'}</span>
                  </span>
                  <span className={cards.fact}>
                    <span className={cards.factLabel}>Started</span>
                    <span className={cards.factMono}>{when(a.startedAtUtc) ?? 'Not started'}</span>
                  </span>
                  <span className={cards.fact}>
                    <span className={cards.factLabel}>Planned end</span>
                    <span className={cards.factMono}>{when(a.plannedEndAtUtc) ?? 'Open ended'}</span>
                  </span>
                  <span className={cards.fact}>
                    <span className={cards.factLabel}>Closed</span>
                    <span className={cards.factMono}>{when(a.closedAtUtc) ?? 'Not closed'}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={table.scroll}>
            <table className={`${table.table} ${styles.table}`}>
              <thead>
                <tr>
                  <th scope="col" className={`${table.th} ${styles.wide}`}>Customer</th>
                  <th scope="col" className={`${table.th} ${styles.colVehicle}`}>Vehicle</th>
                  <th scope="col" className={`${table.th} ${styles.colStatus}`}>Status</th>
                  <th scope="col" className={`${table.th} ${styles.colWhen}`}>Planned start</th>
                  <th scope="col" className={`${table.th} ${styles.colWhen} ${table.foldTablet}`}>Started</th>
                  <th scope="col" className={`${table.th} ${styles.colWhen} ${table.foldNarrow}`}>Planned end</th>
                  <th scope="col" className={`${table.th} ${styles.colAction}`}>
                    <span className={table.srOnly}>Open assignment</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {page?.items.map((a) => (
                  <tr key={a.id} className={table.row}>
                    <td className={table.td}>
                      <span className={table.stack}>
                        <span className={`${table.name} ${table.oneLine}`} title={a.customerDisplayName}>
                          {a.customerDisplayName}
                        </span>
                      </span>
                    </td>
                    <td className={`${table.td} ${table.mono}`}>{a.vehiclePlateNumber}</td>
                    <td className={table.td}>
                      <Chip tone={ASSIGNMENT_STATUS_TONE[a.status]} dot={ASSIGNMENT_STATUS_DOT[a.status]}>
                        {ASSIGNMENT_STATUS_LABEL[a.status]}
                      </Chip>
                    </td>
                    <td className={table.td}>
                      <span className={table.stack}>
                        {when(a.plannedStartAtUtc)
                          ? <span className={table.mono}>{when(a.plannedStartAtUtc)}</span>
                          : <span className={table.dim}>Not set</span>}
                        <span className={`${table.sub} ${table.showTablet}`}>
                          {when(a.startedAtUtc) ? `Started ${when(a.startedAtUtc)}` : 'Not started'}
                        </span>
                        <span className={`${table.sub} ${table.showNarrow}`}>
                          {when(a.plannedEndAtUtc) ? `Until ${when(a.plannedEndAtUtc)}` : 'Open ended'}
                        </span>
                      </span>
                    </td>
                    <td className={`${table.td} ${table.foldTablet}`}>
                      {when(a.startedAtUtc)
                        ? (
                          <span className={table.stack}>
                            <span className={table.mono}>{when(a.startedAtUtc)}</span>
                            <span className={table.sub}>{relative(a.startedAtUtc)}</span>
                          </span>
                        )
                        : <span className={table.dim}>Not started</span>}
                    </td>
                    <td className={`${table.td} ${table.foldNarrow}`}>
                      <span className={table.stack}>
                        {when(a.plannedEndAtUtc)
                          ? <span className={table.mono}>{when(a.plannedEndAtUtc)}</span>
                          : <span className={table.dim}>Open ended</span>}
                        {when(a.closedAtUtc) ? (
                          <span className={`${table.sub} ${table.dim}`}>Closed {when(a.closedAtUtc)}</span>
                        ) : null}
                      </span>
                    </td>
                    <td className={table.td}>
                      <Link
                        to={`/rental-assignments/${a.id}`}
                        className={table.link}
                        aria-label={`Open the assignment for ${a.vehiclePlateNumber}`}
                      >
                        <span data-icon aria-hidden="true">chevron_right</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {page ? (
          <Pagination
            page={page}
            onPage={(n) => patch({ page: String(n) })}
            onPageSize={(size) => patch({ size: String(size) })}
          />
        ) : null}
      </section>

      <NewAssignmentDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
