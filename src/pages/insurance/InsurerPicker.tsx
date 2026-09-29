import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { InsurerListItemResponse } from '@/api/dto';
import { CHOOSE_INSURER, NOT_CHOSEN, NO_INSURERS, OUT_OF_USE, holdsFind } from '@/format';
import { Chip } from '@/ui/Chip';
import { invalidProps } from '@/ui/Field';
import styles from './InsurerPicker.module.css';

/**
 * The insurer picker of a case's form (Follow-up 18, F18-2d), for Our insurer and for The other
 * party's insurer, as the mock-up the owner approved has it. Closed, it shows the chosen insurer or
 * "Choose an insurer". Open, a find box with the focus, then Not chosen, then the insurers in use
 * whose names hold what is typed, the chosen one with a check; the case's own insurer of that side
 * stays offered and chosen even when it is out of use, marked so; and at the foot Add an insurer,
 * which opens the Add insurer window with what was typed. Arrows and Enter choose, Esc closes.
 *
 * The API decides whether an insurer may go on a case (INS-018): the picker only offers the ones that
 * can, and the refusal of one that could not lands under the picker all the same.
 */

/** What the picker needs of an insurer: the list's item, or a case's insurer. */
export type PickerInsurer = Pick<InsurerListItemResponse, 'id' | 'name' | 'isActive'>;

/** One line of the open list: Not chosen, an insurer, or Add an insurer at its foot. */
export type PickerItem =
  | { kind: 'none' }
  | { kind: 'insurer'; insurer: PickerInsurer }
  | { kind: 'add' };

/**
 * What the open picker offers for what is typed: Not chosen, the insurers in use whose names hold it
 * in the list's order, the case's own insurer of that side even out of use, and Add an insurer for
 * those who may add one. The list's own copy of the kept insurer wins: a rename shows at once.
 */
export function pickerItems(
  insurers: readonly PickerInsurer[],
  find: string,
  kept: PickerInsurer | null | undefined,
  canAdd: boolean,
): PickerItem[] {
  const offered = insurers.filter((insurer) => insurer.isActive || insurer.id === kept?.id);
  if (kept && !offered.some((insurer) => insurer.id === kept.id)) offered.push(kept);
  const shown = offered.filter((insurer) => holdsFind(insurer.name, find));
  return [
    { kind: 'none' },
    ...shown.map((insurer): PickerItem => ({ kind: 'insurer', insurer })),
    ...(canAdd ? [{ kind: 'add' } as const] : []),
  ];
}

/** The insurer a picker shows as chosen: from the list, or the case's own while the list loads. */
export function chosenInsurer(
  value: string,
  insurers: readonly PickerInsurer[] | undefined,
  kept: PickerInsurer | null | undefined,
): PickerInsurer | null {
  if (!value) return null;
  return insurers?.find((insurer) => insurer.id === value) ?? (kept?.id === value ? kept : null);
}

/** The line the arrows start from as the list opens: the chosen one, Not chosen when none is. */
export function chosenLine(items: readonly PickerItem[], value: string): number {
  const at = items.findIndex((item) => (item.kind === 'insurer' ? item.insurer.id === value : item.kind === 'none' && !value));
  return at < 0 ? 0 : at;
}

/** What a key in the find box does: move the line the arrows reach, choose it, or close the list. */
export type FindKeyAction = { move: number } | { choose: number } | { close: true } | { leave: true } | null;

/**
 * Arrows move through the lines, Not chosen first and Add an insurer last; Enter chooses the line
 * reached, and never sends the form around the picker; Esc closes the list; Tab closes it and moves on.
 */
export function findKey(key: string, active: number, count: number): FindKeyAction {
  const at = Math.min(active, count - 1);
  if (key === 'ArrowDown') return { move: Math.min(at + 1, count - 1) };
  if (key === 'ArrowUp') return { move: Math.max(at - 1, 0) };
  if (key === 'Enter') return { choose: at };
  if (key === 'Escape') return { close: true };
  if (key === 'Tab') return { leave: true };
  return null;
}

/** The mark of an insurer out of use, in the API's words, wherever one is shown. */
export function OutOfUseChip() {
  return <Chip tone="mute" dot="1px">{OUT_OF_USE}</Chip>;
}

export function InsurerPicker({
  label, value, insurers, kept, canAdd, error, onChange, onAdd, initialOpen = false, initialFind = '',
}: {
  /** The field's label, for the control's accessible name. */
  label: string;
  /** The chosen insurer's id, or '' for none. */
  value: string;
  /** The whole list, in use and out of use, in the list's order. */
  insurers: readonly PickerInsurer[] | undefined;
  /** The case's own insurer of this side, as the case was read: offered even out of use. */
  kept?: PickerInsurer | null;
  /** Whether the reader may add an insurer (`InsuranceCases.Manage`, which the form needs anyway). */
  canAdd: boolean;
  error?: string | undefined;
  onChange: (insurerId: string) => void;
  /** Add an insurer, with what was typed in the find box. */
  onAdd: (typed: string) => void;
  /** Opened, with a find typed: the render tests use them. */
  initialOpen?: boolean;
  initialFind?: string;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [find, setFind] = useState(initialFind);
  const [active, setActive] = useState(() => chosenLine(pickerItems(insurers ?? [], initialFind, kept, canAdd), value));
  const wrapper = useRef<HTMLDivElement | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const id = useId();
  const listId = `${id}-list`;
  const optionId = (index: number) => `${id}-option-${index}`;

  const list = insurers ?? [];
  const items = pickerItems(list, find, kept, canAdd);
  const chosen = chosenInsurer(value, insurers, kept);
  const nothingOnTheList = !list.length && !kept;
  const matches = items.filter((item) => item.kind === 'insurer').length;

  const openList = () => {
    setFind('');
    setOpen(true);
    setActive(chosenLine(pickerItems(list, '', kept, canAdd), value));
  };

  const close = (focusTrigger: boolean) => {
    setOpen(false);
    if (focusTrigger) trigger.current?.focus();
  };

  const choose = (item: PickerItem | undefined) => {
    if (!item) return;
    close(true);
    if (item.kind === 'add') onAdd(find.trim());
    else onChange(item.kind === 'insurer' ? item.insurer.id : '');
  };

  // The find box takes the focus as the list opens.
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  // The line the arrows reach stays in view.
  useEffect(() => {
    if (!open) return;
    document.getElementById(optionId(active))?.scrollIntoView?.({ block: 'nearest' });
  }, [open, active]); // eslint-disable-line react-hooks/exhaustive-deps

  // A press outside the picker closes it, leaving the focus where the press put it.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapper.current && !wrapper.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const onFindKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const action = findKey(e.key, active, items.length);
    if (!action) return;
    if ('leave' in action) {
      setOpen(false);
      return;
    }
    // Enter in the form's field would send the case, and Esc would close the dialog around it.
    e.preventDefault();
    e.stopPropagation();
    if ('move' in action) setActive(action.move);
    else if ('choose' in action) choose(items[action.choose]);
    else close(true);
  };

  const shown = chosen ? chosen.name : CHOOSE_INSURER;

  return (
    <div ref={wrapper} className={styles.picker}>
      <button
        ref={trigger}
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${shown}`}
        {...invalidProps(error)}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={(e) => {
          if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault();
            openList();
          }
        }}
      >
        <span className={`${styles.value} ${chosen ? '' : styles.placeholder}`}>{shown}</span>
        {chosen && !chosen.isActive ? <OutOfUseChip /> : null}
        <span data-icon aria-hidden="true" className={styles.caret}>expand_more</span>
      </button>

      {open ? (
        // A press inside the list keeps the focus in the find box.
        <div className={styles.popover} onMouseDown={(e) => { if (e.target !== input.current) e.preventDefault(); }}>
          <input
            ref={input}
            className={styles.find}
            type="text"
            role="combobox"
            aria-label={`Find ${label.toLowerCase()}`}
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={optionId(Math.min(active, items.length - 1))}
            placeholder="Find an insurer"
            autoComplete="off"
            maxLength={100}
            value={find}
            onChange={(e) => {
              setFind(e.target.value);
              // The first insurer that holds what is typed is the one Enter takes.
              const next = pickerItems(list, e.target.value, kept, canAdd);
              setActive(next.some((item) => item.kind === 'insurer') && e.target.value.trim() ? 1 : 0);
            }}
            onKeyDown={onFindKey}
          />
          <ul id={listId} role="listbox" aria-label={label} className={styles.options}>
            {items.map((item, index) => {
              const isActive = index === Math.min(active, items.length - 1);
              if (item.kind === 'add') return null;
              const selected = item.kind === 'none' ? !value : item.insurer.id === value;
              return (
                <li
                  key={item.kind === 'none' ? 'none' : item.insurer.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={selected}
                  data-active={isActive ? 'true' : undefined}
                  className={styles.option}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(item)}
                >
                  {item.kind === 'none' ? (
                    <span className={`${styles.optionName} ${styles.none}`}>{NOT_CHOSEN}</span>
                  ) : (
                    <>
                      <span className={styles.optionName}>{item.insurer.name}</span>
                      {item.insurer.isActive ? null : <OutOfUseChip />}
                    </>
                  )}
                  {selected ? <span data-icon aria-hidden="true" className={styles.check}>check</span> : null}
                </li>
              );
            })}
            {/* Above Add an insurer: that the list is empty, or that nothing on it holds what is typed. */}
            {nothingOnTheList ? (
              <li role="presentation" className={styles.empty}>{NO_INSURERS}</li>
            ) : find.trim() && !matches ? (
              <li role="presentation" className={styles.empty}>No insurer on the list holds “{find.trim()}”.</li>
            ) : null}
            {items.map((item, index) => {
              const isActive = index === Math.min(active, items.length - 1);
              if (item.kind !== 'add') return null;
              return (
                <li
                  key="add"
                  id={optionId(index)}
                  role="option"
                  aria-selected={false}
                  data-active={isActive ? 'true' : undefined}
                  className={`${styles.option} ${styles.add}`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(item)}
                >
                  <span data-icon aria-hidden="true" className={styles.addIcon}>add</span>
                  Add an insurer
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
