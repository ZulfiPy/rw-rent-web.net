import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { qk } from '@/api';
import { listDrivers } from '@/api/drivers';
import type { DriversQuery } from '@/api/dto';
import { toFailure } from '@/api/problem';
import { useTier } from '@/app/useViewport';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { SelectFilter, type FilterOption } from '@/ui/Filters';
import { PageHeader } from '@/ui/PageHeader';
import { Pagination } from '@/ui/Pagination';
import cards from '@/ui/cards.module.css';
import filters from '@/ui/Filters.module.css';
import list from '@/ui/list.module.css';
import table from '@/ui/table.module.css';
import styles from './Drivers.module.css';

const DEFAULT_PAGE_SIZE = 20;

const STATE_OPTIONS: FilterOption[] = [
  { value: '', label: 'Active and inactive' },
  { value: 'true', label: 'Active only' },
  { value: 'false', label: 'Inactive only' },
];

export function Drivers() {
  const [params, setParams] = useSearchParams();
  const phone = useTier() === 'phone';

  const active = params.get('active') ?? '';
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

  const query: DriversQuery = {
    PageNumber: pageNumber,
    PageSize: pageSize,
    ...(active ? { IsActive: active === 'true' } : {}),
  };

  const drivers = useQuery({
    queryKey: qk.drivers.list(query),
    queryFn: () => listDrivers(query),
    placeholderData: keepPreviousData,
  });

  const page = drivers.data;
  const failure = drivers.error ? toFailure(drivers.error) : null;

  return (
    <>
      <PageHeader
        title="Drivers"
        description="People who may be authorized to drive a rented vehicle. A licence is checked before a handover."
      />

      <section className={list.panel}>
        <div className={filters.toolbar}>
          <SelectFilter value={active} options={STATE_OPTIONS} label="Status" onChange={(next) => patch({ active: next })} />
          <span className={filters.count}>
            {page ? `${page.totalCount} driver${page.totalCount === 1 ? '' : 's'}` : ''}
          </span>
        </div>

        {failure ? (
          <EmptyState
            icon={failure.kind === 'forbidden' ? 'lock' : 'error'}
            title={failure.kind === 'forbidden' ? 'Not available to you' : 'The list could not be loaded'}
            body={
              failure.kind === 'forbidden'
                ? 'Reading drivers needs Drivers.Read.'
                : 'message' in failure ? failure.message : 'The request was refused.'
            }
            onRetry={failure.kind === 'forbidden' ? undefined : () => void drivers.refetch()}
          />
        ) : page && page.items.length === 0 ? (
          <EmptyState
            icon="badge"
            title={active ? 'No drivers match' : 'No drivers yet'}
            body={active
              ? 'Widen the status filter to see the rest.'
              : 'A driver appears here once one is registered.'}
          />
        ) : phone ? (
          <div className={cards.cards}>
            {page?.items.map((d) => (
              <div key={d.id} className={cards.card}>
                <div className={cards.head}>
                  <span className={cards.heading}>
                    <span className={cards.title}>{d.firstName} {d.lastName}</span>
                    <span className={cards.sub}>{d.email}</span>
                  </span>
                  <Chip tone={d.isActive ? 'ok' : 'mute'} dot={d.isActive ? '50%' : '1px'}>
                    {d.isActive ? 'Active' : 'Inactive'}
                  </Chip>
                </div>
                <div className={cards.facts}>
                  <span className={cards.fact}>
                    <span className={cards.factLabel}>Phone</span>
                    <span className={cards.factMono}>{d.phoneNumber}</span>
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
                  <th scope="col" className={`${table.th} ${styles.wide}`}>Driver</th>
                  <th scope="col" className={`${table.th} ${styles.colPhone} ${table.foldNarrow}`}>Phone</th>
                  <th scope="col" className={`${table.th} ${styles.colState}`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {page?.items.map((d) => (
                  <tr key={d.id} className={table.row}>
                    <td className={table.td}>
                      <span className={table.stack}>
                        <span className={table.name}>{d.firstName} {d.lastName}</span>
                        <span className={`${table.sub} ${table.oneLine}`} title={d.email}>{d.email}</span>
                        <span className={`${table.sub} ${table.showNarrow}`}>{d.phoneNumber}</span>
                      </span>
                    </td>
                    <td className={`${table.td} ${table.mono} ${table.foldNarrow}`}>{d.phoneNumber}</td>
                    <td className={table.td}>
                      <Chip tone={d.isActive ? 'ok' : 'mute'} dot={d.isActive ? '50%' : '1px'}>
                        {d.isActive ? 'Active' : 'Inactive'}
                      </Chip>
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
    </>
  );
}
