import { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { qk } from '@/api';
import { getUser, listUsers } from '@/api/users';
import {
  ApplicationUserStatus,
  type ApplicationUserListItemResponse, type PagedResponse, type UsersQuery,
} from '@/api/dto';
import { toFailure } from '@/api/problem';
import { formatLocal, relative, USER_STATUS_LABEL } from '@/format';
import { useTier } from '@/app/useViewport';
import { useAccess } from '@/permissions/usePermissions';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { SearchInput, SelectFilter, type FilterOption } from '@/ui/Filters';
import { PageHeader } from '@/ui/PageHeader';
import { Pagination } from '@/ui/Pagination';
import { USER_STATUS_DOT, USER_STATUS_TONE } from '@/ui/status';
import cards from '@/ui/cards.module.css';
import filters from '@/ui/Filters.module.css';
import list from '@/ui/list.module.css';
import table from '@/ui/table.module.css';
import { UserDialogs, type UserDialogState } from '../users/UserDialogs';
import styles from './Registrations.module.css';

const DEFAULT_PAGE_SIZE = 20;

/** The three registration-lifecycle states. Admitted users are the directory's business. */
const LIFECYCLE = [
  ApplicationUserStatus.PendingActivation,
  ApplicationUserStatus.RegistrationRejected,
  ApplicationUserStatus.RegistrationExpired,
];

const STATUS_OPTIONS: FilterOption[] = [
  { value: '', label: 'All lifecycle states' },
  { value: String(ApplicationUserStatus.PendingActivation), label: 'Pending activation' },
  { value: String(ApplicationUserStatus.RegistrationRejected), label: 'Rejected' },
  { value: String(ApplicationUserStatus.RegistrationExpired), label: 'Expired' },
];

/** The dialogs a queue row can open; the record is fetched before the dialog renders. */
function RowDialog({ userId, state, onClose }: {
  userId: string;
  state: UserDialogState;
  onClose: () => void;
}) {
  const user = useQuery({ queryKey: qk.users.detail(userId), queryFn: () => getUser(userId) });
  if (!user.data) return null;
  return <UserDialogs state={state} user={user.data} roles={[]} sessions={[]} onClose={onClose} />;
}

export function Registrations() {
  const [params, setParams] = useSearchParams();
  const { can } = useAccess();
  const phone = useTier() === 'phone';
  const [dialog, setDialog] = useState<{ userId: string; state: UserDialogState } | null>(null);

  const search = params.get('search') ?? '';
  const status = params.get('status') ?? '';
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

  // FOLLOW-UP: GET /api/users takes one Status. "All lifecycle states" therefore fans out into one
  // request per state and pages the merged result here; a multi-status filter would remove the
  // fan-out and hand paging back to the server.
  const statuses = status ? [Number(status) as ApplicationUserStatus] : LIFECYCLE;
  const queryFor = (s: ApplicationUserStatus): UsersQuery => ({
    PageSize: 100,
    Status: s,
    ...(search ? { Search: search } : {}),
  });

  const results = useQueries({
    queries: statuses.map((s) => ({
      queryKey: qk.users.list(queryFor(s)),
      queryFn: () => listUsers(queryFor(s)),
    })),
  });

  const isPending = results.some((r) => r.isPending);
  const error = results.find((r) => r.error)?.error;
  const failure = error ? toFailure(error) : null;

  const merged = results
    .flatMap((r) => r.data?.items ?? [])
    .sort((a, b) => `${a.firstName}${a.lastName}${a.id}`.localeCompare(`${b.firstName}${b.lastName}${b.id}`));
  const totalCount = merged.length;
  const page: PagedResponse<ApplicationUserListItemResponse> = {
    items: merged.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
    pageNumber,
    pageSize,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };

  const rowActions = (u: ApplicationUserListItemResponse) => (
    <>
      {u.status === ApplicationUserStatus.PendingActivation && u.emailConfirmed && can('Users.ReviewRegistrations') ? (
        <Button label="Activate" icon="how_to_reg" tone="primary" small onClick={() => setDialog({ userId: u.id, state: { kind: 'activate' } })} />
      ) : null}
      {u.status === ApplicationUserStatus.PendingActivation && can('Users.ManageRegistrations') ? (
        <Button label="Reject" icon="person_off" tone="danger" small onClick={() => setDialog({ userId: u.id, state: { kind: 'reject' } })} />
      ) : null}
      {u.status === ApplicationUserStatus.RegistrationRejected && can('Users.ManageRegistrations') ? (
        <Button label="Reopen" icon="restart_alt" small onClick={() => setDialog({ userId: u.id, state: { kind: 'reopen' } })} />
      ) : null}
    </>
  );

  return (
    <>
      <PageHeader
        title="Registrations"
        description="Self-registered accounts awaiting a decision. Confirmed registrations can be activated with one or more roles."
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
          <span className={filters.count}>
            {isPending ? '' : `${totalCount} record${totalCount === 1 ? '' : 's'}`}
          </span>
        </div>

        {failure ? (
          <EmptyState
            icon={failure.kind === 'forbidden' ? 'lock' : 'error'}
            title={failure.kind === 'forbidden' ? 'Not available to you' : 'The queue could not be loaded'}
            body={
              failure.kind === 'forbidden'
                ? 'Reviewing registrations needs Users.ReviewRegistrations.'
                : 'message' in failure ? failure.message : 'The request was refused.'
            }
            onRetry={failure.kind === 'forbidden' ? undefined : () => results.forEach((r) => void r.refetch())}
          />
        ) : totalCount === 0 && !isPending ? (
          <EmptyState
            icon="how_to_reg"
            title="No registrations waiting"
            body="Self-registered accounts appear here once submitted. Confirmed ones can be activated with roles."
          />
        ) : phone ? (
          <div className={cards.cards}>
            {page.items.map((u) => (
              <div key={u.id} className={cards.card}>
                <div className={cards.head}>
                  <span className={cards.heading}>
                    <Link to={`/users/${u.id}`} className={cards.title}>{u.firstName} {u.lastName}</Link>
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
                    <span className={cards.factLabel}>Registered</span>
                    <span className={cards.factMono}>{formatLocal(u.createdAtUtc)}</span>
                  </span>
                  <span className={cards.fact}>
                    <span className={cards.factLabel}>Expires</span>
                    <span className={u.registrationExpiresAtUtc ? cards.factMono : cards.factValue}>
                      {u.registrationExpiresAtUtc ? formatLocal(u.registrationExpiresAtUtc) : 'No expiry'}
                    </span>
                  </span>
                </div>
                <div className={cards.actions}>{rowActions(u)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className={table.scroll}>
            <table className={`${table.table} ${styles.table}`}>
              <thead>
                <tr>
                  <th scope="col" className={`${table.th} ${styles.wide}`}>Applicant</th>
                  <th scope="col" className={`${table.th} ${styles.colPhone} ${table.foldTablet}`}>Phone</th>
                  <th scope="col" className={`${table.th} ${styles.colEmail}`}>Email ownership</th>
                  <th scope="col" className={`${table.th} ${styles.colWhen}`}>Registered</th>
                  <th scope="col" className={`${table.th} ${styles.colExpires} ${table.foldTablet}`}>Expires</th>
                  <th scope="col" className={`${table.th} ${styles.colStatus}`}>Status</th>
                  <th scope="col" className={`${table.th} ${table.right} ${styles.colActions}`}>
                    <span className={table.srOnly}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((u) => (
                  <tr key={u.id} className={table.row}>
                    <td className={table.td}>
                      <span className={table.stack}>
                        <Link to={`/users/${u.id}`} className={table.name}>{u.firstName} {u.lastName}</Link>
                        <span className={table.sub}>{u.email}</span>
                      </span>
                    </td>
                    <td className={`${table.td} ${table.mono} ${table.foldTablet}`}>{u.phoneNumber}</td>
                    <td className={table.td}>
                      <Chip tone={u.emailConfirmed ? 'ok' : 'warn'} dot={u.emailConfirmed ? '50%' : '2px'}>
                        {u.emailConfirmed ? 'Confirmed' : 'Not confirmed'}
                      </Chip>
                    </td>
                    <td className={table.td}>
                      <span className={table.stack}>
                        <span className={table.mono}>{formatLocal(u.createdAtUtc)}</span>
                        <span className={table.sub}>{relative(u.createdAtUtc)}</span>
                        <span className={`${table.sub} ${table.showTablet}`}>
                          {u.registrationExpiresAtUtc
                            ? `Expires ${formatLocal(u.registrationExpiresAtUtc)}`
                            : 'No expiry'}
                        </span>
                      </span>
                    </td>
                    <td className={`${table.td} ${table.foldTablet}`}>
                      {u.registrationExpiresAtUtc
                        ? <span className={table.mono}>{formatLocal(u.registrationExpiresAtUtc)}</span>
                        : <span className={table.dim}>No expiry</span>}
                    </td>
                    <td className={table.td}>
                      <Chip tone={USER_STATUS_TONE[u.status]} dot={USER_STATUS_DOT[u.status]}>
                        {USER_STATUS_LABEL[u.status]}
                      </Chip>
                    </td>
                    <td className={table.td}>
                      <span className={table.actionsCell}>{rowActions(u)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalCount > 0 ? (
          <Pagination
            page={page}
            onPage={(n) => patch({ page: String(n) })}
            onPageSize={(size) => patch({ size: String(size) })}
          />
        ) : null}
      </section>

      {dialog ? (
        <RowDialog userId={dialog.userId} state={dialog.state} onClose={() => setDialog(null)} />
      ) : null}
    </>
  );
}
