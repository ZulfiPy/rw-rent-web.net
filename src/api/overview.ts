import { listAssignments } from './rentalAssignments';
import { listUsers } from './users';
import { listVehicles } from './vehicles';
import { ApplicationUserStatus, AssignmentStatus, type OverviewSummary } from './dto';

/**
 * FOLLOW-UP: no summary endpoint. Four PageSize=1 probes read totalCount — constant work, and one
 * file to replace when the backend exposes a summary. See COVERAGE.md §5.4.
 */
export async function getOverviewSummary(): Promise<OverviewSummary> {
  const probe = { PageNumber: 1, PageSize: 1 };
  const [active, planned, vehicles, pending] = await Promise.all([
    listAssignments({ ...probe, Status: AssignmentStatus.Active }),
    listAssignments({ ...probe, Status: AssignmentStatus.Planned }),
    listVehicles({ ...probe, IsActive: true }),
    listUsers({ ...probe, Status: ApplicationUserStatus.PendingActivation }),
  ]);
  return {
    activeAssignments: active.totalCount,
    plannedAssignments: planned.totalCount,
    availableVehicles: vehicles.totalCount,
    pendingRegistrations: pending.totalCount,
  };
}
