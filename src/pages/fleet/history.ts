import { AssignmentStatus, type RentalAssignmentListItemResponse } from '@/api/dto';

/**
 * The prototype's rental-history order, used by the vehicle and customer records: active first,
 * then planned by nearest start, then closed rows by most recent end.
 */
const rank = (a: RentalAssignmentListItemResponse) =>
  a.status === AssignmentStatus.Active ? 0 : a.status === AssignmentStatus.Planned ? 1 : 2;
const cmp = (x: string, y: string) => (x < y ? -1 : x > y ? 1 : 0);
const startKey = (a: RentalAssignmentListItemResponse) => a.startedAtUtc ?? a.plannedStartAtUtc ?? '';
const endKey = (a: RentalAssignmentListItemResponse) => a.closedAtUtc ?? a.plannedEndAtUtc ?? '';

export function sortHistory(rows: RentalAssignmentListItemResponse[]) {
  return rows.slice().sort((x, y) =>
    rank(x) - rank(y)
    || (rank(x) < 2 ? cmp(startKey(x), startKey(y)) : cmp(endKey(y), endKey(x))));
}
