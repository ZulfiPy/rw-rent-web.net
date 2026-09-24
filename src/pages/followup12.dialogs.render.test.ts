import { createElement as h } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import { fieldMessages, toFailure } from '@/api/problem';
import { WorkTaskAboutKind, type ProblemDetails } from '@/api/dto';
import { CancelTask, FinishTask, TaskForm, blankStep, formOf, type StepDraft } from './tasks/TaskDialogs';
import { around, clearTaskRenders, count, refused, renderAs } from './followup12.harness';
import {
  CAPTURED_AT, cancelNoteLongRefusal, concurrencyRefusal, createAboutMissingRefusal, createDueAfterRefusal,
  createKindWithoutRecordRefusal, createShapeRefusal, createTitleLongRefusal, editAboutMissingRefusal,
  editClosedRefusal, editCreatorOnlyRefusal, editDueAfterRefusal, editPractice, finishAgainRefusal,
  meDita, notFoundDita, peopleDita, pickAssignments, pickCustomers, pickDrivers, pickVehicles,
  taskAboutDeleted, taskFobsDita, taskPrepareDita,
} from './followup12.support';

/**
 * Follow-up 12, F12-4 and F12-5: New task and Edit task with their steps, Finish task and Cancel
 * task, each rendered with the lists they pick from and a refusal the scratch API really gave. A
 * server render cannot submit, so the one hook every dialog submits through is replaced, as in
 * Follow-ups 10 and 11: it answers with the refusal a test names, read by the dialog's own `refusal`
 * and the app's own `toFailure` under the dialog's own `op`, which is what the real hook does.
 */
const hook = vi.hoisted(() => ({ refusal: null as unknown, ops: [] as string[] }));

vi.mock('@/app/useActionMutation', () => ({
  useActionMutation: ({ op, refusal }: { op: string; refusal?: (error: unknown) => unknown }) => {
    hook.ops.push(op);
    const failure = hook.refusal
      ? ((refusal?.(hook.refusal) as ReturnType<typeof toFailure> | null) ?? toFailure(hook.refusal, op))
      : null;
    return { submit: () => true, busy: false, failure, fields: failure ? fieldMessages(failure) : {}, refresh: () => {} };
  },
}));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(CAPTURED_AT));
});
afterEach(() => {
  vi.useRealTimers();
  clearTaskRenders();
  hook.refusal = null;
  hook.ops = [];
});

const PICK = { PageSize: 100 } as const;
const LISTS: Array<[readonly unknown[], unknown]> = [
  [qk.tasks.people, peopleDita],
  [qk.vehicles.list(PICK), pickVehicles],
  [qk.customers.list(PICK), pickCustomers],
  [qk.drivers.list(PICK), pickDrivers],
  [qk.assignments.list(PICK), pickAssignments],
];

const dialog = (element: ReturnType<typeof h>, body: ProblemDetails | null = null, me = meDita, data = LISTS) => {
  hook.refusal = body ? refused(body) : null;
  return renderAs(element, { at: '/x', route: '/x', me, data }).markup;
};

/** The markup of one field, from its label to the end of that field. */
const field = (markup: string, label: string, from = 0) => {
  const at = markup.indexOf(`<span>${label}</span>`, from);
  expect(at, `no field ${label}`).toBeGreaterThan(-1);
  const start = markup.lastIndexOf('<label', at);
  return markup.slice(start, markup.indexOf('</label>', at) + '</label>'.length);
};

/** The markup of the n-th step row (from 1). */
const stepRow = (markup: string, n: number) => {
  const rows = markup.split(/(?=<div class="_step_[^"]*"(?: data-refused="true")?>)/).slice(1);
  expect(rows.length, 'too few step rows').toBeGreaterThanOrEqual(n);
  const row = rows[n - 1]!;
  return row.slice(0, row.indexOf('<div class="_stepButtons_') > -1 ? row.indexOf('</div></div>', row.indexOf('<div class="_stepButtons_')) : undefined);
};

const marked = (markup: string) => markup.match(/aria-invalid="true"/g)?.length ?? 0;
const escaped = (text: string) => text.replace(/'/g, '&#x27;');

const step = (patch: Partial<StepDraft>): StepDraft => ({ ...blankStep(), ...patch });
const ids = Object.fromEntries(peopleDita.map((person) => [person.displayName.split(' ')[0]!, person.userId]));

describe('New task (F12-4)', () => {
  test('its sections as the handover draws them: Task, then Steps with none yet', () => {
    const markup = dialog(h(TaskForm, { onClose: () => {} }));
    expect(hook.ops).toEqual(['task-create']);
    expect(markup).toContain('aria-label="New task"');
    expect(markup).toContain('>Task</p>');
    expect(field(markup, 'Title')).toContain('required');
    expect(field(markup, 'Description')).toContain('· optional');
    expect(field(markup, 'Due')).toContain('type="datetime-local"');
    const about = field(markup, 'About');
    expect(about).toContain('<option value="" selected="">Nothing</option>');
    expect(about).toMatch(/Vehicle<\/option>.*Customer<\/option>.*Driver<\/option>.*Rental assignment<\/option>/);
    expect(markup).toContain('>Steps</p>');
    expect(markup).toContain('No steps: the task stays yours alone.');
    expect(markup).toMatch(/add<\/span>Add step<\/button>/);
    expect(markup).toContain('Everyone named on a step sees this task and can mark their own step done. Only you change or finish the task.');
    expect(markup).toMatch(/Cancel<\/button><button[^>]*data-tone="primary"[^>]*>Create task<\/button>/);
    expect(marked(markup)).toBe(0);
  });

  test('About reveals the record select for its kind: the first 100, inactive ones marked', () => {
    const vehicles = dialog(h(TaskForm, { onClose: () => {}, initial: { aboutKind: WorkTaskAboutKind.Vehicle } }));
    const vehicle = field(vehicles, 'Vehicle', vehicles.indexOf('>Rental assignment</option>'));
    expect(vehicle).toContain('required');
    expect(vehicle).toContain('<option value="" selected="">Choose a vehicle</option>');
    expect(vehicle).toContain('>204 JLM · Hyundai Kona Electric</option>');
    expect(vehicle).toContain('>660 BYH · Fiat Tipo · inactive</option>');
    expect(count(vehicle, '<option')).toBe(pickVehicles.items.length + 1);

    const rentals = dialog(h(TaskForm, { onClose: () => {}, initial: { aboutKind: WorkTaskAboutKind.RentalAssignment } }));
    const rental = field(rentals, 'Rental assignment', rentals.indexOf('>Rental assignment</option>') + 1);
    expect(rental).toContain('Choose a rental assignment');
    expect(rental).toContain('>552 KLM · Nordwind Logistics · Active</option>');
    expect(rental).toContain('>660 BYH · Ventspils Marine Services · Cancelled</option>');

    const customers = dialog(h(TaskForm, { onClose: () => {}, initial: { aboutKind: WorkTaskAboutKind.Customer } }));
    expect(customers).toContain('>Ventspils Marine Services · inactive</option>');
    const drivers = dialog(h(TaskForm, { onClose: () => {}, initial: { aboutKind: WorkTaskAboutKind.Driver } }));
    expect(drivers).toContain('>Normunds Zarins · inactive</option>');
    expect(drivers).toContain('>Janis Krumins</option>');
  });

  test('a step row: Title, Person from the people with "(you)", Due, and its three buttons', () => {
    const markup = dialog(h(TaskForm, {
      onClose: () => {},
      initial: { steps: [step({ title: 'Measure', userId: ids.Toms! }), step({ title: 'Order', userId: ids.Dita! })] },
    }));
    expect(markup).not.toContain('No steps: the task stays yours alone.');
    const first = stepRow(markup, 1);
    expect(first).toContain('>1</span>');
    const person = field(first, 'Person');
    expect(person).toContain('<option value="">Choose a person</option>');
    expect(person).toMatch(new RegExp(`<option value="${ids.Toms}" selected="">Toms Rudzitis</option>`));
    expect(person).toContain('>Dita Smite (you)</option>');
    expect(person).toContain('>Karlis Zvaigzne</option>');
    expect(first).toMatch(/aria-label="Move step up" title="Move step up" disabled=""/);
    expect(first).not.toMatch(/aria-label="Move step down" title="Move step down" disabled=""/);
    expect(first).toContain('aria-label="Remove step"');
    const second = stepRow(markup, 2);
    expect(second).toMatch(/aria-label="Move step down" title="Move step down" disabled=""/);
  });

  test('the API’s shape refusal lands on the title and on the step row’s title and person', () => {
    const markup = dialog(h(TaskForm, { onClose: () => {}, initial: { title: '  ', steps: [step({})] } }), createShapeRefusal);
    expect(createShapeRefusal.status).toBe(400);
    expect(field(markup, 'Title')).toContain('Enter a title for the task.');
    const row = stepRow(markup, 1);
    expect(row).toContain('data-refused="true"');
    expect(field(row, 'Title')).toContain('Every step needs a title.');
    expect(field(row, 'Person')).toContain('Every step needs a person.');
    expect(field(row, 'Due')).not.toContain('aria-invalid');
    expect(marked(markup)).toBe(3);
    expect(markup).not.toContain('_alert_');
  });

  test('a step due after the task: under that step’s Due, not the other’s', () => {
    const markup = dialog(h(TaskForm, {
      onClose: () => {},
      initial: { steps: [step({ title: 'First', userId: ids.Toms! }), step({ title: 'Second', userId: ids.Dita! })] },
    }), createDueAfterRefusal);
    expect(Object.keys((createDueAfterRefusal as { errors: object }).errors)).toEqual(['Steps[1].DueAtUtc']);
    expect(stepRow(markup, 1)).not.toContain('aria-invalid');
    const second = stepRow(markup, 2);
    expect(field(second, 'Due')).toContain('A step cannot be due after the task.');
    expect(marked(markup)).toBe(1);
  });

  test('a record that is gone lands under the record select; a kind without a record too', () => {
    const missing = dialog(h(TaskForm, { onClose: () => {}, initial: { aboutKind: WorkTaskAboutKind.Vehicle } }), createAboutMissingRefusal);
    expect(createAboutMissingRefusal.status).toBe(404);
    const vehicle = field(missing, 'Vehicle', missing.indexOf('>Rental assignment</option>'));
    expect(vehicle).toContain('aria-invalid="true"');
    expect(vehicle).toContain('The vehicle this task is about was not found.');
    expect(missing).not.toContain('_alert_');
    expect(marked(missing)).toBe(1);

    const none = dialog(h(TaskForm, { onClose: () => {}, initial: { aboutKind: WorkTaskAboutKind.Vehicle } }), createKindWithoutRecordRefusal);
    expect(field(none, 'Vehicle', none.indexOf('>Rental assignment</option>'))).toContain('Choose the vehicle this task is about.');
  });

  test('a title too long, in the API’s words', () => {
    const markup = dialog(h(TaskForm, { onClose: () => {} }), createTitleLongRefusal);
    expect(field(markup, 'Title')).toContain('The title must be at most 200 characters.');
  });
});

describe('Edit task (F12-4)', () => {
  test('it opens on the task as its page read it: the steps in order, the done one with its line', () => {
    const markup = dialog(h(TaskForm, { task: taskPrepareDita, onClose: () => {} }));
    expect(hook.ops).toEqual(['task-edit']);
    expect(markup).toContain('aria-label="Edit task"');
    expect(markup).toMatch(/data-tone="primary"[^>]*>Save changes<\/button>/);
    expect(field(markup, 'Title')).toContain(`value="${taskPrepareDita.title}"`);
    expect(field(markup, 'Description')).toContain(taskPrepareDita.description!);
    expect(field(markup, 'Due')).toContain('value="2026-09-27T16:08"');
    expect(field(markup, 'Vehicle', markup.indexOf('>Rental assignment</option>'))).toMatch(
      new RegExp(`<option value="${taskPrepareDita.aboutRecordId}" selected="">204 JLM · Hyundai Kona Electric</option>`),
    );
    taskPrepareDita.steps.forEach((s, index) => {
      expect(field(stepRow(markup, index + 1), 'Title')).toContain(`value="${s.title}"`);
    });
    expect(stepRow(markup, 1)).toContain('Done · Dita Smite, 23 Sep, 15:28');
    expect(stepRow(markup, 2)).not.toContain('Done ·');
  });

  test('a step’s person no longer offered is still shown on that step', () => {
    const withoutToms = peopleDita.filter((person) => person.displayName !== 'Toms Rudzitis');
    const markup = dialog(h(TaskForm, { task: taskPrepareDita, onClose: () => {} }), null, meDita, [
      [qk.tasks.people, withoutToms], ...LISTS.slice(1),
    ]);
    const carWash = field(stepRow(markup, 3), 'Person');
    expect(carWash).toMatch(new RegExp(`<option value="${ids.Toms}" selected="">Toms Rudzitis</option>`));
    expect(field(stepRow(markup, 1), 'Person')).not.toContain('Toms Rudzitis');
  });

  test('the record of a task whose record was deleted is kept, as "deleted record"', () => {
    const markup = dialog(h(TaskForm, { task: taskAboutDeleted, onClose: () => {} }));
    expect(field(markup, 'Vehicle', markup.indexOf('>Rental assignment</option>'))).toMatch(
      new RegExp(`<option value="${taskAboutDeleted.aboutRecordId}" selected="">deleted record</option>`),
    );
  });

  test('the edit’s refusals: a step due after the task, a record gone, a closed task, not the creator', () => {
    const edited = formOf(editPractice);
    const due = dialog(h(TaskForm, { task: editPractice, onClose: () => {} }), editDueAfterRefusal);
    expect(edited.steps).toHaveLength(3);
    expect(field(stepRow(due, 2), 'Due')).toContain('A step cannot be due after the task.');
    expect(marked(due)).toBe(1);

    const gone = dialog(h(TaskForm, { task: editPractice, onClose: () => {} }), editAboutMissingRefusal);
    expect(field(gone, 'Vehicle', gone.indexOf('>Rental assignment</option>'))).toContain('The vehicle this task is about was not found.');

    const closed = dialog(h(TaskForm, { task: editPractice, onClose: () => {} }), editClosedRefusal);
    expect(closed).toMatch(/<strong[^>]*>The change was refused<\/strong>This task was finished or cancelled and can no longer be changed\./);
    const creator = dialog(h(TaskForm, { task: editPractice, onClose: () => {} }), editCreatorOnlyRefusal);
    expect(creator).toMatch(/<strong[^>]*>Not permitted<\/strong>/);
    expect(creator).toContain(escaped('Only the task\'s creator can change, finish or cancel it.'));
  });

  test('a task that no longer exists is a refused change, in the API’s words', () => {
    const markup = dialog(h(TaskForm, { task: taskPrepareDita, onClose: () => {} }), notFoundDita);
    expect(markup).toMatch(/<strong[^>]*>The change was refused<\/strong>This task no longer exists\./);
    expect(marked(markup)).toBe(0);
  });

  test('a lost race is the stale banner with Refresh, and the save waits for it', () => {
    const markup = dialog(h(TaskForm, { task: taskPrepareDita, onClose: () => {} }), concurrencyRefusal);
    expect(concurrencyRefusal.code).toBe('tasks.concurrency_conflict');
    expect(markup).toContain('This record changed while you had it open.');
    expect(markup).toMatch(/refresh<\/span>Refresh<\/button>/);
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*title="Refresh to load the current values first\."[^>]*>Save changes<\/button>/);
    // Cancel stays.
    expect(markup).toMatch(/data-tone="ghost"[^>]*>Cancel<\/button>/);
  });
});

describe('Finish task and Cancel task (F12-5)', () => {
  test('with steps still open: the warn banner names them, in the task’s order, and asks', () => {
    const markup = dialog(h(FinishTask, { task: taskPrepareDita, onClose: () => {} }));
    expect(hook.ops).toEqual(['task-finish']);
    expect(markup).toContain('aria-label="Finish task"');
    expect(markup).toMatch(/data-tone="warn"><span[^>]*>warning<\/span><span[^>]*><strong[^>]*>3 steps are not done: Apply for the taxi licence \(Signe Priede\), Car wash \(Toms Rudzitis\), Handover \(Dita Smite\)\.<\/strong>Finish anyway\?/);
    expect(markup).not.toContain('Finish this task? It leaves everyone’s open list.');
    expect(markup).toContain('It stays readable under Finished for everyone on it.');
    expect(markup).toContain('Its steps can no longer be marked done or undone.');
    expect(markup).toMatch(/data-tone="primary"[^>]*>Finish task<\/button>/);
  });

  test('with nothing open it only asks, in the ok tone', () => {
    const markup = dialog(h(FinishTask, { task: taskFobsDita, onClose: () => {} }));
    expect(markup).toContain('Finish this task? It leaves everyone’s open list.');
    expect(markup).not.toContain('not done:');
    expect(markup).toMatch(/data-tone="ok"><span[^>]*>task_alt<\/span>/);
  });

  test('finishing a task already closed is refused in the API’s words', () => {
    const markup = dialog(h(FinishTask, { task: taskPrepareDita, onClose: () => {} }), finishAgainRefusal);
    expect(markup).toMatch(/The change was refused<\/strong>This task was finished or cancelled and can no longer be changed\./);
  });

  test('Cancel task: the optional Why, "Keep task", and a note too long under Why', () => {
    const markup = dialog(h(CancelTask, { task: taskPrepareDita, onClose: () => {} }));
    expect(hook.ops).toEqual(['task-cancel']);
    expect(markup).toContain('The task moves to Finished as Cancelled. Everyone on it can still read it there.');
    expect(field(markup, 'Why')).toContain('· optional');
    expect(markup).toMatch(/data-tone="ghost"[^>]*>Keep task<\/button><button[^>]*data-tone="primary"[^>]*>Cancel task<\/button>/);
    expect(markup).toMatch(/data-tone="mute"><span[^>]*>block<\/span>/);
    const refusedNote = dialog(h(CancelTask, { task: taskPrepareDita, onClose: () => {} }), cancelNoteLongRefusal);
    expect(field(refusedNote, 'Why')).toContain('The note must be at most 1000 characters.');
    expect(marked(refusedNote)).toBe(1);
    const stale = dialog(h(CancelTask, { task: taskPrepareDita, onClose: () => {} }), concurrencyRefusal);
    // Keep task stays enabled beside a stale record, as Cancel does elsewhere.
    expect(stale).toMatch(/<button type="button" data-tone="ghost"[^>]*>Keep task<\/button>/);
    expect(around(stale, '>Keep task<', 'button')).not.toContain('disabled');
  });
});
