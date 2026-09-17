import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { ROUTES } from './app/routes';
import { useCompanyName } from './app/useCompanyName';
import { consumeSessionEnd, getSessionEnd, subscribeSessionEnd } from './app/session';
import { useAccess } from './permissions/usePermissions';
import type { Permission } from './permissions/permissions';
import { SignIn } from './pages/account/SignIn';
import { Register } from './pages/account/Register';
import { ConfirmRegistrationEmail } from './pages/account/ConfirmRegistrationEmail';
import { ResetPassword } from './pages/account/ResetPassword';
import { ConfirmEmailChange } from './pages/account/ConfirmEmailChange';
import { AcceptAdministratorTransfer } from './pages/account/AcceptAdministratorTransfer';
import { Profile } from './pages/account/Profile';
import { AccessPending } from './pages/account/AccessPending';
import { EmptyState } from './ui/EmptyState';
import styles from './App.module.css';

function Unreachable({ message }: { message: string }) {
  return (
    <main className={styles.centre}>
      <div className={styles.card}>
        <span data-icon aria-hidden="true" className={styles.icon}>cloud_off</span>
        <h1 className={styles.title}>The API did not answer</h1>
        <p className={styles.body}>
          The app could not reach the RW-Rent API. Start it and reload this page.
        </p>
        <p className={styles.mail}>{message}</p>
      </div>
    </main>
  );
}

/**
 * The single consumer of the session-end signal (§6.4): clear the cache, open the sign-in page
 * with its message, and keep the path so the user comes back to where they were.
 */
function SessionWatcher() {
  const signal = useSyncExternalStore(subscribeSessionEnd, getSessionEnd, getSessionEnd);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!signal) return;
    const { returnTo } = signal;
    consumeSessionEnd();
    void queryClient.resetQueries();
    navigate('/sign-in', { state: { from: returnTo, sessionEnded: true }, replace: true });
  }, [signal, navigate, queryClient]);

  return null;
}

/**
 * The permission gate (T-001, and the review of Follow-up 4).
 *
 * It is handed the permission of the route that matched, and never looks at the address. That is
 * the whole correction: the first version read the raw first path segment, while the router matches
 * without regard to letter case and after decoding — so a differently spelled address reached the
 * page and the lookup found nothing to require. Here there is nothing to spell; the permission
 * arrives with the element, from `ROUTES`.
 *
 * The guarded page is never rendered without the permission, so no request goes out and no content
 * sits behind the lock. The state is the one a refused list already shows, inside the shell.
 */
function Guarded({ permission, children }: { permission: Permission | null; children: ReactNode }) {
  const { can } = useAccess();

  if (permission && !can(permission)) {
    return (
      <EmptyState
        icon="lock"
        title="Not available to you"
        body={`Opening this page needs ${permission}.`}
      />
    );
  }

  return <>{children}</>;
}

/** A protected route while signed out: to the front door, remembering where the user was going. */
function RequireSession({ children }: { children: ReactNode }) {
  const { status } = useAccess();
  const location = useLocation();

  if (status === 'loading') {
    return <main className={styles.centre}><p className={styles.body}>Loading…</p></main>;
  }
  if (status === 'signed-out') {
    return <Navigate to="/sign-in" state={{ from: `${location.pathname}${location.search}` }} replace />;
  }
  return <>{children}</>;
}

/** Everything behind the shell, once a session and its permissions are known. */
function Workspace() {
  const { me } = useAccess();
  const companyName = useCompanyName();

  /*
   * An Active account with no permissions: the prototype's Access pending route, inside the shell
   * whose navigation is empty for them, with their own account reachable from the account button.
   */
  if (me && me.permissions.length === 0) {
    return (
      <Routes>
        <Route element={<AppShell companyName={companyName} />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<AccessPending />} />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppShell companyName={companyName} />}>
        {ROUTES.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={<Guarded permission={route.permission}>{route.element}</Guarded>}
          />
        ))}
      </Route>
    </Routes>
  );
}

export function App() {
  const { status, error } = useAccess();

  if (status === 'unreachable') return <Unreachable message={error ?? ''} />;

  return (
    <>
      <SessionWatcher />
      <Routes>
        {/* The public routes render in every session state; the backend's emails link to them. */}
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/register" element={<Register />} />
        <Route path="/confirm-registration-email" element={<ConfirmRegistrationEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/confirm-email-change" element={<ConfirmEmailChange />} />
        <Route path="/accept-administrator-transfer" element={<AcceptAdministratorTransfer />} />
        <Route path="*" element={<RequireSession><Workspace /></RequireSession>} />
      </Routes>
    </>
  );
}
