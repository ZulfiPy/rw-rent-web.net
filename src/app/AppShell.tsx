import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAccess } from '@/permissions/usePermissions';
import { primaryRoleLabel } from '@/format/labels';
import { useOpenWork } from '@/pages/overview/useOpenWork';
import { Chip } from '@/ui/Chip';
import { NAV_GROUPS, type NavItem } from './routes';
import { PageHeaderProvider, type PageHeaderModel } from './pageHeader';
import { useSignOut } from './useSignOut';
import { useRailMode } from './useViewport';
import { themeIcon, themeLabel, themeTip, toggleTheme, useTheme } from './theme';
import styles from './AppShell.module.css';

/**
 * The prototype's identifier row: the record's own id and a copy button. The prototype confirms the
 * copy with a toast; there is no toast surface here, so the button says so itself.
 */
function HeaderId({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard?.writeText(value)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setCopied(false));
  };
  return (
    <div className={styles.idRow}>
      <span className={styles.idValue}>{value}</span>
      <button type="button" className={styles.idCopy} title="Copy identifier" onClick={copy}>
        <span data-icon aria-hidden="true" className={styles.idCopyIcon}>
          {copied ? 'check' : 'content_copy'}
        </span>
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

/** The prototype's breadcrumb row: a single crumb carries a leading chevron. */function Breadcrumb({ crumbs }: { crumbs: PageHeaderModel['crumbs'] }) {
  const last = crumbs.length - 1;
  return (
    <nav aria-label="Breadcrumb" className={styles.crumbs}>
      {crumbs.map((c, i) => (
        <span key={`${c.label}-${i}`} className={styles.crumb}>
          {crumbs.length === 1 ? (
            <span data-icon aria-hidden="true" className={styles.crumbSep}>chevron_right</span>
          ) : null}
          {i === last ? (
            <span aria-current="page" className={styles.crumbLast}>{c.label}</span>
          ) : c.to ? (
            <Link to={c.to} className={styles.crumbLink}>{c.label}</Link>
          ) : (
            <span className={styles.crumbPlain}>{c.label}</span>
          )}
          {i === last ? null : (
            <span data-icon aria-hidden="true" className={styles.crumbSep}>chevron_right</span>
          )}
        </span>
      ))}
    </nav>
  );
}

const NAV_KEY = 'rwrent.nav';

/** The prototype's `nav` state: 'auto' follows the viewport, an explicit choice overrides it. */
function useNavChoice() {
  const [choice, setChoice] = useState<'auto' | 'expanded' | 'collapsed'>(() => {
    try {
      const stored = localStorage.getItem(NAV_KEY);
      return stored === 'expanded' || stored === 'collapsed' ? stored : 'auto';
    } catch {
      return 'auto';
    }
  });
  const set = (next: 'auto' | 'expanded' | 'collapsed') => {
    setChoice(next);
    try {
      localStorage.setItem(NAV_KEY, next);
    } catch {
      /* private mode */
    }
  };
  return [choice, set] as const;
}

export function AppShell({ companyName }: { companyName: string }) {
  const { me, can } = useAccess();
  const mode = useRailMode();
  const theme = useTheme();
  const [choice, setChoice] = useNavChoice();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const work = useOpenWork();

  useEffect(() => setDrawerOpen(false), [location.pathname, location.search]);

  const signOut = useSignOut();

  // Narrow keeps the drawer expanded; wider follows the persona's choice, defaulting to the viewport.
  const narrow = mode === 'drawer';
  const expanded = narrow || (choice === 'auto' ? mode === 'expanded' : choice === 'expanded');

  const badge = (kind: NavItem['badge']) => {
    if (kind === 'queue') return work.items.length || undefined;
    if (kind === 'registrations') return work.pendingRegistrations || undefined;
    return undefined;
  };

  /*
   * The prototype's `navModel()`: an account with no effective permission has no navigation at all
   * — not even the ungated entries — because every destination behind them is Access pending.
   */
  const groups = me && me.permissions.length === 0
    ? []
    : NAV_GROUPS
      .map((g) => ({ ...g, items: g.items.filter((i) => !i.permission || can(i.permission)) }))
      .filter((g) => g.items.length > 0);

  const roleLabel = me ? primaryRoleLabel(me.roles) : '';
  const initials = me ? `${me.firstName[0] ?? ''}${me.lastName[0] ?? ''}`.toUpperCase() : '—';

  const rail = (
    <aside
      className={styles.rail}
      data-mode={narrow ? 'drawer' : expanded ? 'expanded' : 'collapsed'}
      aria-label="Primary navigation"
    >
      <div className={styles.head}>
        <svg viewBox="470 187 1060 1125" role="img" aria-label="RW-Rent" className={styles.logo}>
          <path d="M936.6,846.6l-68.2-58.4l62.6-11.9c5.8-1.1,10-6.2,10-12V204.1c0-4.9-2.9-9.3-7.4-11.3c-4.5-1.9-9.7-1-13.3,2.4l-442.3,424c-2.4,2.3-3.8,5.5-3.8,8.8v367.1c0,3.3,1.3,6.3,3.6,8.6l70.1,70.4c3.5,3.5,8.7,4.6,13.3,2.7c4.6-1.9,7.6-6.3,7.6-11.3l0.3-416.6l282.7-268.4v310.8L698,747.7c-4.2,1.5-7.2,5.2-7.9,9.6s1,8.8,4.5,11.5l151.7,120v344.4c0,3.5,1.5,6.8,4.1,9.2l70.1,62.1c2.3,2,5.2,3.1,8.1,3.1c1.7,0,3.4-0.4,5.1-1.1c4.4-2,7.2-6.3,7.2-11.2l0-439.5C940.9,852.3,939.3,848.9,936.6,846.6z" />
          <path d="M1521.1,595.6c-3.9-3-9-3.4-13.3-1.1l-76.5,41.3c-3,1.6-5.2,4.4-6,7.7l-60,227.9l-140.7-194.2c-2.6-3.5-6.7-5.4-11-5c-4.3,0.4-8,3-9.9,6.9l-138.7,288.6V283c0-2.8-1-5.5-2.7-7.7l-59.3-73.2c-3.3-4.1-8.6-5.6-13.6-3.8c-5,1.8-8.2,6.3-8.2,11.5v1086.2c0,5.8,4,10.7,9.6,11.9c0.9,0.2,1.8,0.3,2.7,0.3c4.7,0,9-2.7,11.1-7.1l221.3-479l171.1,239c2.8,4,7.5,5.8,12.3,4.9c4.8-0.9,8.4-4.5,9.5-9.2l106.8-448.6C1526.7,603.4,1525,598.6,1521.1,595.6z" />
        </svg>
        {expanded ? (
          <div className={styles.brand}>
            <span className={styles.mark}>RW-Rent</span>
            <span className={styles.company}>{companyName}</span>
          </div>
        ) : null}
        {narrow ? (
          <button type="button" className={styles.close} aria-label="Close navigation" onClick={() => setDrawerOpen(false)}>
            <span data-icon aria-hidden="true">close</span>
          </button>
        ) : null}
      </div>

      <nav className={styles.nav}>
        {groups.map((group, index) => (
          <div key={group.label} className={styles.group}>
            {expanded ? <div className={styles.groupLabel}>{group.label}</div> : null}
            {!expanded && index > 0 ? <div className={styles.rule} /> : null}
            {group.items.map((item) => {
              const count = badge(item.badge);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={styles.item}
                  title={expanded ? undefined : item.label}
                  aria-label={item.label}
                >
                  <span data-icon aria-hidden="true" className={styles.itemIcon}>{item.icon}</span>
                  {expanded ? <span className={styles.itemLabel}>{item.label}</span> : null}
                  {expanded && count ? <span className={styles.badge}>{count}</span> : null}
                  <span aria-hidden="true" className={styles.mark2} />
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={styles.foot}>
        <Link
          to="/profile"
          className={styles.util}
          title="Your profile and sessions"
          aria-label="Your profile and sessions"
        >
          <span className={styles.initials}>{initials}</span>
          {expanded ? (
            <span className={styles.who}>
              <span className={styles.name}>{me ? `${me.firstName} ${me.lastName}` : '—'}</span>
              <span className={styles.role}>{roleLabel}</span>
            </span>
          ) : null}
        </Link>
        <button
          type="button"
          className={styles.util}
          title={themeTip(theme)}
          aria-label={themeTip(theme)}
          onClick={toggleTheme}
        >
          <span data-icon aria-hidden="true" className={styles.utilIcon}>{themeIcon(theme)}</span>
          {expanded ? <span className={styles.utilLabel}>{themeLabel(theme)}</span> : null}
        </button>
        <button
          type="button"
          className={`${styles.util} ${styles.signOut}`}
          title="Sign out"
          aria-label="Sign out"
          onClick={() => signOut.mutate()}
        >
          <span data-icon aria-hidden="true" className={styles.utilIcon}>logout</span>
          {expanded ? <span className={styles.utilLabel}>Sign out</span> : null}
        </button>
        {narrow ? null : (
          <button
            type="button"
            className={`${styles.util} ${styles.toggle}`}
            title={expanded ? 'Collapse navigation' : 'Expand navigation'}
            aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
            aria-expanded={expanded}
            onClick={() => setChoice(expanded ? 'collapsed' : 'expanded')}
          >
            <span data-icon aria-hidden="true" className={styles.utilIcon}>
              {expanded ? 'menu_open' : 'menu'}
            </span>
            {expanded ? <span className={styles.utilLabel}>Collapse menu</span> : null}
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <div className={styles.shell}>
      {narrow && drawerOpen ? <div className={styles.scrim} onClick={() => setDrawerOpen(false)} /> : null}
      {narrow ? <div className={styles.drawer} data-open={drawerOpen}>{rail}</div> : rail}

      <PageHeaderProvider>
        {(header) => (
          <div className={styles.main}>
            <header className={styles.headerBar}>
              <div className={styles.crumbRow}>
                {narrow ? (
                  <button type="button" className={styles.menu} aria-label="Open navigation" onClick={() => setDrawerOpen(true)}>
                    <span data-icon aria-hidden="true">menu</span>
                  </button>
                ) : null}
                {header ? <Breadcrumb crumbs={header.crumbs} /> : null}
              </div>
              {header ? (
                <div className={styles.headerRow}>
                  <div className={styles.titleBlock}>
                    <div className={styles.titleLine}>
                      <h1 className={styles.h1} data-mono={header.mono ? 'true' : undefined}>{header.title}</h1>
                      {header.badges?.length ? (
                        <span className={styles.badges}>
                          {header.badges.map((b) => (
                            <Chip key={b.label} tone={b.tone} dot={b.dot} size="badge">{b.label}</Chip>
                          ))}
                        </span>
                      ) : null}
                    </div>
                    {header.code ? <p className={styles.headerCode}>{header.code}</p> : null}
                    {header.description ? <p className={styles.headerDesc}>{header.description}</p> : null}
                    {header.pageId ? <HeaderId value={header.pageId} /> : null}
                  </div>
                  {header.actions ? <div className={styles.headerActions}>{header.actions}</div> : null}
                </div>
              ) : null}
            </header>
            <div className={styles.scroll}>
              <div className={styles.content}><Outlet /></div>
            </div>
          </div>
        )}
      </PageHeaderProvider>
    </div>
  );
}
