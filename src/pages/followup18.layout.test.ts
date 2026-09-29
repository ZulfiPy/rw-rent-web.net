import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import { waitText } from '@/format';
import { HeaderFact, RecordHeader } from '@/ui/RecordHeader';
import { AssignmentRecord } from './fleet/AssignmentRecord';
import { CaseRecord } from './insurance/CaseRecord';
import { InsuranceCases } from './insurance/InsuranceCases';
import { TaskRecord } from './tasks/TaskRecord';
import { UserRecord } from './users/UserRecord';
import { TABLET, declared, readRules } from './followup14.stylesheet';
import { clearRenders, renderPage, assignment, page } from './followup7b.support';
import { tomsBefore } from './followup10.support';
import { clearTaskRenders, renderAs } from './followup12.harness';
import { meDita as taskReader, taskFobsDita, taskPrepareDita } from './followup12.support';
import { CAPTURED_AT, caseHdvDita, caseKlmDita, countsDita, meDita, view1Dita } from './followup17.support';

/**
 * Follow-up 18, F18-1 and F18-3, the owner's two look fixes on the desktop.
 *
 * F18-1: in a record's band every fact stood centred in a reserve as tall as a fact with a line under
 * its value, so a fact without that line stood 9px lower (Driver, Handled by and At fault on a case;
 * About and Progress on a task). A band with such a line now marks its facts row, and the stylesheet
 * stands every fact of that row from the top; a band without one is left as it was. A server render
 * carries class names, not a layout, so the mark is read here and the rule from the stylesheet; the
 * browser measured the heights (the report, §4.3).
 *
 * F18-3: the list's Waiting for column broke "Someone else · 21 hours" after the dot at 1512px.
 */
const BAND = readRules(new URL('../ui/RecordHeader.module.css', import.meta.url));
const LIST = readRules(new URL('./insurance/InsuranceCases.module.css', import.meta.url));
const DESKTOP = '(min-width: 1024px)';

/** The band's facts row as the render gives it: its opening tag. */
const factsRow = (markup: string) => /<div class="_facts_[^"]*"[^>]*>/.exec(markup)?.[0] ?? '';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(CAPTURED_AT));
});
afterEach(() => {
  vi.useRealTimers();
  clearRenders();
  clearTaskRenders();
});

describe('F18-1: a band’s labels on one line', () => {
  test('a band where one fact has a line under its value marks its facts row; one where none has keeps it as it was', () => {
    const band = (sub: string | null) => renderToStaticMarkup(h(RecordHeader, {
      backTo: '/x', backLabel: 'List', title: 'Record',
      children: [
        h(HeaderFact, { key: 'a', label: 'Waiting for', value: 'Us', sub }),
        h(HeaderFact, { key: 'b', label: 'Driver', value: 'Ilze Berzina' }),
      ],
    }));
    expect(factsRow(band('since 20 Sep, 14:40 · 6 days'))).toContain('data-sub-lines="true"');
    expect(factsRow(band(null))).not.toContain('data-sub-lines');
    expect(factsRow(band(''))).not.toContain('data-sub-lines');
  });

  test('the stylesheet stands every fact of a marked row from the top; the reserve and the centring of other bands stay', () => {
    expect(declared(BAND, ".facts[data-sub-lines='true'] .fact")).toEqual({ 'align-self': 'flex-start', 'justify-content': 'flex-start' });
    expect(declared(BAND, '.fact')).toMatchObject({ 'align-self': 'center', 'justify-content': 'center', 'min-height': '54.5px' });
    // The phone tier stacks the facts from the top already.
    expect(declared(BAND, '.fact', '(max-width: 767px)')).toEqual({ 'min-height': '0', 'justify-content': 'flex-start' });
  });

  test('both 770 HDV cases and 552 KLM: the band is marked, since Waiting for, Found or Happened and Rental carry a line', () => {
    for (const kase of [caseHdvDita, caseKlmDita]) {
      const { markup } = renderAs(h(CaseRecord), {
        at: `/insurance-cases/${kase.id}`, route: '/insurance-cases/:caseId', me: meDita,
        data: [[qk.insuranceCases.detail(kase.id), kase]],
      });
      expect(factsRow(markup)).toContain('data-sub-lines="true"');
      for (const label of ['Waiting for', 'Driver', 'Rental', 'Handled by', 'At fault']) expect(markup).toContain(`>${label}</span>`);
    }
  });

  test('a case still loading: every fact reads "—" with no line under it, so its band stays centred until the case arrives', () => {
    const { markup } = renderAs(h(CaseRecord), {
      at: `/insurance-cases/${caseHdvDita.id}`, route: '/insurance-cases/:caseId', me: meDita,
    });
    expect(factsRow(markup)).not.toContain('data-sub-lines');
  });

  test('a task: Created by carries its time, so the band is marked; Due, About and Progress stand level with it', () => {
    for (const task of [taskPrepareDita, taskFobsDita]) {
      const { markup } = renderAs(h(TaskRecord), {
        at: `/tasks/${task.id}`, route: '/tasks/:taskId', me: taskReader,
        data: [[qk.tasks.detail(task.id), task]],
      });
      expect(factsRow(markup)).toContain('data-sub-lines="true"');
      for (const label of ['Created by', 'Due', 'About', 'Progress']) expect(markup).toContain(`>${label}</span>`);
    }
  });

  test('the user and rental-assignment bands, where no fact has a line under its value, are unchanged', () => {
    const user = renderPage(h(UserRecord), {
      at: `/users/${tomsBefore.id}`, route: '/users/:userId', permissions: ['Users.ReadDirectory'],
      data: [[qk.users.detail(tomsBefore.id), tomsBefore]],
    });
    expect(user).toContain('>Effective roles</span>');
    expect(factsRow(user)).toMatch(/^<div class="_facts_[^"]*">$/);
    const rental = renderPage(h(AssignmentRecord), {
      at: `/rental-assignments/${assignment.id}`, route: '/rental-assignments/:assignmentId', permissions: ['RentalAssignments.Read'],
      data: [
        [qk.assignments.detail(assignment.id), assignment],
        [qk.audit.list({ RentalAssignmentId: assignment.id, PageSize: 100 }), page([])],
      ],
    });
    expect(rental).toContain('>Open authorizations</span>');
    expect(factsRow(rental)).toMatch(/^<div class="_facts_[^"]*">$/);
  });
});

describe('F18-3: the Waiting for column on one line from 1024 up', () => {
  test('the column is as wide as its longest value, "Someone else · 59 minutes", and each value stays on one line', () => {
    expect(declared(LIST, '.cWaiting')).toEqual({ width: '190px' });
    expect(declared(LIST, '.waitingText', DESKTOP)).toEqual({ 'white-space': 'nowrap' });
    // The folded band (768–1023) keeps its 121px and lets the value wrap, as before.
    expect(declared(LIST, '.cWaiting', TABLET)).toEqual({ width: '121px' });
    expect(declared(LIST, '.waitingText', TABLET)).toEqual({});
    // The table's floor stays: the three text columns give up the 20px.
    expect(declared(LIST, '.table')).toEqual({ 'min-width': '920px' });
  });

  test('every value of the column carries the class, "Us" in its tone too', () => {
    const { markup } = renderAs(h(InsuranceCases), {
      at: '/insurance-cases', route: '/insurance-cases', me: meDita,
      data: [
        [qk.insuranceCases.counts, countsDita],
        [qk.insuranceCases.list({ View: 1, PageNumber: 1, PageSize: 20 }), view1Dita],
      ],
    });
    const values = [...markup.matchAll(/<span class="([^"]*)">((?:Us|The driver|The insurer|Someone else) · [^<]*|Nobody)<\/span>/g)];
    expect(values.map((v) => v[2])).toEqual(view1Dita.items.map((item) => waitText(item)));
    for (const [, classes] of values) expect(classes).toMatch(/_waitingText_/);
    expect(values.filter(([, classes]) => /_us_/.test(classes!)).map((v) => v[2])).toEqual(['Us · 2 days', 'Us · 21 hours']);
  });
});
