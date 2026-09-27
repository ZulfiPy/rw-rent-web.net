import { describe, expect, test } from 'vitest';
import { TABLET, declared, readRules } from './followup14.stylesheet';

/**
 * Follow-up 17: what each screen size is given, read from the stylesheets themselves (a server render
 * carries class names, not a layout), against the handover's values (HANDOVER.md e). The one value
 * this run changed on purpose is the folded band's Status column: the handover's 94px cut every
 * status chip but Repair, which the browser check found; it is 120px, the width "Under review" needs.
 */
const LIST = readRules(new URL('./insurance/InsuranceCases.module.css', import.meta.url));
const CASE = readRules(new URL('./insurance/CaseRecord.module.css', import.meta.url));
const PHOTO = readRules(new URL('./insurance/PhotoView.module.css', import.meta.url));
const DIALOGS = readRules(new URL('./insurance/CaseDialogs.module.css', import.meta.url));
const SHEET = '(max-width: 639px)';

describe('the list’s columns', () => {
  test('from 1024 up: Status 132, Waiting for 170, At fault 150, Closed 130, the text columns sharing the rest; never under 920', () => {
    expect(declared(LIST, '.table')).toEqual({ 'min-width': '920px' });
    expect(declared(LIST, '.cStatus')).toEqual({ width: '132px' });
    expect(declared(LIST, '.cWaiting')).toEqual({ width: '170px' });
    expect(declared(LIST, '.cFault')).toEqual({ width: '150px' });
    expect(declared(LIST, '.cClosed')).toEqual({ width: '130px' });
    for (const auto of ['.cCase', '.cHandled', '.cLast']) expect(declared(LIST, auto)).toEqual({ width: 'auto' });
  });

  test('the folded band: fixed layout, the widths at 71% but Status’s, which keeps its widest chip whole', () => {
    expect(declared(LIST, '.table', TABLET)).toEqual({ 'table-layout': 'fixed', 'min-width': '679px' });
    expect(declared(LIST, '.cStatus', TABLET)).toEqual({ width: '120px' });
    expect(declared(LIST, '.cWaiting', TABLET)).toEqual({ width: '121px' });
    expect(declared(LIST, '.cFault', TABLET)).toEqual({ width: '107px' });
    expect(declared(LIST, '.cClosed', TABLET)).toEqual({ width: '92px' });
    // Nothing scrolls at 768: the list's frame there is 736px.
    expect(679).toBeLessThanOrEqual(768 - 2 * 16);
  });
});

describe('a case’s page', () => {
  test('two columns 1.7 : 1 from 1024 up with the right one at least 300px, one below', () => {
    expect(declared(CASE, ".columns[data-cols='2']")).toEqual({ 'grid-template-columns': 'minmax(0, 1.7fr) minmax(300px, 1fr)' });
    expect(declared(CASE, ".columns[data-cols='1']")).toEqual({ 'grid-template-columns': 'minmax(0, 1fr)' });
    expect(declared(CASE, '.columns').gap).toBe('14px');
  });

  test('the timeline’s rail, dot and entry, and the thumbnails at each size', () => {
    expect(declared(CASE, '.entry')['grid-template-columns']).toBe('22px minmax(0, 1fr)');
    expect(declared(CASE, '.entry')['column-gap']).toBe('12px');
    expect(declared(CASE, '.dot')).toMatchObject({ width: '9px', height: '9px', 'margin-top': '17px', 'box-shadow': '0 0 0 4px var(--surface)' });
    expect(declared(CASE, '.thumb')).toMatchObject({ width: '76px', height: '57px' });
    expect(declared(CASE, ".thumb[data-size='panel']")).toMatchObject({ width: '96px', height: '72px' });
    expect(declared(CASE, '.thumb', SHEET)).toMatchObject({ width: '64px', height: '48px' });
    expect(declared(CASE, ".thumb[data-size='panel']", SHEET)).toMatchObject({ width: '88px', height: '66px' });
    expect(declared(CASE, '.edit', SHEET)).toEqual({ 'min-height': '44px' });
  });
});

describe('the photo view and the dialogs', () => {
  test('the photo view: at most 980px, 24px from the viewport, 4:3 capped at 68vh; full-bleed with 44px buttons below 640', () => {
    expect(declared(PHOTO, '.overlay')).toMatchObject({ 'z-index': '75', padding: '24px', background: 'rgba(0, 0, 0, .8)' });
    expect(declared(PHOTO, '.panel')).toMatchObject({ 'max-width': '980px', 'border-radius': '16px' });
    expect(declared(PHOTO, '.stage')).toMatchObject({ 'aspect-ratio': '4 / 3', 'max-height': '68vh' });
    expect(declared(PHOTO, '.overlay', SHEET)).toEqual({ padding: '0' });
    expect(declared(PHOTO, '.panel', SHEET)).toMatchObject({ 'border-radius': '0' });
    expect(declared(PHOTO, '.close, .step', SHEET)).toEqual({ width: '44px', height: '44px' });
  });

  test('the dialogs: paired fields in two columns from 1024 up, one below; photo tiles 104 × 78 with a 44px Remove on the sheet', () => {
    expect(declared(DIALOGS, '.grid')['grid-template-columns']).toBe('1fr 1fr');
    expect(declared(DIALOGS, '.grid', TABLET)).toEqual({ 'grid-template-columns': '1fr' });
    expect(declared(DIALOGS, '.tilePicture')).toMatchObject({ width: '104px', height: '78px' });
    expect(declared(DIALOGS, '.tileRemove')['min-height']).toBe('28px');
    expect(declared(DIALOGS, '.tileRemove, .add', SHEET)).toEqual({ 'min-height': '44px' });
  });
});
