import { describe, expect, test } from 'vitest';
import {
  endOfDayLocal, formatLocal, formatUtc, fromLocalInput, isFuture, startOfDayLocal,
  toDateOnlyLocal, zoneOffset,
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

describe('audit and sessions surfaces render UTC', () => {
  test('yyyy-MM-dd HH:mm, with the zone declared by the subtitle instead of the cell', () => {
    expect(formatUtc('2026-08-23T11:57:51.621Z')).toBe('2026-08-23 11:57');
  });

  test('an offset instant is normalised to UTC first', () => {
    expect(formatUtc('2026-08-23T14:57:51.621+03:00')).toBe('2026-08-23 11:57');
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
