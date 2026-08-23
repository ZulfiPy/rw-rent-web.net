import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { FailureMode } from '@/mock/failures';
import { getDevState, setDevState } from './devState';
import styles from './DevPanel.module.css';

/**
 * The prototype's PROTOTYPE panel. Dev-only, rendered behind import.meta.env.DEV, and it touches
 * nothing but the mock: the persona swaps the /me response, the failure mode arms the next mutation.
 * Labels are declared here (not imported from the mock) so no mock module reaches the bundle.
 */
const PERSONAS: Array<[id: string, label: string]> = [
  ['u1', 'System Administrator'],
  ['u2', 'Company Principal'],
  ['u4', 'Fleet Manager'],
  ['u5', 'Viewer'],
  ['u0', 'Active, no permissions'],
];

const MODES: Array<[FailureMode, string]> = [
  ['none', 'None — succeed'],
  ['fields', 'Field errors'],
  ['conflict', 'Conflict (409)'],
  ['stale', 'Stale record (409)'],
];

export function DevPanel() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState(getDevState);
  const queryClient = useQueryClient();

  const update = (patch: Partial<typeof state>) => {
    setDevState(patch);
    setState(getDevState());
    // A different persona is a different /me, so every cached answer is re-fetched.
    if (patch.personaId) void queryClient.invalidateQueries();
  };

  if (!open) {
    return (
      <button type="button" className={styles.launcher} onClick={() => setOpen(true)}>
        <span data-icon aria-hidden="true">tune</span>Prototype
      </button>
    );
  }

  return (
    <div className={styles.panel} role="dialog" aria-label="Prototype controls">
      <div className={styles.head}>
        <span className={styles.title}>Prototype</span>
        <button type="button" className={styles.close} aria-label="Close" onClick={() => setOpen(false)}>
          <span data-icon aria-hidden="true">close</span>
        </button>
      </div>

      <div className={styles.group}>
        <span className={styles.label}>Signed in as</span>
        {PERSONAS.map(([id, label]) => (
          <label key={id} className={styles.option}>
            <input
              type="radio"
              name="persona"
              checked={state.personaId === id}
              onChange={() => update({ personaId: id })}
            />
            {label}
          </label>
        ))}
      </div>

      <div className={styles.group}>
        <span className={styles.label}>Next action fails as</span>
        <select
          className={styles.select}
          value={state.nextFailure}
          onChange={(e) => update({ nextFailure: e.target.value as FailureMode })}
        >
          {MODES.map(([mode, label]) => <option key={mode} value={mode}>{label}</option>)}
        </select>
        <p className={styles.note}>Consumed by the next mutation, then reset.</p>
      </div>
    </div>
  );
}
