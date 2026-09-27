import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { qk } from '@/api';
import { listCases } from '@/api/insuranceCases';
import {
  InsuranceCaseParty, InsuranceCaseStatus,
  type InsuranceCaseListItemResponse, type InsuranceCaseQuery, type InsuranceCaseStatus as Status,
} from '@/api/dto';
import { toFailure } from '@/api/problem';
import {
  CASE_STATUS_LABEL, NO_EVENTS, atFaultText, caseCount, caseSub, caseTitle, closedText, daysAgoText,
  formatLocal, handledInfo, handledLine, waitText,
} from '@/format';
import { useTier } from '@/app/useViewport';
import { useAccess } from '@/permissions/usePermissions';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { ClearFilters, SearchInput, SelectFilter } from '@/ui/Filters';
import { PageHeader } from '@/ui/PageHeader';
import { Pagination } from '@/ui/Pagination';
import { RecordTabs, recordStyles as shell } from '@/ui/RecordTabs';
import { CASE_STATUS_DOT, CASE_STATUS_TONE } from '@/ui/status';
import cards from '@/ui/cards.module.css';
import filters from '@/ui/Filters.module.css';
import list from '@/ui/list.module.css';
import { useRowNav } from '@/ui/rowNav';
import table from '@/ui/table.module.css';
import { RegisterCaseDialog } from './CaseDialogs';
import {
  CASE_TABS, CASES_MANAGE, CASES_READ, STATUS_OPTIONS, TYPE_OPTIONS, WAITING_OPTIONS, caseHref, caseTabOf,
  filterValue, useCaseCounts, type CaseTab, type CaseTabSpec,
} from './caseAddress';
import styles from './InsuranceCases.module.css';

/**
 * Insurance cases (Follow-up 17, F17-2): the list of the cases the backend's round 12 keeps, built
 * from the approved prototype's handover with the app's own list vocabulary, as Tasks was. The header
 * with Register case for a holder of `InsuranceCases.Manage`; the strip of Open, Waiting for us and
 * Closed with the server's counts; the search and the filters each view offers; each view's columns,
 * in the order the API gives them; the phone cards; paging.
 *
 * The server decides. Which cases a view holds and their order, what the search and the filters find,
 * since when a case waits and when it was closed all come from the API; this page words them. The
 * view, the search, the filters and the page live in the address. A filter set on one view is kept in
 * the address but not applied where the view does not offer it (handover d), and a change of view
 * starts again at the first page.
 */

const DEFAULT_PAGE_SIZE = 20;

export const CASES_DESCRIPTION =
  'Damage to the company’s cars and its insurance claims, from the day it is found until the case is closed.';

/** Each view's empty list, in the prototype's words. */
const EMPTY: Record<CaseTab, { icon: string; title: string; body?: string }> = {
  open: { icon: 'car_crash', title: 'No open cases', body: 'Register a case as soon as you learn about new damage, so nothing is forgotten.' },
  us: { icon: 'task_alt', title: 'Nothing is waiting for you', body: 'A case appears here when the next move is yours.' },
  closed: { icon: 'inventory_2', title: 'No closed cases yet' },
};

/* the cells --------------------------------------------------------------------------------------- */

export function CaseStatusChip({ status }: { status: Status }) {
  return <Chip tone={CASE_STATUS_TONE[status]} dot={CASE_STATUS_DOT[status]}>{CASE_STATUS_LABEL[status]}</Chip>;
}

const waitsForUs = (item: InsuranceCaseListItemResponse) => item.waitingFor === InsuranceCaseParty.Us;

/** Handled by: the chosen insurer with its claim number under it, or the words for none. */
function HandledCell({ item }: { item: InsuranceCaseListItemResponse }) {
  const h = handledInfo(item);
  return (
    <span className={table.stack}>
      <span className={`${styles.cellText} ${h.dim ? styles.dim : ''}`}>{h.text}</span>
      {h.sub ? <span className={table.subMono}>{h.sub}</span> : null}
    </span>
  );
}

/** Last event: its title with the day under it; "No events yet" in dim ink without one. */
function LastEventCell({ item }: { item: InsuranceCaseListItemResponse }) {
  if (!item.lastEvent) return <span className={styles.dim}>{NO_EVENTS}</span>;
  return (
    <span className={table.stack}>
      <span className={styles.cellText}>{item.lastEvent.title}</span>
      <span className={table.sub}>{daysAgoText(item.lastEvent.happenedAtUtc)}</span>
    </span>
  );
}

/* the phone card ---------------------------------------------------------------------------------- */

/**
 * A case on the phone: the other lists' card. Its head holds the title and the line under it with the
 * status chip at the right; its facts, in two columns with the right one flush right, are Waiting for
 * and Handled by with the last event across both on the open views, and At fault and Closed with
 * Handled by across both on Closed. Tapping the card opens the case.
 */
function CaseCard({ item, tab }: { item: InsuranceCaseListItemResponse; tab: CaseTabSpec }) {
  const rowNav = useRowNav();
  const href = caseHref(item.id, tab.id);
  const closed = tab.id === 'closed';
  const h = handledInfo(item);
  const handled = (
    <>
      <span className={`${cards.factValue} ${h.dim ? styles.cardDim : ''}`}>{h.text}</span>
      {h.sub ? <span className={styles.cardSubMono}>{h.sub}</span> : null}
    </>
  );
  return (
    <div {...rowNav(href)} className={`${cards.card} ${cards.cardLink} ${styles.card}`}>
      <div className={cards.head}>
        <span className={cards.heading}>
          <Link to={href} className={`${cards.title} ${styles.cardTitle}`}>{caseTitle(item)}</Link>
          <span className={cards.sub}>{caseSub(item)}</span>
        </span>
        <CaseStatusChip status={item.status} />
      </div>
      <div className={styles.cardFacts}>
        {closed ? (
          <>
            <span className={cards.fact}>
              <span className={cards.factLabel}>At fault</span>
              <span className={`${cards.factValue} ${item.atFault ? '' : styles.cardDim}`}>{atFaultText(item.atFault)}</span>
            </span>
            <span className={`${cards.fact} ${cards.cardFactEnd}`}>
              <span className={cards.factLabel}>Closed</span>
              <span className={cards.factValue}>{formatLocal(item.closedAtUtc, 'dateShort')}</span>
            </span>
            <span className={`${cards.fact} ${cards.cardFactFull}`}>
              <span className={cards.factLabel}>Handled by</span>
              {handled}
            </span>
          </>
        ) : (
          <>
            <span className={cards.fact}>
              <span className={cards.factLabel}>Waiting for</span>
              <span className={`${cards.factValue} ${waitsForUs(item) ? styles.us : ''}`}>{waitText(item)}</span>
            </span>
            <span className={`${cards.fact} ${cards.cardFactEnd}`}>
              <span className={cards.factLabel}>Handled by</span>
              {handled}
            </span>
            <span className={`${cards.fact} ${cards.cardFactFull}`}>
              <span className={cards.factLabel}>Last event</span>
              {item.lastEvent ? (
                <>
                  <span className={cards.factValue}>{item.lastEvent.title}</span>
                  <span className={styles.cardSub}>{daysAgoText(item.lastEvent.happenedAtUtc)}</span>
                </>
              ) : <span className={`${cards.factValue} ${styles.cardDim}`}>{NO_EVENTS}</span>}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/* the page ---------------------------------------------------------------------------------------- */

export function InsuranceCases() {
  const [params, setParams] = useSearchParams();
  const { can } = useAccess();
  const rowNav = useRowNav();
  const phone = useTier() === 'phone';
  const allowed = can(CASES_READ);
  const manages = can(CASES_MANAGE);
  const { counts } = useCaseCounts();
  const [registering, setRegistering] = useState(false);

  const tab = caseTabOf(params.get('tab'));
  const search = params.get('search') ?? '';
  const typeSlug = params.get('type') ?? '';
  const statusSlug = params.get('status') ?? '';
  const waitingSlug = params.get('waiting') ?? '';
  const type = filterValue(TYPE_OPTIONS, typeSlug);
  // Only the filters this view offers are applied; the others stay in the address for their view.
  const status = tab.statusFilter ? filterValue(STATUS_OPTIONS, statusSlug) : undefined;
  const waiting = tab.waitingFilter ? filterValue(WAITING_OPTIONS, waitingSlug) : undefined;
  const pageNumber = Math.max(1, Number(params.get('page') ?? 1) || 1);
  const pageSize = Number(params.get('size') ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE;

  const patch = (next: Record<string, string>) => {
    const merged = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value === '') merged.delete(key);
      else merged.set(key, value);
    }
    if (!('page' in next)) merged.delete('page');
    setParams(merged, { replace: true });
  };

  const query: InsuranceCaseQuery = {
    View: tab.view,
    PageNumber: pageNumber,
    PageSize: pageSize,
    ...(type ? { Type: type as InsuranceCaseQuery['Type'] } : {}),
    ...(status ? { Status: status as Status } : {}),
    ...(waiting ? { WaitingFor: waiting as InsuranceCaseParty } : {}),
    ...(search ? { Search: search } : {}),
  };

  const cases = useQuery({
    queryKey: qk.insuranceCases.list(query),
    queryFn: () => listCases(query),
    enabled: allowed,
    // The previous page stays while the next loads, within one view: another view's rows do not fit
    // this one's columns.
    placeholderData: (previous, previousQuery) =>
      (previousQuery?.queryKey[2] as InsuranceCaseQuery | undefined)?.View === tab.view ? previous : undefined,
  });

  const header = (
    <PageHeader
      title="Insurance cases"
      description={CASES_DESCRIPTION}
      actionsKey={String(manages)}
      actions={manages ? <Button label="Register case" icon="add" tone="primary" onClick={() => setRegistering(true)} /> : undefined}
    />
  );

  const failure = cases.error ? toFailure(cases.error) : null;
  if (!allowed || failure?.kind === 'forbidden') {
    return (
      <>
        {header}
        <EmptyState icon="lock" title="Not available to you" body={`Opening this page needs ${CASES_READ}.`} />
      </>
    );
  }

  const page = cases.data;
  const rows = page?.items ?? [];
  const filtered = !!search || !!type || !!status || !!waiting;
  const closed = tab.id === 'closed';
  const empty = EMPTY[tab.id];
  const clear = () => patch({ search: '', type: '', status: '', waiting: '' });

  return (
    <div className={shell.page}>
      {header}

      <RecordTabs
        compact
        tabs={CASE_TABS.map((t) => ({ id: t.id, label: t.label, icon: t.icon, count: counts?.[t.count] }))}
        active={tab.id}
        onSelect={(next) => patch({ tab: next === 'open' ? '' : next })}
      />

      <section className={list.panel}>
        <div className={filters.toolbar}>
          <SearchInput
            value={search}
            placeholder="Plate, damage, driver, insurer or claim"
            maxLength={50}
            onChange={(next) => patch({ search: next })}
          />
          <SelectFilter value={type ? typeSlug : ''} options={TYPE_OPTIONS} label="Type" onChange={(next) => patch({ type: next })} />
          {tab.statusFilter ? (
            <SelectFilter value={status ? statusSlug : ''} options={STATUS_OPTIONS} label="Status" onChange={(next) => patch({ status: next })} />
          ) : null}
          {tab.waitingFilter ? (
            <SelectFilter value={waiting ? waitingSlug : ''} options={WAITING_OPTIONS} label="Waiting for" onChange={(next) => patch({ waiting: next })} />
          ) : null}
          <span className={filters.spacer} />
          {filtered ? <ClearFilters onClear={clear} /> : null}
          <span className={filters.count}>{page ? caseCount(page.totalCount) : ''}</span>
        </div>

        {failure ? (
          <EmptyState
            icon="error"
            title="The cases could not be loaded"
            body={'message' in failure ? failure.message : 'The request was refused.'}
            onRetry={() => void cases.refetch()}
          />
        ) : page && rows.length === 0 ? (
          filtered ? (
            <EmptyState
              icon="search_off"
              title="No results for these filters"
              body="Nothing matches the current search and filters. Clearing them restores the full list."
              action={{ label: 'Clear filters', icon: 'filter_alt_off', onClick: clear }}
            />
          ) : (
            <EmptyState
              icon={empty.icon}
              title={empty.title}
              body={empty.body}
              action={tab.id === 'open' && manages ? { label: 'Register case', icon: 'add', onClick: () => setRegistering(true) } : undefined}
            />
          )
        ) : phone ? (
          <div className={cards.cards}>
            {rows.map((item) => <CaseCard key={item.id} item={item} tab={tab} />)}
          </div>
        ) : (
          <div className={table.scroll}>
            <table className={`${table.table} ${styles.table}`}>
              <thead>
                <tr>
                  <th scope="col" className={`${table.th} ${styles.cCase}`}>Case</th>
                  <th scope="col" className={`${table.th} ${styles.cStatus}`}>Status</th>
                  <th scope="col" className={`${table.th} ${closed ? styles.cFault : styles.cWaiting}`}>{closed ? 'At fault' : 'Waiting for'}</th>
                  <th scope="col" className={`${table.th} ${styles.cHandled} ${table.foldTablet}`}>Handled by</th>
                  <th scope="col" className={`${table.th} ${closed ? styles.cClosed : styles.cLast}`}>{closed ? 'Closed' : 'Last event'}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => {
                  const href = caseHref(item.id, tab.id);
                  return (
                    <tr key={item.id} {...rowNav(href)}>
                      <td className={table.td}>
                        <span className={table.stack}>
                          <Link to={href} className={`${table.name} ${table.quietLink} ${styles.cellText}`}>{caseTitle(item)}</Link>
                          <span className={table.sub}>{caseSub(item)}</span>
                          {/* The folded band (768–1023): Handled by comes under the case. */}
                          <span className={`${table.sub} ${table.showTablet} ${styles.cellText}`}>{handledLine(item)}</span>
                        </span>
                      </td>
                      <td className={table.td}>
                        <CaseStatusChip status={closed ? InsuranceCaseStatus.Closed : item.status} />
                      </td>
                      <td className={table.td}>
                        {closed ? (
                          <span className={`${styles.cellText} ${item.atFault ? '' : styles.dim}`}>{atFaultText(item.atFault)}</span>
                        ) : (
                          <span className={waitsForUs(item) ? styles.us : undefined}>{waitText(item)}</span>
                        )}
                      </td>
                      <td className={`${table.td} ${table.foldTablet}`}>
                        <HandledCell item={item} />
                      </td>
                      <td className={table.td}>
                        {closed ? closedText(item.closedAtUtc) : <LastEventCell item={item} />}
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

      <RegisterCaseDialog open={registering} tab={tab.id} onClose={() => setRegistering(false)} />
    </div>
  );
}
