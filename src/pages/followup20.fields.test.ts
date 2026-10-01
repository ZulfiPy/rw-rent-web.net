import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { declared, readRules } from './followup14.stylesheet';

/**
 * Follow-up 20, F20-1: on the phone tier, below 768 pixels, every text field, select and text area of
 * the app draws its text at 16px, so Safari on an iPhone never zooms the page when one is tapped. A
 * server render carries no layout, so these tests read the stylesheets and the app's own source: one
 * base rule names every field by kind, nothing in the app can outrank it, and every field the app draws
 * is one it names. A select drawn transparent over its own shown value is tapped as a select, so the
 * rule reaches it; the value it shows is its text and is 16px too. Labels, hints, buttons, checkboxes
 * and the tablet and desktop tiers stay as they were.
 */
const PHONE = '(max-width: 767px)';
const FIELDS = "input:not([type='checkbox']):not([type='radio']):not([type='file']), select, textarea";
/** The input types the rule leaves out: nothing is typed into them. */
const NOT_TYPED = ['checkbox', 'radio', 'file'];

const SRC = new URL('..', import.meta.url).pathname;
const files = (pattern: RegExp): string[] => {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (pattern.test(name) && !/\.test\./.test(name)) found.push(path);
    }
  };
  walk(SRC);
  return found.sort();
};
const short = (path: string) => path.split('/src/')[1]!;

interface FieldTag { path: string; line: number; tag: 'input' | 'select' | 'textarea'; type: string | null; source: string }

/** Every `<input>`, `<select>` and `<textarea>` the app's components draw, read to the tag's end. */
function fieldTags(): FieldTag[] {
  const tags: FieldTag[] = [];
  for (const path of files(/\.tsx$/)) {
    const text = readFileSync(path, 'utf8');
    for (const open of text.matchAll(/<(input|select|textarea)\b/g)) {
      let at = open.index + open[0].length;
      let depth = 0;
      for (; at < text.length; at++) {
        const char = text[at];
        if (char === '{') depth++;
        else if (char === '}') depth--;
        else if (char === '>' && depth === 0) break;
      }
      const source = text.slice(open.index, at + 1);
      const type = /\btype=(?:"([^"]+)"|\{([^}]+)\})/.exec(source);
      tags.push({
        path: short(path),
        line: text.slice(0, open.index).split('\n').length,
        tag: open[1] as FieldTag['tag'],
        type: type ? (type[1] ?? `{${type[2]}}`) : null,
        source,
      });
    }
  }
  return tags;
}

/** The types an input whose type is a prop may take: the union the component declares for it. */
function typesOf(field: FieldTag): string[] {
  const prop = /^\{(\w+)\}$/.exec(field.type!)![1]!;
  const text = readFileSync(join(SRC, field.path), 'utf8');
  const union = new RegExp(`\\b${prop}\\??:\\s*((?:'[\\w-]+'\\s*\\|?\\s*)+);`).exec(text);
  expect(union, `${field.path}:${field.line} declares no union for ${prop}`).not.toBeNull();
  return [...union![1]!.matchAll(/'([\w-]+)'/g)].map((one) => one[1]!);
}

describe('F20-1: every field draws its text at 16px on the phone', () => {
  const base = readRules(new URL('../styles/base.css', import.meta.url));

  test('the base names every field by kind at 16px below 768, and above it sets no field’s size', () => {
    expect(base.filter((rule) => rule.media === PHONE)).toEqual([
      { media: PHONE, selector: FIELDS, declarations: { 'font-size': '16px !important' } },
    ]);
    // From 768 up a field inherits its size as before, and its module's own class sets it.
    expect(declared(base, 'input, select, textarea')).toEqual({ 'font-family': 'inherit', 'font-size': 'inherit', color: 'inherit' });
    expect(base.filter((rule) => rule.media !== PHONE && /\b(?:input|select|textarea)\b/.test(rule.selector)).map((rule) => rule.selector))
      .toEqual(['input, select, textarea']);
  });

  test('every field the app draws is one the rule names; only checkboxes, radios and the photo picker are left out', () => {
    const tags = fieldTags();
    // The app's fields as this follow-up found them: 110 in 18 components.
    expect(tags.length).toBeGreaterThanOrEqual(110);
    expect(new Set(tags.map((field) => field.path)).size).toBeGreaterThanOrEqual(18);
    const left: string[] = [];
    for (const field of tags) {
      if (field.tag !== 'input') continue;
      const types = field.type === null ? ['text'] : field.type.startsWith('{') ? typesOf(field) : [field.type];
      for (const type of types) if (NOT_TYPED.includes(type)) left.push(`${field.path}:${field.line} ${type}`);
      // An input of a typed type is never also one of the left-out kinds.
      if (types.some((type) => NOT_TYPED.includes(type))) expect(types, `${field.path}:${field.line}`).toHaveLength(1);
    }
    expect(left).toEqual([
      'pages/fleet/AssignmentDialogs.tsx:341 checkbox',
      'pages/fleet/NewAssignment.tsx:119 radio',
      'pages/insurance/CaseDialogs.tsx:211 file',
      'pages/users/UserDialogs.tsx:183 checkbox',
      'ui/CheckCard.tsx:19 checkbox',
    ]);
    // The prop-typed input (FleetDialogs' Text) is typed into whatever its type.
    const typed = tags.filter((field) => field.type?.startsWith('{'));
    expect(typed.map((field) => `${field.path} ${typesOf(field).join('|')}`)).toEqual(['pages/fleet/FleetDialogs.tsx text|email|tel|number|date']);
  });

  test('nothing in the app sets a size with !important but the base rule, so no field’s own class outranks it', () => {
    const important: string[] = [];
    for (const path of files(/\.css$/)) {
      for (const rule of readRules(new URL(`file://${path}`))) {
        for (const [property, value] of Object.entries(rule.declarations)) {
          if (/font/.test(property) && /!important/.test(value)) important.push(`${short(path)} ${rule.media ?? ''} ${rule.selector}`.replace(/\s+/g, ' '));
        }
      }
    }
    expect(important).toEqual([`styles/base.css ${PHONE} ${FIELDS}`]);
  });

  /** Each select drawn transparent over its shown value, and the value it shows. */
  const SHOWN = [
    { css: '../ui/Filters.module.css', select: '.nativeSelect', shown: ['.selectValue', '.moreValue'], wide: { '.selectValue': '13px', '.moreValue': '13px' } },
    { css: '../ui/Pagination.module.css', select: '.nativeSelect', shown: ['.sizeValue'], wide: { '.sizeValue': '12.5px' } },
    { css: './fleet/NewAssignment.module.css', select: '.searchSelect', shown: ['.searchValue'], wide: { '.searchValue': '13.5px' } },
  ] as const;

  test('a select drawn over its shown value shows that value at 16px on the phone, and as before above it', () => {
    for (const { css, shown, wide } of SHOWN) {
      const rules = readRules(new URL(css, import.meta.url));
      for (const selector of shown) {
        const phone = rules.filter((rule) => rule.media === PHONE && rule.selector.split(/\s*,\s*/).includes(selector));
        expect(phone.map((rule) => rule.declarations), `${css} ${selector}`).toEqual([{ 'font-size': '16px' }]);
        expect(declared(rules, selector)['font-size'], `${css} ${selector}`).toBe(wide[selector as keyof typeof wide]);
      }
      // Nothing else of the module changes on the phone.
      expect(rules.filter((rule) => rule.media === PHONE).map((rule) => rule.selector)).toEqual([shown.join(', ')]);
    }
    // Their labels keep their sizes: the filter's name beside its value, the extra filter's name above it.
    const filters = readRules(new URL('../ui/Filters.module.css', import.meta.url));
    expect(declared(filters, '.selectLabel')['font-size']).toBe('12.5px');
    expect(declared(filters, '.moreLabel')['font-size']).toBe('12px');
  });

  test('those are all of the app’s transparent selects', () => {
    const transparent: string[] = [];
    for (const path of files(/\.module\.css$/)) {
      for (const rule of readRules(new URL(`file://${path}`))) {
        if (rule.declarations['opacity'] === '0' && rule.declarations['position'] === 'absolute') transparent.push(`${short(path)} ${rule.selector}`);
      }
    }
    // The photo picker's transparent input is a file input, which nothing is typed into.
    expect(transparent).toEqual([
      'pages/fleet/NewAssignment.module.css .searchSelect',
      'pages/insurance/CaseDialogs.module.css .addInput',
      'ui/Filters.module.css .nativeSelect',
      'ui/Pagination.module.css .nativeSelect',
    ]);
    const used = fieldTags().filter((field) => /styles\.(?:nativeSelect|searchSelect|addInput)/.test(field.source));
    expect(used.map((field) => `${field.path} ${field.tag}${field.type && field.tag === 'input' ? ` ${field.type}` : ''}`)).toEqual([
      'pages/fleet/NewAssignment.tsx select',
      'pages/insurance/CaseDialogs.tsx input file',
      'ui/Filters.tsx select',
      'ui/Filters.tsx select',
      'ui/Pagination.tsx select',
    ]);
  });
});
