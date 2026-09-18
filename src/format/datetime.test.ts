import { describe, expect, test } from 'vitest';
import {
  LOCAL_TIME_NOTE, endOfDayLocal, formatLocal, formatLocalStamp, formatUtc, fromLocalInput,
  fromPrefilledInput, isFuture, startOfDayLocal, toDateOnlyLocal, toLocalInput, zoneOffset,
} from './datetime';

const year = new Date().getUTCFullYear();

describe('operational surfaces render Europe/Tallinn', () => {
  test('summer instants shift by three hours', () => {
    // 11:57 UTC on 23 August is 14:57 in Tallinn (EEST, +03:00).
    expect(formatLocal(`${year}-08-23T11:57:00Z`)).toBe('23 Aug, 14:57');
  });

  test('winter instants shift by two hours', () => {
    expect(formatLocal(`${year}-01-15T11:57:00Z`)).toBe('15 Jan, 13:57');
  });

  test('the year appears only when it is not the current one', () => {
    expect(formatLocal('2019-03-04T09:00:00Z')).toBe('04 Mar 2019, 11:00');
    expect(formatLocal(`${year}-03-04T09:00:00Z`)).toBe('04 Mar, 11:00');
  });

  test('date modes', () => {
    expect(formatLocal('2019-03-04T09:00:00Z', 'date')).toBe('04 Mar 2019');
    expect(formatLocal(`${year}-03-04T09:00:00Z`, 'dateShort')).toBe('04 Mar');
  });

  test('a missing instant renders as an em dash', () => {
    expect(formatLocal(null)).toBe('—');
    expect(formatUtc(undefined)).toBe('—');
  });
});

describe('the UTC stamp (no surface renders it since Follow-up 7)', () => {
  test('yyyy-MM-dd HH:mm, with the zone declared by the subtitle instead of the cell', () => {
    expect(formatUtc('2026-08-23T11:57:51.621Z')).toBe('2026-08-23 11:57');
  });

  test('an offset instant is normalised to UTC first', () => {
    expect(formatUtc('2026-08-23T14:57:51.621+03:00')).toBe('2026-08-23 11:57');
  });
});

describe('the audit, sessions and transfer surfaces render Europe/Tallinn too (F7-1)', () => {
  test('the stamp is three hours ahead of UTC in summer', () => {
    // The owner's check: an audit entry read 11:57 while the clock on the wall said 14:57.
    expect(formatLocalStamp('2026-08-23T11:57:51.621Z')).toBe('2026-08-23 14:57');
  });

  test('and two hours ahead in winter', () => {
    expect(formatLocalStamp('2026-01-15T11:57:00Z')).toBe('2026-01-15 13:57');
  });

  test('the calendar day is the local one', () => {
    expect(formatLocalStamp('2026-12-31T22:30:00Z')).toBe('2027-01-01 00:30');
    expect(formatLocalStamp('2026-06-30T21:30:00Z')).toBe('2026-07-01 00:30');
  });

  test('an instant written with an offset names the same local minute', () => {
    expect(formatLocalStamp('2026-08-23T14:57:51.621+03:00')).toBe('2026-08-23 14:57');
    expect(formatLocalStamp('2026-08-23T08:57:00-03:00')).toBe('2026-08-23 14:57');
  });

  test('the API\'s microseconds do not disturb it', () => {
    expect(formatLocalStamp('2026-09-18T10:39:10.839886+00:00')).toBe('2026-09-18 13:39');
  });

  test('it keeps the shape the UTC stamp gave those columns', () => {
    const at = '2026-08-23T11:57:51.621Z';
    expect(formatLocalStamp(at)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    expect(formatLocalStamp(at)).toHaveLength(formatUtc(at).length);
    // "idle until 14:57": the sessions tables take the time from the stamp's tail.
    expect(formatLocalStamp(at).slice(11)).toBe('14:57');
  });

  test('a missing instant renders as an em dash', () => {
    expect(formatLocalStamp(null)).toBe('—');
    expect(formatLocalStamp(undefined)).toBe('—');
  });

  test('the Overview\'s activity times are local in both seasons, across midnight', () => {
    expect(formatLocal(`${year}-08-23T21:05:00Z`)).toBe('24 Aug, 00:05');
    expect(formatLocal(`${year}-01-15T22:05:00Z`)).toBe('16 Jan, 00:05');
  });

  test('the one note names the zone and no longer says UTC', () => {
    expect(LOCAL_TIME_NOTE).toContain('Tallinn');
    expect(LOCAL_TIME_NOTE).not.toMatch(/UTC/);
  });
});

describe('date-only expiries resolve to the end of the chosen local day', () => {
  // The bounds used to be written with the zone's offset. The instants below are the same moments;
  // only the representation changed, because Npgsql takes an offset of zero and nothing else — as
  // a query parameter just as much as on a stored value (the review of 2026-09-16).
  test('a summer date resolves through +03:00 and reports UTC', () => {
    expect(endOfDayLocal('2026-07-15')).toBe('2026-07-15T20:59:59.999Z');
    expect(startOfDayLocal('2026-07-15')).toBe('2026-07-14T21:00:00.000Z');
  });

  test('a winter date resolves through +02:00 and reports UTC', () => {
    expect(endOfDayLocal('2026-01-15')).toBe('2026-01-15T21:59:59.999Z');
    expect(startOfDayLocal('2026-01-15')).toBe('2026-01-14T22:00:00.000Z');
    expect(zoneOffset(new Date('2026-01-15T12:00:00Z'))).toBe('+02:00');
  });

  test('neither bound ever carries an offset, because the API refuses one', () => {
    for (const dateOnly of ['2026-07-15', '2026-01-15']) {
      expect(startOfDayLocal(dateOnly).endsWith('Z')).toBe(true);
      expect(endOfDayLocal(dateOnly).endsWith('Z')).toBe(true);
    }
  });

  test('the picker gets the chosen day back from the bound it produced', () => {
    // The whole point of the end-of-day bound: a date input seeded from a stored expiry shows the
    // day the person chose, in either offset season.
    expect(toDateOnlyLocal(endOfDayLocal('2026-07-15'))).toBe('2026-07-15');
    expect(toDateOnlyLocal(endOfDayLocal('2026-01-15'))).toBe('2026-01-15');
    expect(toDateOnlyLocal(endOfDayLocal('2026-12-31'))).toBe('2026-12-31');
  });

  test('the chosen day is the last valid one, so it is still in the future all day', () => {
    const today = toDateOnlyLocal(new Date().toISOString());
    expect(isFuture(endOfDayLocal(today))).toBe(true);
  });

  test('a stored expiry seeds the picker with its local calendar date', () => {
    // 21:30 UTC on 30 June is already 1 July in Tallinn.
    expect(toDateOnlyLocal('2026-06-30T21:30:00Z')).toBe('2026-07-01');
  });
});

describe('fromLocalInput', () => {
  it('resolves the wall clock through the zone and reports it in UTC', () => {
    // Europe/Tallinn is UTC+3 in September and UTC+2 in January.
    expect(fromLocalInput('2026-09-16T08:01')).toBe('2026-09-16T05:01:00.000Z');
    expect(fromLocalInput('2026-01-16T08:01')).toBe('2026-01-16T06:01:00.000Z');
  });

  it('never reports an offset, because the API stores these values', () => {
    // Npgsql writes a DateTimeOffset into `timestamp with time zone` only at offset zero, so an
    // instant carrying +03:00 was refused by the server with a 500.
    expect(fromLocalInput('2026-09-16T08:01').endsWith('Z')).toBe(true);
  });

  it('passes an empty input through', () => {
    expect(fromLocalInput('')).toBe('');
  });
});

/*
 * The tester's T-009: a control shows minutes, a stored instant carries seconds (the seeded ones
 * microseconds), and every prefilled dialog sent the rounded value back. The timeline correction of
 * a seeded assignment was refused with no field marked, because no field had been changed.
 */
describe('fromPrefilledInput', () => {
  // As the API serializes them: the seeded assignment 0007 closes at 12:10:17.422987 in Tallinn.
  const seeded = '2026-08-08T09:10:17.422987+00:00';

  it('sends an untouched instant back byte for byte, microseconds and all', () => {
    const shown = toLocalInput(seeded);
    expect(shown).toBe('2026-08-08T12:10');
    expect(fromPrefilledInput(shown, seeded)).toBe(seeded);
  });

  it('does the same for seconds, and for any spelling the API used', () => {
    for (const stored of [
      '2026-09-07T09:10:17+00:00',
      '2026-09-07T09:10:17.4Z',
      '2026-01-16T06:01:30.5+00:00',
    ]) {
      expect(fromPrefilledInput(toLocalInput(stored), stored)).toBe(stored);
    }
  });

  it('converts a changed control exactly as fromLocalInput does, in summer', () => {
    // Europe/Tallinn is UTC+3 in August.
    expect(fromPrefilledInput('2026-08-08T12:11', seeded)).toBe('2026-08-08T09:11:00.000Z');
    expect(fromPrefilledInput('2026-08-08T12:11', seeded)).toBe(fromLocalInput('2026-08-08T12:11'));
  });

  it('and in winter', () => {
    // UTC+2 in January.
    const winter = '2026-01-16T06:01:30.5+00:00';
    expect(toLocalInput(winter)).toBe('2026-01-16T08:01');
    expect(fromPrefilledInput('2026-01-16T08:02', winter)).toBe('2026-01-16T06:02:00.000Z');
  });

  it('sends null for a control the person emptied', () => {
    expect(fromPrefilledInput('', seeded)).toBeNull();
    expect(fromPrefilledInput('', null)).toBeNull();
    expect(fromPrefilledInput('', undefined)).toBeNull();
  });

  it('converts a value that had nothing stored behind it, as a new record does', () => {
    expect(fromPrefilledInput('2026-09-16T08:01', null)).toBe('2026-09-16T05:01:00.000Z');
    expect(fromPrefilledInput('2026-09-16T08:01', undefined)).toBe('2026-09-16T05:01:00.000Z');
  });

  it('treats a control changed and changed back as untouched, because it shows the same', () => {
    // What decides is what the control shows, not what happened to it on the way.
    expect(fromPrefilledInput('2026-08-08T12:10', seeded)).toBe(seeded);
  });

  describe('for a date-only expiry', () => {
    // A seeded expiry is not at the end of a local day, so the old conversion moved it.
    const expiry = '2026-10-01T09:00:00+00:00';

    it('keeps an untouched expiry where it was', () => {
      expect(toDateOnlyLocal(expiry)).toBe('2026-10-01');
      expect(fromPrefilledInput('2026-10-01', expiry, 'date')).toBe(expiry);
      expect(endOfDayLocal('2026-10-01')).not.toBe(expiry);
    });

    it('resolves a changed date to the end of that local day, as before', () => {
      expect(fromPrefilledInput('2026-10-02', expiry, 'date')).toBe(endOfDayLocal('2026-10-02'));
    });

    it('sends null when the date is cleared', () => {
      expect(fromPrefilledInput('', expiry, 'date')).toBeNull();
    });
  });
});
