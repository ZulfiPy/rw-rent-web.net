import { useEffect, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { useCompanyName } from './app/useCompanyName';
import { consumeSessionEnd, getSessionEnd, subscribeSessionEnd } from './app/session';
import { useAccess } from './permissions/usePermissions';
import { UserDirectory } from './pages/users/UserDirectory';
import { UserRecord } from './pages/users/UserRecord';
import { Registrations } from './pages/registrations/Registrations';
import { SecurityAudit } from './pages/audit/SecurityAudit';
import { AuditEntry } from './pages/audit/AuditEntry';
import { Overview } from './pages/overview/Overview';
import { NeedsAttention } from './pages/overview/NeedsAttention';
import { InsuranceCases, Tasks } from './pages/simple/Placeholders';
import { Assignments } from './pages/fleet/Assignments';
import { AssignmentRecord } from './pages/fleet/AssignmentRecord';
import { Vehicles } from './pages/fleet/Vehicles';
import { VehicleRecord } from './pages/fleet/VehicleRecord';
import { Customers } from './pages/fleet/Customers';
import { CustomerRecord } from './pages/fleet/CustomerRecord';
import { Drivers } from './pages/fleet/Drivers';
import { DriverRecord } from './pages/fleet/DriverRecord';
import { CompanyProfile } from './pages/admin/CompanyProfile';
import { SystemAdministrator } from './pages/admin/SystemAdministrator';
import { SignIn } from './pages/account/SignIn';
import { Register } from './pages/account/Register';
import { ConfirmRegistrationEmail } from './pages/account/ConfirmRegistrationEmail';
import { ResetPassword } from './pages/account/ResetPassword';
import { ConfirmEmailChange } from './pages/account/ConfirmEmailChange';
import { AcceptAdministratorTransfer } from './pages/account/AcceptAdministratorTransfer';
import { Profile } from './pages/account/Profile';
import { AccessPending } from './pages/account/AccessPending';
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

/** A protected route while signed out: to the front door, remembering where the user was going. */
function RequireSession({ children }: { children: React.ReactNode }) {
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
        <Route path="/overview" element={<Overview />} />
        <Route path="/needs-attention" element={<NeedsAttention />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/insurance-cases" element={<InsuranceCases />} />
        <Route path="/rental-assignments" element={<Assignments />} />
        <Route path="/rental-assignments/:assignmentId" element={<AssignmentRecord />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/vehicles/:vehicleId" element={<VehicleRecord />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:customerId" element={<CustomerRecord />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/drivers/:driverId" element={<DriverRecord />} />
        <Route path="/users" element={<UserDirectory />} />
        <Route path="/users/:userId" element={<UserRecord />} />
        <Route path="/registrations" element={<Registrations />} />
        <Route path="/company" element={<CompanyProfile />} />
        <Route path="/system-administrator" element={<SystemAdministrator />} />
        <Route path="/security-audit" element={<SecurityAudit />} />
        <Route path="/security-audit/:entryId" element={<AuditEntry />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/overview" replace />} />
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
