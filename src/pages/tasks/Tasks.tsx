import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { qk } from '@/api';
import { listTasks } from '@/api/tasks';
import {
  WorkTaskStatus, type WorkTaskListItemResponse, type WorkTaskQuery, type WorkTaskStepResponse,
} from '@/api/dto';
import { toFailure } from '@/api/problem';
import {
  LOCAL_TIME_NOTE, aboutText, dueInfo, formatLocal, fromLine, peopleText, progressText, progressWidth,
  stepDue, taskCount,
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
import filters from '@/ui/Filters.module.css';
import list from '@/ui/list.module.css';
import { useRowNav } from '@/ui/rowNav';
import table from '@/ui/table.module.css';
import { DoneMark, StepButton, StepRefusal, useStepAction } from './StepAction';
import { NewTaskDialog } from './TaskDialogs';
import {
  DUE_FILTER, DUE_OPTIONS, TASK_TABS, TASKS_PERMISSION, tabOf, taskHref, useTaskCounts, type TaskTab,
  type TaskTabSpec,
} from './taskAddress';
import styles from './Tasks.module.css';

/**
 * Tasks (Follow-up 12, F12-2): the reader's three views of the tasks the backend's round 10 keeps,
 * built from the approved prototype's handover with the app's own list vocabulary, as Delete
 * records was. The header with New task; the strip of My tasks, Involving me and Finished with the
 * server's counts; the search and the Due filter; each view's columns, in the order the API gives
 * them; the phone cards; paging.
 *
 * Since round 11 My tasks holds every open task the reader is part of, so it shares Involving me's
 * columns and cards (Follow-up 13): the reader's own steps with their actions, a dim dash where the
 * reader has none, and "from" on a task someone else created. Finished keeps its own columns.
 *
 * The server decides. Which tasks a view holds, their order, what the search and the filter find,
 * and whether the reader may mark or undo a step all come from the API; this page words them. The
 * view, the search, the filter and the page live in the address; a change of view keeps the search
 * and the filter and starts again at the first page.
 */

const DEFAULT_PAGE_SIZE = 20;

export const TASKS_DESCRIPTION =
  'Your tasks, and the steps others have given you. Only a task’s creator changes or finishes it.';

/** Each view's empty list, in the prototype's words. */
const EMPTY: Record<TaskTab, { icon: string; title: string; body?: string }> = {
  mine: { icon: 'task_alt', title: 'No open tasks', body: 'Press New task to write down what must not be forgotten.' },
  involving: { icon: 'group', title: 'Nobody is waiting on you', body: 'When someone gives you a step in their task, it appears here.' },
  finished: { icon: 'inventory_2', title: 'Nothing finished yet' },
};

/* the cells --------------------------------------------------------------------------------------- */

const TONE_CLASS = { bad: styles.toneBad, warn: styles.toneWarn } as const;

/** The progress line and its bar; on the folded band of the open views the people come under it. */
function Progress({ task, people }: { task: WorkTaskListItemResponse; people?: string }) {
  const none = task.stepCount === 0;
  return (
    <span className={styles.progress}>
      <span className={none ? styles.progressNone : styles.progressText}>{progressText(task.doneStepCount, task.stepCount)}</span>
      {none ? null : (
        <span aria-hidden="true" className={styles.bar}>
          <span className={styles.barFill} style={{ width: progressWidth(task.doneStepCount, task.stepCount) }} />
        </span>
      )}
      {people ? <span className={`${table.sub} ${table.showTablet}`}>{people}</span> : null}
    </span>
  );
}

/** One of the reader's own steps in the Your step cell: its title and due, Done, and the action. */
function YourStep({ taskId, step }: { taskId: string; step: WorkTaskStepResponse }) {
  const action = useStepAction(taskId, step);
  // My tasks and Involving me hold open tasks only; the step's own state decides its tone.
  const due = stepDue(step, true);
  return (
    <span className={styles.yourStep}>
      <span className={styles.yourStepLine}>
        <span className={styles.yourStepText}>
          <span className={styles.yourStepTitle}>{step.title}</span>
          <span className={`${styles.yourStepDue} ${due.tone ? TONE_CLASS[due.tone] : ''}`}>{due.text}</span>
        </span>
        {step.doneAtUtc ? <DoneMark /> : null}
        <StepButton action={action} size="cell" title={step.title} />
      </span>
      <StepRefusal action={action} />
    </span>
  );
}

/** The Due cell: the task's own date, toned while it is overdue or due today; a dim dash without one. */
function DueCell({ task }: { task: WorkTaskListItemResponse }) {
  if (!task.dueAtUtc) return <span className={table.dim}>—</span>;
  const due = dueInfo(task.dueAtUtc);
  return <span className={`${styles.due} ${due.tone ? TONE_CLASS[due.tone] : ''}`}>{due.text}</span>;
}

/** A closed task's chip, with the time it was closed under it. */
function ClosedCell({ task }: { task: WorkTaskListItemResponse }) {
  const finished = task.status === WorkTaskStatus.Finished;
  return (
    <span className={table.stack}>
      {finished ? <Chip tone="ok" dot="50%">Finished</Chip> : <Chip tone="mute" dot="1px">Cancelled</Chip>}
      <span className={table.sub}>{formatLocal(task.closedAtUtc)}</span>
    </span>
  );
}

/* the phone card ---------------------------------------------------------------------------------- */

function CardStep({ taskId, step }: { taskId: string; step: WorkTaskStepResponse }) {
  const action = useStepAction(taskId, step);
  const due = stepDue(step, true);
  return (
    <div className={styles.cardStep}>
      <div className={styles.cardStepLine}>
        <span className={styles.yourStepText}>
          <span className={styles.yourStepTitle}>{step.title}</span>
          <span className={`${styles.yourStepDue} ${due.tone ? TONE_CLASS[due.tone] : ''}`}>{due.text}</span>
        </span>
        {step.doneAtUtc ? <DoneMark /> : null}
      </div>
      <StepButton action={action} size="card" title={step.title} />
      <StepRefusal action={action} />
    </div>
  );
}

function TaskCard({ task, tab, readerId }: { task: WorkTaskListItemResponse; tab: TaskTabSpec; readerId: string | undefined }) {
  const rowNav = useRowNav();
  const href = taskHref(task.id, tab.id);
  const finishedView = tab.id === 'finished';
  const about = aboutText(task);
  const from = fromLine(task.createdByUserId, task.createdByDisplayName, readerId);
  const due = task.dueAtUtc ? dueInfo(task.dueAtUtc) : null;
  const none = task.stepCount === 0;
  const steps = tab.yourSteps ? task.yourSteps : [];

  return (
    <div {...rowNav(href)} className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.cardHeading}>
          <Link to={href} className={styles.cardTitle}>{task.title}</Link>
          {about ? <span className={styles.cardSub}>{about}</span> : null}
          {from ? <span className={styles.cardSub}>{from}</span> : null}
        </span>
        {finishedView ? (
          task.status === WorkTaskStatus.Finished
            ? <Chip tone="ok" dot="50%">Finished</Chip>
            : <Chip tone="mute" dot="1px">Cancelled</Chip>
        ) : null}
      </div>
      <div className={styles.cardFacts}>
        <span className={styles.cardFact}>
          <span className={styles.cardLabel}>Steps</span>
          <span className={none ? styles.cardValueDim : styles.cardValue}>{progressText(task.doneStepCount, task.stepCount)}</span>
          {none ? null : (
            <span aria-hidden="true" className={`${styles.bar} ${styles.cardBar}`}>
              <span className={styles.barFill} style={{ width: progressWidth(task.doneStepCount, task.stepCount) }} />
            </span>
          )}
        </span>
        <span className={styles.cardFact}>
          <span className={styles.cardLabel}>{finishedView ? 'Closed' : 'Due'}</span>
          {finishedView ? (
            <span className={styles.cardDue}>{formatLocal(task.closedAtUtc)}</span>
          ) : due ? (
            <span className={`${styles.cardDue} ${due.tone ? TONE_CLASS[due.tone] : ''}`}>{due.text}</span>
          ) : (
            <span className={`${styles.cardDue} ${styles.cardValueDim}`}>No due date</span>
          )}
        </span>
      </div>
      {steps.length ? (
        <div className={styles.cardSteps}>
          <span className={styles.cardLabel}>{steps.length > 1 ? 'Your steps' : 'Your step'}</span>
          {steps.map((step) => <CardStep key={step.id} taskId={task.id} step={step} />)}
        </div>
      ) : null}
    </div>
  );
}

/* the page ---------------------------------------------------------------------------------------- */

export function Tasks() {
  const [params, setParams] = useSearchParams();
  const { can, me } = useAccess();
  const rowNav = useRowNav();
  const phone = useTier() === 'phone';
  const allowed = can(TASKS_PERMISSION);
  const { counts } = useTaskCounts();
  const [creating, setCreating] = useState(false);

  const tab = tabOf(params.get('tab'));
  const search = params.get('search') ?? '';
  const dueSlug = params.get('due') ?? '';
  const due = DUE_FILTER[dueSlug];
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

  const query: WorkTaskQuery = {
    View: tab.view,
    PageNumber: pageNumber,
    PageSize: pageSize,
    ...(due ? { Due: due } : {}),
    ...(search ? { Search: search } : {}),
  };

  const tasks = useQuery({
    queryKey: qk.tasks.list(query),
    queryFn: () => listTasks(query),
    enabled: allowed,
    // The previous page stays while the next loads, within one view: another view's rows do not fit
    // this one's columns.
    placeholderData: (previous, previousQuery) =>
      (previousQuery?.queryKey[2] as WorkTaskQuery | undefined)?.View === tab.view ? previous : undefined,
  });

  const header = (
    <PageHeader
      title="Tasks"
      description={TASKS_DESCRIPTION}
      actionsKey={String(allowed)}
      actions={allowed ? <Button label="New task" icon="add" tone="primary" onClick={() => setCreating(true)} /> : undefined}
    />
  );

  const failure = tasks.error ? toFailure(tasks.error) : null;
  if (!allowed || failure?.kind === 'forbidden') {
    return (
      <>
        {header}
        <EmptyState icon="lock" title="Not available to you" body={`Opening this page needs ${TASKS_PERMISSION}.`} />
      </>
    );
  }

  const page = tasks.data;
  const rows = page?.items ?? [];
  const filtered = !!search || !!due;
  const withSteps = tab.yourSteps;
  const finishedView = tab.id === 'finished';
  const empty = EMPTY[tab.id];
  const clear = () => patch({ search: '', due: '' });

  return (
    <div className={shell.page}>
      {header}

      <div className={styles.tabsRow}>
        <RecordTabs
          compact
          tabs={TASK_TABS.map((t) => ({ id: t.id, label: t.label, icon: t.icon, count: counts?.[t.count] }))}
          active={tab.id}
          onSelect={(next) => patch({ tab: next === 'mine' ? '' : next })}
        />
        <span className={styles.zone}>{LOCAL_TIME_NOTE}</span>
      </div>

      <section className={list.panel}>
        <div className={filters.toolbar}>
          <SearchInput
            value={search}
            placeholder="Task, step or record"
            maxLength={50}
            onChange={(next) => patch({ search: next })}
          />
          <SelectFilter value={due ? dueSlug : ''} options={DUE_OPTIONS} label="Due" onChange={(next) => patch({ due: next })} />
          <span className={filters.spacer} />
          {filtered ? <ClearFilters onClear={clear} /> : null}
          <span className={filters.count}>{page ? taskCount(page.totalCount) : ''}</span>
        </div>

        {failure ? (
          <EmptyState
            icon="error"
            title="The tasks could not be loaded"
            body={'message' in failure ? failure.message : 'The request was refused.'}
            onRetry={() => void tasks.refetch()}
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
              action={tab.id === 'mine' ? { label: 'New task', icon: 'add', onClick: () => setCreating(true) } : undefined}
            />
          )
        ) : phone ? (
          <div className={styles.cards}>
            {rows.map((task) => <TaskCard key={task.id} task={task} tab={tab} readerId={me?.id} />)}
          </div>
        ) : (
          <div className={table.scroll}>
            <table className={`${table.table} ${styles.table} ${withSteps ? styles.withSteps : styles.plain}`}>
              <thead>
                <tr>
                  <th scope="col" className={`${table.th} ${styles.cTask}`}>Task</th>
                  <th scope="col" className={`${table.th} ${withSteps ? styles.cSteps150 : styles.cSteps170}`}>Steps</th>
                  {withSteps ? <th scope="col" className={`${table.th} ${styles.cYour}`}>Your step</th> : null}
                  <th scope="col" className={`${table.th} ${withSteps ? `${styles.cPeople200} ${table.foldTablet}` : styles.cPeople240}`}>People</th>
                  <th scope="col" className={`${table.th} ${styles.cDue}`}>{finishedView ? 'Closed' : 'Due'}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((task) => {
                  const href = taskHref(task.id, tab.id);
                  const about = aboutText(task);
                  const from = fromLine(task.createdByUserId, task.createdByDisplayName, me?.id);
                  const people = peopleText(task.people);
                  return (
                    <tr key={task.id} {...rowNav(href)}>
                      <td className={table.td}>
                        <span className={table.stack}>
                          <Link to={href} className={`${table.name} ${table.quietLink} ${styles.title}`}>{task.title}</Link>
                          {about ? <span className={`${table.sub} ${table.wrap}`}>{about}</span> : null}
                          {from ? <span className={table.sub}>{from}</span> : null}
                        </span>
                      </td>
                      <td className={table.td}>
                        <Progress task={task} people={withSteps && task.people.length ? people : undefined} />
                      </td>
                      {withSteps ? (
                        <td className={table.td}>
                          {task.yourSteps.length ? (
                            <span className={styles.yourSteps}>
                              {task.yourSteps.map((step) => <YourStep key={step.id} taskId={task.id} step={step} />)}
                            </span>
                          ) : (
                            // One's own task without a step of one's own (My tasks).
                            <span className={table.dim}>—</span>
                          )}
                        </td>
                      ) : null}
                      <td className={`${table.td} ${table.wrap} ${task.people.length ? '' : table.dim} ${withSteps ? table.foldTablet : ''}`}>
                        {people}
                      </td>
                      <td className={table.td}>
                        {finishedView ? <ClosedCell task={task} /> : <DueCell task={task} />}
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

      <NewTaskDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
