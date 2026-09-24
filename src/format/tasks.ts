import {
  WorkTaskAboutKind, WorkTaskStatus,
  type AssignmentStatus, type Instant, type WorkTaskStepResponse, type Uuid,
} from '@/api/dto';
import { SYSTEM_ACTOR } from './auditNames';
import { EMPTY, formatLocal, toDateOnlyLocal, toLocalInput } from './datetime';
import { ASSIGNMENT_STATUS_LABEL } from './labels';

/**
 * The words of Tasks (Follow-up 12), from the approved prototype's copy deck (`Context/prototype/
 * tasks/HANDOVER.md` f). Everything here only words what the API answered: who may mark, undo or
 * change a task is never worked out here, it is read from the answer.
 */

export const TASK_STATUS_LABEL: Record<WorkTaskStatus, string> = {
  [WorkTaskStatus.Open]: 'Open',
  [WorkTaskStatus.Finished]: 'Finished',
  [WorkTaskStatus.Cancelled]: 'Cancelled',
};

/** The kind as the About select and a record's line name it. */
export const TASK_ABOUT_LABEL: Record<WorkTaskAboutKind, string> = {
  [WorkTaskAboutKind.Vehicle]: 'Vehicle',
  [WorkTaskAboutKind.Customer]: 'Customer',
  [WorkTaskAboutKind.Driver]: 'Driver',
  [WorkTaskAboutKind.RentalAssignment]: 'Rental assignment',
};

/** The kind inside a sentence: "Choose a vehicle". */
export const TASK_ABOUT_NOUN: Record<WorkTaskAboutKind, string> = {
  [WorkTaskAboutKind.Vehicle]: 'vehicle',
  [WorkTaskAboutKind.Customer]: 'customer',
  [WorkTaskAboutKind.Driver]: 'driver',
  [WorkTaskAboutKind.RentalAssignment]: 'rental assignment',
};

export const TASK_ABOUT_KINDS: readonly WorkTaskAboutKind[] = [
  WorkTaskAboutKind.Vehicle, WorkTaskAboutKind.Customer, WorkTaskAboutKind.Driver,
  WorkTaskAboutKind.RentalAssignment,
];

/** The record select's first option. */
export const chooseRecord = (kind: WorkTaskAboutKind) => `Choose a ${TASK_ABOUT_NOUN[kind]}`;

/** What every answer about a task carries about its record. */
export interface TaskAbout {
  aboutKind?: WorkTaskAboutKind | null;
  aboutRecordId?: Uuid | null;
  aboutLabel?: string | null;
  aboutRecordExists: boolean;
}

/**
 * "Vehicle · 204 JLM" — the kind's word, which the app adds, and the record's text, which the API
 * gives; "Vehicle · deleted record" once the record is gone; null for a task about nothing.
 */
export function aboutText(task: TaskAbout): string | null {
  if (!task.aboutKind) return null;
  const record = task.aboutRecordExists && task.aboutLabel ? task.aboutLabel : 'deleted record';
  return `${TASK_ABOUT_LABEL[task.aboutKind]} · ${record}`;
}

const ABOUT_PATH: Record<WorkTaskAboutKind, string> = {
  [WorkTaskAboutKind.Vehicle]: '/vehicles',
  [WorkTaskAboutKind.Customer]: '/customers',
  [WorkTaskAboutKind.Driver]: '/drivers',
  [WorkTaskAboutKind.RentalAssignment]: '/rental-assignments',
};

/** The permission the record's own page needs, so a link is offered only to a reader it opens for. */
export const ABOUT_READ = {
  [WorkTaskAboutKind.Vehicle]: 'Vehicles.Read',
  [WorkTaskAboutKind.Customer]: 'Customers.Read',
  [WorkTaskAboutKind.Driver]: 'Drivers.Read',
  [WorkTaskAboutKind.RentalAssignment]: 'RentalAssignments.Read',
} as const satisfies Record<WorkTaskAboutKind, string>;

/** Where the record opens; null for a task about nothing or a record that is gone. */
export function aboutHref(task: TaskAbout): string | null {
  if (!task.aboutKind || !task.aboutRecordId || !task.aboutRecordExists) return null;
  return `${ABOUT_PATH[task.aboutKind]}/${task.aboutRecordId}`;
}

/* dates ------------------------------------------------------------------------------------------ */

/** Overdue is bad, later today is warn, anything else is plain. */
export type DueTone = 'bad' | 'warn' | null;

export interface DueInfo {
  text: string;
  tone: DueTone;
}

/** "17:00" in Tallinn time. */
const localTime = (iso: Instant) => toLocalInput(iso).slice(11);

/**
 * The prototype's `dueInfo`: a due time that has passed is "Overdue · 23 Sep"; one later today is
 * "Due today · 17:00"; any other is the local time, "27 Sep, 12:00". The day is Tallinn's.
 */
export function dueInfo(iso: Instant | null | undefined, now: Date = new Date()): DueInfo {
  if (!iso) return { text: EMPTY, tone: null };
  if (new Date(iso).getTime() < now.getTime()) {
    return { text: `Overdue · ${formatLocal(iso, 'dateShort')}`, tone: 'bad' };
  }
  if (toDateOnlyLocal(iso) === toDateOnlyLocal(now.toISOString())) {
    return { text: `Due today · ${localTime(iso)}`, tone: 'warn' };
  }
  return { text: formatLocal(iso), tone: null };
}

/**
 * A step's due line: "No due date"; "Overdue · 23 Sep" or "Due today · 17:00" while the step is
 * still to do in an open task; otherwise "Due 26 Sep, 16:00" without a tone.
 */
export function stepDue(step: Pick<WorkTaskStepResponse, 'dueAtUtc' | 'doneAtUtc'>, open: boolean, now: Date = new Date()): DueInfo {
  if (!step.dueAtUtc) return { text: 'No due date', tone: null };
  const info = dueInfo(step.dueAtUtc, now);
  return open && !step.doneAtUtc && info.tone ? info : { text: `Due ${formatLocal(step.dueAtUtc)}`, tone: null };
}

/** The Overview's and the to-do list's line: the item's due text, or "No due date". */
export function toDoWhen(dueAtUtc: Instant | null | undefined, now: Date = new Date()): DueInfo {
  return dueAtUtc ? dueInfo(dueAtUtc, now) : { text: 'No due date', tone: null };
}

/* steps and people --------------------------------------------------------------------------------- */

/** "1 of 4 done", or "No steps". */
export const progressText = (done: number, count: number) => (count ? `${done} of ${count} done` : 'No steps');

/** The hero's "1 of 4 steps done", or "No steps". */
export const progressLong = (done: number, count: number) => (count ? `${done} of ${count} steps done` : 'No steps');

/** How much of the bar is filled, as a width. */
export const progressWidth = (done: number, count: number) => (count ? `${Math.round((done / count) * 100)}%` : '0%');

/** "Signe Priede, Toms Rudzitis +1" — the first two names, then how many more; "—" for none. */
export function peopleText(people: readonly string[]): string {
  if (people.length === 0) return EMPTY;
  const more = people.length > 2 ? ` +${people.length - 2}` : '';
  return `${people.slice(0, 2).join(', ')}${more}`;
}

/** "from Dita Smite" under a task someone else created; nothing under the reader's own. */
export function fromLine(createdByUserId: Uuid, createdByDisplayName: string | null | undefined, readerId: Uuid | undefined): string | null {
  if (!readerId || createdByUserId === readerId) return null;
  return `from ${createdByDisplayName ?? SYSTEM_ACTOR}`;
}

/** A done step's line: "Done · Dita Smite, 23 Sep, 14:10". */
export const doneLine = (step: Pick<WorkTaskStepResponse, 'doneAtUtc' | 'doneByDisplayName'>) =>
  `Done · ${step.doneByDisplayName ?? SYSTEM_ACTOR}, ${formatLocal(step.doneAtUtc)}`;

/** " (you)" after the reader's own name, wherever a step's person is named. */
export const personName = (name: string, userId: Uuid, readerId: Uuid | undefined) =>
  (readerId && userId === readerId ? `${name} (you)` : name);

/**
 * The finish dialog's warning, or null when every step is done: "2 steps are not done: Car wash
 * (Toms Rudzitis), Handover (Dita Smite)." The steps come in the task's order.
 */
export function openStepsWarning(steps: ReadonlyArray<Pick<WorkTaskStepResponse, 'title' | 'responsibleDisplayName' | 'doneAtUtc'>>): string | null {
  const open = steps.filter((step) => !step.doneAtUtc);
  if (open.length === 0) return null;
  const names = open.map((step) => `${step.title} (${step.responsibleDisplayName})`).join(', ');
  return `${open.length} ${open.length === 1 ? 'step is' : 'steps are'} not done: ${names}.`;
}

/* the task ------------------------------------------------------------------------------------------ */

/**
 * The banner of a closed task: who closed it and when, and a cancelled task's reason. A closed task
 * accepts no change, so its last change is its closing: the name is the last changer's.
 */
export function closedBanner(task: {
  status: WorkTaskStatus;
  closedAtUtc?: Instant | null;
  cancellationNote?: string | null;
  createdByDisplayName?: string | null;
  updatedByDisplayName?: string | null;
}): { title: string; body: string | null } | null {
  if (task.status === WorkTaskStatus.Open) return null;
  const who = task.updatedByDisplayName ?? task.createdByDisplayName ?? SYSTEM_ACTOR;
  const finished = task.status === WorkTaskStatus.Finished;
  return {
    title: `${finished ? 'Finished' : 'Cancelled'} by ${who} on ${formatLocal(task.closedAtUtc)}`,
    body: finished ? null : task.cancellationNote || 'No reason given.',
  };
}

/** "3 tasks", "1 task". */
export const taskCount = (n: number) => `${n} ${n === 1 ? 'task' : 'tasks'}`;

/* the About lists --------------------------------------------------------------------------------- */

const inactive = (isActive: boolean) => (isActive ? '' : ' · inactive');

/** "204 JLM · Hyundai Kona Electric", with " · inactive" for a vehicle out of use. */
export const vehicleOption = (v: { plateNumber: string; make: string; model: string; isActive: boolean }) =>
  `${v.plateNumber} · ${v.make} ${v.model}${inactive(v.isActive)}`;

export const customerOption = (c: { displayName: string; isActive: boolean }) =>
  `${c.displayName}${inactive(c.isActive)}`;

export const driverOption = (d: { firstName: string; lastName: string; isActive: boolean }) =>
  `${d.firstName} ${d.lastName}${inactive(d.isActive)}`;

/** "552 KLM · Nordwind Logistics · Active" — every rental, whatever its status. */
export const rentalOption = (a: { vehiclePlateNumber: string; customerDisplayName: string; status: AssignmentStatus }) =>
  `${a.vehiclePlateNumber} · ${a.customerDisplayName} · ${ASSIGNMENT_STATUS_LABEL[a.status]}`;
