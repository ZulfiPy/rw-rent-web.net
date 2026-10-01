/**
 * What the record tab strip does in the browser, apart from drawing its tabs (`RecordTabs`): it brings
 * the active tab whole into view, and fades the edge where tabs are cut off.
 *
 * The active tab is seated when it is chosen: on the first paint of a deep link without a slide, on a
 * later choice with one. Its counts arrive after that first paint and widen every tab, so a tab at the
 * end of the strip would stand partly past its edge (Follow-up 19's report: Insurance cases by 127px
 * at 402px). Whenever the tabs change width, the active tab is seated again, without a slide, unless
 * the person has already scrolled the strip (Follow-up 20, F20-2).
 *
 * The person has scrolled the strip when it scrolls while their finger is on it, or when they turn a
 * wheel sideways over it. The strip's other scrolls are the app's own.
 *
 * Choosing a tab sets it in bold, which changes two tabs' widths in the very frame its slide starts.
 * That slide is already heading where the wider tab stands whole, so a change of width that asks for
 * the same place leaves it to finish.
 */
export type Fade = 'none' | 'start' | 'end' | 'both';

export interface TabStrip {
  /** Seats the active tab: with a slide for a choice, without one on the first paint. */
  seat(slide: boolean): void;
  stop(): void;
}

/** The room the active tab keeps from the strip's edges. */
export const SEAT_PAD = 22;

/** How far a slide may stop from where it was sent and still count as there. */
const NEAR = 1;

/**
 * Where the strip's scroll must stand for its active tab to stand whole inside it, measured against
 * the strip's own box, which `offsetLeft` would not give; `null` when it already does, or when there
 * is no further to go.
 */
export function seatFor(strip: HTMLElement): number | null {
  const tab = strip.querySelector<HTMLElement>('[aria-selected="true"]');
  if (!tab) return null;
  const box = strip.getBoundingClientRect();
  const seat = tab.getBoundingClientRect();
  const delta = seat.left < box.left + SEAT_PAD
    ? seat.left - box.left - SEAT_PAD
    : seat.right > box.right - SEAT_PAD
      ? seat.right - box.right + SEAT_PAD
      : 0;
  if (!delta) return null;
  const next = Math.max(0, Math.min(strip.scrollLeft + delta, strip.scrollWidth - strip.clientWidth));
  return Math.abs(next - strip.scrollLeft) < NEAR ? null : next;
}

/** Starts the strip's behaviour on its element; `onFade` hears which edges are cut off. */
export function tabStrip(strip: HTMLElement, onFade: (fade: Fade) => void): TabStrip {
  /**
   * Where the app's own slide is heading, until it gets there. An instant scroll stands where it
   * stops as it is sent, the browser keeping it within the strip, so nothing of it is left to wait for.
   */
  let heading: number | null = null;
  /** A finger is on the strip. */
  let touching = false;
  /** The person has scrolled the strip: a change of width no longer moves it. */
  let scrolledByPerson = false;

  const fade = () => {
    const start = strip.scrollLeft > 1;
    const end = strip.scrollWidth - strip.clientWidth - strip.scrollLeft > 1;
    onFade(start && end ? 'both' : start ? 'start' : end ? 'end' : 'none');
  };

  const scrollTo = (left: number, slide: boolean) => {
    heading = slide ? left : null;
    if (typeof strip.scrollTo === 'function') {
      strip.scrollTo({ left, behavior: slide ? 'smooth' : 'auto' });
    } else {
      strip.scrollLeft = left;
    }
  };

  const onScroll = () => {
    if (touching) scrolledByPerson = true;
    if (heading !== null && Math.abs(strip.scrollLeft - heading) <= NEAR) heading = null;
    fade();
  };
  const onTouchStart = () => {
    touching = true;
    heading = null;
  };
  const onTouchEnd = () => {
    touching = false;
  };
  // Only a sideways turn: a trackpad's up-and-down scroll of the page over the strip carries a little
  // sideways movement too.
  const onWheel = (event: WheelEvent) => {
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey) {
      scrolledByPerson = true;
      heading = null;
    }
  };

  const onTabWidths = () => {
    if (!scrolledByPerson) {
      const next = seatFor(strip);
      if (next !== null && (heading === null || Math.abs(next - heading) > NEAR)) scrollTo(next, false);
    }
    fade();
  };

  const view = strip.ownerDocument?.defaultView ?? null;
  const Observer = typeof ResizeObserver === 'undefined' ? null : ResizeObserver;
  const box = Observer ? new Observer(fade) : null;
  const tabs = Observer ? new Observer(onTabWidths) : null;
  const watchTabs = () => {
    if (!tabs) return;
    tabs.disconnect();
    strip.querySelectorAll<HTMLElement>('[role="tab"]').forEach((tab) => tabs.observe(tab));
  };

  strip.addEventListener('scroll', onScroll, { passive: true });
  strip.addEventListener('touchstart', onTouchStart, { passive: true });
  strip.addEventListener('touchend', onTouchEnd, { passive: true });
  strip.addEventListener('touchcancel', onTouchEnd, { passive: true });
  strip.addEventListener('wheel', onWheel, { passive: true });
  view?.addEventListener('resize', fade);
  box?.observe(strip);

  return {
    seat(slide) {
      // The tabs are read afresh each time a tab is chosen, so a tab added since is watched too.
      watchTabs();
      const next = seatFor(strip);
      if (next !== null) scrollTo(next, slide);
      fade();
    },
    stop() {
      strip.removeEventListener('scroll', onScroll);
      strip.removeEventListener('touchstart', onTouchStart);
      strip.removeEventListener('touchend', onTouchEnd);
      strip.removeEventListener('touchcancel', onTouchEnd);
      strip.removeEventListener('wheel', onWheel);
      view?.removeEventListener('resize', fade);
      box?.disconnect();
      tabs?.disconnect();
    },
  };
}
