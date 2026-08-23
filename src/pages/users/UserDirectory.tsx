import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { qk } from '@/api';
import { listUsers } from '@/api/users';
import {
  ApplicationUserRole, ApplicationUserStatus,
  type ApplicationUserListItemResponse, type UsersQuery,
} from '@/api/dto';
import { toFailure } from '@/api/problem';
import { NO_ROLE_LABEL, ROLE_LABEL, USER_STATUS_LABEL } from '@/format';
import { useCompanyName } from '@/app/useCompanyName';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { SearchInput, SelectFilter, type FilterOption } from '@/ui/Filters';
import { PageHeader } from '@/ui/PageHeader';
import { Pagination } from '@/ui/Pagination';
import { USER_STATUS_DOT, USER_STATUS_TONE } from '@/ui/status';
import filters from '@/ui/Filters.module.css';
import styles from './UserDirectory.module.css';

const PAGE_SIZE = 20;

const STATUS_OPTIONS: FilterOption[] = [
  { value: '', label: 'All statuses' },
  ...Object.values(ApplicationUserStatus).map((s) => ({ value: String(s), label: USER_STATUS_LABEL[s] })),
];

const ROLE_OPTIONS: FilterOption[] = [
  { value: '', label: 'All roles' },
  ...Object.values(ApplicationUserRole).map((r) => ({ value: String(r), label: ROLE_LABEL[r] })),
];

const rolesOf = (u: ApplicationUserListItemResponse) =>
  u.effectiveRoles.length ? u.effectiveRoles.map((r) => ROLE_LABEL[r]).join(', ') : NO_ROLE_LABEL;

/** The System Administrator account cannot be renamed, suspended or role-edited. */
const isProtected = (u: ApplicationUserListItemResponse) =>
  u.effectiveRoles.includes(ApplicationUserRole.SystemAdministrator);

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <tr key={i} className={styles.row}>
          {[0, 1, 2, 3, 4, 5].map((c) => (
            <td key={c} className={styles.td}>
              <div className={`${styles.skeleton} ${c === 0 ? styles.skeletonWide : styles.skeletonNarrow}`} />
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

  const search = params.get('search') ?? '';
  const status = params.get('status') ?? '';
  const role = params.get('role') ?? '';
  const pageNumber = Math.max(1, Number(params.get('page') ?? 1));

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

  const query: UsersQuery = {
    PageNumber: pageNumber,
    PageSize: PAGE_SIZE,
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

  return (
    <>
      <PageHeader
        title="User directory"
        description="Admitted Company users and, for reviewers, registration lifecycle records."
      />

      <section className={styles.panel}>
        <div className={filters.toolbar}>
          <SearchInput
            value={search}
            placeholder="Search name, email or phone"
            onChange={(next) => patch({ search: next })}
          />
          <SelectFilter
            value={status}
            options={STATUS_OPTIONS}
            label="Filter by status"
            onChange={(next) => patch({ status: next })}
          />
          <SelectFilter
            value={role}
            options={ROLE_OPTIONS}
            label="Filter by effective role"
            onChange={(next) => patch({ role: next })}
          />
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
            <div className={styles.scroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col" className={`${styles.th} ${styles.wide}`}>User</th>
                    <th scope="col" className={`${styles.th} ${styles.colPhone}`}>Phone</th>
                    <th scope="col" className={`${styles.th} ${styles.colStatus}`}>Status</th>
                    <th scope="col" className={`${styles.th} ${styles.colEmail}`}>Email</th>
                    <th scope="col" className={`${styles.th} ${styles.colRoles}`}>Effective roles</th>
                    <th scope="col" className={`${styles.th} ${styles.colCompany}`}>Company</th>
                  </tr>
                </thead>
                <tbody>
                  {users.isPending ? <SkeletonRows /> : null}
                  {page?.items.map((u) => (
                    <tr key={u.id} className={styles.row}>
                      <td className={styles.td}>
                        <span className={styles.stack}>
                          <span className={styles.name}>{u.firstName} {u.lastName}</span>
                          <span className={styles.sub}>{u.email}</span>
                        </span>
                      </td>
                      <td className={`${styles.td} ${styles.mono}`}>{u.phoneNumber}</td>
                      <td className={styles.td}>
                        <Chip tone={USER_STATUS_TONE[u.status]} dot={USER_STATUS_DOT[u.status]}>
                          {USER_STATUS_LABEL[u.status]}
                        </Chip>
                      </td>
                      <td className={styles.td}>
                        <Chip tone={u.emailConfirmed ? 'ok' : 'warn'} dot={u.emailConfirmed ? '50%' : '2px'}>
                          {u.emailConfirmed ? 'Confirmed' : 'Not confirmed'}
                        </Chip>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.stack}>
                          <span className={u.effectiveRoles.length ? styles.roles : styles.none}>
                            {rolesOf(u)}
                          </span>
                          {isProtected(u) ? <span className={styles.sub}>Protected account</span> : null}
                        </span>
                      </td>
                      <td className={`${styles.td} ${u.companyId ? '' : styles.none}`}>
                        {u.companyId ? companyName : 'Not assigned'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
              <Pagination page={page} noun={['user', 'users']} onPage={(n) => patch({ page: String(n) })} />
            ) : null}
          </>
        )}
      </section>
    </>
  );
}
