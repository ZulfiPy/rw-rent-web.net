import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { useCompanyName } from './app/useCompanyName';
import { useAccess } from './permissions/usePermissions';
import { UserDirectory } from './pages/users/UserDirectory';
import { UserRecord } from './pages/users/UserRecord';
import { DevPanel } from './dev/DevPanel';
import styles from './App.module.css';

/** Active, but the account holds no permissions: the prototype's Access pending state. */
function AccessPending() {
  const { me } = useAccess();
  return (
    <main className={styles.centre}>
      <div className={styles.card}>
        <span data-icon aria-hidden="true" className={styles.icon}>hourglass_top</span>
        <h1 className={styles.title}>Access pending</h1>
        <p className={styles.body}>
          Your account is active, but no permissions have been granted yet. An administrator assigns
          a role before the workspace opens.
        </p>
        <p className={styles.mail}>{me?.email}</p>
      </div>
    </main>
  );
}

export function App() {
  const { me, isLoading } = useAccess();
  const companyName = useCompanyName();

  return (
    <>
      {isLoading ? (
        <main className={styles.centre}><p className={styles.body}>Loading…</p></main>
      ) : me && me.permissions.length === 0 ? (
        <AccessPending />
      ) : (
        <Routes>
          <Route element={<AppShell companyName={companyName} />}>
            <Route path="/users" element={<UserDirectory />} />
            <Route path="/users/:userId" element={<UserRecord />} />
            <Route path="*" element={<Navigate to="/users" replace />} />
          </Route>
        </Routes>
      )}
      {import.meta.env.DEV ? <DevPanel /> : null}
    </>
  );
}
