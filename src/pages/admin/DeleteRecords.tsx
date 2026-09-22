import { useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { qk } from '@/api';
import {
  countCandidates, listCandidates, listDeletions, type AnyCandidate,
} from '@/api/recordDeletions';
import {
  CustomerType, RecordDeletionShow, RecordDeletionState, RecordKind,
  type CustomerDeletionCandidateResponse, type DriverAuthorizationDeletionCandidateResponse,
  type DriverDeletionCandidateResponse, type InterruptionDeletionCandidateResponse,
  type PagedResponse, type RecordDeletionBlockingRecordResponse,
  type RecordDeletionCandidateCountsResponse, type RecordDeletionCandidatesQuery,
  type RecordDeletionInfo, type RecordDeletionListItemResponse, type RecordDeletionResponse,
  type RentalAssignmentDeletionCandidateResponse, type VehicleDeletionCandidateResponse,
} from '@/api/dto';
import { toFailure } from '@/api/problem';
import {
  ASSIGNMENT_STATUS_LABEL, BILLING_IMPACT_LABEL, CUSTOMER_TYPE_LABEL, INTERRUPTION_REASON_LABEL,
  LOCAL_TIME_NOTE, RECORD_KIND_LABEL, STOP_REASON_LABEL, SYSTEM_ACTOR, authorizationDriver,
  blockSentence, deletionPeriod, deletionReasonText, formatLocal, kindNoun, partsText, rentalPeriod,
  takesSentence, wentWith, type DeletionTarget,
} from '@/format';
import { useTier } from '@/app/useViewport';
import { useAccess } from '@/permissions/usePermissions';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { ClearFilters, SearchInput, SelectFilter, type FilterOption } from '@/ui/Filters';
import { PageHeader } from '@/ui/PageHeader';
import { Pagination } from '@/ui/Pagination';
import { Panel } from '@/ui/Panel';
import { RecordBanner, RecordTabs, recordStyles as shell } from '@/ui/RecordTabs';
import { ASSIGNMENT_STATUS_DOT, ASSIGNMENT_STATUS_TONE } from '@/ui/status';
import cards from '@/ui/cards.module.css';
import filters from '@/ui/Filters.module.css';
import list from '@/ui/list.module.css';
import { useRowNav } from '@/ui/rowNav';
import table from '@/ui/table.module.css';
import { DeleteRecordDialog } from './DeleteRecordDialog';
import styles from './DeleteRecords.module.css';

/**
 * Delete records (Follow-up 8): the page for removing, for good, records the company no longer
 * needs — the System Administrator's, and since Follow-up 10 a Record deleter's, whom the
 * administrator gives the right. A port of the handover: the bad-tone banner, the six-kind tab strip with
 * its counts, the filter row, one table per kind with the server's verdict on every row, the phone
 * cards that carry their own action, the delete dialog, and Recently deleted.
 *
 * The server decides. Whether a row is Ready or Blocked, why, which running rentals are in the way,
 * and what a deletion would take along all come from the API (rounds 7 and 8; Follow-up 9); this page
 * only words them. The kind, the filter, the search and the page live in the URL; the search and the
 * page reset when the kind changes, Show does not.
 */

const DEFAULT_PAGE_SIZE = 20;
const PERMISSION = 'Records.Delete';

interface KindTab {
  kind: RecordKind;
  slug: string;
  label: string;
  icon: string;
  count: keyof RecordDeletionCandidateCountsResponse;
  search: string;
}

/** The six kinds in the switch's order, with each one's search as the API reads it. */
const KINDS: readonly KindTab[] = [
  { kind: RecordKind.RentalAssignment, slug: 'rental-assignments', label: 'Rental assignments', icon: 'assignment', count: 'rentalAssignments', search: 'Plate, VIN or customer name' },
  { kind: RecordKind.DriverAuthorization, slug: 'driver-authorizations', label: 'Driver authorizations', icon: 'key', count: 'driverAuthorizations', search: 'Driver, plate or customer name' },
  // The API searches an interruption's note, plate and customer, not its reason (Follow-up 8, 7).
  { kind: RecordKind.Interruption, slug: 'interruptions', label: 'Interruptions', icon: 'pause_circle', count: 'interruptions', search: 'Note, plate or customer' },
  { kind: RecordKind.Vehicle, slug: 'vehicles', label: 'Vehicles', icon: 'directions_car', count: 'vehicles', search: 'Plate, VIN, make or model' },
  { kind: RecordKind.Customer, slug: 'customers', label: 'Customers', icon: 'contacts', count: 'customers', search: 'Name, identifier or email' },
  { kind: RecordKind.Driver, slug: 'drivers', label: 'Drivers', icon: 'badge', count: 'drivers', search: 'Name, licence number or email' },
];

const SHOW_OPTIONS: FilterOption[] = [
  { value: '', label: 'Out of use' },
  { value: 'all', label: 'Everything' },
];

/* the verdict ---------------------------------------------------------------------------------- */

const isBlocked = (d: RecordDeletionInfo) => d.state === RecordDeletionState.Blocked;

/**
 * Where a record in the way opens. Since round 8 every one is a running rental; anything else the
 * API might name is shown as plain text.
 */
const blockerHref = (record: RecordDeletionBlockingRecordResponse): string | null =>
  record.kind === RecordKind.RentalAssignment ? `/rental-assignments/${record.id}` : null;

/** The records a block names, each one a quiet link to its rental. */
function Blockers({ deletion }: { deletion: RecordDeletionInfo }) {
  const records = deletion.blocks.flatMap((block) => block.records);
  if (records.length === 0) return null;
  return (
    <span className={styles.blockers}>
      {records.map((record) => {
        const href = blockerHref(record);
        return href
          ? <Link key={`${record.kind}-${record.id}`} to={href} className={styles.blocker}>{record.label}</Link>
          : <span key={`${record.kind}-${record.id}`} className={styles.blockerPlain}>{record.label}</span>;
      })}
    </span>
  );
}

const VerdictChip = ({ deletion }: { deletion: RecordDeletionInfo }) => (
  isBlocked(deletion)
    ? <Chip tone="warn" dot="2px">Blocked</Chip>
    : <Chip tone="ok" dot="50%">Ready</Chip>
);

/**
 * The Deletion cell: the chip; for a blocked row the reason the server gave in words with the
 * running rentals in the way; and for every row what a deletion takes along — for a blocked one
 * too, because those numbers stay true once the block is lifted.
 */
function DeletionCell({ kind, deletion }: { kind: RecordKind; deletion: RecordDeletionInfo }) {
  return (
    <span className={table.stack}>
      <VerdictChip deletion={deletion} />
      {isBlocked(deletion) ? (
        <>
          <span className={`${table.sub} ${table.wrap}`}>{blockSentence(kind, deletion.blocks)}</span>
          <Blockers deletion={deletion} />
        </>
      ) : null}
      <span className={`${table.sub} ${table.wrap}`}>{takesSentence(deletion.takes)}</span>
    </span>
  );
}

/**
 * Delete on a row: "Delete", not "Delete…" (the owner's direction of 2026-09-22), in the table and on
 * the phone card; the dialog that follows is the step that asks. A blocked one is the app's
 * disable-with-reason button: pressing it does nothing, and the reason is already written in the row.
 */
function DeleteAction({ kind, deletion, block, onDelete }: {
  kind: RecordKind;
  deletion: RecordDeletionInfo;
  block?: boolean;
  onDelete: () => void;
}) {
  return (
    <Button
      label="Delete"
      icon="delete"
      tone="danger"
      small={!block}
      block={block}
      blockedReason={isBlocked(deletion) ? `${blockSentence(kind, deletion.blocks)}.` : null}
      hint={`Delete this ${kindNoun(kind)}`}
      onClick={onDelete}
    />
  );
}

/* one row, per kind ---------------------------------------------------------------------------- */

/** A column: its header, its width, and whether it folds in the portrait band (768–1023). */
interface Column { label: string; className: string; fold?: boolean }

interface Fact { label: string; value: string; mono?: boolean; wide?: boolean }

/** What one candidate shows: its cells on the table tiers, its card on the phone. */
interface Row {
  id: string;
  /** Where the row, and the card's title, open. */
  open: string;
  cells: ReactNode[];
  title: string;
  titleMono?: boolean;
  sub: string;
  facts: Fact[];
  deletion: RecordDeletionInfo;
}

const statusChip = (active: boolean) => (
  active ? <Chip tone="ok" dot="50%">Active</Chip> : <Chip tone="mute" dot="1px">Inactive</Chip>
);

const name = (text: string, to: string, mono?: boolean) => (
  <Link to={to} className={`${mono ? table.plate : table.name} ${table.quietLink}`}>{text}</Link>
);

/** The dim mono period of the list rows. */
const periodCell = (text: string) => <span className={`${table.mono}`}>{text}</span>;

interface Spec<T> {
  tableClass: string;
  columns: Column[];
  row: (value: T) => Row;
}

const RENTALS: Spec<RentalAssignmentDeletionCandidateResponse> = {
  tableClass: styles.rentals ?? '',
  columns: [
    { label: 'Vehicle', className: styles.c176 ?? '' },
    { label: 'Customer', className: styles.wide ?? '' },
    { label: 'Status', className: styles.c118 ?? '' },
    { label: 'Period', className: styles.c172 ?? '' },
    { label: 'Parts', className: styles.c168 ?? '', fold: true },
    { label: 'Deletion', className: styles.c254 ?? '' },
  ],
  row: (r) => {
    const open = `/rental-assignments/${r.id}`;
    const parts = partsText(r.authorizationCount, r.interruptionCount);
    return {
      id: r.id,
      open,
      cells: [
        <span className={table.stack}>
          {name(r.vehiclePlateNumber, open, true)}
          <span className={`${table.sub} ${table.oneLine}`} title={`${r.vehicleMake} ${r.vehicleModel}`}>
            {r.vehicleMake} {r.vehicleModel}
          </span>
        </span>,
        <span className={table.wrap}>{r.customerDisplayName}</span>,
        <Chip tone={ASSIGNMENT_STATUS_TONE[r.status]} dot={ASSIGNMENT_STATUS_DOT[r.status]}>
          {ASSIGNMENT_STATUS_LABEL[r.status]}
        </Chip>,
        periodCell(rentalPeriod(r)),
        <span className={parts ? table.wrap : table.dim}>{parts || 'No parts'}</span>,
      ],
      title: r.vehiclePlateNumber,
      titleMono: true,
      sub: `${r.vehicleMake} ${r.vehicleModel} · ${r.customerDisplayName}`,
      facts: [
        { label: 'Status', value: ASSIGNMENT_STATUS_LABEL[r.status] },
        { label: 'Period', value: rentalPeriod(r), mono: true },
        { label: 'Parts', value: parts || 'No parts', wide: true },
      ],
      deletion: r.deletion,
    };
  },
};

const AUTHORIZATIONS: Spec<DriverAuthorizationDeletionCandidateResponse> = {
  tableClass: styles.parts ?? '',
  columns: [
    { label: 'Driver', className: styles.wide ?? '' },
    { label: 'Rental', className: styles.c220 ?? '' },
    { label: 'Period', className: styles.c172 ?? '' },
    { label: 'State', className: styles.c176 ?? '' },
    { label: 'Deletion', className: styles.c254 ?? '' },
  ],
  row: (a) => {
    const rental = `/rental-assignments/${a.rentalAssignmentId}`;
    const period = deletionPeriod(a.authorizedFromUtc, a.stoppedAtUtc);
    const stopReason = a.stoppedAtUtc && a.stopReason ? STOP_REASON_LABEL[a.stopReason] : null;
    return {
      id: a.id,
      open: `${rental}?tab=coverage`,
      cells: [
        a.driverId && a.driverDisplayName
          ? <span className={table.wrap}>{name(a.driverDisplayName, `/drivers/${a.driverId}`)}</span>
          : <span className={`${table.name} ${table.wrap}`}>{authorizationDriver(a)}</span>,
        <Link to={rental} className={`${table.quietLink} ${table.wrap}`}>{a.rentalAssignmentLabel}</Link>,
        periodCell(period),
        <span className={table.stack}>
          {a.stoppedAtUtc ? <Chip tone="mute" dot="1px">Stopped</Chip> : <Chip tone="ok" dot="50%">Open</Chip>}
          {stopReason ? <span className={table.sub}>{stopReason}</span> : null}
        </span>,
      ],
      title: authorizationDriver(a),
      sub: a.rentalAssignmentLabel,
      facts: [
        { label: 'State', value: a.stoppedAtUtc ? `Stopped${stopReason ? ` · ${stopReason}` : ''}` : 'Open' },
        { label: 'Period', value: period, mono: true },
      ],
      deletion: a.deletion,
    };
  },
};

const INTERRUPTIONS: Spec<InterruptionDeletionCandidateResponse> = {
  tableClass: styles.parts ?? '',
  columns: [
    { label: 'Reason', className: styles.c210 ?? '' },
    { label: 'Rental', className: styles.c220 ?? '' },
    { label: 'Period', className: styles.c172 ?? '' },
    { label: 'Billing impact', className: styles.c150 ?? '', fold: true },
    { label: 'Deletion', className: styles.c254 ?? '' },
  ],
  row: (i) => {
    const rental = `/rental-assignments/${i.rentalAssignmentId}`;
    const period = deletionPeriod(i.startedAtUtc, i.endedAtUtc);
    return {
      id: i.id,
      open: `${rental}?tab=interruptions`,
      cells: [
        i.endedAtUtc
          ? <Chip tone="mute" dot="1px">{INTERRUPTION_REASON_LABEL[i.reason]}</Chip>
          : <Chip tone="warn" dot="2px">{INTERRUPTION_REASON_LABEL[i.reason]}</Chip>,
        <Link to={rental} className={`${table.quietLink} ${table.wrap}`}>{i.rentalAssignmentLabel}</Link>,
        periodCell(period),
        <span className={`${table.dim} ${table.wrap}`}>{BILLING_IMPACT_LABEL[i.billingImpact]}</span>,
      ],
      title: INTERRUPTION_REASON_LABEL[i.reason],
      sub: i.rentalAssignmentLabel,
      facts: [
        { label: 'Period', value: period, mono: true },
        { label: 'Billing impact', value: BILLING_IMPACT_LABEL[i.billingImpact] },
      ],
      deletion: i.deletion,
    };
  },
};

const VEHICLES: Spec<VehicleDeletionCandidateResponse> = {
  tableClass: styles.records ?? '',
  columns: [
    { label: 'Plate', className: styles.c136 ?? '' },
    { label: 'Make, model, year', className: styles.wide ?? '' },
    { label: 'Status', className: styles.c128 ?? '' },
    { label: 'Deletion', className: styles.c300 ?? '' },
  ],
  row: (v) => {
    const open = `/vehicles/${v.id}`;
    return {
      id: v.id,
      open,
      cells: [
        name(v.plateNumber, open, true),
        <span className={table.stack}>
          <span className={table.wrap}>{v.make} {v.model} · {v.year}</span>
          <span className={`${table.subMono} ${table.oneLine}`}>{v.vinCode}</span>
        </span>,
        statusChip(v.isActive),
      ],
      title: v.plateNumber,
      titleMono: true,
      sub: `${v.make} ${v.model} · ${v.year}`,
      facts: [
        { label: 'Status', value: v.isActive ? 'Active' : 'Inactive' },
        { label: 'VIN', value: v.vinCode, mono: true },
      ],
      deletion: v.deletion,
    };
  },
};

/** The identifier a customer is known by: "Reg. <code>" for a business, the personal code otherwise. */
const identifier = (c: CustomerDeletionCandidateResponse) =>
  c.type === CustomerType.Business ? `Reg. ${c.identifier ?? '—'}` : c.identifier ?? '—';

const CUSTOMERS: Spec<CustomerDeletionCandidateResponse> = {
  tableClass: styles.records ?? '',
  columns: [
    { label: 'Customer', className: styles.wide ?? '' },
    { label: 'Type', className: styles.c140 ?? '' },
    { label: 'Status', className: styles.c128 ?? '' },
    { label: 'Deletion', className: styles.c300 ?? '' },
  ],
  row: (c) => {
    const open = `/customers/${c.id}`;
    const business = c.type === CustomerType.Business;
    return {
      id: c.id,
      open,
      cells: [
        <span className={table.stack}>
          <span className={table.wrap}>{name(c.displayName, open)}</span>
          <span className={`${table.subMono} ${table.oneLine}`}>{identifier(c)}</span>
        </span>,
        business
          ? <Chip tone="info" dot="2px">{CUSTOMER_TYPE_LABEL[c.type]}</Chip>
          : <Chip tone="mute" dot="50%">{CUSTOMER_TYPE_LABEL[c.type]}</Chip>,
        statusChip(c.isActive),
      ],
      title: c.displayName,
      sub: `${CUSTOMER_TYPE_LABEL[c.type]} · ${c.email}`,
      facts: [
        { label: 'Status', value: c.isActive ? 'Active' : 'Inactive' },
        { label: 'Identifier', value: identifier(c), mono: true },
      ],
      deletion: c.deletion,
    };
  },
};

const DRIVERS: Spec<DriverDeletionCandidateResponse> = {
  tableClass: styles.drivers ?? '',
  columns: [
    { label: 'Driver', className: styles.wide ?? '' },
    { label: 'Licence', className: styles.c180 ?? '' },
    { label: 'Status', className: styles.c128 ?? '' },
    { label: 'Deletion', className: styles.c300 ?? '' },
  ],
  row: (d) => {
    const open = `/drivers/${d.id}`;
    return {
      id: d.id,
      open,
      cells: [
        <span className={table.stack}>
          <span className={table.wrap}>{name(`${d.firstName} ${d.lastName}`, open)}</span>
          <span className={`${table.sub} ${table.oneLine}`}>{d.email}</span>
        </span>,
        <span className={table.mono}>{d.driverLicenseNumber}</span>,
        statusChip(d.isActive),
      ],
      title: `${d.firstName} ${d.lastName}`,
      sub: d.email,
      facts: [
        { label: 'Status', value: d.isActive ? 'Active' : 'Inactive' },
        { label: 'Licence', value: d.driverLicenseNumber, mono: true },
      ],
      deletion: d.deletion,
    };
  },
};

/**
 * Each kind's spec. The page reads one kind's list at a time and its cache key carries the kind, so
 * the rows handed to a spec are always that spec's own; the one widening below says so once.
 */
const SPECS: Record<RecordKind, Spec<never>> = {
  [RecordKind.RentalAssignment]: RENTALS,
  [RecordKind.DriverAuthorization]: AUTHORIZATIONS,
  [RecordKind.Interruption]: INTERRUPTIONS,
  [RecordKind.Vehicle]: VEHICLES,
  [RecordKind.Customer]: CUSTOMERS,
  [RecordKind.Driver]: DRIVERS,
};

const rowOf = (kind: RecordKind, value: AnyCandidate): Row =>
  (SPECS[kind] as unknown as Spec<AnyCandidate>).row(value);

const targetOf = (kind: RecordKind, value: AnyCandidate): DeletionTarget =>
  ({ kind, value }) as DeletionTarget;

/* the page ------------------------------------------------------------------------------------- */

export function DeleteRecords() {
  const [params, setParams] = useSearchParams();
  const { can } = useAccess();
  const queryClient = useQueryClient();
  const rowNav = useRowNav();
  const phone = useTier() === 'phone';
  const allowed = can(PERMISSION);
  const canAudit = can('SecurityAudit.ReadCompany');

  const tab = KINDS.find((k) => k.slug === params.get('kind')) ?? KINDS[0]!;
  const kind = tab.kind;
  const show = params.get('show') === 'all' ? RecordDeletionShow.Everything : RecordDeletionShow.OutOfUse;
  const search = params.get('search') ?? '';
  const pageNumber = Math.max(1, Number(params.get('page') ?? 1));
  const pageSize = Number(params.get('size') ?? DEFAULT_PAGE_SIZE);

  const [dialog, setDialog] = useState<DeletionTarget | null>(null);
  const [done, setDone] = useState<RecordDeletionResponse | null>(null);

  const patch = (next: Record<string, string>) => {
    const merged = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value === '') merged.delete(key);
      else merged.set(key, value);
    }
    if (!('page' in next)) merged.delete('page');
    setParams(merged, { replace: true });
  };

  const query: RecordDeletionCandidatesQuery = {
    PageNumber: pageNumber,
    PageSize: pageSize,
    Show: show,
    ...(search ? { Search: search } : {}),
  };

  const candidates = useQuery({
    queryKey: qk.recordDeletions.candidates(kind, query),
    queryFn: () => listCandidates(kind, query),
    enabled: allowed,
    // The previous page stays while the next loads, but only within one kind: another kind's rows
    // do not fit this kind's columns.
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2] === kind ? previous : undefined,
  });
  const counts = useQuery({
    queryKey: qk.recordDeletions.counts(show),
    queryFn: () => countCandidates({ show }),
    enabled: allowed,
  });
  const made = useQuery({
    queryKey: qk.recordDeletions.made({ PageSize: 20 }),
    queryFn: () => listDeletions({ PageSize: 20 }),
    enabled: allowed,
  });

  const header = (
    <PageHeader
      title="Delete records"
      description="Permanently removes records the company no longer needs. A deletion cannot be undone. Every deletion is written to the security audit with its reason."
    />
  );

  const failure = candidates.error ? toFailure(candidates.error) : null;
  if (!allowed || failure?.kind === 'forbidden') {
    return (
      <>
        {header}
        <EmptyState icon="lock" title="Not available to you" body={`Opening this page needs ${PERMISSION}.`} />
      </>
    );
  }

  const page = candidates.data as PagedResponse<AnyCandidate> | undefined;
  const rows = page?.items.map((item) => ({ row: rowOf(kind, item), item })) ?? [];
  const spec = SPECS[kind];
  const filtered = !!search || show === RecordDeletionShow.Everything;

  const selectKind = (next: RecordKind) => {
    const slug = KINDS.find((k) => k.kind === next)?.slug ?? '';
    setDone(null);
    patch({ kind: next === RecordKind.RentalAssignment ? '' : slug, search: '' });
  };

  /** Refresh after a refusal the data raised: reload the lists and close the dialog. */
  const refresh = () => {
    void queryClient.refetchQueries({ queryKey: qk.recordDeletions.all });
    setDialog(null);
  };

  const noun = (n: number) => `${n} ${kindNoun(kind)}${n === 1 ? '' : 's'}`;

  return (
    <div className={shell.page}>
      {header}

      <RecordBanner
        icon="error"
        tone="bad"
        title="Deleted means gone"
        body="The record leaves the database. What stays is one entry in the security audit: who deleted what, when and why, with a copy of what the record said."
      />

      <RecordTabs
        tabs={KINDS.map((k) => ({ id: String(k.kind), label: k.label, icon: k.icon, count: counts.data?.[k.count] }))}
        active={String(kind)}
        onSelect={(next) => selectKind(Number(next) as RecordKind)}
      />

      <section className={list.panel}>
        <div className={filters.toolbar}>
          <SearchInput
            key={kind}
            value={search}
            placeholder={tab.search}
            maxLength={50}
            onChange={(next) => patch({ search: next })}
          />
          <SelectFilter
            value={show === RecordDeletionShow.Everything ? 'all' : ''}
            options={SHOW_OPTIONS}
            label="Show"
            onChange={(next) => patch({ show: next })}
          />
          <span className={filters.spacer} />
          {filtered ? <ClearFilters onClear={() => patch({ search: '', show: '' })} /> : null}
          <span className={filters.count}>{page ? noun(page.totalCount) : ''}</span>
        </div>

        {done ? <Confirmation done={done} canAudit={canAudit} /> : null}

        {failure ? (
          <EmptyState
            icon="error"
            title="The records could not be loaded"
            body={'message' in failure ? failure.message : 'The request was refused.'}
            onRetry={() => void candidates.refetch()}
          />
        ) : page && page.items.length === 0 ? (
          search ? (
            <EmptyState
              icon="search_off"
              title="No results for these filters"
              body="Nothing matches the current search and filters. Clearing them restores the full list."
            />
          ) : (
            <EmptyState
              icon="inventory_2"
              title="Nothing to clean up"
              body="No out-of-use records of this kind. Switch Show to Everything to see the rest."
            />
          )
        ) : phone ? (
          <div className={cards.cards}>
            {rows.map(({ row, item }) => (
              <div key={row.id} className={cards.card}>
                <div className={cards.head}>
                  <span className={cards.heading}>
                    <Link to={row.open} className={`${cards.title} ${styles.cardTitle} ${row.titleMono ? cards.cardPlate : ''}`}>
                      {row.title}
                    </Link>
                    <span className={`${cards.sub} ${styles.cardSub}`}>{row.sub}</span>
                  </span>
                  <VerdictChip deletion={row.deletion} />
                </div>
                <div className={cards.facts}>
                  {row.facts.map((fact) => (
                    <span key={fact.label} className={`${cards.fact} ${fact.wide ? cards.cardFactFull : ''}`}>
                      <span className={cards.factLabel}>{fact.label}</span>
                      <span className={fact.mono ? cards.factMono : cards.factValue}>{fact.value}</span>
                    </span>
                  ))}
                </div>
                <div className={styles.cardBlock}>
                  {isBlocked(row.deletion) ? (
                    <>
                      <p className={styles.cardReason}>{blockSentence(kind, row.deletion.blocks)}</p>
                      <Blockers deletion={row.deletion} />
                    </>
                  ) : null}
                  <p className={styles.cardTakes}>{takesSentence(row.deletion.takes)}</p>
                </div>
                <div className={styles.cardAction}>
                  <DeleteAction kind={kind} deletion={row.deletion} block onDelete={() => setDialog(targetOf(kind, item))} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={table.scroll}>
            <table className={`${table.table} ${styles.table} ${spec.tableClass}`}>
              <thead>
                <tr>
                  {spec.columns.map((column) => (
                    <th
                      key={column.label}
                      scope="col"
                      className={`${table.th} ${column.className} ${column.fold ? table.foldTablet : ''}`}
                    >
                      {column.label}
                    </th>
                  ))}
                  <th scope="col" className={`${table.th} ${table.right} ${styles.actions}`}>
                    <span className={table.srOnly}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ row, item }) => (
                  <tr key={row.id} {...rowNav(row.open)}>
                    {row.cells.map((cell, index) => (
                      <td
                        key={spec.columns[index]?.label ?? index}
                        className={`${table.td} ${spec.columns[index]?.fold ? table.foldTablet : ''}`}
                      >
                        {cell}
                      </td>
                    ))}
                    <td className={table.td}>
                      <DeletionCell kind={kind} deletion={row.deletion} />
                    </td>
                    <td className={`${table.td} ${table.right}`}>
                      <span className={table.actionsCell}>
                        <DeleteAction kind={kind} deletion={row.deletion} onDelete={() => setDialog(targetOf(kind, item))} />
                      </span>
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

      <RecentlyDeleted items={made.data?.items} canAudit={canAudit} phone={phone} />

      {dialog ? (
        <DeleteRecordDialog
          key={`${dialog.kind}-${dialog.value.id}`}
          target={dialog}
          onClose={() => setDialog(null)}
          onRefresh={refresh}
          onDeleted={(result) => {
            setDone(result);
            setDialog(null);
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * The line a deletion leaves above the table (the app has no toast): what was deleted, what went
 * with it by the deletion's own answer (§9, 5), and that it is in the security audit — a link to
 * the entry for a reader who may read the audit.
 */
export function Confirmation({ done, canAudit }: { done: RecordDeletionResponse; canAudit: boolean }) {
  const along = wentWith(done);
  return (
    <p className={styles.done} role="status">
      <span data-icon aria-hidden="true" className={styles.doneIcon}>check_circle</span>
      <span className={styles.doneText}>
        <span className={styles.doneTitle}>{RECORD_KIND_LABEL[done.kind]} deleted:</span> {done.recordLabel}.{' '}
        {along ? `${along} ` : null}
        {canAudit
          ? <Link to={`/security-audit/${done.auditEntryId}`}>Written to the security audit.</Link>
          : 'Written to the security audit.'}
      </span>
    </p>
  );
}

/** "Rental assignment · 660 BYH · Nordwind Logistics" — what a deletion removed, by its kind. */
const whatOf = (item: RecordDeletionListItemResponse) => `${RECORD_KIND_LABEL[item.kind]} · ${item.recordLabel}`;

/**
 * The deletions that were made, newest first, each one opening its audit entry for a reader who may
 * read the audit. Times are local, like everywhere in the app.
 */
export function RecentlyDeleted({ items, canAudit, phone }: {
  items: RecordDeletionListItemResponse[] | undefined;
  canAudit: boolean;
  phone: boolean;
}) {
  const entry = (item: RecordDeletionListItemResponse) => `/security-audit/${item.auditEntryId}`;
  const who = (item: RecordDeletionListItemResponse) => item.actorDisplayName ?? SYSTEM_ACTOR;

  return (
    <Panel title="Recently deleted" description={LOCAL_TIME_NOTE}>
      {items && items.length === 0 ? (
        <EmptyState
          variant="panel"
          icon="history"
          title="Nothing has been deleted yet"
          body="Deletions made on this page appear here, newest first, each one linked to its security-audit entry."
        />
      ) : phone ? (
        <div className={cards.cards}>
          {items?.map((item) => (
            <div key={item.auditEntryId} className={cards.card}>
              <div className={cards.head}>
                <span className={cards.heading}>
                  <span className={cards.title}>{whatOf(item)}</span>
                  <span className={cards.sub}>{deletionReasonText(item.reason, item.note)}</span>
                </span>
                <Chip tone="mute" dot="1px">Deleted</Chip>
              </div>
              <div className={cards.facts}>
                <span className={cards.fact}>
                  <span className={cards.factLabel}>When</span>
                  <span className={cards.factValue}>{formatLocal(item.occurredAtUtc)}</span>
                </span>
                <span className={`${cards.fact} ${cards.cardFactEnd}`}>
                  <span className={cards.factLabel}>Who</span>
                  <span className={cards.factValue}>{who(item)}</span>
                </span>
              </div>
              {canAudit ? (
                <div className={cards.actions}>
                  <Link to={entry(item)} className={`${table.quietLink} ${styles.openEntry}`}>
                    <span data-icon aria-hidden="true" className={styles.openEntryIcon}>open_in_new</span>
                    Open audit entry
                  </Link>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className={table.scroll}>
          <table className={`${table.table} ${styles.made}`} data-panel="" data-nofold="">
            <thead>
              <tr>
                <th scope="col" className={`${table.th} ${styles.madeWhen}`}>When</th>
                <th scope="col" className={`${table.th} ${styles.madeWho}`}>Who</th>
                <th scope="col" className={table.th}>What</th>
                <th scope="col" className={`${table.th} ${styles.madeReason}`}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {items?.map((item) => (
                <tr key={item.auditEntryId} className={table.row}>
                  <td className={`${table.td} ${table.mono} ${table.instant}`}>{formatLocal(item.occurredAtUtc)}</td>
                  <td className={table.td}>{who(item)}</td>
                  <td className={`${table.td} ${table.wrap}`}>
                    {canAudit
                      ? <Link to={entry(item)} className={table.quietLink}>{whatOf(item)}</Link>
                      : whatOf(item)}
                  </td>
                  <td className={`${table.td} ${table.wrap} ${table.dim}`}>{deletionReasonText(item.reason, item.note)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
