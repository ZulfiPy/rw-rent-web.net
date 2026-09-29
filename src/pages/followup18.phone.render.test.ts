import { createElement as h } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { qk } from '@/api';
import { Insurers } from './insurance/Insurers';
import { clearTaskRenders, count, renderAs } from './followup12.harness';
import { meDita, meToms } from './followup17.support';
import { insurersAll } from './followup18.support';

/**
 * The Insurers page below 768 pixels (Follow-up 18, F18-2b): each insurer is the other lists' card, its
 * name with its mark, its email and phone, the open cases it handles and the cases that name it, and
 * for a manager Edit and Put out of use or back under them. The owner looks at the tablet and the phone
 * in the next follow-up; this holds that the page follows the other lists there. A server render always
 * takes the desktop tier, so the tier is set here.
 */
vi.mock('@/app/useViewport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/useViewport')>()),
  useTier: () => 'phone' as const,
  useNarrow: () => true,
  useRailMode: () => 'drawer' as const,
}));

afterEach(() => clearTaskRenders());

const page = (me: typeof meDita) => renderAs(h(Insurers), {
  at: '/insurance-cases/insurers?show=all', route: '/insurance-cases/insurers', me, data: [[qk.insurers.list({}), insurersAll]],
}).markup;

/** The card that carries a name. */
const card = (markup: string, name: string) => {
  const at = markup.indexOf(`>${name}</span>`);
  expect(at, `no card ${name}`).toBeGreaterThan(-1);
  const start = markup.lastIndexOf('<div class="_card_', at);
  const next = markup.indexOf('<div class="_card_', at);
  return markup.slice(start, next > -1 ? next : undefined);
};

describe('the insurer cards on a phone', () => {
  test('no table; each insurer a card with its mark, its email, phone and counts, and a manager’s two actions', () => {
    const markup = page(meDita);
    expect(markup).not.toContain('<table');
    expect(count(markup, '<div class="_card_')).toBe(4);
    const baltic = card(markup, 'Baltic Mutual');
    for (const label of ['Email', 'Phone', 'Open cases it handles', 'Cases']) expect(baltic).toContain(`>${label}</span>`);
    expect(baltic).toContain('href="mailto:claims@balticmutual.example"');
    expect(baltic).toContain('href="tel:+37167001100"');
    expect(baltic).toMatch(/href="\/insurance-cases\?handled=[^"]+"[^>]*>3<\/a>/);
    expect(baltic).toMatch(/Edit<\/button>.*Put out of use<\/button>/s);
    const harbour = card(markup, 'Old Harbour Insurance');
    expect(harbour).toMatch(/data-tone="mute"[^>]*>.*Out of use<\/span>/);
    expect(harbour).toContain('Put back in use</button>');
  });

  test('a Viewer’s cards carry no action', () => {
    const markup = page(meToms);
    expect(count(markup, '<div class="_card_')).toBe(4);
    expect(markup).not.toContain('</button>');
  });
});
