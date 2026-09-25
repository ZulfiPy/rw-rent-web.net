import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { isApiError, GENERIC_REFUSAL } from '@/api/problem';
import { markStepDone, undoStep } from '@/api/tasks';
import type { Uuid, WorkTaskStepResponse } from '@/api/dto';
import { useGatedMutation } from '@/app/submitOnce';
import { fieldStyles as f } from '@/ui/Field';
import { refreshTasks } from './taskAddress';
import styles from './Tasks.module.css';

/**
 * The API's own sentence for a refused mark or undo: "This step is already done.", "The task
 * changed concurrently. Retry the operation." A request that never reached the API says so.
 */
export function stepRefusal(error: unknown): string {
  if (isApiError(error)) return error.problem.detail || error.problem.title || GENERIC_REFUSAL;
  return error instanceof Error ? error.message : GENERIC_REFUSAL;
}

/**
 * Mark done and Undo (F12-5): a single action without a dialog. Whether it is offered is the
 * server's answer (`canMarkDone`, `canUndo`), never the app's reading of who the reader is. It
 * refreshes every task query, so the list, the task, the counts and the to-do list follow at once
 * (F12-7); a refusal refreshes them too, and its sentence stays where the action was.
 */
export function useStepAction(taskId: Uuid, step: WorkTaskStepResponse) {
  const queryClient = useQueryClient();
  const [refusal, setRefusal] = useState<string | null>(null);
  const done = !!step.doneAtUtc;
  const refresh = () => refreshTasks(queryClient);

  const mutation = useGatedMutation({
    mutationFn: () => (done ? undoStep(taskId, step.id) : markStepDone(taskId, step.id)),
    onSuccess: async () => {
      setRefusal(null);
      await refresh();
    },
    onError: async (error: unknown) => {
      setRefusal(stepRefusal(error));
      await refresh();
    },
  });

  return {
    done,
    offered: done ? step.canUndo : step.canMarkDone,
    busy: mutation.isPending,
    refusal,
    run: () => mutation.submit(),
  };
}

export type StepActionState = ReturnType<typeof useStepAction>;

/**
 * The button: "Mark done" on a step still to do, "Undo" on a done one. `size` is where it stands:
 * a list row's cell (one width for both labels, Follow-up 14), a phone card's step (44px, full
 * width), or the task's Steps panel. Nothing is drawn when the API offers no action.
 */
export function StepButton({ action, size, title }: {
  action: StepActionState;
  size: 'cell' | 'card' | 'panel';
  /** The step's title, so a reader of the button alone knows which step it marks. */
  title: string;
}) {
  if (!action.offered) return null;
  const label = action.done ? 'Undo' : 'Mark done';
  return (
    <button
      type="button"
      className={styles.stepButton}
      data-size={size}
      data-done={action.done ? 'true' : undefined}
      disabled={action.busy}
      aria-label={`${label}: ${title}`}
      onClick={action.run}
    >
      <span data-icon aria-hidden="true" className={styles.stepButtonIcon}>{action.done ? 'undo' : 'check'}</span>
      <span>{action.busy ? 'Working…' : label}</span>
    </button>
  );
}

/** The refusal's sentence, under the step it was about. */
export function StepRefusal({ action }: { action: StepActionState }) {
  if (!action.refusal) return null;
  return (
    <span role="alert" className={`${f.error} ${styles.stepRefusal}`}>
      <span data-icon aria-hidden="true" className={f.errorIcon}>error</span>
      {action.refusal}
    </span>
  );
}

/**
 * "✓ Done" in a list row or on a phone card: the line under a done step's title, in place of its
 * due line (Follow-up 14), so a done step reads the same on every screen.
 */
export function DoneMark() {
  return (
    <span className={styles.doneMark}>
      <span data-icon aria-hidden="true" className={styles.doneMarkIcon}>check</span>
      Done
    </span>
  );
}
