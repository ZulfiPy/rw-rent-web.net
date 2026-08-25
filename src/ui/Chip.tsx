import type { ReactNode } from 'react';
import styles from './Chip.module.css';
import type { Tone } from './status';

/** `dot` is a border-radius: the marker's shape encodes the state alongside its colour. */
export function Chip({ tone = 'plain', dot, size, children }: {
  tone?: Tone;
  dot?: string;
  /** The prototype's larger cuts: the page-header badge and the record hero's state chip. */
  size?: 'badge' | 'hero';
  children: ReactNode;
}) {
  return (
    <span className={styles.chip} data-tone={tone} data-size={size}>
      {dot ? <span className={styles.dot} style={{ borderRadius: dot }} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
