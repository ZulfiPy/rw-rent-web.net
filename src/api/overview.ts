import { get } from './client';
import type { OverviewSummaryResponse } from './dto';

/**
 * The Overview's four counts in one request. A count the caller may not read comes back null, so
 * the page shows the cards its permissions allow and never blanks on a missing one.
 */
export const getOverviewSummary = () => get<OverviewSummaryResponse>('/api/overview/summary');
