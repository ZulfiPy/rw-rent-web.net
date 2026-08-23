import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAccess } from '@/permissions/usePermissions';
import type { Permission } from '@/permissions/permissions';
import styles from './AppShell.module.css';

interface NavItem { to: string; label: string; icon: string; permission: Permission }

/**
 * The sidebar carries only screens that exist. Registrations and Security audit join this list as
 * they land; a permission the persona lacks removes its item entirely rather than disabling it.
 */
const NAV: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Users & access',
    items: [
      { to: '/users', label: 'User directory', icon: 'group', permission: 'Users.ReadDirectory' },
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
  const [theme, setTheme] = useTheme();

  const groups = NAV
    .map((g) => ({ ...g, items: g.items.filter((i) => can(i.permission)) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className={styles.shell}>
      <aside className={styles.rail}>
        <div className={styles.brand}>
          <span className={styles.mark}>RW-Rent</span>
          <span className={styles.company}>{companyName}</span>
        </div>

        <nav className={styles.nav} aria-label="Sections">
          {groups.map((group) => (
            <div key={group.label} className={styles.group}>
              <span className={styles.groupLabel}>{group.label}</span>
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to} className={styles.item}>
                  <span data-icon aria-hidden="true" className={styles.itemIcon}>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.identity}>
          <span className={styles.who}>
            <span className={styles.name}>{me ? `${me.firstName} ${me.lastName}` : '—'}</span>
            <span className={styles.mail}>{me?.email ?? ''}</span>
          </span>
          <button
            type="button"
            className={styles.theme}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <span data-icon aria-hidden="true">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            {theme === 'dark' ? 'Light theme' : 'Dark theme'}
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
