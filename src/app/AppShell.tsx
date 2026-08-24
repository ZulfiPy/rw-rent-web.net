import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAccess } from '@/permissions/usePermissions';
import type { Permission } from '@/permissions/permissions';
import { primaryRoleLabel } from '@/format/labels';
import { useTier } from './useViewport';
import styles from './AppShell.module.css';

/** A nav item with no permission is open to every signed-in persona (the overview pair). */
interface NavItem { to: string; label: string; icon: string; permission?: Permission }

/**
 * The sidebar carries only screens that exist. A permission the persona lacks removes its item
 * entirely rather than disabling it.
 */
const NAV: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Overview',
    items: [
      { to: '/overview', label: 'Overview', icon: 'space_dashboard' },
      { to: '/needs-attention', label: 'Needs attention', icon: 'flag' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/rental-assignments', label: 'Rental assignments', icon: 'assignment', permission: 'RentalAssignments.Read' },
      { to: '/vehicles', label: 'Vehicles', icon: 'directions_car', permission: 'Vehicles.Read' },
      { to: '/customers', label: 'Customers', icon: 'badge', permission: 'Customers.Read' },
      { to: '/drivers', label: 'Drivers', icon: 'id_card', permission: 'Drivers.Read' },
    ],
  },
  {
    label: 'Users & access',
    items: [
      { to: '/users', label: 'User directory', icon: 'group', permission: 'Users.ReadDirectory' },
      { to: '/registrations', label: 'Registrations', icon: 'how_to_reg', permission: 'Users.ReviewRegistrations' },
      { to: '/security-audit', label: 'Security audit', icon: 'policy', permission: 'SecurityAudit.ReadCompany' },
    ],
  },
];

const THEME_KEY = 'rwrent.theme';

function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* private mode */
    }
  }, [theme]);
  return [theme, setTheme] as const;
}

export function AppShell({ companyName }: { companyName: string }) {
  const { me, can } = useAccess();
  const tier = useTier();
  const [theme, setTheme] = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setDrawerOpen(false), [location.pathname, location.search]);

  const groups = NAV
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.permission || can(i.permission)) }))
    .filter((g) => g.items.length > 0);

  const icons = tier === 'tablet';
  const roleLabel = me ? primaryRoleLabel(me.roles) : '';

  const rail = (
    <aside className={styles.rail} data-mode={icons ? 'icons' : undefined}>
      <div className={styles.brand}>
        <span className={styles.mark}>{icons ? 'RW' : 'RW-Rent'}</span>
        <span className={styles.company}>{companyName}</span>
      </div>

      <nav className={styles.nav} aria-label="Sections">
        {groups.map((group) => (
          <div key={group.label} className={styles.group}>
            <span className={styles.groupLabel}>{group.label}</span>
            {group.items.map((item) => (
              <NavLink key={item.to} to={item.to} className={styles.item} title={item.label}>
                <span data-icon aria-hidden="true" className={styles.itemIcon}>{item.icon}</span>
                <span className={styles.itemLabel}>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className={styles.identity}>
        <span className={styles.who}>
          <span className={styles.name}>{me ? `${me.firstName} ${me.lastName}` : '—'}</span>
          <span className={styles.role}>{roleLabel}</span>
        </span>
        <button
          type="button"
          className={styles.theme}
          title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <span data-icon aria-hidden="true">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          <span className={styles.themeLabel}>{theme === 'dark' ? 'Light theme' : 'Dark theme'}</span>
        </button>
      </div>
    </aside>
  );

  if (tier === 'phone') {
    return (
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menu}
            aria-label="Open navigation"
            onClick={() => setDrawerOpen(true)}
          >
            <span data-icon aria-hidden="true">menu</span>
          </button>
          <span className={styles.topbarBrand}>
            <span className={styles.mark}>RW-Rent</span>
            <span className={styles.company}>{companyName}</span>
          </span>
        </header>

        {drawerOpen ? (
          <>
            <div className={styles.scrim} onClick={() => setDrawerOpen(false)} />
            <div className={styles.drawer}>{rail}</div>
          </>
        ) : null}

        <div className={styles.main}>
          <div className={styles.content}><Outlet /></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      {rail}
      <div className={styles.main}>
        <div className={styles.content}><Outlet /></div>
      </div>
    </div>
  );
}
