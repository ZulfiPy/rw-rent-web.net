import { fieldStyles as f, invalidProps } from './Field';

/**
 * The prototype's checkbox card: a decision a dialog asks for in words, locked when a rule fixes
 * it. Lifted from the assignment dialogs for the Delete records dialog's "I understand this cannot
 * be undone" (Follow-up 8); both use this one. `error`, when the API refused the tick, marks the box
 * invalid, so the dialog brings it into view; the message itself is the dialog's to write.
 */
export function CheckCard({ label, hint, checked, locked, error, onChange }: {
  label: string;
  hint: string;
  checked: boolean;
  locked?: boolean;
  error?: string | undefined;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className={f.card} data-checked={checked} data-locked={locked ? 'true' : undefined}>
      <input type="checkbox" {...invalidProps(error)} checked={checked} disabled={locked} onChange={(e) => onChange(e.target.checked)} />
      <span className={f.cardBody}>
        <span className={f.cardTitle}>{label}</span>
        <span className={f.cardHint}>{hint}</span>
      </span>
    </label>
  );
}
