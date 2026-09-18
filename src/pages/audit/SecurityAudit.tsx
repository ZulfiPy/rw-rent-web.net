import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { qk } from '@/api';
import { listSecurityAudit } from '@/api/securityAudit';
import { listUsers } from '@/api/users';
import type { SecurityAuditQuery, Uuid } from '@/api/dto';
import { toFailure } from '@/api/problem';
import {
  AUDIT_EVENT_TYPES, LOCAL_TIME_NOTE, auditActorName, auditTargetName, entityLabel, eventLabel,
  formatLocalStamp, isSystemActor, shortId,
} from '@/format';
import { useTier } from '@/app/useViewport';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import {
  ClearFilters, MoreFiltersRow, MoreSelect, SelectFilter, type FilterOption,
} from '@/ui/Filters';
import { PageHeader } from '@/ui/PageHeader';
import { Pagination } from '@/ui/Pagination';
import cards from '@/ui/cards.module.css';
import filters from '@/ui/Filters.module.css';
import list from '@/ui/list.module.css';
import { useRowNav } from '@/ui/rowNav';
import table from '@/ui/table.module.css';
import styles from './SecurityAudit.module.css';

const DEFAULT_PAGE_SIZE = 20;

/** The filter is driven by the event catalog, not by the rows on the page. */
const EVENT_OPTIONS: FilterOption[] = [
  { value: '', label: 'All event types' },
  ...AUDIT_EVENT_TYPES.map((t) => ({ value: t, label: eventLabel(t) })),
];

export function SecurityAudit() {
  const [params, setParams] = useSearchParams();
  const rowNav = useRowNav();
  const phone = useTier() === 'phone';

  const event = params.get('event') ?? '';
  const target = params.get('target') ?? '';
  const more = params.get('more') === '1' || target !== '';
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

  const anyFilter = !!event || !!target;
  const clear = () => patch({ event: '', target: '' });

  const query: SecurityAuditQuery = {
    PageNumber: pageNumber,
    PageSize: pageSize,
    ...(event ? { EventType: event } : {}),
    ...(target ? { TargetUserId: target } : {}),
  };

  const entries = useQuery({
    queryKey: qk.audit.list(query),
    queryFn: () => listSecurityAudit(query),
    placeholderData: keepPreviousData,
  });

  /* Entries name their actor and target themselves (F7-4). The directory the reader may see
     decides only whether a name links to the user record, and feeds the target filter. */
  const directory = useQuery({
    queryKey: qk.users.list({ PageSize: 100 }),
    queryFn: () => listUsers({ PageSize: 100 }),
    staleTime: 60_000,
  });
  const person = (id: Uuid | null | undefined) => directory.data?.items.find((x) => x.id === id);

  const targetOptions: FilterOption[] = [
    { value: '', label: 'Any target' },
    ...(directory.data?.items ?? []).map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` })),
  ];

  const page = entries.data;
  const failure = entries.error ? toFailure(entries.error) : null;

  return (
    <>
      <PageHeader
        title="Security audit"
        description={`Append-only history of security-relevant changes. ${LOCAL_TIME_NOTE}`}
      />

      <section className={list.panel}>
        <div className={filters.toolbar}>
          <SelectFilter
            value={event}
            options={EVENT_OPTIONS}
            label="Event type"
            onChange={(next) => patch({ event: next })}
          />
          <button
            type="button"
            className={filters.moreButton}
            aria-expanded={more}
            onClick={() => patch({ more: more ? '' : '1', ...(more ? { target: '' } : {}) })}
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
            <MoreSelect
              value={target}
              options={targetOptions}
              label="Target user"
              onChange={(next) => patch({ target: next })}
            />
          </MoreFiltersRow>
        ) : null}

        {failure ? (
          <EmptyState
            icon={failure.kind === 'forbidden' ? 'lock' : 'error'}
            title={failure.kind === 'forbidden' ? 'Not available to you' : 'The audit could not be loaded'}
            body={
              failure.kind === 'forbidden'
                ? 'Reading the security audit needs SecurityAudit.ReadCompany.'
                : 'message' in failure ? failure.message : 'The request was refused.'
            }
            onRetry={failure.kind === 'forbidden' ? undefined : () => void entries.refetch()}
          />
        ) : page && page.items.length === 0 ? (
          <EmptyState
            icon="policy"
            title="No audit entries match"
            body="Security-relevant changes are appended here as they happen."
          />
        ) : phone ? (
          <div className={cards.cards}>
            {page?.items.map((a) => (
              <Link key={a.id} to={`/security-audit/${a.id}`} className={`${cards.card} ${cards.cardLink}`}>
                <div className={cards.head}>
                  <span className={cards.heading}>
                    <span className={cards.title}>{eventLabel(a.eventType)}</span>
                    <span className={cards.sub}>{formatLocalStamp(a.occurredAtUtc)}</span>
                  </span>
                  <Chip tone="mute">{entityLabel(a.entityType)}</Chip>
                </div>
                <div className={cards.facts}>
                  <span className={cards.fact}>
                    <span className={cards.factLabel}>Actor</span>
                    <span className={cards.factValue}>{auditActorName(a)}</span>
                  </span>
                  <span className={`${cards.fact} ${cards.cardFactEnd}`}>
                    <span className={cards.factLabel}>Target</span>
                    <span className={`${cards.factValue} ${a.targetUserId ? '' : table.dim}`}>
                      {auditTargetName(a) ?? 'Not user-scoped'}
                    </span>
                  </span>
                  <span className={`${cards.fact} ${cards.cardFactFull}`}>
                    <span className={cards.factLabel}>Reason</span>
                    <span className={`${cards.factValue} ${a.reason ? '' : table.dim}`}>
                      {a.reason ?? 'No reason recorded'}
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={`${table.scroll} ${styles.frame}`}>
            <table className={`${table.table} ${table.tightWide} ${styles.table}`}>
              <thead>
                <tr>
                  <th scope="col" className={`${table.th} ${styles.colEvent}`}>Event</th>
                  <th scope="col" className={`${table.th} ${styles.colActor}`}>Actor</th>
                  <th scope="col" className={`${table.th} ${styles.colTarget} ${styles.cellTarget}`}>Target</th>
                  <th scope="col" className={`${table.th} ${styles.colEntity} ${styles.cellEntity} ${table.foldNarrow}`}>Entity</th>
                  <th scope="col" className={`${table.th} ${styles.wide} ${table.foldNarrow}`}>Reason</th>
                  <th scope="col" className={`${table.th} ${styles.colWhen}`}>Occurred</th>
                </tr>
              </thead>
              <tbody>
                {page?.items.map((a) => (
                  <tr key={a.id} {...rowNav(`/security-audit/${a.id}`)}>
                    <td className={`${table.td} ${table.wrap}`}>
                      <span className={table.stack}>
                        <Link to={`/security-audit/${a.id}`} className={table.name}>
                          {eventLabel(a.eventType)}
                        </Link>
                        <span className={`${table.sub} ${styles.reasonLine} ${a.reason ? '' : table.dim}`}>
                          {a.reason ?? 'No reason recorded'}
                        </span>
                      </span>
                    </td>
                    <td className={`${table.td} ${table.wrap}`}>
                      <span className={table.stack}>
                        {isSystemActor(a) ? (
                          <span className={table.dim}>{auditActorName(a)}</span>
                        ) : person(a.actorUserId) ? (
                          <Link to={`/users/${a.actorUserId}`} className={`${table.name} ${table.quietLink}`}>
                            {auditActorName(a)}
                          </Link>
                        ) : (
                          <span className={table.name}>{auditActorName(a)}</span>
                        )}
                        <span className={`${table.sub} ${styles.targetLine}`}>
                          {a.targetUserId ? `on ${auditTargetName(a)}` : 'Not user-scoped'}
                        </span>
                      </span>
                    </td>
                    <td className={`${table.td} ${styles.cellTarget} ${a.targetUserId ? '' : table.dim}`}>
                      {a.targetUserId && person(a.targetUserId) ? (
                        <Link to={`/users/${a.targetUserId}`} className={`${table.name} ${table.quietLink}`}>
                          {auditTargetName(a)}
                        </Link>
                      ) : auditTargetName(a) ?? 'Not user-scoped'}
                    </td>
                    <td className={`${table.td} ${styles.cellEntity} ${table.foldNarrow}`}>
                      <span className={table.stack}>
                        <span>{entityLabel(a.entityType)}</span>
                        {a.entityId ? (
                          <span className={table.subMono} title={a.entityId}>{shortId(a.entityId)}</span>
                        ) : null}
                      </span>
                    </td>
                    <td className={`${table.td} ${table.wrap} ${table.foldNarrow} ${a.reason ? '' : table.dim}`}>
                      {a.reason ?? 'No reason recorded'}
                    </td>
                    <td className={`${table.td} ${table.mono}`}>{formatLocalStamp(a.occurredAtUtc)}</td>
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
