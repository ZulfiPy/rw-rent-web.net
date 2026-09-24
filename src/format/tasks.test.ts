import { describe, expect, test } from 'vitest';
import { AssignmentStatus, WorkTaskAboutKind, WorkTaskStatus } from '@/api/dto';
import {
  aboutHref, aboutText, chooseRecord, closedBanner, customerOption, doneLine, driverOption, dueInfo,
  fromLine, openStepsWarning, peopleText, personName, progressLong, progressText, progressWidth,
  rentalOption, stepDue, taskCount, toDoWhen, vehicleOption,
} from './tasks';

/**
 * The words of Tasks (Follow-up 12), from the handover's copy deck. Every instant is read in
 * Tallinn: in September it is three hours ahead of UTC.
 */
const NOW = new Date('2026-09-24T10:00:00Z'); // 13:00 in Tallinn

describe('what a task is about', () => {
  test('the kind’s word and the record’s text; a gone record; nothing', () => {
    expect(aboutText({ aboutKind: WorkTaskAboutKind.Vehicle, aboutLabel: '204 JLM', aboutRecordExists: true })).toBe('Vehicle · 204 JLM');
    expect(aboutText({ aboutKind: WorkTaskAboutKind.RentalAssignment, aboutLabel: '552 KLM · Nordwind Logistics', aboutRecordExists: true }))
      .toBe('Rental assignment · 552 KLM · Nordwind Logistics');
    expect(aboutText({ aboutKind: WorkTaskAboutKind.Customer, aboutLabel: null, aboutRecordExists: false })).toBe('Customer · deleted record');
    expect(aboutText({ aboutKind: WorkTaskAboutKind.Driver, aboutLabel: 'Janis Krumins', aboutRecordExists: false })).toBe('Driver · deleted record');
    expect(aboutText({ aboutKind: null, aboutLabel: null, aboutRecordExists: false })).toBeNull();
  });

  test('where the record opens; nowhere once it is gone', () => {
    const id = 'r-1';
    expect(aboutHref({ aboutKind: WorkTaskAboutKind.Vehicle, aboutRecordId: id, aboutRecordExists: true })).toBe('/vehicles/r-1');
    expect(aboutHref({ aboutKind: WorkTaskAboutKind.Customer, aboutRecordId: id, aboutRecordExists: true })).toBe('/customers/r-1');
    expect(aboutHref({ aboutKind: WorkTaskAboutKind.Driver, aboutRecordId: id, aboutRecordExists: true })).toBe('/drivers/r-1');
    expect(aboutHref({ aboutKind: WorkTaskAboutKind.RentalAssignment, aboutRecordId: id, aboutRecordExists: true })).toBe('/rental-assignments/r-1');
    expect(aboutHref({ aboutKind: WorkTaskAboutKind.Vehicle, aboutRecordId: id, aboutRecordExists: false })).toBeNull();
    expect(aboutHref({ aboutKind: null, aboutRecordExists: false })).toBeNull();
  });

  test('the record select’s first option and each list’s option text', () => {
    expect(chooseRecord(WorkTaskAboutKind.Vehicle)).toBe('Choose a vehicle');
    expect(chooseRecord(WorkTaskAboutKind.RentalAssignment)).toBe('Choose a rental assignment');
    expect(vehicleOption({ plateNumber: '204 JLM', make: 'Hyundai', model: 'Kona Electric', isActive: true })).toBe('204 JLM · Hyundai Kona Electric');
    expect(vehicleOption({ plateNumber: '660 BYH', make: 'Fiat', model: 'Tipo', isActive: false })).toBe('660 BYH · Fiat Tipo · inactive');
    expect(customerOption({ displayName: 'Ventspils Marine Services', isActive: false })).toBe('Ventspils Marine Services · inactive');
    expect(driverOption({ firstName: 'Janis', lastName: 'Krumins', isActive: true })).toBe('Janis Krumins');
    expect(rentalOption({ vehiclePlateNumber: '552 KLM', customerDisplayName: 'Nordwind Logistics', status: AssignmentStatus.Active }))
      .toBe('552 KLM · Nordwind Logistics · Active');
  });
});

describe('due dates', () => {
  test('passed is overdue, later today is due today, anything else the local time', () => {
    expect(dueInfo('2026-09-23T16:08:00Z', NOW)).toEqual({ text: 'Overdue · 23 Sep', tone: 'bad' });
    expect(dueInfo('2026-09-24T09:59:00Z', NOW)).toEqual({ text: 'Overdue · 24 Sep', tone: 'bad' });
    expect(dueInfo('2026-09-24T18:08:00Z', NOW)).toEqual({ text: 'Due today · 21:08', tone: 'warn' });
    // 23:30 in Tallinn is still today; 00:30 is tomorrow, whatever UTC's date says.
    expect(dueInfo('2026-09-24T20:30:00Z', NOW)).toEqual({ text: 'Due today · 23:30', tone: 'warn' });
    expect(dueInfo('2026-09-24T21:30:00Z', NOW)).toEqual({ text: '25 Sep, 00:30', tone: null });
    expect(dueInfo('2026-09-27T13:08:00Z', NOW)).toEqual({ text: '27 Sep, 16:08', tone: null });
    expect(dueInfo(null, NOW)).toEqual({ text: '—', tone: null });
  });

  test('a step’s line: toned only while it is to do in an open task', () => {
    const overdue = { dueAtUtc: '2026-09-23T18:08:00Z', doneAtUtc: null };
    expect(stepDue(overdue, true, NOW)).toEqual({ text: 'Overdue · 23 Sep', tone: 'bad' });
    expect(stepDue({ ...overdue, doneAtUtc: '2026-09-23T19:00:00Z' }, true, NOW)).toEqual({ text: 'Due 23 Sep, 21:08', tone: null });
    expect(stepDue(overdue, false, NOW)).toEqual({ text: 'Due 23 Sep, 21:08', tone: null });
    expect(stepDue({ dueAtUtc: '2026-09-24T14:00:00Z', doneAtUtc: null }, true, NOW)).toEqual({ text: 'Due today · 17:00', tone: 'warn' });
    expect(stepDue({ dueAtUtc: '2026-09-25T11:08:00Z', doneAtUtc: null }, true, NOW)).toEqual({ text: 'Due 25 Sep, 14:08', tone: null });
    expect(stepDue({ dueAtUtc: null, doneAtUtc: null }, true, NOW)).toEqual({ text: 'No due date', tone: null });
  });

  test('a to-do item’s line: its date, or "No due date"', () => {
    expect(toDoWhen('2026-09-23T16:08:00Z', NOW)).toEqual({ text: 'Overdue · 23 Sep', tone: 'bad' });
    expect(toDoWhen(null, NOW)).toEqual({ text: 'No due date', tone: null });
  });
});

describe('steps and people', () => {
  test('progress, short and long, and the bar', () => {
    expect(progressText(1, 4)).toBe('1 of 4 done');
    expect(progressText(0, 0)).toBe('No steps');
    expect(progressLong(1, 4)).toBe('1 of 4 steps done');
    expect(progressLong(0, 0)).toBe('No steps');
    expect(progressWidth(1, 4)).toBe('25%');
    expect(progressWidth(2, 3)).toBe('67%');
    expect(progressWidth(0, 0)).toBe('0%');
  });

  test('the people: two names, then how many more', () => {
    expect(peopleText([])).toBe('—');
    expect(peopleText(['Toms Rudzitis'])).toBe('Toms Rudzitis');
    expect(peopleText(['Dita Smite', 'Toms Rudzitis'])).toBe('Dita Smite, Toms Rudzitis');
    expect(peopleText(['Dita Smite', 'Signe Priede', 'Toms Rudzitis'])).toBe('Dita Smite, Signe Priede +1');
    expect(peopleText(['A B', 'C D', 'E F', 'G H'])).toBe('A B, C D +2');
  });

  test('"from" under someone else’s task; "(you)" after the reader', () => {
    expect(fromLine('u-dita', 'Dita Smite', 'u-toms')).toBe('from Dita Smite');
    expect(fromLine('u-dita', 'Dita Smite', 'u-dita')).toBeNull();
    expect(personName('Toms Rudzitis', 'u-toms', 'u-toms')).toBe('Toms Rudzitis (you)');
    expect(personName('Toms Rudzitis', 'u-toms', 'u-dita')).toBe('Toms Rudzitis');
  });

  test('a done step’s line', () => {
    expect(doneLine({ doneAtUtc: '2026-09-23T11:10:00Z', doneByDisplayName: 'Dita Smite' })).toBe('Done · Dita Smite, 23 Sep, 14:10');
  });

  test('the finish warning names the steps still open, one or many; none when all are done', () => {
    const steps = [
      { title: 'Add to Bolt', responsibleDisplayName: 'Dita Smite', doneAtUtc: '2026-09-23T11:10:00Z' },
      { title: 'Car wash', responsibleDisplayName: 'Toms Rudzitis', doneAtUtc: null },
      { title: 'Handover', responsibleDisplayName: 'Dita Smite', doneAtUtc: null },
    ];
    expect(openStepsWarning(steps)).toBe('2 steps are not done: Car wash (Toms Rudzitis), Handover (Dita Smite).');
    expect(openStepsWarning(steps.slice(0, 2))).toBe('1 step is not done: Car wash (Toms Rudzitis).');
    expect(openStepsWarning(steps.slice(0, 1))).toBeNull();
    expect(openStepsWarning([])).toBeNull();
  });
});

describe('the task', () => {
  test('a closed task’s banner: who closed it and when, with a cancelled one’s reason', () => {
    const task = { closedAtUtc: '2026-09-22T13:02:00Z', createdByDisplayName: 'Dita Smite', updatedByDisplayName: 'Dita Smite' };
    expect(closedBanner({ ...task, status: WorkTaskStatus.Finished })).toEqual({ title: 'Finished by Dita Smite on 22 Sep, 16:02', body: null });
    expect(closedBanner({ ...task, status: WorkTaskStatus.Cancelled, cancellationNote: 'The plan changed.' }))
      .toEqual({ title: 'Cancelled by Dita Smite on 22 Sep, 16:02', body: 'The plan changed.' });
    expect(closedBanner({ ...task, status: WorkTaskStatus.Cancelled, cancellationNote: null })?.body).toBe('No reason given.');
    expect(closedBanner({ ...task, status: WorkTaskStatus.Open })).toBeNull();
  });

  test('the count of a list', () => {
    expect(taskCount(1)).toBe('1 task');
    expect(taskCount(4)).toBe('4 tasks');
    expect(taskCount(0)).toBe('0 tasks');
  });
});
