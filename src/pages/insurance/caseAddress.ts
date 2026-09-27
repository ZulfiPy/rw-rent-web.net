import { useQuery, type QueryClient } from '@tanstack/react-query';
import { qk } from '@/api';
import { countCases } from '@/api/insuranceCases';
import {
  InsuranceCaseView, type InsuranceCaseCountsResponse, type Uuid,
} from '@/api/dto';
import {
  CASE_PARTIES, CASE_PARTY_LABEL, CASE_STATUS_LABEL, CASE_TYPE_LABEL, OPEN_STATUSES,
} from '@/format';
import { useAccess } from '@/permissions/usePermissions';
import type { FilterOption } from '@/ui/Filters';

/**
 * Where Insurance cases lives in the address, and the count every surface reads (Follow-up 17). The
 * tab, the search, the filters and the page are in the list's address; a case's page carries the tab
 * it was opened from, so its breadcrumb leads back to it.
 */

export const CASES_READ = 'InsuranceCases.Read';
export const CASES_MANAGE = 'InsuranceCases.Manage';

export type CaseTab = 'open' | 'us' | 'closed';

export interface CaseTabSpec {
  id: CaseTab;
  view: InsuranceCaseView;
  label: string;
  icon: string;
  count: keyof InsuranceCaseCountsResponse;
  /** Status is a filter on the two open views; Closed's cases all read Closed. */
  statusFilter: boolean;
  /** Waiting for is a filter on Open only: Waiting for us is that filter already. */
  waitingFilter: boolean;
}

/** The three views in the strip's order, with the prototype's icons. */
export const CASE_TABS: readonly CaseTabSpec[] = [
  { id: 'open', view: InsuranceCaseView.Open, label: 'Open', icon: 'folder_open', count: 'open', statusFilter: true, waitingFilter: true },
  { id: 'us', view: InsuranceCaseView.WaitingForUs, label: 'Waiting for us', icon: 'pending_actions', count: 'waitingForUs', statusFilter: true, waitingFilter: false },
  { id: 'closed', view: InsuranceCaseView.Closed, label: 'Closed', icon: 'inventory_2', count: 'closed', statusFilter: false, waitingFilter: false },
];

/** The view an address names; Open when it names none or one that does not exist. */
export const caseTabOf = (value: string | null | undefined): CaseTabSpec =>
  CASE_TABS.find((tab) => tab.id === value) ?? CASE_TABS[0]!;

/** The list at a view: Open is the bare address. */
export const casesHref = (tab: CaseTab = 'open') => (tab === 'open' ? '/insurance-cases' : `/insurance-cases?tab=${tab}`);

/** A case's page, carrying the view it was opened from. */
export const caseHref = (id: Uuid, tab: CaseTab = 'open') =>
  (tab === 'open' ? `/insurance-cases/${id}` : `/insurance-cases/${id}?tab=${tab}`);

/** The filters' options, in the copy deck's words; the empty value is "any". */
export const TYPE_OPTIONS: FilterOption[] = [
  { value: '', label: 'Any type' },
  ...([1, 2] as const).map((type) => ({ value: String(type), label: CASE_TYPE_LABEL[type] })),
];

export const STATUS_OPTIONS: FilterOption[] = [
  { value: '', label: 'Any status' },
  ...OPEN_STATUSES.map((status) => ({ value: String(status), label: CASE_STATUS_LABEL[status] })),
];

export const WAITING_OPTIONS: FilterOption[] = [
  { value: '', label: 'Anyone' },
  ...CASE_PARTIES.map((party) => ({ value: String(party), label: CASE_PARTY_LABEL[party] })),
];

/** A filter's value from the address, or undefined when it names nothing the options offer. */
export function filterValue(options: FilterOption[], value: string | null): number | undefined {
  if (!value || !options.some((option) => option.value === value)) return undefined;
  return Number(value);
}

/**
 * What every write of a case refreshes (F17-10): one prefix holds the case, the three views, the
 * counts, the Overview's card and tile and the navigation's count; the deletions page's candidates
 * follow a case that closes or reopens.
 */
export const CASE_REFRESH = [qk.insuranceCases.all, qk.recordDeletions.all] as const;

export const refreshCases = (client: QueryClient) =>
  Promise.all(CASE_REFRESH.map((queryKey) => client.invalidateQueries({ queryKey })));

/**
 * The three views' sizes, for a holder of `InsuranceCases.Read` only: without it nothing is asked (a
 * Record deleter alone, and every reader of an API that does not grant it yet).
 */
export function useCaseCounts() {
  const { can } = useAccess();
  const allowed = can(CASES_READ);
  const counts = useQuery({ queryKey: qk.insuranceCases.counts, queryFn: countCases, enabled: allowed });
  return { allowed, counts: allowed ? counts.data : undefined };
}
