import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { qk } from '@/api';
import { listCustomers } from '@/api/customers';
import { CustomerType, type CustomersQuery } from '@/api/dto';
import { toFailure } from '@/api/problem';
import { CUSTOMER_TYPE_LABEL } from '@/format';
import { useTier } from '@/app/useViewport';
import { useAccess } from '@/permissions/usePermissions';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { ClearFilters, SelectFilter, type FilterOption } from '@/ui/Filters';
import { PageHeader } from '@/ui/PageHeader';
import { Pagination } from '@/ui/Pagination';
import cards from '@/ui/cards.module.css';
import filters from '@/ui/Filters.module.css';
import list from '@/ui/list.module.css';
import table from '@/ui/table.module.css';
import { FleetDialogs, type FleetDialogState } from './FleetDialogs';
import styles from './Customers.module.css';

const DEFAULT_PAGE_SIZE = 20;

const TYPE_OPTIONS: FilterOption[] = [
  { value: '', label: 'Private and business' },
  { value: String(CustomerType.PrivateIndividual), label: 'Private individuals' },
  { value: String(CustomerType.Business), label: 'Businesses' },
];

const STATE_OPTIONS: FilterOption[] = [
  { value: '', label: 'Active and inactive' },
  { value: 'true', label: 'Active only' },
  { value: 'false', label: 'Inactive only' },
];

export function Customers() {
  const [params, setParams] = useSearchParams();
  const { can } = useAccess();
  const phone = useTier() === 'phone';
  const canManage = can('Customers.Manage');
  const [dialog, setDialog] = useState<FleetDialogState | null>(null);

  const type = params.get('type') ?? '';
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

  /* The prototype offers clearing while the search or any filter is set. */
  const anyFilter = !!type || !!active;
  const clear = () => patch({ type: '', active: '' });

  const query: CustomersQuery = {
    PageNumber: pageNumber,
    PageSize: pageSize,
    ...(type ? { Type: Number(type) as CustomerType } : {}),
    ...(active ? { IsActive: active === 'true' } : {}),
  };

  const customers = useQuery({
    queryKey: qk.customers.list(query),
    queryFn: () => listCustomers(query),
    placeholderData: keepPreviousData,
  });

  const page = customers.data;
  const failure = customers.error ? toFailure(customers.error) : null;
  const isFiltered = !!(type || active);

  return (
    <>
      <PageHeader
        title="Customers"
        description="Who rents: businesses under a framework agreement and private individuals."
        actionsKey={String(canManage)}
        actions={canManage ? (
          <Button label="Add customer" icon="add" tone="primary" onClick={() => setDialog({ kind: 'customer-create' })} />
        ) : undefined}
      />

      <section className={list.panel}>
        <div className={filters.toolbar}>
          <SelectFilter value={type} options={TYPE_OPTIONS} label="Type" onChange={(next) => patch({ type: next })} />
          <SelectFilter value={active} options={STATE_OPTIONS} label="Status" onChange={(next) => patch({ active: next })} />
          <span className={filters.spacer} />
          {anyFilter ? <ClearFilters onClear={clear} /> : null}
          <span className={filters.count}>
            {page ? `${page.totalCount} customer${page.totalCount === 1 ? '' : 's'}` : ''}
          </span>
        </div>

        {failure ? (
          <EmptyState
            icon={failure.kind === 'forbidden' ? 'lock' : 'error'}
            title={failure.kind === 'forbidden' ? 'Not available to you' : 'The list could not be loaded'}
            body={
              failure.kind === 'forbidden'
                ? 'Reading customers needs Customers.Read.'
                : 'message' in failure ? failure.message : 'The request was refused.'
            }
            onRetry={failure.kind === 'forbidden' ? undefined : () => void customers.refetch()}
          />
        ) : page && page.items.length === 0 ? (
          <EmptyState
            icon="badge"
            title={isFiltered ? 'No customers match' : 'No customers yet'}
            body={isFiltered
              ? 'Widen the type or status filter.'
              : 'A customer appears here once one is registered.'}
          />
        ) : phone ? (
          <div className={cards.cards}>
            {page?.items.map((c) => (
              <div key={c.id} className={cards.card}>
                <div className={cards.head}>
                  <span className={cards.heading}>
                    <Link to={`/customers/${c.id}`} className={cards.title}>{c.displayName}</Link>
                    <span className={cards.sub}>{CUSTOMER_TYPE_LABEL[c.type]}</span>
                  </span>
                  <Chip tone={c.isActive ? 'ok' : 'mute'} dot={c.isActive ? '50%' : '1px'}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </Chip>
                </div>
                <div className={cards.facts}>
                  <span className={cards.fact}>
                    <span className={cards.factLabel}>Email</span>
                    <span className={cards.factValue}>{c.email}</span>
                  </span>
                  <span className={cards.fact}>
                    <span className={cards.factLabel}>Phone</span>
                    <span className={cards.factMono}>{c.phoneNumber}</span>
                  </span>
                  <span className={cards.fact}>
                    <span className={cards.factLabel}>Driver record</span>
                    <span className={cards.factValue}>{c.driverId ? 'Also a driver' : 'None'}</span>
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
                  <th scope="col" className={`${table.th} ${styles.colType}`}>Type</th>
                  <th scope="col" className={`${table.th} ${styles.colPhone} ${table.foldTablet}`}>Phone</th>
                  <th scope="col" className={`${table.th} ${styles.colDriver} ${table.foldNarrow}`}>Driver record</th>
                  <th scope="col" className={`${table.th} ${styles.colState}`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {page?.items.map((c) => (
                  <tr key={c.id} className={table.row}>
                    <td className={table.td}>
                      <span className={table.stack}>
                        <Link to={`/customers/${c.id}`} className={`${table.name} ${table.oneLine}`} title={c.displayName}>{c.displayName}</Link>
                        <span className={`${table.sub} ${table.oneLine}`} title={c.email}>{c.email}</span>
                        <span className={`${table.sub} ${table.showTablet}`}>{c.phoneNumber}</span>
                      </span>
                    </td>
                    <td className={table.td}>
                      <Chip tone="mute" dot={c.type === CustomerType.Business ? '2px' : '50%'}>
                        {CUSTOMER_TYPE_LABEL[c.type]}
                      </Chip>
                    </td>
                    <td className={`${table.td} ${table.mono} ${table.foldTablet}`}>{c.phoneNumber}</td>
                    <td className={`${table.td} ${table.foldNarrow} ${c.driverId ? '' : table.dim}`}>
                      {c.driverId ? 'Also a driver' : 'None'}
                    </td>
                    <td className={table.td}>
                      <Chip tone={c.isActive ? 'ok' : 'mute'} dot={c.isActive ? '50%' : '1px'}>
                        {c.isActive ? 'Active' : 'Inactive'}
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

      <FleetDialogs state={dialog} onClose={() => setDialog(null)} />
    </>
  );
}
