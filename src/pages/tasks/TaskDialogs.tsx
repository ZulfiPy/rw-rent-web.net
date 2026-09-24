import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { qk } from '@/api';
import { listAssignments } from '@/api/rentalAssignments';
import { listCustomers } from '@/api/customers';
import { listDrivers } from '@/api/drivers';
import { listVehicles } from '@/api/vehicles';
import { cancelTask, createTask, finishTask, listTaskPeople, updateTask } from '@/api/tasks';
import {
  WorkTaskAboutKind,
  type CancelWorkTaskRequest, type CreateWorkTaskRequest, type UpdateWorkTaskRequest, type Uuid,
  type WorkTaskResponse, type WorkTaskStepResponse,
} from '@/api/dto';
import { isApiError, type Failure } from '@/api/problem';
import {
  ABOUT_READ, TASK_ABOUT_KINDS, TASK_ABOUT_LABEL, chooseRecord, customerOption, doneLine, driverOption,
  fromLocalInput, fromPrefilledInput, openStepsWarning, rentalOption, toLocalInput, vehicleOption,
} from '@/format';
import { ReseedScope } from '@/app/reseed';
import { useActionMutation } from '@/app/useActionMutation';
import { useAccess } from '@/permissions/usePermissions';
import { Button } from '@/ui/Button';
import { Dialog, DialogNote, dialogStyles } from '@/ui/Dialog';
import { Field, fieldStyles as f, invalidProps } from '@/ui/Field';
import { TASK_REFRESH, taskHref } from './taskAddress';
import styles from './TaskDialogs.module.css';

/**
 * New task and Edit task (F12-4), Finish task and Cancel task (F12-5), from the handover's dialogs
 * and built with the app's own: the shared `Dialog`, `Field` and `invalidProps`, the one mutation
 * hook every dialog submits through, and the stale banner's Refresh.
 *
 * The app judges nothing before it sends: an empty title, a step without a person, a step due after
 * the task, a record that is gone are all the API's refusals, and each lands where it belongs — a
 * field's under the field, a step's under that step's row, the record's under its select, the rest
 * in the dialog's banner, a lost race as the stale banner with Refresh.
 */

/** The first 100 of each kind's list, as the new-rental dialog offers them. */
const PICK = { PageSize: 100 } as const;

/** A step without a person is sent with no one named, and the API says it needs one. */
export const NO_PERSON: Uuid = '00000000-0000-0000-0000-000000000000';

/**
 * A refusal of a task write that is about the task, not a field: "This task no longer exists."
 * is shown as a refused change, with its title, like the closed task's 409. The record the task
 * is about stays the shared reading's, under its select.
 */
export function taskRefusal(error: unknown): Failure | null {
  if (!isApiError(error) || error.status !== 404 || error.code === 'tasks.about_record_not_found') return null;
  return { kind: 'conflict', message: error.problem.detail || error.problem.title || '', code: error.code };
}

/* the form ----------------------------------------------------------------------------------------- */

/** A step as the dialog holds it: its row's key, its id when it is one of the task's, and its values. */
export interface StepDraft {
  key: string;
  id: Uuid | null;
  title: string;
  userId: Uuid | '';
  /** The datetime-local value. */
  due: string;
  /** The stored instant, sent back unchanged while the control still shows it. */
  storedDue: string | null;
  /** The person on the step when the dialog opened, named even when no longer offered. */
  storedUserName: string | null;
  doneAtUtc: string | null;
  doneByDisplayName: string | null;
}

export interface TaskFormState {
  title: string;
  description: string;
  due: string;
  aboutKind: WorkTaskAboutKind | '';
  aboutId: Uuid | '';
  steps: StepDraft[];
}

let nextKey = 0;
const newKey = () => `new-${(nextKey += 1)}`;

export const blankStep = (): StepDraft => ({
  key: newKey(), id: null, title: '', userId: '', due: '', storedDue: null, storedUserName: null,
  doneAtUtc: null, doneByDisplayName: null,
});

const stepDraft = (step: WorkTaskStepResponse): StepDraft => ({
  key: step.id,
  id: step.id,
  title: step.title,
  userId: step.responsibleUserId,
  due: toLocalInput(step.dueAtUtc),
  storedDue: step.dueAtUtc ?? null,
  storedUserName: step.responsibleDisplayName,
  doneAtUtc: step.doneAtUtc ?? null,
  doneByDisplayName: step.doneByDisplayName ?? null,
});

/** The form as an edit opens it: the task as its page read it. */
export const formOf = (task: WorkTaskResponse): TaskFormState => ({
  title: task.title,
  description: task.description ?? '',
  due: toLocalInput(task.dueAtUtc),
  aboutKind: task.aboutKind ?? '',
  aboutId: task.aboutRecordId ?? '',
  steps: task.steps.map(stepDraft),
});

const EMPTY_FORM: TaskFormState = { title: '', description: '', due: '', aboutKind: '', aboutId: '', steps: [] };

/**
 * What New task sends: the form as the person left it. Nothing is judged here; a blank title or a
 * step without a person goes as it is, and the API says what is missing.
 */
export function createRequest(form: TaskFormState): CreateWorkTaskRequest {
  return {
    ...taskFields(form, null),
    steps: form.steps.map((step) => ({
      title: step.title,
      responsibleUserId: step.userId === '' ? NO_PERSON : step.userId,
      dueAtUtc: step.due ? fromLocalInput(step.due) : null,
    })),
  };
}

/**
 * What Edit task sends: the whole task, every step in the order shown with its id when it is one of
 * the task's, so a done step keeps its mark. An instant the person did not touch goes back exactly as
 * it was stored (T-009).
 */
export function updateRequest(form: TaskFormState, task: WorkTaskResponse): UpdateWorkTaskRequest {
  return {
    ...taskFields(form, task),
    steps: form.steps.map((step) => ({
      id: step.id,
      title: step.title,
      responsibleUserId: step.userId === '' ? NO_PERSON : step.userId,
      dueAtUtc: step.id ? fromPrefilledInput(step.due, step.storedDue) : step.due ? fromLocalInput(step.due) : null,
    })),
  };
}

function taskFields(form: TaskFormState, task: WorkTaskResponse | null) {
  return {
    title: form.title,
    description: form.description === '' ? null : form.description,
    dueAtUtc: task ? fromPrefilledInput(form.due, task.dueAtUtc) : form.due ? fromLocalInput(form.due) : null,
    aboutKind: form.aboutKind === '' ? null : form.aboutKind,
    aboutRecordId: form.aboutId === '' ? null : form.aboutId,
  };
}

/** What Cancel task sends: the Why as typed, or none. */
export const cancelRequest = (note: string): CancelWorkTaskRequest => ({ note: note === '' ? null : note });

/**
 * A refusal's message for one member of a step row. The API counts the steps in the order they were
 * sent (`steps[1].dueAtUtc`), so a row is found by where it stood then, wherever it has moved since;
 * a row added after the refusal has none. `member` null asks for the row's own message.
 */
export function stepMessage(
  fields: Record<string, string>,
  sent: readonly string[],
  key: string,
  member: string | null,
): string | undefined {
  const index = sent.indexOf(key);
  if (index < 0) return undefined;
  return member ? fields[`steps[${index}].${member}`] : fields[`steps[${index}].id`] ?? fields[`steps[${index}]`];
}

/** The record select's options for a kind: its list's first 100, inactive ones marked. */
function useRecordOptions(kind: WorkTaskAboutKind | '') {
  const vehicles = useQuery({
    queryKey: qk.vehicles.list(PICK), queryFn: () => listVehicles(PICK), enabled: kind === WorkTaskAboutKind.Vehicle,
  });
  const customers = useQuery({
    queryKey: qk.customers.list(PICK), queryFn: () => listCustomers(PICK), enabled: kind === WorkTaskAboutKind.Customer,
  });
  const drivers = useQuery({
    queryKey: qk.drivers.list(PICK), queryFn: () => listDrivers(PICK), enabled: kind === WorkTaskAboutKind.Driver,
  });
  const rentals = useQuery({
    queryKey: qk.assignments.list(PICK), queryFn: () => listAssignments(PICK), enabled: kind === WorkTaskAboutKind.RentalAssignment,
  });
  switch (kind) {
    case WorkTaskAboutKind.Vehicle:
      return (vehicles.data?.items ?? []).map((v) => ({ value: v.id, label: vehicleOption(v) }));
    case WorkTaskAboutKind.Customer:
      return (customers.data?.items ?? []).map((c) => ({ value: c.id, label: customerOption(c) }));
    case WorkTaskAboutKind.Driver:
      return (drivers.data?.items ?? []).map((d) => ({ value: d.id, label: driverOption(d) }));
    case WorkTaskAboutKind.RentalAssignment:
      return (rentals.data?.items ?? []).map((a) => ({ value: a.id, label: rentalOption(a) }));
    default:
      return [];
  }
}

/**
 * New task (no `task`) and Edit task. An edit sends every step with its id in the order shown, so a
 * done step keeps its mark whether renamed, moved or given to someone else; a step removed here is
 * removed with its mark. `initial` seeds the form (the render tests use it).
 */
export function TaskForm({ task, onClose, initial }: {
  task?: WorkTaskResponse;
  onClose: () => void;
  initial?: Partial<TaskFormState>;
}) {
  const navigate = useNavigate();
  const { me, can } = useAccess();
  const seed = { ...(task ? formOf(task) : EMPTY_FORM), ...initial };
  const [title, setTitle] = useState(seed.title);
  const [description, setDescription] = useState(seed.description);
  const [due, setDue] = useState(seed.due);
  const [aboutKind, setAboutKind] = useState<WorkTaskAboutKind | ''>(seed.aboutKind);
  const [aboutId, setAboutId] = useState<Uuid | ''>(seed.aboutId);
  const [steps, setSteps] = useState<StepDraft[]>(seed.steps);
  /** The rows in the order they were sent: a refusal's `steps[i]` belongs to the row sent i-th. */
  const sent = useRef<string[]>(seed.steps.map((step) => step.key));
  const created = useRef<Uuid | null>(null);

  const people = useQuery({ queryKey: qk.tasks.people, queryFn: listTaskPeople });
  const records = useRecordOptions(aboutKind);

  const form: TaskFormState = { title, description, due, aboutKind, aboutId, steps };

  const m = useActionMutation({
    op: task ? 'task-edit' : 'task-create',
    mutationFn: async () => {
      sent.current = steps.map((step) => step.key);
      if (task) return updateTask(task.id, updateRequest(form, task));
      const answer = await createTask(createRequest(form));
      created.current = answer.id;
      return answer;
    },
    invalidate: TASK_REFRESH,
    refusal: taskRefusal,
    onDone: () => {
      const id = created.current;
      onClose();
      // After Create the new task's page opens, its breadcrumb leading back to My tasks.
      if (id) navigate(taskHref(id));
    },
  });

  const stepError = (key: string, member: string) => stepMessage(m.fields, sent.current, key, member);
  const stepRowError = (key: string) => stepMessage(m.fields, sent.current, key, null);

  const setStep = (key: string, patch: Partial<StepDraft>) =>
    setSteps((list) => list.map((step) => (step.key === key ? { ...step, ...patch } : step)));
  const moveStep = (key: string, by: -1 | 1) =>
    setSteps((list) => {
      const at = list.findIndex((step) => step.key === key);
      const to = at + by;
      if (at < 0 || to < 0 || to >= list.length) return list;
      const next = list.slice();
      [next[at], next[to]] = [next[to]!, next[at]!];
      return next;
    });

  const peopleOptions = (people.data ?? []).map((person) => ({
    value: person.userId,
    label: person.userId === me?.id ? `${person.displayName} (you)` : person.displayName,
  }));

  // The kinds the reader may open a list of; the task's own kind stays offered whatever it is.
  const kinds = TASK_ABOUT_KINDS.filter((kind) => can(ABOUT_READ[kind]) || kind === task?.aboutKind);
  const recordOptions = aboutKind === '' ? [] : [...records];
  // The record the task is about stays offered while its kind is chosen: beyond the first 100, or
  // gone since, when an unchanged reference is kept.
  if (task?.aboutKind && task.aboutRecordId && aboutKind === task.aboutKind
    && !recordOptions.some((option) => option.value === task.aboutRecordId)) {
    recordOptions.push({
      value: task.aboutRecordId,
      label: task.aboutRecordExists && task.aboutLabel ? task.aboutLabel : 'deleted record',
    });
  }

  return (
    <Dialog
      title={task ? 'Edit task' : 'New task'}
      icon="checklist"
      tone="accent"
      width={720}
      submitLabel={task ? 'Save changes' : 'Create task'}
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <div className={dialogStyles.section}>
        <p className={dialogStyles.sectionTitle}>Task</p>
        <div className={styles.taskGrid}>
          <span className={styles.span}>
            <Field label="Title" required error={m.fields['title']}>
              <input
                className={f.control}
                {...invalidProps(m.fields['title'])}
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
          </span>
          <span className={styles.span}>
            <Field label="Description" optional error={m.fields['description']}>
              <textarea
                className={f.control}
                {...invalidProps(m.fields['description'])}
                rows={3}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
          </span>
          <Field label="Due" optional error={m.fields['dueAtUtc']}>
            <input
              type="datetime-local"
              className={f.control}
              {...invalidProps(m.fields['dueAtUtc'])}
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </Field>
          <Field label="About" optional error={m.fields['aboutKind']}>
            <select
              className={f.control}
              {...invalidProps(m.fields['aboutKind'])}
              value={aboutKind === '' ? '' : String(aboutKind)}
              onChange={(e) => {
                setAboutKind(e.target.value ? Number(e.target.value) as WorkTaskAboutKind : '');
                setAboutId('');
              }}
            >
              <option value="">Nothing</option>
              {kinds.map((kind) => <option key={kind} value={kind}>{TASK_ABOUT_LABEL[kind]}</option>)}
            </select>
          </Field>
          {aboutKind === '' ? null : (
            <span className={styles.span}>
              <Field label={TASK_ABOUT_LABEL[aboutKind]} required error={m.fields['aboutRecordId']}>
                <select
                  className={f.control}
                  {...invalidProps(m.fields['aboutRecordId'])}
                  value={aboutId}
                  onChange={(e) => setAboutId(e.target.value)}
                >
                  <option value="">{chooseRecord(aboutKind)}</option>
                  {recordOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </Field>
            </span>
          )}
        </div>
      </div>

      <div className={dialogStyles.section}>
        <p className={dialogStyles.sectionTitle}>Steps</p>
        <div className={styles.steps}>
          {steps.map((step, index) => {
            const titleError = stepError(step.key, 'title');
            const personError = stepError(step.key, 'responsibleUserId');
            const dueError = stepError(step.key, 'dueAtUtc');
            const rowError = stepRowError(step.key);
            const options = peopleOptions.some((option) => option.value === step.userId) || step.userId === ''
              ? peopleOptions
              : [...peopleOptions, { value: step.userId, label: step.storedUserName ?? step.userId }];
            return (
              <div
                key={step.key}
                className={styles.step}
                data-refused={titleError || personError || dueError || rowError ? 'true' : undefined}
              >
                <span aria-hidden="true" className={styles.stepNum}>{index + 1}</span>
                <div className={styles.stepFields}>
                  <span className={styles.span}>
                    <Field label="Title" required error={titleError}>
                      <input
                        className={f.control}
                        {...invalidProps(titleError)}
                        maxLength={200}
                        value={step.title}
                        onChange={(e) => setStep(step.key, { title: e.target.value })}
                      />
                    </Field>
                  </span>
                  <Field label="Person" required error={personError}>
                    <select
                      className={f.control}
                      {...invalidProps(personError)}
                      value={step.userId}
                      onChange={(e) => setStep(step.key, { userId: e.target.value })}
                    >
                      <option value="">Choose a person</option>
                      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Due" optional error={dueError}>
                    <input
                      type="datetime-local"
                      className={f.control}
                      {...invalidProps(dueError)}
                      value={step.due}
                      onChange={(e) => setStep(step.key, { due: e.target.value })}
                    />
                  </Field>
                  {step.doneAtUtc ? (
                    <span className={styles.done}>
                      <span data-icon aria-hidden="true" className={styles.doneIcon}>check_circle</span>
                      {doneLine(step)}
                    </span>
                  ) : null}
                  {rowError ? (
                    <span role="alert" className={`${f.error} ${styles.span}`}>
                      <span data-icon aria-hidden="true" className={f.errorIcon}>error</span>
                      {rowError}
                    </span>
                  ) : null}
                </div>
                <div className={styles.stepButtons}>
                  <button
                    type="button"
                    className={styles.stepButton}
                    aria-label="Move step up"
                    title="Move step up"
                    disabled={index === 0}
                    onClick={() => moveStep(step.key, -1)}
                  >
                    <span data-icon aria-hidden="true" className={styles.stepButtonIcon}>arrow_upward</span>
                  </button>
                  <button
                    type="button"
                    className={styles.stepButton}
                    aria-label="Move step down"
                    title="Move step down"
                    disabled={index === steps.length - 1}
                    onClick={() => moveStep(step.key, 1)}
                  >
                    <span data-icon aria-hidden="true" className={styles.stepButtonIcon}>arrow_downward</span>
                  </button>
                  <button
                    type="button"
                    className={styles.stepButton}
                    aria-label="Remove step"
                    title="Remove step"
                    onClick={() => setSteps((list) => list.filter((other) => other.key !== step.key))}
                  >
                    <span data-icon aria-hidden="true" className={styles.stepButtonIcon}>close</span>
                  </button>
                </div>
              </div>
            );
          })}
          {steps.length === 0 ? <p className={styles.stepsEmpty}>No steps: the task stays yours alone.</p> : null}
          <div className={styles.addRow}>
            <Button label="Add step" icon="add" small onClick={() => setSteps((list) => [...list, blankStep()])} />
          </div>
          {m.fields['steps'] ? (
            <span role="alert" className={f.error}>
              <span data-icon aria-hidden="true" className={f.errorIcon}>error</span>
              {m.fields['steps']}
            </span>
          ) : null}
          <p className={styles.hint}>
            Everyone named on a step sees this task and can mark their own step done. Only you change or finish the task.
          </p>
        </div>
      </div>
    </Dialog>
  );
}

/* finish and cancel -------------------------------------------------------------------------------- */

/**
 * Finish task: in the ok tone when every step is done, and with a warn banner naming the steps
 * still open when some are, which stay not done.
 */
export function FinishTask({ task, onClose }: { task: WorkTaskResponse; onClose: () => void }) {
  const warning = openStepsWarning(task.steps);
  const m = useActionMutation({
    op: 'task-finish',
    mutationFn: () => finishTask(task.id),
    invalidate: TASK_REFRESH,
    refusal: taskRefusal,
    onDone: onClose,
  });
  return (
    <Dialog
      title="Finish task"
      description={warning ? undefined : 'Finish this task? It leaves everyone’s open list.'}
      icon="task_alt"
      tone="ok"
      width={500}
      submitLabel="Finish task"
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      {warning ? (
        <DialogNote icon="warning" tone="warn" title={warning}>Finish anyway?</DialogNote>
      ) : null}
      <ul className={dialogStyles.consequences}>
        <li className={dialogStyles.consequence}>It stays readable under Finished for everyone on it.</li>
        <li className={dialogStyles.consequence}>Its steps can no longer be marked done or undone.</li>
      </ul>
    </Dialog>
  );
}

/** Cancel task, with the optional Why; "Keep task" closes it without a change. */
export function CancelTask({ task, onClose, initialNote = '' }: {
  task: WorkTaskResponse;
  onClose: () => void;
  initialNote?: string;
}) {
  const [note, setNote] = useState(initialNote);
  const m = useActionMutation({
    op: 'task-cancel',
    mutationFn: () => cancelTask(task.id, cancelRequest(note)),
    invalidate: TASK_REFRESH,
    refusal: taskRefusal,
    onDone: onClose,
  });
  return (
    <Dialog
      title="Cancel task"
      description="The task moves to Finished as Cancelled. Everyone on it can still read it there."
      icon="block"
      tone="mute"
      width={520}
      submitLabel="Cancel task"
      cancelLabel="Keep task"
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <Field label="Why" optional error={m.fields['note']}>
        <textarea
          className={f.control}
          {...invalidProps(m.fields['note'])}
          rows={3}
          maxLength={1000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
    </Dialog>
  );
}

/* the switches ------------------------------------------------------------------------------------- */

export function NewTaskDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <ReseedScope>
      <TaskForm onClose={onClose} />
    </ReseedScope>
  );
}

export type TaskDialogKind = 'edit' | 'finish' | 'cancel';

/**
 * A task page's three dialogs. Each reads the task as the page holds it; the stale banner's Refresh
 * reloads it and re-seeds the dialog from what came back.
 */
export function TaskDialogs({ kind, task, onClose }: {
  kind: TaskDialogKind | null;
  task: WorkTaskResponse;
  onClose: () => void;
}) {
  if (!kind) return null;
  return (
    <ReseedScope>
      {kind === 'edit' ? <TaskForm task={task} onClose={onClose} />
        : kind === 'finish' ? <FinishTask task={task} onClose={onClose} />
          : <CancelTask task={task} onClose={onClose} />}
    </ReseedScope>
  );
}
