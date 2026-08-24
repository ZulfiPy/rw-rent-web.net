import { listAssignments } from './rentalAssignments';
import { listUsers } from './users';
import { listVehicles } from './vehicles';
import { ApplicationUserStatus, AssignmentStatus, type OverviewSummary } from './dto';

/**
 * FOLLOW-UP: no summary endpoint. Four PageSize=1 probes read totalCount — constant work, and one
 * file to replace when the backend exposes a summary. See COVERAGE.md §5.4.
 *
 * A probe the persona cannot read comes back null rather than rejecting the whole summary: the
 * Overview shows the cards its permissions allow, and one 403 never blanks the page.
 */
export async function getOverviewSummary(): Promise<OverviewSummary> {
  const probe = { PageNumber: 1, PageSize: 1 };
  const counts = await Promise.allSettled([
    listAssignments({ ...probe, Status: AssignmentStatus.Active }),
    listAssignments({ ...probe, Status: AssignmentStatus.Planned }),
    listVehicles({ ...probe, IsActive: true }),
    listUsers({ ...probe, Status: ApplicationUserStatus.PendingActivation }),
  ]);
  const [active, planned, vehicles, pending] = counts.map((r) =>
    r.status === 'fulfilled' ? r.value.totalCount : null);
  return {
    activeAssignments: active ?? null,
    plannedAssignments: planned ?? null,
    activeVehicles: vehicles ?? null,
    pendingRegistrations: pending ?? null,
  };
}
