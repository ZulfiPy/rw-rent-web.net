import { useCallback } from 'react';
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import table from './table.module.css';

/**
 * A cell's own control keeps its behaviour: a click that lands inside one never opens the row.
 * `[data-no-row-nav]` opts an element out without being a control.
 */
const CONTROL =
  'a, button, input, select, textarea, label, [role="button"], [role="link"], [data-no-row-nav]';

/** A row click opens the record unless a control took it, a selection was being made, or it was handled. */
function opens(e: MouseEvent<HTMLElement>): boolean {
  if (e.defaultPrevented) return false;
  const el = e.target as HTMLElement | null;
  if (el && typeof el.closest === 'function' && el.closest(CONTROL)) return false;
  return !window.getSelection()?.toString();
}

export interface RowNavProps {
  className: string;
  onClick?: (e: MouseEvent<HTMLTableRowElement>) => void;
  onAuxClick?: (e: MouseEvent<HTMLTableRowElement>) => void;
  onMouseDown?: (e: MouseEvent<HTMLTableRowElement>) => void;
}

/**
 * Row navigation, as list vocabulary rather than a per-page fix: wherever the prototype's rows open
 * a record, the whole row is the click target its hover already promises — pointer cursor, a click
 * anywhere opening the record the row's own link opens, and a modifier or middle click opening it
 * in a new tab the way the link would.
 *
 * The row is deliberately not a link and takes no focus: the chevron (or the row's name link) stays
 * the real anchor, so keyboard and screen-reader users reach the record through it and hear one
 * link per row rather than a duplicated row-sized one.
 *
 * `const rowNav = useRowNav();` once per table, then `<tr {...rowNav(href)}>` — the helper carries
 * the row class, and a null target leaves the row inert.
 */
export function useRowNav(): (to: string | null | undefined) => RowNavProps {
  const navigate = useNavigate();
  return useCallback(
    (to: string | null | undefined): RowNavProps => {
      if (!to) return { className: table.row };
      const href = to;
      return {
        className: `${table.row} ${table.rowNav}`,
        onClick: (e) => {
          if (e.button !== 0 || !opens(e)) return;
          if (e.metaKey || e.ctrlKey || e.shiftKey) {
            window.open(href, '_blank', 'noopener');
            return;
          }
          navigate(href);
        },
        onAuxClick: (e) => {
          if (e.button !== 1 || !opens(e)) return;
          e.preventDefault();
          window.open(href, '_blank', 'noopener');
        },
        // Middle-press otherwise starts the browser's autoscroll before the new tab opens.
        onMouseDown: (e) => {
          if (e.button === 1 && opens(e)) e.preventDefault();
        },
      };
    },
    [navigate],
  );
}
