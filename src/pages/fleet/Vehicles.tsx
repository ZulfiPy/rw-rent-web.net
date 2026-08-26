import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { qk } from '@/api';
import { listAssignments } from '@/api/rentalAssignments';
import { listVehicles } from '@/api/vehicles';
import {
  AssignmentStatus, BodyType, FuelType, GearboxType,
  type VehicleListItemResponse, type VehiclesQuery,
} from '@/api/dto';
import { toFailure } from '@/api/problem';
import { BODY_TYPE_LABEL, FUEL_LABEL, GEARBOX_LABEL, formatLocal } from '@/format';
import { useTier } from '@/app/useViewport';
import { useAccess } from '@/permissions/usePermissions';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import {
  ClearFilters, MoreFiltersRow, MoreSelect, SearchInput, SelectFilter, type FilterOption,
} from '@/ui/Filters';
import { PageHeader } from '@/ui/PageHeader';
import { Pagination } from '@/ui/Pagination';
import type { Tone } from '@/ui/status';
import cards from '@/ui/cards.module.css';
import filters from '@/ui/Filters.module.css';
import list from '@/ui/list.module.css';
import table from '@/ui/table.module.css';
import { FleetDialogs, type FleetDialogState } from './FleetDialogs';
import styles from './Vehicles.module.css';

const DEFAULT_PAGE_SIZE = 20;

const BODY_OPTIONS: FilterOption[] = [
  { value: '', label: 'Any body type' },
  ...Object.values(BodyType).map((v) => ({ value: String(v), label: BODY_TYPE_LABEL[v] })),
];

const FUEL_OPTIONS: FilterOption[] = [
  { value: '', label: 'Any fuel' },
  ...Object.values(FuelType).map((v) => ({ value: String(v), label: FUEL_LABEL[v] })),
];

const GEARBOX_OPTIONS: FilterOption[] = [
  { value: '', label: 'Any gearbox' },
  ...Object.values(GearboxType).map((v) => ({ value: String(v), label: GEARBOX_LABEL[v] })),
];

/** The prototype offers the five most recent years; the API itself accepts 1900 or later. */
const YEAR_OPTIONS: FilterOption[] = [
  { value: '', label: 'Any year' },
  ...[2024, 2023, 2022, 2021, 2020].map((y) => ({ value: String(y), label: String(y) })),
];

const ACTIVE_OPTIONS: FilterOption[] = [
  { value: '', label: 'Active and retired' },
  { value: 'true', label: 'In the fleet' },
  { value: 'false', label: 'Retired' },
];

interface Availability { label: string; tone: Tone; dot: string; sub: string | null }

export function Vehicles() {
  const [params, setParams] = useSearchParams();
  const { can } = useAccess();
  const phone = useTier() === 'phone';
  const canManage = can('Vehicles.Manage');
  const [dialog, setDialog] = useState<FleetDialogState | null>(null);

  const search = params.get('search') ?? '';
  const body = params.get('body') ?? '';
  const fuel = params.get('fuel') ?? '';
  const active = params.get('active') ?? '';
  const gearbox = params.get('gearbox') ?? '';
  const year = params.get('year') ?? '';
  const more = params.get('more') === '1' || gearbox !== '' || year !== '';
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

  const anyFilter = !!search || !!body || !!fuel || !!active || !!gearbox || !!year;
  const clear = () => patch({ search: '', body: '', fuel: '', active: '', gearbox: '', year: '' });

  const query: VehiclesQuery = {
    PageNumber: pageNumber,
    PageSize: pageSize,
    ...(search ? { Search: search } : {}),
    ...(body ? { BodyType: Number(body) as BodyType } : {}),
    ...(fuel ? { FuelType: Number(fuel) as FuelType } : {}),
    ...(gearbox ? { GearboxType: Number(gearbox) as GearboxType } : {}),
    ...(year ? { Year: Number(year) } : {}),
    ...(active ? { IsActive: active === 'true' } : {}),
  };

  const vehicles = useQuery({
    queryKey: qk.vehicles.list(query),
    queryFn: () => listVehicles(query),
    placeholderData: keepPreviousData,
  });

  /**
   * FOLLOW-UP: swagger has no availability field. A vehicle is In use when an active assignment
   * holds it, Reserved when the next planned one does (the mock's upcoming* projection), otherwise
   * Available — so the list reads the open assignments rather than inventing a status.
   */
  const mayReadAssignments = can('RentalAssignments.Read');
  const open = useQuery({
    queryKey: qk.assignments.list({ PageSize: 100, Status: AssignmentStatus.Active }),
    queryFn: () => listAssignments({ PageSize: 100, Status: AssignmentStatus.Active }),
    enabled: mayReadAssignments,
    staleTime: 30_000,
  });

  const inUse = new Map<string, string>();
  for (const a of open.data?.items ?? []) inUse.set(a.vehicleId, a.customerDisplayName);

  const availability = (v: VehicleListItemResponse): Availability => {
    if (!v.isActive) return { label: 'Retired', tone: 'mute', dot: '1px', sub: 'Not in the fleet' };
    const holder = inUse.get(v.id);
    if (holder) return { label: 'In use', tone: 'info', dot: '50%', sub: holder };
    if (v.upcomingPlannedStartAtUtc) {
      return {
        label: 'Reserved',
        tone: 'warn',
        dot: '2px',
        sub: `${v.upcomingCustomerDisplayName ?? 'Reserved'} · from ${formatLocal(v.upcomingPlannedStartAtUtc)}`,
      };
    }
    return {
      label: mayReadAssignments ? 'Available' : 'In the fleet',
      tone: 'ok',
      dot: '50%',
      sub: null,
    };
  };

  const page = vehicles.data;
  const failure = vehicles.error ? toFailure(vehicles.error) : null;
  const isFiltered = !!(search || body || fuel || active || gearbox || year);

  return (
    <>
      <PageHeader
        title="Vehicles"
        description="The fleet, what each vehicle is, and whether it is free to hand over."
        actionsKey={String(canManage)}
        actions={canManage ? (
          <Button label="Add vehicle" icon="add" tone="primary" onClick={() => setDialog({ kind: 'vehicle-create' })} />
        ) : undefined}
      />

      <section className={list.panel}>
        <div className={filters.toolbar}>
          <SearchInput
            value={search}
            placeholder="Plate, VIN, make or model"
            maxLength={50}
            onChange={(next) => patch({ search: next })}
          />
          <SelectFilter value={body} options={BODY_OPTIONS} label="Body" onChange={(next) => patch({ body: next })} />
          <SelectFilter value={fuel} options={FUEL_OPTIONS} label="Fuel" onChange={(next) => patch({ fuel: next })} />
          <SelectFilter value={active} options={ACTIVE_OPTIONS} label="Fleet" onChange={(next) => patch({ active: next })} />
          <button
            type="button"
            className={filters.moreButton}
            aria-expanded={more}
            onClick={() => patch({ more: more ? '' : '1', ...(more ? { gearbox: '', year: '' } : {}) })}
          >
            <span data-icon aria-hidden="true" className={filters.moreIcon}>tune</span>
            {more ? 'Fewer filters' : 'More filters'}
          </button>
          <span className={filters.spacer} />
          {anyFilter ? <ClearFilters onClear={clear} /> : null}
          <span className={filters.count}>
            {page ? `${page.totalCount} vehicle${page.totalCount === 1 ? '' : 's'}` : ''}
          </span>
        </div>

        {more ? (
          <MoreFiltersRow>
            <MoreSelect
              value={gearbox}
              options={GEARBOX_OPTIONS}
              label="Gearbox"
              onChange={(next) => patch({ gearbox: next })}
            />
            <MoreSelect
              value={year}
              options={YEAR_OPTIONS}
              label="Manufacturing year"
              hint="Exact year; the API accepts 1900 or later."
              onChange={(next) => patch({ year: next })}
            />
          </MoreFiltersRow>
        ) : null}

        {failure ? (
          <EmptyState
            icon={failure.kind === 'forbidden' ? 'lock' : 'error'}
            title={failure.kind === 'forbidden' ? 'Not available to you' : 'The fleet could not be loaded'}
            body={
              failure.kind === 'forbidden'
                ? 'Reading vehicles needs Vehicles.Read.'
                : 'message' in failure ? failure.message : 'The request was refused.'
            }
            onRetry={failure.kind === 'forbidden' ? undefined : () => void vehicles.refetch()}
          />
        ) : page && page.items.length === 0 ? (
          <EmptyState
            icon="directions_car"
            title={isFiltered ? 'No vehicles match' : 'No vehicles yet'}
            body={isFiltered
              ? 'Widen the search, the body, fuel or fleet filter.'
              : 'A vehicle appears here once it is added to the fleet.'}
          />
        ) : phone ? (
          <div className={cards.cards}>
            {page?.items.map((v) => {
              const a = availability(v);
              return (
                <div key={v.id} className={cards.card}>
                  <div className={cards.head}>
                    <span className={cards.heading}>
                      <Link to={`/vehicles/${v.id}`} className={cards.title}>{v.plateNumber}</Link>
                      <span className={cards.sub}>{v.make} {v.model} · {v.year}</span>
                    </span>
                    <Chip tone={a.tone} dot={a.dot}>{a.label}</Chip>
                  </div>
                  <div className={cards.facts}>
                    <span className={cards.fact}>
                      <span className={cards.factLabel}>Body</span>
                      <span className={cards.factValue}>{BODY_TYPE_LABEL[v.bodyType]}</span>
                    </span>
                    <span className={cards.fact}>
                      <span className={cards.factLabel}>Fuel</span>
                      <span className={cards.factValue}>{FUEL_LABEL[v.fuelType]}</span>
                    </span>
                    <span className={cards.fact}>
                      <span className={cards.factLabel}>VIN</span>
                      <span className={cards.factMono}>{v.vinCode}</span>
                    </span>
                    {a.sub ? (
                      <span className={cards.fact}>
                        <span className={cards.factLabel}>{a.label}</span>
                        <span className={cards.factValue}>{a.sub}</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={table.scroll}>
            <table className={`${table.table} ${table.tightWide} ${styles.table}`}>
              <thead>
                <tr>
                  <th scope="col" className={`${table.th} ${styles.wide}`}>Vehicle</th>
                  <th scope="col" className={`${table.th} ${styles.colVin} ${table.foldWide}`}>VIN</th>
                  <th scope="col" className={`${table.th} ${styles.colYear}`}>Year</th>
                  <th scope="col" className={`${table.th} ${styles.colSpec} ${table.foldNarrow}`}>Body</th>
                  <th scope="col" className={`${table.th} ${styles.colSpec} ${table.foldWide}`}>Fuel</th>
                  <th scope="col" className={`${table.th} ${styles.colState}`}>Availability</th>
                </tr>
              </thead>
              <tbody>
                {page?.items.map((v) => {
                  const a = availability(v);
                  return (
                    <tr key={v.id} className={table.row}>
                      <td className={table.td}>
                        <span className={table.stack}>
                          <Link to={`/vehicles/${v.id}`} className={`${table.name} ${table.mono}`}>{v.plateNumber}</Link>
                          <span className={`${table.sub} ${table.oneLine}`} title={`${v.make} ${v.model}`}>
                            {v.make} {v.model}
                          </span>
                          <span className={`${table.sub} ${table.showWide}`}>
                            {FUEL_LABEL[v.fuelType]}
                          </span>
                          <span className={`${table.sub} ${table.showNarrow}`}>
                            {BODY_TYPE_LABEL[v.bodyType]}
                          </span>
                        </span>
                      </td>
                      <td className={`${table.td} ${table.mono} ${table.foldWide}`}>{v.vinCode}</td>
                      <td className={`${table.td} ${table.mono}`}>{v.year}</td>
                      <td className={`${table.td} ${table.foldNarrow}`}>{BODY_TYPE_LABEL[v.bodyType]}</td>
                      <td className={`${table.td} ${table.foldWide}`}>{FUEL_LABEL[v.fuelType]}</td>
                      <td className={table.td}>
                        <span className={table.stack}>
                          <Chip tone={a.tone} dot={a.dot}>{a.label}</Chip>
                          {a.sub ? (
                            <span className={`${table.sub} ${table.oneLine}`} title={a.sub}>{a.sub}</span>
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

        {page ? (
          <Pagination
            page={page}
            onPage={(n) => patch({ page: String(n) })}
            onPageSize={(size) => patch({ size: String(size) })}
          />
        ) : null}
      </section>

      <FleetDialogs state={dialog} onClose={() => setDialog(null)} />
    </>
  );
}
