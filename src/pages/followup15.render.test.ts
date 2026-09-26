import { createElement as h } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import { WorkTaskView, type WorkTaskQuery } from '@/api/dto';
import { Tasks } from './tasks/Tasks';
import { around, clearTaskRenders, renderAs } from './followup12.harness';
import { meDita, meSigne, meToms, view3Signe } from './followup12.support';
import { P15_CAPTURED_AT, p15CountsDita, p15CountsToms, p15MyTasksDita, p15MyTasksToms } from './followup15.support';
import { TABLE_CSS, TABLET, TASKS_CSS, declared, readRules } from './followup14.stylesheet';

/**
 * Follow-up 15 on the desktop (F15-1): from 1024 pixels up, Task and Your step share the width that
 * Steps, People and Due leave, half each, and Your step never takes less than 330 pixels, so a step title
 * of about 30 characters stays on one line beside its button. Rendered from the scratch API's answers
 * with the practice tasks in them (`followup15.support.ts`: a title of 171 characters, steps of 11 to 81
 * characters); the widths each frame gives are worked out from the stylesheet's own values, since a
 * server render has no layout. The browser's measurements are in the report.
 */
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(P15_CAPTURED_AT));
});
afterEach(() => {
  vi.useRealTimers();
  clearTaskRenders();
});

const LIST = (view: WorkTaskQuery['View']): WorkTaskQuery => ({ View: view, PageNumber: 1, PageSize: 20 });

const myTasks = (me: typeof meDita, page: typeof p15MyTasksDita, counts: typeof p15CountsDita) =>
  renderAs(h(Tasks), { at: '/tasks', route: '/tasks', me, data: [[qk.tasks.list(LIST(WorkTaskView.MyTasks)), page], [qk.tasks.counts, counts]] }).markup;

const rules = readRules(TASKS_CSS);
const px = (value: string | undefined) => {
  expect(value, 'a length in px').toMatch(/^\d+(\.\d+)?px$/);
  return parseFloat(value!);
};

/** The open views' widths for a frame of `frame` px, as the stylesheet sets them. */
function widthsFor(frame: number) {
  const table = declared(rules, '.withSteps');
  const fixed = px(table['--fixed-columns']);
  const least = px(table['--your-step-min']);
  const floor = px(table['min-width']);
  const width = Math.max(frame, floor);
  const your = Math.max(least, (frame - fixed) / 2);
  return { width, your, task: width - fixed - your, scrolls: width > frame };
}

/** The frames the browser measured (report §4.4): the list's width at each screen size and rail. */
const FRAMES = { w1920: 1620, w1512: 1212, w1512railFolded: 1394, w1366: 1056, w1280: 970, w1194: 1082, w1024: 912 };

describe('Your step wider and Task narrower from 1024 px up (F15-1)', () => {
  test('Your step is half of what Steps, People and Due leave, measured on the list’s frame, never under 330px', () => {
    expect(declared(rules, '.cYour').width).toBe('max(var(--your-step-min), (100cqw - var(--fixed-columns)) / 2)');
    expect(declared(rules, '.withSteps')).toMatchObject({ '--your-step-min': '330px', '--fixed-columns': '520px' });
    // The fixed columns are exactly Steps, People and Due of the open views.
    const fixed = px(declared(rules, '.cSteps150').width) + px(declared(rules, '.cPeople200').width) + px(declared(rules, '.cDue').width);
    expect(fixed).toBe(520);
    // Task takes the rest; the frame the units measure is the list's own.
    expect(declared(rules, '.cTask').width).toBe('auto');
    expect(declared(rules, '.tableFrame')['container-type']).toBe('inline-size');
  });

  test('the spare width is shared: Task and Your step equal from 1180px of frame, Your step at 330 below it', () => {
    for (const [name, frame] of Object.entries(FRAMES)) {
      const { your, task } = widthsFor(frame);
      expect(your, name).toBeGreaterThanOrEqual(330);
      if (frame >= 1180) expect(task, name).toBe(your);
      else expect(your, name).toBe(330);
    }
    expect(widthsFor(FRAMES.w1920)).toMatchObject({ your: 550, task: 550 });
    expect(widthsFor(FRAMES.w1512)).toMatchObject({ your: 346, task: 346 });
    expect(widthsFor(FRAMES.w1194)).toMatchObject({ your: 330, task: 232 });
  });

  test('at 1512 a step title of about 30 characters fits on one line beside its button', () => {
    const { your } = widthsFor(FRAMES.w1512);
    // The cell's pads (14px each side), Follow-up 14's button place and its fixed gap.
    const room = your - 28 - px(declared(rules, '.yourStep')['--your-step-button']) - px(declared(rules, '.yourStep')['column-gap']);
    // "Book the service appointment" is 179px wide in the list's type, "Pick up the repair invoice" 150px.
    expect(room).toBeGreaterThanOrEqual(179);
    // At the floor of 330 the room is 186px: still the 28 characters of "Book the service appointment".
    expect(330 - 28 - 104 - 12).toBeGreaterThanOrEqual(179);
  });

  test('nothing scrolls sideways at 1194 or wider; the floor stays 1020px, so it scrolls nowhere it did not before', () => {
    expect(px(declared(rules, '.withSteps')['min-width'])).toBe(1020);
    for (const name of ['w1920', 'w1512', 'w1512railFolded', 'w1366', 'w1194'] as const) {
      expect(widthsFor(FRAMES[name]).scrolls, name).toBe(false);
    }
    // Where the frame is under 1020 (1024 with the rail folded, 1280 with it open) the table scrolled
    // before and still does, by the same amount, and Task takes what Your step leaves: 170px.
    expect(widthsFor(FRAMES.w1024)).toMatchObject({ width: 1020, your: 330, task: 170, scrolls: true });
    expect(widthsFor(FRAMES.w1280)).toMatchObject({ width: 1020, your: 330, task: 170, scrolls: true });
  });

  test('the list is drawn in its frame; the long practice title wraps inside Task, nothing cut', () => {
    for (const [me, page, counts] of [[meDita, p15MyTasksDita, p15CountsDita], [meToms, p15MyTasksToms, p15CountsToms]] as const) {
      const markup = myTasks(me, page, counts);
      expect(markup).toMatch(/<div class="_scroll_[^"]* _tableFrame_[^"]*"><table class="[^"]*_withSteps_/);
      expect(markup).toMatch(/_cTask_[^"]*">Task<\/th>.*_cYour_[^"]*">Your step<\/th>/);
      const long = page.items.find((task) => task.title.length > 160)!;
      expect(long.title).toHaveLength(171);
      const row = around(markup, `>${long.title}</a>`, 'tr');
      // The title is the list's wrapping title, never the one-line cut.
      expect(row).toMatch(new RegExp(`<a class="[^"]*_title_[^"]*" href="/tasks/${long.id}"[^>]*>${long.title}</a>`));
      expect(row).not.toContain('_oneLine_');
    }
    expect(declared(rules, '.title')['overflow-wrap']).toBe('anywhere');
    const cells = declared(readRules(TABLE_CSS), '.td');
    expect(cells['white-space']).toBeUndefined();
  });

  test('Toms’s practice steps: the overdue one of 81 characters and the one Dita marked are in Your step', () => {
    const markup = myTasks(meToms, p15MyTasksToms, p15CountsToms);
    const long = p15MyTasksToms.items.find((task) => task.title.length > 160)!;
    const row = around(markup, `>${long.title}</a>`, 'tr');
    expect(long.yourSteps.map((step) => step.title.length)).toEqual([11, 81, 72]);
    expect(row).toMatch(/Ask the storage for the tyre hotel receipt and photograph each tyre&#x27;s tread depth<\/span><span class="[^"]*_toneBad_[^"]*">Overdue · /);
    expect(row).toMatch(/Tell both drivers when the fitting is booked and where to bring the cars<\/span><span class="_doneMark_/);
    // Dita, the task's creator, marked it: the API offers Toms no action, and the place stays empty.
    expect(row).toMatch(/where to bring the cars<\/span><span class="_doneMark_[^"]*">.*?Done<\/span><\/span><span class="_yourStepAction_[^"]*"><\/span>/);
  });
});

describe('what F15-1 leaves as it was', () => {
  test('the folded band keeps its widths: Your step 206px in a fixed layout, the table’s floor 582px', () => {
    expect(declared(rules, '.cYour', TABLET).width).toBe('206px');
    expect(declared(rules, '.withSteps', TABLET)['min-width']).toBe('582px');
    expect(declared(rules, '.table', TABLET)['table-layout']).toBe('fixed');
  });

  test('Finished keeps its columns: Task, Steps 170, People 240, Closed 170, no Your step', () => {
    const markup = renderAs(h(Tasks), {
      at: '/tasks?tab=finished', route: '/tasks', me: meSigne, data: [[qk.tasks.list(LIST(WorkTaskView.Finished)), view3Signe]],
    }).markup;
    expect(markup).toMatch(/<table class="[^"]*_plain_/);
    expect(markup).not.toContain('_cYour_');
    expect(declared(rules, '.plain')['min-width']).toBe('800px');
    expect([declared(rules, '.cSteps170').width, declared(rules, '.cPeople240').width, declared(rules, '.cDue').width]).toEqual(['170px', '240px', '170px']);
  });
});
