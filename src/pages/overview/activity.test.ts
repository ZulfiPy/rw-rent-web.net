import { describe, expect, it } from 'vitest';
import { ACTIVITY_ROWS, activityRows, isRoutineEvent } from './activity';

const entry = (eventType: string, id = eventType) => ({ id, eventType });

describe('the activity card rows', () => {
  it('knows which events are the routine ones', () => {
    expect(isRoutineEvent('Authentication.SessionCreated')).toBe(true);
    expect(isRoutineEvent('Authentication.Logout')).toBe(true);
    // Everything else about a session is not routine: a password change is worth a row.
    expect(isRoutineEvent('Authentication.PasswordChanged')).toBe(false);
    expect(isRoutineEvent('Registration.Activated')).toBe(false);
    expect(isRoutineEvent('RentalAssignment.Cancelled')).toBe(false);
  });

  it('drops the sign-ins and sign-outs and keeps the order it was given', () => {
    const rows = activityRows([
      entry('Authentication.SessionCreated', 'a'),
      entry('Registration.Activated', 'b'),
      entry('Authentication.Logout', 'c'),
      entry('RentalAssignment.Cancelled', 'd'),
    ]);

    expect(rows.map((r) => r.id)).toEqual(['b', 'd']);
  });

  it('shows five at most', () => {
    const rows = activityRows(
      Array.from({ length: 12 }, (_, index) => entry('Company.Updated', `e${index}`)),
    );

    expect(rows).toHaveLength(ACTIVITY_ROWS);
    expect(rows[0]?.id).toBe('e0');
  });

  it('shows what there is when fewer than five remain', () => {
    const rows = activityRows([
      entry('Authentication.SessionCreated', 'a'),
      entry('Company.Updated', 'b'),
      entry('Authentication.SessionCreated', 'c'),
    ]);

    expect(rows.map((r) => r.id)).toEqual(['b']);
  });

  it('shows nothing when the page holds only routine events', () => {
    expect(activityRows([entry('Authentication.Logout'), entry('Authentication.SessionCreated')]))
      .toEqual([]);
  });
});
