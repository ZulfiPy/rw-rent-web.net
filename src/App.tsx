import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { useCompanyName } from './app/useCompanyName';
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
            <Route path="/security-audit" element={<SecurityAudit />} />
            <Route path="/security-audit/:entryId" element={<AuditEntry />} />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Route>
        </Routes>
      )}
      {import.meta.env.DEV ? <DevPanel /> : null}
    </>
  );
}
