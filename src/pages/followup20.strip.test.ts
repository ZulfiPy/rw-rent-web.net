import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { SEAT_PAD, tabStrip, type Fade } from '@/ui/tabStrip';

/**
 * Follow-up 20, F20-2: the record tab strip brings its active tab whole into view again whenever the
 * tabs change width, its counts arriving among them, without a slide, unless the person has already
 * scrolled the strip. `RecordTabs` starts `tabStrip` on its element; a server render runs no effects,
 * so the strip is played here as a browser holds it: the Delete records page's seven tabs at 402px,
 * 16px from the screen's edges, their boxes from their widths and the strip's scroll, and the
 * observer of their sizes fired as the browser fires it.
 */

/** The strip at 402px: 370px wide inside the page's 16px gutters, its tabs 4px apart within 4px. */
const LEFT = 16;
const WIDTH = 370;
/** The seven tabs before their counts arrive, Rental assignments to Insurance cases. */
const BEFORE = [178, 190, 136, 112, 125, 102, 155];
/** A count beside a label: the gap and the digits. */
const COUNT = 24;
const INSURANCE_CASES = 6;
const INTERRUPTIONS = 2;

type Listener = (event: Partial<WheelEvent>) => void;

class FakeObserver {
  static made: FakeObserver[] = [];
  readonly targets = new Set<unknown>();
  constructor(private readonly callback: () => void) { FakeObserver.made.push(this); }
  observe(target: unknown) { this.targets.add(target); }
  unobserve(target: unknown) { this.targets.delete(target); }
  disconnect() { this.targets.clear(); }
  /** The browser reports a change of size of one of the targets. */
  static fire(target: unknown) { for (const one of FakeObserver.made) if (one.targets.has(target)) one.callback(); }
}

/** The strip as the browser holds it. */
function stripAt(widths: number[], active: number) {
  const state = { widths: [...widths], active, scrollLeft: 0 };
  const listeners = new Map<string, Set<Listener>>();
  const leftOf = (i: number) => 4 + state.widths.slice(0, i).reduce((sum, w) => sum + w + 4, 0);
  const tabs = state.widths.map((_, i) => ({
    i,
    getBoundingClientRect: () => {
      const left = LEFT + leftOf(i) - state.scrollLeft;
      return { left, right: left + state.widths[i]!, top: 0, bottom: 38, width: state.widths[i]!, height: 38 };
    },
  }));
  const scrollTo = vi.fn(({ left, behavior }: ScrollToOptions) => {
    // An instant scroll stands at once and reports itself a frame later; a slide moves over frames.
    if (behavior !== 'smooth') state.scrollLeft = Math.max(0, Math.min(left!, element.scrollWidth - WIDTH));
  });
  const element = {
    get scrollLeft() { return state.scrollLeft; },
    set scrollLeft(value: number) { state.scrollLeft = value; },
    clientWidth: WIDTH,
    get scrollWidth() { return leftOf(state.widths.length) },
    getBoundingClientRect: () => ({ left: LEFT, right: LEFT + WIDTH, top: 0, bottom: 46, width: WIDTH, height: 46 }),
    querySelector: (selector: string) => (selector === '[aria-selected="true"]' ? tabs[state.active] : null),
    querySelectorAll: (selector: string) => (selector === '[role="tab"]' ? tabs : []),
    scrollTo,
    addEventListener: (type: string, listener: Listener) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(listener);
    },
    removeEventListener: (type: string, listener: Listener) => listeners.get(type)?.delete(listener),
  };
  const emit = (type: string, event: Partial<WheelEvent> = {}) => listeners.get(type)?.forEach((listener) => listener(event));
  return {
    el: element as unknown as HTMLElement,
    state,
    scrollTo,
    listeners,
    /** The browser's scroll event for where the strip stands now. */
    scrolled: () => emit('scroll'),
    emit,
    /** Every tab widens or narrows; the observer hears of it. */
    resize: (next: number[]) => {
      state.widths = [...next];
      tabs.forEach((tab) => FakeObserver.fire(tab));
    },
    /** The active tab's box against the strip's: whole when it stands inside it. */
    seatOfActive: () => tabs[state.active]!.getBoundingClientRect(),
  };
}

const counted = (widths: number[]) => widths.map((w) => w + COUNT);
const whole = (seat: { left: number; right: number }) => seat.left >= LEFT && seat.right <= LEFT + WIDTH;

let fades: Fade[];
const onFade = (fade: Fade) => fades.push(fade);

beforeEach(() => {
  FakeObserver.made = [];
  fades = [];
  vi.stubGlobal('ResizeObserver', FakeObserver);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('F20-2: the active tab whole once its counts arrive', () => {
  test('a deep link to the last tab lands on it without a slide, before the counts', () => {
    const strip = stripAt(BEFORE, INSURANCE_CASES);
    tabStrip(strip.el, onFade).seat(false);
    expect(strip.scrollTo).toHaveBeenCalledTimes(1);
    expect(strip.scrollTo).toHaveBeenLastCalledWith({ left: strip.el.scrollWidth - WIDTH, behavior: 'auto' });
    expect(whole(strip.seatOfActive())).toBe(true);
    expect(fades.at(-1)).toBe('start');
  });

  test('when the counts widen the tabs, the active tab is brought whole into view again, without a slide', () => {
    const strip = stripAt(BEFORE, INSURANCE_CASES);
    tabStrip(strip.el, onFade).seat(false);
    strip.scrolled();
    strip.resize(counted(BEFORE));
    // Without the second seat it would stand 164px past the strip's edge.
    expect(strip.seatOfActive().right - (LEFT + WIDTH)).toBeLessThan(0);
    expect(strip.scrollTo).toHaveBeenCalledTimes(2);
    expect(strip.scrollTo).toHaveBeenLastCalledWith({ left: strip.el.scrollWidth - WIDTH, behavior: 'auto' });
    expect(whole(strip.seatOfActive())).toBe(true);
    // Its own scroll is not the person's: a later change of width seats it again.
    strip.scrolled();
    strip.resize(counted(counted(BEFORE)));
    expect(strip.scrollTo).toHaveBeenCalledTimes(3);
    expect(whole(strip.seatOfActive())).toBe(true);
  });

  test('a tab in the middle is seated with the same room from the edge', () => {
    const strip = stripAt(BEFORE, 4);
    tabStrip(strip.el, onFade).seat(false);
    strip.scrolled();
    strip.resize(counted(BEFORE));
    const seat = strip.seatOfActive();
    // The room is the strip's 22px, read here as a number, not from the module that keeps it.
    expect(SEAT_PAD).toBe(22);
    expect(seat.right).toBe(LEFT + WIDTH - 22);
    expect(strip.scrollTo.mock.calls.map(([options]) => options.behavior)).toEqual(['auto', 'auto']);
  });

  test('once the person has scrolled the strip with a finger, the counts leave it where they put it', () => {
    const strip = stripAt(BEFORE, INSURANCE_CASES);
    tabStrip(strip.el, onFade).seat(false);
    strip.scrolled();
    strip.emit('touchstart');
    strip.state.scrollLeft = 300;
    strip.scrolled();
    strip.emit('touchend');
    strip.resize(counted(BEFORE));
    expect(strip.scrollTo).toHaveBeenCalledTimes(1);
    expect(strip.state.scrollLeft).toBe(300);
  });

  test('a finger that only taps, and a wheel that scrolls the page, are not the person scrolling the strip', () => {
    const strip = stripAt(BEFORE, INSURANCE_CASES);
    tabStrip(strip.el, onFade).seat(false);
    strip.emit('touchstart');
    strip.emit('touchend');
    strip.scrolled();
    strip.emit('wheel', { deltaX: 1, deltaY: 40, shiftKey: false });
    strip.resize(counted(BEFORE));
    expect(strip.scrollTo).toHaveBeenCalledTimes(2);
    expect(whole(strip.seatOfActive())).toBe(true);
  });

  test('a wheel turned sideways over the strip is the person scrolling it', () => {
    const strip = stripAt(BEFORE, INSURANCE_CASES);
    tabStrip(strip.el, onFade).seat(false);
    strip.scrolled();
    strip.emit('wheel', { deltaX: -30, deltaY: 2, shiftKey: false });
    strip.state.scrollLeft = 500;
    strip.scrolled();
    strip.resize(counted(BEFORE));
    expect(strip.scrollTo).toHaveBeenCalledTimes(1);
    expect(strip.state.scrollLeft).toBe(500);
  });

  test('choosing a tab slides to it, and the bold that widens it in that frame does not cut the slide short', () => {
    const strip = stripAt(counted(BEFORE), INSURANCE_CASES);
    const control = tabStrip(strip.el, onFade);
    control.seat(false);
    strip.scrolled();
    // Interruptions is chosen: it turns bold and Insurance cases plain, before the slide is measured.
    strip.state.active = INTERRUPTIONS;
    const bold = counted(BEFORE).map((w, i) => (i === INTERRUPTIONS ? w + 3 : i === INSURANCE_CASES ? w - 3 : w));
    strip.state.widths = bold;
    control.seat(true);
    expect(strip.scrollTo).toHaveBeenLastCalledWith({ left: expect.any(Number), behavior: 'smooth' });
    const target = strip.scrollTo.mock.lastCall![0].left!;
    strip.resize(bold);
    expect(strip.scrollTo).toHaveBeenCalledTimes(2);
    // The slide runs its course; its scroll events are the app's, not the person's.
    for (const at of [700, 520, target]) {
      strip.state.scrollLeft = at;
      strip.scrolled();
    }
    expect(whole(strip.seatOfActive())).toBe(true);
    // Labels before it grow by far: it would stand past the edge, and is seated again without a slide.
    strip.resize(bold.map((w, i) => (i < INTERRUPTIONS ? w + 200 : w)));
    expect(strip.scrollTo).toHaveBeenCalledTimes(3);
    expect(strip.scrollTo).toHaveBeenLastCalledWith({ left: expect.any(Number), behavior: 'auto' });
    expect(whole(strip.seatOfActive())).toBe(true);
  });

  test('an instant seat the browser moves on, as the tabs narrow, leaves nothing to wait for', () => {
    const strip = stripAt(BEFORE, INSURANCE_CASES);
    tabStrip(strip.el, onFade).seat(false);
    const first = strip.scrollTo.mock.lastCall![0].left!;
    // The page's font arrives: every tab narrows, and the browser keeps the scroll within the strip.
    const narrow = BEFORE.map((w) => w - 10);
    strip.state.widths = narrow;
    strip.state.scrollLeft = Math.min(strip.state.scrollLeft, strip.el.scrollWidth - WIDTH);
    strip.scrolled();
    strip.resize(narrow);
    expect(strip.state.scrollLeft).toBeLessThan(first);
    // The tabs widen back to where the first seat was sent: the tab is seated again there.
    strip.resize(BEFORE);
    expect(strip.scrollTo).toHaveBeenLastCalledWith({ left: first, behavior: 'auto' });
    expect(whole(strip.seatOfActive())).toBe(true);
  });

  test('a change of width while the active tab stands whole moves nothing', () => {
    const strip = stripAt(BEFORE, 0);
    tabStrip(strip.el, onFade).seat(false);
    strip.resize(counted(BEFORE));
    expect(strip.scrollTo).not.toHaveBeenCalled();
    expect(fades.at(-1)).toBe('end');
  });

  test('started twice, as React’s development mode starts it, the strip is still seated once the counts arrive', () => {
    const strip = stripAt(BEFORE, INSURANCE_CASES);
    const first = tabStrip(strip.el, onFade);
    first.seat(false);
    first.stop();
    const second = tabStrip(strip.el, onFade);
    second.seat(true);
    // The first start's scroll reports itself to the second.
    strip.scrolled();
    strip.resize(counted(BEFORE));
    expect(strip.scrollTo).toHaveBeenCalledTimes(2);
    expect(strip.scrollTo).toHaveBeenLastCalledWith({ left: strip.el.scrollWidth - WIDTH, behavior: 'auto' });
    expect(whole(strip.seatOfActive())).toBe(true);
  });

  test('stopped, it hears nothing more', () => {
    const strip = stripAt(BEFORE, INSURANCE_CASES);
    const control = tabStrip(strip.el, onFade);
    control.seat(false);
    control.stop();
    expect([...strip.listeners.values()].every((set) => set.size === 0)).toBe(true);
    strip.resize(counted(BEFORE));
    expect(strip.scrollTo).toHaveBeenCalledTimes(1);
  });
});

describe('F20-2: every page with the strip gains it', () => {
  /**
   * The component's effects do not run in a server render, so this reads `RecordTabs` itself: it starts
   * `tabStrip` on its strip's element once, before its first seat, stops it when it goes, and seats the
   * active tab on each choice, the first without a slide. The browser's measurements in the report are
   * the proof that it runs; every page with a tab strip draws this one (Follow-up 16's test lists them).
   */
  const source = readFileSync(new URL('../ui/RecordTabs.tsx', import.meta.url), 'utf8');

  test('RecordTabs starts the strip on its element, seats on each choice and stops it when it goes', () => {
    const start = source.indexOf('const started = tabStrip(el, setFade);');
    const seat = source.indexOf('control.current?.seat(opened.current);');
    expect(start).toBeGreaterThan(-1);
    expect(seat).toBeGreaterThan(start);
    expect(source.slice(source.lastIndexOf('useLayoutEffect(', start), start)).toContain('const el = strip.current;');
    expect(source.slice(start, source.indexOf('}, []);', start))).toContain('started.stop();');
    expect(source.slice(seat, source.indexOf(');', source.indexOf('}, [', seat)) + 2)).toContain('}, [active, tabs.length]);');
    expect(source.slice(source.lastIndexOf('useLayoutEffect(', seat), seat)).not.toContain('}, [');
    expect(source).toMatch(/<div ref=\{strip\} className=\{styles\.tabs\} role="tablist"/);
    // No other scroll of the strip is left in the component.
    expect(source).not.toMatch(/scrollTo|scrollLeft|ResizeObserver/);
  });
});
