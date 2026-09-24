import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { qk } from '@/api';
import { getTask } from '@/api/tasks';
import { WorkTaskStatus, type WorkTaskResponse, type WorkTaskStepResponse } from '@/api/dto';
import { isApiError, toFailure } from '@/api/problem';
import {
  ABOUT_READ, LOCAL_TIME_NOTE, TASK_STATUS_LABEL, aboutHref, aboutText, closedBanner, createdByName,
  doneLine, dueInfo, formatLocal, lastChangedByName, personName, progressLong, stepDue,
} from '@/format';
import { useAccess } from '@/permissions/usePermissions';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { Fact, FactGrid } from '@/ui/FactGrid';
import { Panel } from '@/ui/Panel';
import { HeaderFact, RecordHeader } from '@/ui/RecordHeader';
import { RecordBanner, recordStyles as shell } from '@/ui/RecordTabs';
import type { Tone } from '@/ui/status';
import { StepButton, StepRefusal, useStepAction } from './StepAction';
import { TaskDialogs, type TaskDialogKind } from './TaskDialogs';
import { TASKS_PERMISSION, tabOf, tasksHref } from './taskAddress';
import tasks from './Tasks.module.css';
import styles from './TaskRecord.module.css';

/**
 * One task (Follow-up 12, F12-3), as the handover shows it: the breadcrumb back to the view it was
 * opened from, the hero with the status, who created it, when it is due, what it is about and how
 * far it is, and — only when the API says the reader may change it (`canChange`) — Edit, Finish
 * task and Cancel task; the banner of a finished or cancelled task; the description; the steps, each
 * with the Mark done or Undo the API allows its reader; and who created it and last changed it.
 *
 * A task the reader is not on is "not shared with you" (`403 tasks.not_shared`); one that does not
 * exist is not found (`404 tasks.not_found`).
 */

const STATUS_TONE: Record<WorkTaskStatus, Tone> = {
  [WorkTaskStatus.Open]: 'info',
  [WorkTaskStatus.Finished]: 'ok',
  [WorkTaskStatus.Cancelled]: 'mute',
};

const STATUS_DOT: Record<WorkTaskStatus, string> = {
  [WorkTaskStatus.Open]: '2px',
  [WorkTaskStatus.Finished]: '50%',
  [WorkTaskStatus.Cancelled]: '1px',
};

const TONE_CLASS = { bad: tasks.toneBad, warn: tasks.toneWarn } as const;

/** One step of the Steps panel: its number, title, person and due, its state, and its action. */
function StepRow({ task, step, number, readerId }: {
  task: WorkTaskResponse;
  step: WorkTaskStepResponse;
  number: number;
  readerId: string | undefined;
}) {
  const action = useStepAction(task.id, step);
  const open = task.status === WorkTaskStatus.Open;
  const due = stepDue(step, open);
  const done = !!step.doneAtUtc;
  return (
    <li className={styles.step}>
      <span aria-hidden="true" className={styles.num} data-done={done ? 'true' : undefined}>{number}</span>
      <span className={styles.stepText}>
        <span className={styles.stepTitle}>{step.title}</span>
        <span className={styles.stepMeta}>
          <span>{personName(step.responsibleDisplayName, step.responsibleUserId, readerId)}</span>
          <span className={due.tone ? TONE_CLASS[due.tone] : undefined}>{due.text}</span>
        </span>
      </span>
      <span className={styles.stepState}>
        {done ? <Chip tone="ok" dot="50%">{doneLine(step)}</Chip> : <Chip tone="mute" dot="2px">Open</Chip>}
        <StepButton action={action} size="panel" title={step.title} />
      </span>
      {action.refusal ? <span className={styles.stepRefusalRow}><StepRefusal action={action} /></span> : null}
    </li>
  );
}

export function TaskRecord() {
  const { taskId = '' } = useParams();
  const [params] = useSearchParams();
  const { can, me } = useAccess();
  const [dialog, setDialog] = useState<TaskDialogKind | null>(null);
  const back = tasksHref(tabOf(params.get('tab')).id);

  const record = useQuery({
    queryKey: qk.tasks.detail(taskId),
    queryFn: () => getTask(taskId),
    enabled: can(TASKS_PERMISSION),
  });
  const task = record.data;

  if (record.error) {
    const failure = toFailure(record.error);
    const code = isApiError(record.error) ? record.error.code : undefined;
    const notShared = code === 'tasks.not_shared';
    const notFound = code === 'tasks.not_found';
    return (
      <div className={shell.page}>
        <RecordHeader backTo={back} backLabel="Tasks" title="Task" />
        {notShared ? (
          <Panel title="Task">
            <EmptyState
              variant="panel"
              icon="lock"
              title="This task is not shared with you"
              body="A task is seen by its creator and by the people named on its steps."
            />
          </Panel>
        ) : failure.kind === 'forbidden' ? (
          <EmptyState icon="lock" title="Not available to you" body={`Opening this page needs ${TASKS_PERMISSION}.`} />
        ) : (
          <EmptyState
            icon="checklist"
            title="That task is not available"
            body={'message' in failure ? failure.message : 'The task could not be loaded.'}
            onRetry={notFound ? undefined : () => void record.refetch()}
          />
        )}
      </div>
    );
  }

  const open = task?.status === WorkTaskStatus.Open;
  const due = task?.dueAtUtc ? dueInfo(task.dueAtUtc) : null;
  // Tones apply to an open task only.
  const dueTone = open && due?.tone ? due.tone : null;
  const about = task ? aboutText(task) : null;
  const href = task ? aboutHref(task) : null;
  const linked = href && task?.aboutKind && can(ABOUT_READ[task.aboutKind]) ? href : null;
  const banner = task ? closedBanner(task) : null;
  const finished = task?.status === WorkTaskStatus.Finished;
  const steps = task?.steps ?? [];

  return (
    <div className={shell.page}>
      <RecordHeader
        backTo={back}
        backLabel="Tasks"
        title={task?.title ?? 'Task'}
        description={LOCAL_TIME_NOTE}
        stackActions
        chip={task ? {
          label: TASK_STATUS_LABEL[task.status],
          tone: STATUS_TONE[task.status],
          dot: STATUS_DOT[task.status],
        } : undefined}
        actions={task?.canChange ? (
          <>
            <Button label="Edit" icon="edit" small onClick={() => setDialog('edit')} />
            <Button label="Finish task" icon="task_alt" tone="primary" small onClick={() => setDialog('finish')} />
            <Button label="Cancel task" icon="block" small onClick={() => setDialog('cancel')} />
          </>
        ) : undefined}
      >
        <HeaderFact
          label="Created by"
          value={task ? createdByName(task) : '—'}
          sub={task ? formatLocal(task.createdAtUtc) : null}
        />
        <HeaderFact
          label="Due"
          value={(
            <span className={dueTone ? TONE_CLASS[dueTone] : task?.dueAtUtc ? undefined : styles.dim}>
              {task?.dueAtUtc ? formatLocal(task.dueAtUtc) : 'No due date'}
            </span>
          )}
          sub={dueTone === 'bad' ? 'Overdue' : dueTone === 'warn' ? 'Due today' : null}
        />
        <HeaderFact
          label="About"
          value={about
            ? linked ? <Link to={linked} className={styles.aboutLink}>{about}</Link> : about
            : <span className={styles.dim}>Nothing</span>}
        />
        <HeaderFact label="Progress" value={task ? progressLong(task.doneStepCount, task.stepCount) : '—'} />
      </RecordHeader>

      {banner ? (
        <RecordBanner
          tone={finished ? 'ok' : 'mute'}
          icon={finished ? 'task_alt' : 'block'}
          title={banner.title}
          body={banner.body}
        />
      ) : null}

      {task?.description ? (
        <Panel title="Description">
          <p className={styles.description}>{task.description}</p>
        </Panel>
      ) : null}

      {task ? (
        <Panel
          title="Steps"
          description={steps.length
            ? `In the order ${task.viewerIsCreator ? 'you' : 'the creator'} set. Steps do not wait for each other.`
            : undefined}
        >
          {steps.length ? (
            <ol className={styles.steps}>
              {steps.map((step, index) => (
                <StepRow key={step.id} task={task} step={step} number={index + 1} readerId={me?.id} />
              ))}
            </ol>
          ) : (
            <EmptyState variant="panel" icon="person" title="No steps" body="This task is yours alone." />
          )}
        </Panel>
      ) : null}

      {task ? (
        <Panel title="Record">
          <FactGrid>
            <Fact label="Created" mono sub={`by ${createdByName(task)}`}>{formatLocal(task.createdAtUtc)}</Fact>
            <Fact
              label="Last updated"
              mono={!!task.updatedAtUtc}
              dim={!task.updatedAtUtc}
              sub={task.updatedAtUtc ? `by ${lastChangedByName(task)}` : null}
            >
              {task.updatedAtUtc ? formatLocal(task.updatedAtUtc) : 'Never'}
            </Fact>
          </FactGrid>
        </Panel>
      ) : null}

      {task ? <TaskDialogs kind={dialog} task={task} onClose={() => setDialog(null)} /> : null}
    </div>
  );
}
