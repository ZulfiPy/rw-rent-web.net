import { describe, expect, test } from 'vitest';
import { endOfDayLocal, formatLocal, formatUtc, isFuture, toDateOnlyLocal, zoneOffset } from './datetime';

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
  test('summer dates carry +03:00', () => {
    expect(endOfDayLocal('2026-07-15')).toBe('2026-07-15T23:59:59.999+03:00');
  });

  test('winter dates carry +02:00', () => {
    expect(endOfDayLocal('2026-01-15')).toBe('2026-01-15T23:59:59.999+02:00');
    expect(zoneOffset(new Date('2026-01-15T12:00:00Z'))).toBe('+02:00');
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
