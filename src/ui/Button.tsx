import styles from './Button.module.css';

export type ButtonTone = 'default' | 'primary' | 'danger' | 'warn' | 'ghost';

/**
 * `blockedReason` is the disable-with-reason case: an action the persona holds the permission for
 * but the record's state refuses. An action they can never perform is not rendered at all.
 */
export function Button({ label, icon, tone = 'default', small, blockedReason, busy, onClick, type = 'button' }: {
  label: string;
  icon?: string;
  tone?: ButtonTone;
  small?: boolean;
  blockedReason?: string | null;
  busy?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) {
  const disabled = !!blockedReason || !!busy;
  return (
    <button
      type={type}
      data-tone={tone}
      className={`${styles.button} ${small ? styles.small : ''}`}
      disabled={disabled}
      title={blockedReason ?? undefined}
      onClick={onClick}
    >
      {icon ? <span data-icon aria-hidden="true" className={styles.icon}>{icon}</span> : null}
      {busy ? 'Working…' : label}
    </button>
  );
}
