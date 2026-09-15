import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import appStyles from '../../App.module.css';
import styles from './Account.module.css';

export { styles as accountStyles };

export type AlertTone = 'bad' | 'warn' | 'ok' | 'info';

/** The alert block of the dialogs, used inline above a form or on its own as an outcome. */
export function AccountAlert({ tone, title, children }: {
  tone: AlertTone;
  title?: string;
  children: ReactNode;
}) {
  const icon = tone === 'ok' ? 'check_circle' : tone === 'warn' ? 'warning' : tone === 'info' ? 'info' : 'error';
  return (
    <p className={styles.alert} data-tone={tone} role={tone === 'bad' ? 'alert' : undefined}>
      <span data-icon aria-hidden="true" className={styles.alertIcon}>{icon}</span>
      <span className={styles.alertText}>
        {title ? <strong className={styles.alertTitle}>{title}</strong> : null}
        {children}
      </span>
    </p>
  );
}

/** A text link that sits with the others under the primary action. */
export function AccountLink({ to, label }: { to: string; label: string }) {
  return <Link className={styles.link} to={to}>{label}</Link>;
}

/**
 * Every standalone account screen: the app's centred card on the page background, the wordmark,
 * a title in the display face, one column of content. The document title follows the screen so a
 * browser tab and the back list stay readable.
 */
export function AccountLayout({ title, intro, documentTitle, children, links }: {
  title: string;
  intro?: ReactNode;
  documentTitle?: string;
  /** Some outcomes are the title and the intro alone. */
  children?: ReactNode;
  links?: ReactNode;
}) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${documentTitle ?? title} · RW-Rent`;
    return () => { document.title = previous; };
  }, [documentTitle, title]);

  return (
    <main className={appStyles.centre}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <svg viewBox="470 187 1060 1125" role="img" aria-label="RW-Rent" className={styles.logo}>
            <path d="M936.6,846.6l-68.2-58.4l62.6-11.9c5.8-1.1,10-6.2,10-12V204.1c0-4.9-2.9-9.3-7.4-11.3c-4.5-1.9-9.7-1-13.3,2.4l-442.3,424c-2.4,2.3-3.8,5.5-3.8,8.8v367.1c0,3.3,1.3,6.3,3.6,8.6l70.1,70.4c3.5,3.5,8.7,4.6,13.3,2.7c4.6-1.9,7.6-6.3,7.6-11.3l0.3-416.6l282.7-268.4v310.8L698,747.7c-4.2,1.5-7.2,5.2-7.9,9.6s1,8.8,4.5,11.5l151.7,120v344.4c0,3.5,1.5,6.8,4.1,9.2l70.1,62.1c2.3,2,5.2,3.1,8.1,3.1c1.7,0,3.4-0.4,5.1-1.1c4.4-2,7.2-6.3,7.2-11.2l0-439.5C940.9,852.3,939.3,848.9,936.6,846.6z" />
            <path d="M1521.1,595.6c-3.9-3-9-3.4-13.3-1.1l-76.5,41.3c-3,1.6-5.2,4.4-6,7.7l-60,227.9l-140.7-194.2c-2.6-3.5-6.7-5.4-11-5c-4.3,0.4-8,3-9.9,6.9l-138.7,288.6V283c0-2.8-1-5.5-2.7-7.7l-59.3-73.2c-3.3-4.1-8.6-5.6-13.6-3.8c-5,1.8-8.2,6.3-8.2,11.5v1086.2c0,5.8,4,10.7,9.6,11.9c0.9,0.2,1.8,0.3,2.7,0.3c4.7,0,9-2.7,11.1-7.1l221.3-479l171.1,239c2.8,4,7.5,5.8,12.3,4.9c4.8-0.9,8.4-4.5,9.5-9.2l106.8-448.6C1526.7,603.4,1525,598.6,1521.1,595.6z" />
          </svg>
          <span className={styles.mark}>RW-Rent</span>
        </div>
        <div className={styles.head}>
          <h1 className={styles.title}>{title}</h1>
          {intro ? <p className={styles.intro}>{intro}</p> : null}
        </div>
        {children}
        {links ? <div className={styles.links}>{links}</div> : null}
      </div>
    </main>
  );
}
