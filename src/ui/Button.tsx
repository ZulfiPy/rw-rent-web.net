import styles from './Button.module.css';

export type ButtonTone =
  | 'default' | 'primary' | 'danger' | 'danger-solid' | 'warn' | 'ok' | 'info' | 'ghost';

/**
 * `blockedReason` is the disable-with-reason case: an action the persona holds the permission for
 * but the record's state refuses. An action they can never perform is not rendered at all.
 */
export function Button({ label, icon, tone = 'default', small, row, compact, blockedReason, hint, busy, onClick, type = 'button' }: {
  label: string;
  icon?: string | undefined;
  tone?: ButtonTone;
  small?: boolean;
  /** A panel table's row action: the prototype's transparent, tone-coloured button. */
  row?: boolean;
  /** Icon only, label on the element: for a row of actions in a folded table cell. */
  compact?: boolean;
  blockedReason?: string | null;
  /** A tooltip on an action that stays available — the prototype's tip without the refusal. */
  hint?: string;
  busy?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) {
  const disabled = !!blockedReason || !!busy;
  const iconOnly = !!compact && !!icon;
  return (
    <button
      type={type}
      data-tone={tone}
      className={[
        styles.button,
        small ? styles.small : '',
        row ? styles.row : '',
        iconOnly ? styles.iconOnly : '',
      ].filter(Boolean).join(' ')}
      disabled={disabled}
      aria-label={iconOnly ? label : undefined}
      title={blockedReason ?? hint ?? (iconOnly ? label : undefined)}
      onClick={onClick}
    >
      {icon ? <span data-icon aria-hidden="true" className={styles.icon}>{icon}</span> : null}
      {iconOnly ? null : busy ? 'Working…' : label}
    </button>
  );
}
