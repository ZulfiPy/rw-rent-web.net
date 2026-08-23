import { useQuery } from '@tanstack/react-query';
import { Route, Routes } from 'react-router-dom';
import { qk } from '@/api';
import { listUsers } from '@/api/users';
import { listSecurityAudit } from '@/api/securityAudit';
import { useAccess } from '@/permissions/usePermissions';
import { formatUtc } from '@/format';
import { eventLabel, USER_STATUS_LABEL } from '@/format/labels';
import styles from './App.module.css';

/**
 * DELIVERABLE A SMOKE SCREEN. Proves the api layer, the mock transport, the permission gate and the
 * formatting modules are wired. Deliverable B replaces this with the ported pages and routes.
 */
function Status() {
  const { me, can, isLoading } = useAccess();
  const directory = useQuery({
    queryKey: qk.users.list({ PageSize: 100 }),
    queryFn: () => listUsers({ PageSize: 100 }),
    enabled: can('Users.ReadDirectory'),
  });
  const audit = useQuery({
    queryKey: qk.audit.list({ PageSize: 5 }),
    queryFn: () => listSecurityAudit({ PageSize: 5 }),
    enabled: can('SecurityAudit.ReadCompany'),
  });

  if (isLoading) return <p className={styles.muted}>Loading /api/me…</p>;

  return (
    <div className={styles.grid}>
      <section className={styles.card}>
        <h2 className={styles.h2}>Signed in</h2>
        <p className={styles.body}>
          {me?.firstName} {me?.lastName} · <span className={styles.mono}>{me?.email}</span>
        </p>
        <p className={styles.muted}>{me?.permissions.length ?? 0} permissions from GET /api/me</p>
      </section>

      <section className={styles.card}>
        <h2 className={styles.h2}>User directory</h2>
        {can('Users.ReadDirectory') ? (
          <ul className={styles.list}>
            {directory.data?.items.map((u) => (
              <li key={u.id} className={styles.row}>
                <span>{u.firstName} {u.lastName}</span>
                <span className={styles.muted}>{USER_STATUS_LABEL[u.status]}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.muted}>Hidden — Users.ReadDirectory not held.</p>
        )}
      </section>

      <section className={styles.card}>
        <h2 className={styles.h2}>Security audit</h2>
        <p className={styles.muted}>Times in UTC</p>
        {can('SecurityAudit.ReadCompany') ? (
          <ul className={styles.list}>
            {audit.data?.items.map((row) => (
              <li key={row.id} className={styles.row}>
                <span>{eventLabel(row.eventType)}</span>
                <span className={styles.mono}>{formatUtc(row.occurredAtUtc)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.muted}>Hidden — SecurityAudit.ReadCompany not held.</p>
        )}
      </section>
    </div>
  );
}

export function App() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.h1}>RW-Rent</h1>
        <p className={styles.muted}>Phase 2 · deliverable A — api, mock, errors, formatting</p>
      </header>
      <Routes>
        <Route path="*" element={<Status />} />
      </Routes>
    </main>
  );
}
