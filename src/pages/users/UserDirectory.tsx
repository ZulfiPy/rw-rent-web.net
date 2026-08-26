import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { qk } from '@/api';
import { listUsers } from '@/api/users';
import {
  ApplicationUserRole, ApplicationUserStatus,
  type ApplicationUserListItemResponse, type UsersQuery,
} from '@/api/dto';
import { toFailure } from '@/api/problem';
import { rolesLabel, ROLE_LABEL, USER_STATUS_LABEL } from '@/format';
import { useCompanyName } from '@/app/useCompanyName';
import { useTier } from '@/app/useViewport';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { ClearFilters, SearchInput, SelectFilter, type FilterOption } from '@/ui/Filters';
import { PageHeader } from '@/ui/PageHeader';
import { Pagination } from '@/ui/Pagination';
import { USER_STATUS_DOT, USER_STATUS_TONE } from '@/ui/status';
import cards from '@/ui/cards.module.css';
import filters from '@/ui/Filters.module.css';
import list from '@/ui/list.module.css';
import table from '@/ui/table.module.css';
import styles from './UserDirectory.module.css';

const DEFAULT_PAGE_SIZE = 20;

const STATUS_OPTIONS: FilterOption[] = [
  { value: '', label: 'Any status' },
  ...Object.values(ApplicationUserStatus).map((s) => ({ value: String(s), label: USER_STATUS_LABEL[s] })),
];

const ROLE_OPTIONS: FilterOption[] = [
  { value: '', label: 'Any role' },
  ...Object.values(ApplicationUserRole).map((r) => ({ value: String(r), label: ROLE_LABEL[r] })),
];

/** The System Administrator account cannot be renamed, suspended or role-edited. */
const isProtected = (u: ApplicationUserListItemResponse) =>
  u.effectiveRoles.includes(ApplicationUserRole.SystemAdministrator);

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <tr key={i} className={table.row}>
          {[0, 1, 2, 3, 4, 5, 6].map((c) => (
            <td
              key={c}
              className={`${table.td} ${c === 3 ? table.foldTablet : ''} ${c === 5 ? table.foldNarrow : ''}`}
            >
              <div className={`${table.skeleton} ${c === 0 ? table.skeletonWide : table.skeletonNarrow}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function UserDirectory() {
  const [params, setParams] = useSearchParams();
  const companyName = useCompanyName();
  const phone = useTier() === 'phone';

  const search = params.get('search') ?? '';
  const status = params.get('status') ?? '';
  const role = params.get('role') ?? '';
  const pageNumber = Math.max(1, Number(params.get('page') ?? 1));
  const pageSize = Number(params.get('size') ?? DEFAULT_PAGE_SIZE);

  const patch = (next: Record<string, string>) => {
    const merged = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value === '') merged.delete(key);
      else merged.set(key, value);
    }
    // Any filter change restarts paging; the page number is only meaningful within one result set.
    if (!('page' in next)) merged.delete('page');
    setParams(merged, { replace: true });
  };

  /* The prototype offers clearing while the search or any filter is set. */
  const anyFilter = !!search || !!status || !!role;
  const clear = () => patch({ search: '', status: '', role: '' });

  const query: UsersQuery = {
    PageNumber: pageNumber,
    PageSize: pageSize,
    ...(search ? { Search: search } : {}),
    ...(status ? { Status: Number(status) as ApplicationUserStatus } : {}),
    ...(role ? { Role: Number(role) as ApplicationUserRole } : {}),
  };

  const users = useQuery({
    queryKey: qk.users.list(query),
    queryFn: () => listUsers(query),
    placeholderData: keepPreviousData,
  });

  const page = users.data;
  const failure = users.error ? toFailure(users.error) : null;
  const isFiltered = search !== '' || status !== '' || role !== '';
  const countLabel = page ? `${page.totalCount} record${page.totalCount === 1 ? '' : 's'}` : '';

  return (
    <>
      <PageHeader
        title="User directory"
        description="Admitted Company users and, for reviewers, registration lifecycle records."
      />

      <section className={list.panel}>
        <div className={filters.toolbar}>
          <SearchInput
            value={search}
            placeholder="Search name, email or phone"
            onChange={(next) => patch({ search: next })}
          />
          <SelectFilter
            value={status}
            options={STATUS_OPTIONS}
            label="Status"
            onChange={(next) => patch({ status: next })}
          />
          <SelectFilter
            value={role}
            options={ROLE_OPTIONS}
            label="Role"
            onChange={(next) => patch({ role: next })}
          />
          <span className={filters.spacer} />
          {anyFilter ? <ClearFilters onClear={clear} /> : null}
          <span className={filters.count}>{countLabel}</span>
        </div>

        {failure ? (
          <EmptyState
            icon={failure.kind === 'forbidden' ? 'lock' : 'error'}
            title={failure.kind === 'forbidden' ? 'Not available to you' : 'The directory could not be loaded'}
            body={
              failure.kind === 'forbidden'
                ? 'Your permissions do not include reading the user directory.'
                : 'message' in failure ? failure.message : 'The request was refused.'
            }
            onRetry={failure.kind === 'forbidden' ? undefined : () => void users.refetch()}
          />
        ) : (
          <>
            {phone ? (
              <div className={cards.cards}>
                {page?.items.map((u) => (
                  <Link key={u.id} to={`/users/${u.id}`} className={`${cards.card} ${cards.cardLink}`}>
                    <div className={cards.head}>
                      <span className={cards.heading}>
                        <span className={cards.title}>{u.firstName} {u.lastName}</span>
                        <span className={cards.sub}>{u.email}</span>
                      </span>
                      <Chip tone={USER_STATUS_TONE[u.status]} dot={USER_STATUS_DOT[u.status]}>
                        {USER_STATUS_LABEL[u.status]}
                      </Chip>
                    </div>
                    <div className={cards.facts}>
                      <span className={cards.fact}>
                        <span className={cards.factLabel}>Email</span>
                        <span className={cards.factValue}>{u.emailConfirmed ? 'Confirmed' : 'Not confirmed'}</span>
                      </span>
                      <span className={cards.fact}>
                        <span className={cards.factLabel}>Phone</span>
                        <span className={cards.factMono}>{u.phoneNumber}</span>
                      </span>
                      <span className={cards.fact}>
                        <span className={cards.factLabel}>Effective roles</span>
                        <span className={cards.factValue}>
                          {rolesLabel(u.effectiveRoles)}
                          {isProtected(u) ? ' · Protected account' : ''}
                        </span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={table.scroll}>
                <table className={`${table.table} ${styles.table}`}>
                  <thead>
                    <tr>
                      <th scope="col" className={`${table.th} ${styles.wide}`}>User</th>
                      <th scope="col" className={`${table.th} ${styles.colPhone}`}>Phone</th>
                      <th scope="col" className={`${table.th} ${styles.colStatus}`}>Status</th>
                      <th scope="col" className={`${table.th} ${styles.colEmail} ${table.foldTablet}`}>Email</th>
                      <th scope="col" className={`${table.th} ${styles.colRoles}`}>Effective roles</th>
                      <th scope="col" className={`${table.th} ${styles.colCompany} ${table.foldNarrow}`}>Company</th>
                      <th scope="col" className={`${table.th} ${styles.colAction}`}>
                        <span className={table.srOnly}>Open record</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.isPending ? <SkeletonRows /> : null}
                    {page?.items.map((u) => (
                      <tr key={u.id} className={table.row}>
                        <td className={table.td}>
                          <span className={table.stack}>
                            <span className={table.name}>{u.firstName} {u.lastName}</span>
                            <span className={`${table.sub} ${table.oneLine}`} title={u.email}>{u.email}</span>
                          </span>
                        </td>
                        <td className={`${table.td} ${table.mono}`}>{u.phoneNumber}</td>
                        <td className={table.td}>
                          <Chip tone={USER_STATUS_TONE[u.status]} dot={USER_STATUS_DOT[u.status]}>
                            {USER_STATUS_LABEL[u.status]}
                          </Chip>
                        </td>
                        <td className={`${table.td} ${table.foldTablet}`}>
                          <Chip tone={u.emailConfirmed ? 'ok' : 'warn'} dot={u.emailConfirmed ? '50%' : '2px'}>
                            {u.emailConfirmed ? 'Confirmed' : 'Not confirmed'}
                          </Chip>
                        </td>
                        <td className={`${table.td} ${table.wrap}`}>
                          <span className={table.stack}>
                            <span className={u.effectiveRoles.length ? '' : table.dim}>{rolesLabel(u.effectiveRoles)}</span>
                            {isProtected(u) ? <span className={table.sub}>Protected account</span> : null}
                          </span>
                        </td>
                        <td className={`${table.td} ${table.foldNarrow} ${u.companyId ? '' : table.dim}`}>
                          <span className={table.oneLine} title={u.companyId ? companyName : 'Not assigned'}>
                            {u.companyId ? companyName : 'Not assigned'}
                          </span>
                        </td>
                        <td className={table.td}>
                          <Link
                            to={`/users/${u.id}`}
                            className={table.link}
                            aria-label={`Open the record for ${u.firstName} ${u.lastName}`}
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

            {page && page.items.length === 0 ? (
              <EmptyState
                icon="group"
                title={isFiltered ? 'No users match' : 'No users yet'}
                body={
                  isFiltered
                    ? 'Adjust the search or status filter to widen the directory.'
                    : 'Admitted Company users appear here once a registration is activated.'
                }
              />
            ) : null}

            {page ? (
              <Pagination
                page={page}
                onPage={(n) => patch({ page: String(n) })}
                onPageSize={(size) => patch({ size: String(size) })}
              />
            ) : null}
          </>
        )}
      </section>
    </>
  );
}
