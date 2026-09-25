import { useQuery, type QueryClient } from '@tanstack/react-query';
import { qk } from '@/api';
import { countTasks } from '@/api/tasks';
import { WorkTaskDueFilter, WorkTaskView, type Uuid, type WorkTaskCountsResponse } from '@/api/dto';
import { useAccess } from '@/permissions/usePermissions';
import type { FilterOption } from '@/ui/Filters';

/**
 * Where Tasks lives in the address, and the count every surface reads (Follow-up 12). The view, the
 * search, the due filter and the page are in the list's address, as on Delete records; a task's page
 * carries the view it was opened from, so its breadcrumb leads back to it.
 */

export const TASKS_PERMISSION = 'Tasks.Use';

export type TaskTab = 'mine' | 'involving' | 'finished';

export interface TaskTabSpec {
  id: TaskTab;
  view: WorkTaskView;
  label: string;
  icon: string;
  count: keyof WorkTaskCountsResponse;
  /**
   * Whether the view's rows carry the reader's own steps with Mark done and Undo: the two views of
   * open tasks. Since round 11 My tasks also holds tasks someone else created in which the reader has
   * a step (Follow-up 13), so it takes Involving me's layout; Finished has no actions.
   */
  yourSteps: boolean;
}

/** The three views in the strip's order, with the prototype's icons. */
export const TASK_TABS: readonly TaskTabSpec[] = [
  { id: 'mine', view: WorkTaskView.MyTasks, label: 'My tasks', icon: 'person', count: 'myTasks', yourSteps: true },
  { id: 'involving', view: WorkTaskView.InvolvingMe, label: 'Involving me', icon: 'group', count: 'involvingMe', yourSteps: true },
  { id: 'finished', view: WorkTaskView.Finished, label: 'Finished', icon: 'inventory_2', count: 'finished', yourSteps: false },
];

/** The view an address names; My tasks when it names none or one that does not exist. */
export const tabOf = (value: string | null | undefined): TaskTabSpec =>
  TASK_TABS.find((tab) => tab.id === value) ?? TASK_TABS[0]!;

/** The list at a view: My tasks is the bare address. */
export const tasksHref = (tab: TaskTab = 'mine') => (tab === 'mine' ? '/tasks' : `/tasks?tab=${tab}`);

/** A task's page, carrying the view it was opened from. */
export const taskHref = (id: Uuid, tab: TaskTab = 'mine') =>
  (tab === 'mine' ? `/tasks/${id}` : `/tasks/${id}?tab=${tab}`);

/** The Due filter's options; the server applies each to the date the view is ordered by. */
export const DUE_OPTIONS: FilterOption[] = [
  { value: '', label: 'Any due date' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'week', label: 'Due in the next 7 days' },
  { value: 'none', label: 'No due date' },
];

export const DUE_FILTER: Readonly<Record<string, WorkTaskDueFilter>> = {
  overdue: WorkTaskDueFilter.Overdue,
  week: WorkTaskDueFilter.NextSevenDays,
  none: WorkTaskDueFilter.NoDueDate,
};

/**
 * What every task write refreshes (F12-7): one prefix holds the task, the three views, the counts,
 * the to-do list and the people, so the navigation's count and the Overview follow a mark at once.
 */
export const TASK_REFRESH = [qk.tasks.all] as const;

export const refreshTasks = (client: QueryClient) =>
  Promise.all(TASK_REFRESH.map((queryKey) => client.invalidateQueries({ queryKey })));

/**
 * The three views' sizes and the to-do count, for a holder of `Tasks.Use` only: without it nothing
 * is asked (the System Administrator, and every reader of an API that does not grant it yet).
 */
export function useTaskCounts() {
  const { can } = useAccess();
  const allowed = can(TASKS_PERMISSION);
  const counts = useQuery({ queryKey: qk.tasks.counts, queryFn: countTasks, enabled: allowed });
  return { allowed, counts: allowed ? counts.data : undefined };
}
