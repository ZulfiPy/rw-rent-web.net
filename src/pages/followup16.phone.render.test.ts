import { createElement as h } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import { WorkTaskView, type WorkTaskQuery } from '@/api/dto';
import { LOCAL_TIME_NOTE } from '@/format';
import { Tasks } from './tasks/Tasks';
import { clearTaskRenders, renderAs } from './followup12.harness';
import { meToms } from './followup12.support';
import { P15_CAPTURED_AT, p15CountsToms, p15InvolvingToms, p15MyTasksToms } from './followup15.support';

/**
 * Follow-up 16 below 768 pixels: the note no longer drops to a line of its own between the tabs and the
 * list (F16-1), and the tab bar is the compact strip that spans the list (F16-2; its width is the
 * stylesheet's, held in `followup16.render.test.ts`). A server render always takes the desktop tier,
 * so the phone tier is set here, as in Follow-up 12.
 */
vi.mock('@/app/useViewport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/useViewport')>()),
  useTier: () => 'phone' as const,
  useNarrow: () => true,
  useRailMode: () => 'drawer' as const,
}));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(P15_CAPTURED_AT));
});
afterEach(() => {
  vi.useRealTimers();
  clearTaskRenders();
});

const LIST = (view: WorkTaskQuery['View']): WorkTaskQuery => ({ View: view, PageNumber: 1, PageSize: 20 });

describe('the Tasks tab row on a phone (F16)', () => {
  test('the compact strip, then at once the list of cards: no line with the zone between them', () => {
    for (const [at, view, page] of [['/tasks', WorkTaskView.MyTasks, p15MyTasksToms], ['/tasks?tab=involving', WorkTaskView.InvolvingMe, p15InvolvingToms]] as const) {
      const markup = renderAs(h(Tasks), { at, route: '/tasks', me: meToms, data: [[qk.tasks.list(LIST(view)), page], [qk.tasks.counts, p15CountsToms]] }).markup;
      expect(markup).not.toContain(LOCAL_TIME_NOTE);
      expect(markup).toMatch(/^<div class="_page_[^"]*"><div class="_tabs_[^"]*" role="tablist" data-fade="none" data-compact="true">/);
      // The strip's three tabs with their counts, then the list's panel with its cards.
      expect(markup).toMatch(/My tasks<span[^>]*>5<\/span><\/button>.*Involving me<span[^>]*>5<\/span><\/button>.*Finished<span[^>]*>0<\/span><\/button><\/div><section class="_panel_/);
      expect(markup).toContain('<div class="_card_');
    }
  });
});
