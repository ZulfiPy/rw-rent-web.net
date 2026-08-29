import { useState } from 'react';
import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { qk } from '@/api';
import { listAuthorizations } from '@/api/authorizations';
import { listCustomers } from '@/api/customers';
import { listDrivers } from '@/api/drivers';
import { listInterruptions } from '@/api/interruptions';
import { listAssignments } from '@/api/rentalAssignments';
import { listVehicles } from '@/api/vehicles';
import {
  AssignmentDriverAuthorizationType, AssignmentStatus, SortDirection,
  type RentalAssignmentsQuery,
} from '@/api/dto';
import { toFailure } from '@/api/problem';
import {
  ASSIGNMENT_STATUS_LABEL, CUSTOMER_TYPE_LABEL, endOfDayLocal, formatLocal, startOfDayLocal,
} from '@/format';
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
const DIRECTORY = { PageSize: 100 } as const;

const STATUS_OPTIONS: FilterOption[] = [
  { value: '', label: 'Any status' },
  { value: String(AssignmentStatus.Active), label: 'Active' },
  { value: String(AssignmentStatus.Planned), label: 'Planned' },
  { value: String(AssignmentStatus.Ended), label: 'Ended' },
  { value: String(AssignmentStatus.Cancelled), label: 'Cancelled' },
];

const when = (instant?: string | null) => (instant ? formatLocal(instant) : null);

/**
 * The two headers the prototype makes sortable. Everything else is a plain label: the list's own
 * default order is the record's creation instant, newest first, which no header exposes.
 */
type SortKey = 'Status' | 'PlannedStartAtUtc';
const isSortKey = (value: string): value is SortKey =>
  value === 'Status' || value === 'PlannedStartAtUtc';

function SortHeader(props: {
  label: string;
  column: SortKey;
  sort: SortKey | '';
  dir: 'asc' | 'desc';
  className: string;
  onSort: (column: SortKey, dir: 'asc' | 'desc') => void;
}) {
  const active = props.sort === props.column;
  // The prototype's header button: first click on a column sorts ascending, and only an already
  // ascending column flips to descending.
  const next = active && props.dir === 'asc' ? 'desc' : 'asc';
  const arrow = active ? (props.dir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more';
  return (
    <th
      scope="col"
      className={`${table.th} ${props.className}`}
      aria-sort={active ? (props.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        className={`${table.sortButton} ${active ? table.sortActive : ''}`}
        aria-label={`Sort by ${props.label}`}
        onClick={() => props.onSort(props.column, next)}
      >
        <span>{props.label}</span>
        <span data-icon aria-hidden="true" className={table.sortIcon}>{arrow}</span>
      </button>
    </th>
  );
}

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
  const rawSort = params.get('sort') ?? '';
  const sort: SortKey | '' = isSortKey(rawSort) ? rawSort : '';
  const dir: 'asc' | 'desc' = params.get('dir') === 'desc' ? 'desc' : 'asc';
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
    ...(sort
      ? {
        SortBy: sort,
        SortDirection: dir === 'desc' ? SortDirection.Descending : SortDirection.Ascending,
      }
      : {}),
  };

  const assignments = useQuery({
    queryKey: qk.assignments.list(query),
    queryFn: () => listAssignments(query),
    placeholderData: keepPreviousData,
  });

  const page = assignments.data;
  const rows = page?.items ?? [];

  /*
   * The list projection carries the plate and the customer's display name and nothing else the
   * prototype's row shows. The three directories below name the vehicle model, the customer type and
   * the driver surnames; the two fan-outs read each row's open authorizations and open interruptions,
   * the way the Overview's open-work queue does. Every source is gated on its own permission, so a
   * persona reads exactly the columns its role allows and the rest stay blank.
   */
  const customerList = useQuery({
    queryKey: qk.customers.list(DIRECTORY),
    queryFn: () => listCustomers(DIRECTORY),
    enabled: can('Customers.Read'),
    staleTime: 60_000,
  });
  const vehicleList = useQuery({
    queryKey: qk.vehicles.list(DIRECTORY),
    queryFn: () => listVehicles(DIRECTORY),
    enabled: can('Vehicles.Read'),
    staleTime: 60_000,
  });
  const driverList = useQuery({
    queryKey: qk.drivers.list(DIRECTORY),
    queryFn: () => listDrivers(DIRECTORY),
    enabled: can('Drivers.Read'),
    staleTime: 60_000,
  });

  const mayReadAuths = can('DriverAuthorizations.Read');
  const mayReadInterruptions = can('Interruptions.Read');

  const authorizations = useQueries({
    queries: (mayReadAuths ? rows : []).map((a) => ({
      queryKey: qk.assignments.authorizations(a.id, { IsOpen: true }),
      queryFn: () => listAuthorizations(a.id, { IsOpen: true }),
      staleTime: 30_000,
    })),
  });
  const interruptions = useQueries({
    queries: (mayReadInterruptions ? rows : []).map((a) => ({
      queryKey: qk.assignments.interruptions(a.id, { IsOpen: true }),
      queryFn: () => listInterruptions(a.id, { IsOpen: true }),
      staleTime: 30_000,
    })),
  });

  const models = new Map((vehicleList.data?.items ?? []).map((v) => [v.id, `${v.make} ${v.model}`]));
  const types = new Map((customerList.data?.items ?? []).map((c) => [c.id, CUSTOMER_TYPE_LABEL[c.type]]));
  const surnames = new Map((driverList.data?.items ?? []).map((d) => [d.id, d.lastName]));

  /** The prototype's coverage line: the open authorizations, named by surname, or none at all. */
  const coverage = (index: number) => {
    // Without DriverAuthorizations.Read the column is not readable at all, so it says so with a dash
    // rather than claiming the assignment has no authorized driver.
    if (!mayReadAuths) return { text: '—', none: true };
    const open = authorizations[index]?.data;
    if (!open) return null;
    if (open.items.length === 0) return { text: 'None authorized', none: true };
    const names = open.items.map((z) => (
      z.authorizationType === AssignmentDriverAuthorizationType.BusinessCustomerDrivers
        ? 'Company-authorized drivers'
        : surnames.get(z.driverId ?? '') ?? 'Named driver'
    ));
    return { text: names.join(', '), none: false };
  };

  const openInterruptions = (index: number) => interruptions[index]?.data?.totalCount ?? 0;

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
            {rows.map((a) => (
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
                  <th scope="col" className={`${table.th} ${styles.colPlate}`}>Plate number</th>
                  <th scope="col" className={`${table.th} ${styles.wide}`}>Customer</th>
                  <SortHeader
                    label="Status"
                    column="Status"
                    sort={sort}
                    dir={dir}
                    className={styles.colStatus}
                    onSort={(column, next) => patch({ sort: column, dir: next })}
                  />
                  <SortHeader
                    label="Starts"
                    column="PlannedStartAtUtc"
                    sort={sort}
                    dir={dir}
                    className={styles.colWhen}
                    onSort={(column, next) => patch({ sort: column, dir: next })}
                  />
                  <th scope="col" className={`${table.th} ${styles.colWhen}`}>Ends</th>
                  <th scope="col" className={`${table.th} ${styles.colDrivers}`}>Authorized drivers</th>
                  <th scope="col" className={`${table.th} ${styles.colAction}`}>
                    <span className={table.srOnly}>Open assignment</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a, i) => {
                  const starts = when(a.startedAtUtc ?? a.plannedStartAtUtc);
                  const ends = when(a.closedAtUtc ?? a.plannedEndAtUtc);
                  const cover = coverage(i);
                  const open = openInterruptions(i);
                  return (
                    <tr key={a.id} className={table.row}>
                      <td className={table.td}>
                        <span className={table.stack}>
                          <span className={styles.plate}>{a.vehiclePlateNumber}</span>
                          <span className={table.sub}>{models.get(a.vehicleId) ?? ''}</span>
                        </span>
                      </td>
                      <td className={table.td}>
                        <span className={table.stack}>
                          <span className={table.wrap}>{a.customerDisplayName}</span>
                          <span className={table.sub}>{types.get(a.customerId) ?? ''}</span>
                        </span>
                      </td>
                      <td className={table.td}>
                        <Chip tone={ASSIGNMENT_STATUS_TONE[a.status]} dot={ASSIGNMENT_STATUS_DOT[a.status]}>
                          {ASSIGNMENT_STATUS_LABEL[a.status]}
                        </Chip>
                      </td>
                      <td className={table.td}>
                        <span className={table.stack}>
                          <span className={`${table.mono} ${a.startedAtUtc ? '' : table.dim}`}>
                            {starts ?? '—'}
                          </span>
                          <span className={table.sub}>{a.startedAtUtc ? 'actual' : 'planned'}</span>
                        </span>
                      </td>
                      <td className={table.td}>
                        <span className={table.stack}>
                          <span className={`${table.mono} ${table.dim}`}>{ends ?? '—'}</span>
                          <span className={table.sub}>{a.closedAtUtc ? 'closed' : 'planned'}</span>
                        </span>
                      </td>
                      <td className={table.td}>
                        <span className={table.stack}>
                          <span className={cover?.none ? table.dim : undefined}>{cover?.text ?? ''}</span>
                          {open ? (
                            <span className={table.sub}>
                              {`${open} open interruption${open === 1 ? '' : 's'}`}
                            </span>
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
                  );
                })}
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
