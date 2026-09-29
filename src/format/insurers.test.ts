import { describe, expect, test } from 'vitest';
import { holdsFind, insurerCount, insurerKey, lookAlikes, looksAlike, mailHref, telHref } from './insurers';

/**
 * Follow-up 18, F18-2c and F18-2d: the two ways the app offers the insurers while a name is typed. The
 * picker's find box keeps the insurers whose names hold what is typed; the Add insurer and Edit insurer
 * windows show the insurers that look alike, as the mock-up the owner approved had them. Both ignore
 * letter case, accents and runs of spaces. The server alone decides which names are one name.
 */
const SEED = ['Baltic Mutual', 'Meridian Insurance', 'Northgate Insurance', 'Old Harbour Insurance'];
const alike = (typed: string) => SEED.filter((name) => looksAlike(name, typed));

describe('the words', () => {
  test('a name as it is compared: letter case, accents and runs of spaces ignored', () => {
    expect(insurerKey('  Baltic   MUTUAL ')).toBe('baltic mutual');
    expect(insurerKey('Ērgo  Insurance')).toBe('ergo insurance');
    expect(insurerKey('Seesam\tPolska')).toBe('seesam polska');
  });

  test('the count, the mail and the phone links', () => {
    expect(insurerCount(1)).toBe('1 insurer');
    expect(insurerCount(4)).toBe('4 insurers');
    expect(insurerCount(0)).toBe('0 insurers');
    expect(mailHref('claims@balticmutual.example')).toBe('mailto:claims@balticmutual.example');
    expect(telHref('+371 6700 1100')).toBe('tel:+37167001100');
    expect(telHref('(372) 600-2200')).toBe('tel:3726002200');
  });
});

describe('the picker’s find box (F18-2d)', () => {
  test('an insurer whose name holds what is typed, whatever the letters, accents and spaces', () => {
    expect(SEED.filter((name) => holdsFind(name, 'insurance'))).toEqual(['Meridian Insurance', 'Northgate Insurance', 'Old Harbour Insurance']);
    expect(SEED.filter((name) => holdsFind(name, 'BALTIC  mu'))).toEqual(['Baltic Mutual']);
    expect(holdsFind('Ērgo Insurance', 'ergo')).toBe(true);
    // Nothing typed holds every name; a name is not found by its initials here.
    expect(SEED.filter((name) => holdsFind(name, ''))).toEqual(SEED);
    expect(SEED.filter((name) => holdsFind(name, 'BM'))).toEqual([]);
  });
});

describe('the insurers that look alike (F18-2c)', () => {
  test('its name holds what is typed', () => {
    expect(alike('meridian')).toEqual(['Meridian Insurance']);
    expect(alike('  old   HARBOUR')).toEqual(['Old Harbour Insurance']);
  });

  test('what is typed holds a word of four letters or more of its name', () => {
    expect(alike('Baltic Mutual Insurance AS')).toEqual(['Baltic Mutual', 'Meridian Insurance', 'Northgate Insurance', 'Old Harbour Insurance']);
    expect(alike('Northgate Group')).toEqual(['Northgate Insurance']);
    // "Old" has three letters: typing it inside another name does not bring Old Harbour.
    expect(alike('Bold Riga')).toEqual([]);
  });

  test('what is typed, without spaces, is its initials: "BM" shows Baltic Mutual', () => {
    expect(alike('BM')).toEqual(['Baltic Mutual']);
    expect(alike('b m')).toEqual(['Baltic Mutual']);
    expect(alike('ohi')).toEqual(['Old Harbour Insurance']);
    expect(alike('MI')).toEqual(['Meridian Insurance']);
  });

  test('from two letters on, and never for a name that matches none of the three', () => {
    expect(alike('B')).toEqual([]);
    expect(alike(' ')).toEqual([]);
    expect(alike('Pilot Insurance AS').length).toBe(3);
    expect(alike('Pilot')).toEqual([]);
  });

  test('accents and letter case are ignored on both sides', () => {
    expect(looksAlike('Ērgo Insurance', 'ERGO')).toBe(true);
    expect(looksAlike('Baltic Mutual', 'BALTIČ')).toBe(true);
  });

  test('the list’s look-alikes in its order, an edited insurer not its own', () => {
    const list = SEED.map((name, n) => ({ id: `i-${n}`, name }));
    expect(lookAlikes(list, 'Insurance').map((i) => i.name)).toEqual(['Meridian Insurance', 'Northgate Insurance', 'Old Harbour Insurance']);
    expect(lookAlikes(list, 'Meridian Insurance', 'i-1').map((i) => i.name)).toEqual(['Northgate Insurance', 'Old Harbour Insurance']);
  });
});
