import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { InsurerPicker, findKey, pickerItems, type PickerInsurer } from './insurance/InsurerPicker';
import { declared, readRules } from './followup14.stylesheet';
import { around, count } from './followup12.harness';
import { insurersAll } from './followup18.support';

/**
 * Follow-up 19, F19-1: Add an insurer stays at the foot of the open picker, always in view, whatever
 * the list's length and at every size. The list scrolled within 244px with Add an insurer as its last
 * line, so with six insurers or more it lay below the list's bottom edge until the list was scrolled
 * to its end. It is still the list's last option; the stylesheet now holds it at the bottom of the
 * scrolling list, over an opaque ground, and keeps the line the arrows reach above it. A server render
 * carries class names, not a layout, so the rules are read from the stylesheet; the browser measured
 * the list (the report, §4.3).
 */
const PICKER = readRules(new URL('./insurance/InsurerPicker.module.css', import.meta.url));
const PHONE = '(max-width: 639px)';

/** The owner's real list, likely ten insurers or more: the seed's four and eight more, in the list's order. */
const MORE = [
  'BTA Baltic Insurance Company', 'Compensa Vienna Insurance Group', 'ERGO Insurance SE', 'Gjensidige Forsikring',
  'If P&C Insurance AS', 'LHV Kindlustus', 'Salva Kindlustuse AS', 'Swedbank P&C Insurance AS',
];
const LONG: PickerInsurer[] = [
  ...insurersAll,
  ...MORE.map((name, index) => ({ id: `00000000-0000-4000-8000-0000000000${10 + index}`, name, isActive: true })),
].sort((a, b) => a.name.localeCompare(b.name));

const open = (insurers: readonly PickerInsurer[], canAdd = true) => renderToStaticMarkup(h(InsurerPicker, {
  label: 'Our insurer', value: '', insurers, canAdd, onChange: () => {}, onAdd: () => {}, initialOpen: true,
}));

/** The open list's lines, in order: each `li` with its text. */
const lines = (markup: string) => [...around(markup, 'role="listbox"', 'ul').matchAll(/<li([^>]*)>(.*?)<\/li>/g)]
  .map((m) => ({ attributes: m[1]!, text: m[2]!.replace(/<span data-icon[^>]*>[^<]*<\/span>/g, '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim() }));

const px = (value: string | undefined) => Number(/^(\d+)px$/.exec(value ?? '')?.[1]);

describe('F19-1: Add an insurer at the foot of the open list, always in view', () => {
  test('the stylesheet holds it at the bottom of the scrolling list, over an opaque ground above the insurers', () => {
    expect(declared(PICKER, '.options')).toMatchObject({ 'max-height': '244px', 'overflow-y': 'auto' });
    expect(declared(PICKER, '.add')).toMatchObject({
      position: 'sticky',
      bottom: '0',
      'z-index': '1',
      background: 'var(--surface)',
      // Its 4px of space above the rule is painted over too, so no insurer shows through it.
      'margin-top': '4px',
      'box-shadow': '0 -4px 0 var(--surface)',
    });
    // Still set off by its rule, in the accent, as the mock-up has it.
    expect(declared(PICKER, '.add')).toMatchObject({ 'border-top': '1px solid var(--line)', color: 'var(--accent)' });
  });

  test('the line the arrows reach comes into view above the foot, not under it, on the desktop and the phone', () => {
    // The foot is a line of the list and its space above: 34px and 4 on the desktop, 44 and 4 on the phone.
    const foot = (media: string | null) =>
      px(declared(PICKER, '.option', media)['min-height'] ?? declared(PICKER, '.option')['min-height']) + px(declared(PICKER, '.add')['margin-top']);
    expect(foot(null)).toBe(38);
    expect(px(declared(PICKER, '.options')['scroll-padding-bottom'])).toBe(foot(null));
    expect(foot(PHONE)).toBe(48);
    expect(px(declared(PICKER, '.options', PHONE)['scroll-padding-bottom'])).toBe(foot(PHONE));
  });

  test('twelve insurers: Not chosen, the eleven in use in the list’s order, then Add an insurer, still an option and the last one', () => {
    const markup = open(LONG);
    const shown = lines(markup);
    expect(shown.map((line) => line.text)).toEqual(['Not chosen', ...LONG.map((insurer) => insurer.name).filter((name) => name !== 'Old Harbour Insurance'), 'Add an insurer']);
    const add = shown.at(-1)!;
    expect(add.attributes).toContain('role="option"');
    expect(add.attributes).toContain(`-option-${shown.length - 1}"`);
    expect(add.attributes).toMatch(/_add_/);
    expect(count(markup, '>Add an insurer</li>')).toBe(1);
  });

  test('the keyboard reaches it last, from the last insurer, and goes no further; Enter on it opens the Add insurer window as before', () => {
    const items = pickerItems(LONG, '', null, true);
    expect(items.at(-1)).toEqual({ kind: 'add' });
    const last = items.length - 1;
    expect(findKey('ArrowDown', last - 1, items.length)).toEqual({ move: last });
    expect(findKey('ArrowDown', last, items.length)).toEqual({ move: last });
    expect(findKey('Enter', last, items.length)).toEqual({ choose: last });
  });

  test('a short list, and the list of a reader who may not add an insurer, look as before', () => {
    expect(lines(open(insurersAll)).map((line) => line.text))
      .toEqual(['Not chosen', 'Baltic Mutual', 'Meridian Insurance', 'Northgate Insurance', 'Add an insurer']);
    expect(lines(open(LONG, false)).map((line) => line.text)).not.toContain('Add an insurer');
  });
});
