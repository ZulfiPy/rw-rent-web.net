import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { qk } from '@/api';
import { getUser, listUsers } from '@/api/users';
import { listRoleHistory } from '@/api/roles';
import { listUserSessions } from '@/api/sessions';
import {
  ApplicationUserRole, ApplicationUserStatus,
  type ApplicationUserResponse, type RoleAssignmentResponse, type SessionResponse, type Uuid,
} from '@/api/dto';
import { toFailure } from '@/api/problem';
import { EMPTY, formatLocal, formatUtc } from '@/format';
import { rolesLabel, ROLE_LABEL, USER_STATUS_LABEL } from '@/format/labels';
import { useCompanyName } from '@/app/useCompanyName';
import { useTier } from '@/app/useViewport';
import { useAccess } from '@/permissions/usePermissions';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { Panel } from '@/ui/Panel';
import { USER_STATUS_DOT, USER_STATUS_TONE } from '@/ui/status';
import cards from '@/ui/cards.module.css';
import table from '@/ui/table.module.css';
import { UserDialogs, type UserDialogState } from './UserDialogs';
import styles from './UserRecord.module.css';

type TabId = 'summary' | 'roles' | 'sessions';

const isProtected = (u: ApplicationUserResponse) =>
  u.effectiveRoles.includes(ApplicationUserRole.SystemAdministrator);

const roleState = (r: RoleAssignmentResponse) =>
  r.isEffective
    ? { label: 'Effective', tone: 'ok' as const, dot: '50%' }
    : r.revokedAtUtc
      ? { label: 'Revoked', tone: 'bad' as const, dot: '1px' }
      : { label: 'Expired', tone: 'mute' as const, dot: '1px' };

const sessionState = (s: SessionResponse) =>
  s.revokedAtUtc
    ? { label: 'Revoked', tone: 'bad' as const, dot: '1px' }
    : s.isActive
      ? { label: 'Active', tone: 'ok' as const, dot: '50%' }
      : { label: 'Expired', tone: 'mute' as const, dot: '1px' };

function Row({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <>
      <div className={styles.rowLabel}>{label}</div>
      <div className={styles.rowValue}>
        {children}
        {hint ? <span className={styles.hint}>{hint}</span> : null}
      </div>
    </>
  );
}

function Fact({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <span className={cards.fact}>
      <span className={cards.factLabel}>{label}</span>
      <span className={mono ? cards.factMono : cards.factValue}>{value}</span>
    </span>
  );
}

export function UserRecord() {
  const { userId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { can } = useAccess();
  const companyName = useCompanyName();
  const tier = useTier();
  const phone = tier === 'phone';
  const [dialog, setDialog] = useState<UserDialogState | null>(null);

  const canRoles = can('Roles.ReadHistory');
  const canSessions = can('Sessions.ManageOrdinaryCompanyUsers');

  const user = useQuery({
    queryKey: qk.users.detail(userId),
    queryFn: () => getUser(userId),
    enabled: userId !== '',
  });

  const roles = useQuery({
    queryKey: qk.roles.history(userId, { PageSize: 100 }),
    queryFn: () => listRoleHistory(userId, { PageSize: 100 }),
    enabled: userId !== '' && canRoles,
  });

  const sessions = useQuery({
    queryKey: qk.sessions.ofUser(userId, { PageSize: 100, IncludeEnded: true }),
    queryFn: () => listUserSessions(userId, { PageSize: 100, IncludeEnded: true }),
    enabled: userId !== '' && canSessions,
  });

  // Grants and revocations carry actor ids; the directory is where their names live.
  const directory = useQuery({
    queryKey: qk.users.list({ PageSize: 100 }),
    queryFn: () => listUsers({ PageSize: 100 }),
    enabled: canRoles,
    staleTime: 60_000,
  });
  const actorName = (id: Uuid | null | undefined, fallback = 'System') =>
    directory.data?.items.find((x) => x.id === id)?.lastName ?? fallback;

  const tabs: Array<{ id: TabId; label: string; icon: string; count?: number }> = [
    { id: 'summary', label: 'Account', icon: 'person' },
    ...(canRoles ? [{ id: 'roles' as const, label: 'Roles', icon: 'shield_person', count: roles.data?.totalCount }] : []),
    ...(canSessions ? [{ id: 'sessions' as const, label: 'Sessions', icon: 'devices' }] : []),
  ];
  const wanted = params.get('tab') as TabId | null;
  const tab: TabId = tabs.some((t) => t.id === wanted) ? (wanted as TabId) : 'summary';
  const selectTab = (next: TabId) => {
    const merged = new URLSearchParams(params);
    if (next === 'summary') merged.delete('tab');
    else merged.set('tab', next);
    setParams(merged, { replace: true });
  };

  const backLink = (
    <Link to="/users" className={styles.back}>
      <span data-icon aria-hidden="true" className={styles.backIcon}>arrow_back</span>User directory
    </Link>
  );

  if (user.isError) {
    const failure = toFailure(user.error);
    return (
      <div className={styles.page}>
        {backLink}
        <EmptyState
          icon={failure.kind === 'forbidden' ? 'lock' : 'person_off'}
          title="That user is not available"
          body={'message' in failure ? failure.message : 'The record could not be loaded.'}
          onRetry={failure.kind === 'forbidden' ? undefined : () => void user.refetch()}
        />
      </div>
    );
  }

  const u = user.data;
  const guarded = u ? isProtected(u) : false;
  const activeSessions = sessions.data?.items.filter((s) => s.isActive).length ?? 0;
  const canManageRole = (r: RoleAssignmentResponse) =>
    r.role === ApplicationUserRole.CompanyPrincipal
      ? can('Roles.ManageCompanyPrincipal')
      : can('Roles.ManageViewerFleetManager');
  const roleActionable = (r: RoleAssignmentResponse) =>
    r.isEffective && r.role !== ApplicationUserRole.SystemAdministrator && canManageRole(r);

  const lifecycleActions = u ? (
    <>
      {u.status === ApplicationUserStatus.PendingActivation && u.emailConfirmed && can('Users.ReviewRegistrations') ? (
        <Button label="Activate" icon="how_to_reg" tone="primary" small onClick={() => setDialog({ kind: 'activate' })} />
      ) : null}
      {u.status === ApplicationUserStatus.PendingActivation && can('Users.ManageRegistrations') ? (
        <Button label="Reject" icon="person_off" tone="danger" small onClick={() => setDialog({ kind: 'reject' })} />
      ) : null}
      {u.status === ApplicationUserStatus.RegistrationRejected && can('Users.ManageRegistrations') ? (
        <Button label="Reopen" icon="restart_alt" small onClick={() => setDialog({ kind: 'reopen' })} />
      ) : null}
      {u.status === ApplicationUserStatus.Active && !guarded && can('Users.SuspendRestoreOrdinary') ? (
        <Button label="Suspend" icon="lock_person" tone="danger" small onClick={() => setDialog({ kind: 'suspend' })} />
      ) : null}
      {u.status === ApplicationUserStatus.Suspended && !guarded && can('Users.SuspendRestoreOrdinary') ? (
        <Button label="Restore" icon="lock_open" tone="primary" small onClick={() => setDialog({ kind: 'restore' })} />
      ) : null}
    </>
  ) : null;

  return (
    <div className={styles.page}>
      {backLink}

      <div className={styles.hero}>
        <div className={styles.heroTop}>
          <h1 className={styles.name}>{u ? `${u.firstName} ${u.lastName}` : 'User'}</h1>
          {u ? (
            <Chip tone={USER_STATUS_TONE[u.status]} dot={USER_STATUS_DOT[u.status]}>
              {USER_STATUS_LABEL[u.status]}
            </Chip>
          ) : null}
        </div>
        <div className={styles.facts}>
          <div className={styles.fact}>
            <span className={styles.factLabel}>Email</span>
            <span className={styles.factValue}>{u?.email ?? EMPTY}</span>
          </div>
          <div className={styles.fact}>
            <span className={styles.factLabel}>Effective roles</span>
            <span className={styles.factValue}>{u ? rolesLabel(u.effectiveRoles) : EMPTY}</span>
          </div>
          <div className={styles.fact}>
            <span className={styles.factLabel}>Phone</span>
            <span className={styles.factMono}>{u?.phoneNumber ?? EMPTY}</span>
          </div>
        </div>
      </div>

      {guarded ? (
        <div className={styles.banner}>
          <span data-icon aria-hidden="true" className={styles.bannerIcon}>admin_panel_settings</span>
          <div>
            <p className={styles.bannerTitle}>Protected System Administrator</p>
            <p className={styles.bannerBody}>
              This account is outside ordinary Company administration. Changing who holds it uses the
              audited transfer workflow under Administration.
            </p>
          </div>
        </div>
      ) : null}

      <div className={styles.tabs} role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={styles.tab}
            onClick={() => selectTab(t.id)}
          >
            <span data-icon aria-hidden="true" className={styles.tabIcon}>{t.icon}</span>
            {t.label}
            {t.count === undefined ? null : <span className={styles.count}>{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'summary' ? (
        <>
          <Panel
            title="Account"
            actions={u && !guarded && can('Users.CorrectName') ? (
              <Button label="Correct name" icon="shield" tone="warn" small onClick={() => setDialog({ kind: 'correct-name' })} />
            ) : undefined}
          >
            <div className={styles.rows}>
              <Row label="First name">{u?.firstName ?? EMPTY}</Row>
              <Row label="Last name">{u?.lastName ?? EMPTY}</Row>
              <Row label="Login email">{u?.email ?? EMPTY}</Row>
              <Row label="Email ownership">{u ? (u.emailConfirmed ? 'Confirmed' : 'Not confirmed') : EMPTY}</Row>
              <Row label="Phone"><span className={table.mono}>{u?.phoneNumber ?? EMPTY}</span></Row>
              <Row label="Company">
                <span className={u?.companyId ? '' : table.dim}>{u?.companyId ? companyName : 'Not assigned'}</span>
              </Row>
              <Row label="Security version" hint="Increments on credential and access changes.">
                <span className={table.mono}>{u?.securityVersion ?? EMPTY}</span>
              </Row>
            </div>
          </Panel>

          <Panel
            title="Lifecycle"
            description="Registration and access state."
            actions={lifecycleActions}
            note={
              guarded
                ? 'Protected System Administrator account. Ordinary suspend, restore and role administration do not apply; use the System Administrator transfer workflow.'
                : u?.registrationDecisionReason
                  ? `Internal rejection reason: ${u.registrationDecisionReason} — never shown to the registrant.`
                  : null
            }
            noteIcon={guarded ? 'admin_panel_settings' : 'lock'}
          >
            <div className={styles.rows}>
              <Row label="Status">
                {u ? (
                  <Chip tone={USER_STATUS_TONE[u.status]} dot={USER_STATUS_DOT[u.status]}>
                    {USER_STATUS_LABEL[u.status]}
                  </Chip>
                ) : EMPTY}
              </Row>
              <Row label="Registered"><span className={table.mono}>{formatLocal(u?.createdAtUtc)}</span></Row>
              <Row label="Registration expires">
                {u?.registrationExpiresAtUtc
                  ? <span className={table.mono}>{formatLocal(u.registrationExpiresAtUtc)}</span>
                  : <span className={table.dim}>No expiry</span>}
              </Row>
              <Row label="Last updated">
                {u?.updatedAtUtc
                  ? <span className={table.mono}>{formatLocal(u.updatedAtUtc)}</span>
                  : <span className={table.dim}>Never</span>}
              </Row>
            </div>
          </Panel>
        </>
      ) : null}

      {tab === 'roles' ? (
        <Panel
          title="Role assignments"
          description="Full grant history including revoked and expired assignments."
          actions={u && u.status === ApplicationUserStatus.Active && !guarded && can('Roles.ManageViewerFleetManager') ? (
            <Button label="Grant role" icon="add_moderator" tone="primary" small onClick={() => setDialog({ kind: 'role-grant' })} />
          ) : undefined}
          note={
            can('Roles.ManageCompanyPrincipal')
              ? 'Viewer, Fleet Manager and Company Principal can be granted after activation. System Administrator is never grantable.'
              : 'Only Viewer and Fleet Manager can be granted after activation. Company Principal grants need System Administrator.'
          }
        >
          {roles.data && roles.data.items.length === 0 ? (
            <EmptyState
              icon="shield_person"
              title="No role history"
              body="Roles appear here once the account has been activated."
            />
          ) : phone ? (
            <div className={cards.cards}>
              {roles.data?.items.map((r) => {
                const state = roleState(r);
                return (
                  <div key={r.id} className={cards.card}>
                    <div className={cards.head}>
                      <span className={cards.heading}>
                        <span className={cards.title}>{ROLE_LABEL[r.role]}</span>
                        <span className={cards.sub}>Granted by {actorName(r.assignedByUserId)}</span>
                      </span>
                      <Chip tone={state.tone} dot={state.dot}>{state.label}</Chip>
                    </div>
                    <div className={cards.facts}>
                      <Fact label="Assigned" value={formatLocal(r.assignedAtUtc)} mono />
                      <Fact label="Expires" value={r.expiresAtUtc ? formatLocal(r.expiresAtUtc) : 'No expiry'} mono={!!r.expiresAtUtc} />
                      {r.revokedAtUtc ? <Fact label="Revoked" value={formatLocal(r.revokedAtUtc)} mono /> : null}
                      {r.revocationReason ? <Fact label="Reason" value={r.revocationReason} /> : null}
                    </div>
                    {roleActionable(r) ? (
                      <div className={cards.actions}>
                        <Button label="Expiry" icon="schedule" small onClick={() => setDialog({ kind: 'role-expiry', assignment: r })} />
                        <Button label="Revoke" icon="remove_moderator" tone="danger" small onClick={() => setDialog({ kind: 'role-revoke', assignment: r })} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={table.scroll}>
              <table className={table.table}>
                <thead>
                  <tr>
                    <th scope="col" className={`${table.th} ${styles.colRole}`}>Role</th>
                    <th scope="col" className={`${table.th} ${styles.colWhen}`}>Assigned</th>
                    <th scope="col" className={`${table.th} ${styles.colWhen}`}>Expires</th>
                    <th scope="col" className={`${table.th} ${styles.colState}`}>State</th>
                    <th scope="col" className={`${table.th} ${table.foldTablet}`}>Revocation</th>
                    <th scope="col" className={`${table.th} ${table.right} ${styles.colActions}`}>
                      <span className={table.srOnly}>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roles.data?.items.map((r) => {
                    const state = roleState(r);
                    return (
                      <tr key={r.id} className={table.row}>
                        <td className={table.td}><span className={table.name}>{ROLE_LABEL[r.role]}</span></td>
                        <td className={table.td}>
                          <span className={table.stack}>
                            <span className={table.mono}>{formatLocal(r.assignedAtUtc)}</span>
                            <span className={table.sub}>{actorName(r.assignedByUserId)}</span>
                          </span>
                        </td>
                        <td className={table.td}>
                          {r.expiresAtUtc
                            ? <span className={table.mono}>{formatLocal(r.expiresAtUtc)}</span>
                            : <span className={table.dim}>No expiry</span>}
                        </td>
                        <td className={table.td}>
                          <Chip tone={state.tone} dot={state.dot}>{state.label}</Chip>
                        </td>
                        <td className={`${table.td} ${table.wrap} ${table.foldTablet}`}>
                          <span className={table.stack}>
                            <span>{r.revocationReason ?? EMPTY}</span>
                            {r.revokedAtUtc ? (
                              <span className={table.sub}>
                                {formatLocal(r.revokedAtUtc)} · {actorName(r.revokedByUserId)}
                              </span>
                            ) : null}
                          </span>
                        </td>
                        <td className={table.td}>
                          {roleActionable(r) ? (
                            <span className={table.actionsCell}>
                              <Button label="Expiry" icon="schedule" small onClick={() => setDialog({ kind: 'role-expiry', assignment: r })} />
                              <Button label="Revoke" icon="remove_moderator" tone="danger" small onClick={() => setDialog({ kind: 'role-revoke', assignment: r })} />
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      ) : null}

      {tab === 'sessions' ? (
        <Panel
          title="Server sessions"
          description="Two-hour idle timeout, twelve-hour absolute lifetime. Times in UTC."
          actions={u && !guarded && canSessions ? (
            <Button
              label="Force sign out"
              icon="no_accounts"
              tone="danger"
              small
              blockedReason={activeSessions === 0 ? 'This user has no active sessions.' : null}
              onClick={() => setDialog({ kind: 'session-revoke-all' })}
            />
          ) : undefined}
        >
          {sessions.data && sessions.data.items.length === 0 ? (
            <EmptyState
              icon="devices_off"
              title="No sessions"
              body="This user has never signed in, or every session has been cleared."
            />
          ) : phone ? (
            <div className={cards.cards}>
              {sessions.data?.items.map((s) => {
                const state = sessionState(s);
                return (
                  <div key={s.id} className={cards.card}>
                    <div className={cards.head}>
                      <span className={cards.heading}>
                        <span className={cards.title}>{s.deviceDescription ?? EMPTY}</span>
                        <span className={cards.sub}>{s.ipAddress ?? ''}</span>
                      </span>
                      <Chip tone={state.tone} dot={state.dot}>{state.label}</Chip>
                    </div>
                    <div className={cards.facts}>
                      <Fact label="Started (UTC)" value={formatUtc(s.createdAtUtc)} mono />
                      <Fact label="Last seen (UTC)" value={formatUtc(s.lastSeenAtUtc)} mono />
                      {s.revocationReason ? <Fact label="Reason" value={s.revocationReason} /> : null}
                    </div>
                    {s.isActive && canSessions ? (
                      <div className={cards.actions}>
                        <Button label="Revoke" icon="link_off" tone="danger" small onClick={() => setDialog({ kind: 'session-revoke', session: s })} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={table.scroll}>
              <table className={table.table}>
                <thead>
                  <tr>
                    <th scope="col" className={`${table.th} ${styles.colDevice}`}>Device</th>
                    <th scope="col" className={`${table.th} ${styles.colUtc} ${table.foldTablet}`}>Started (UTC)</th>
                    <th scope="col" className={`${table.th} ${styles.colUtc}`}>Last seen (UTC)</th>
                    <th scope="col" className={`${table.th} ${styles.colState}`}>State</th>
                    <th scope="col" className={table.th}>Reason</th>
                    <th scope="col" className={`${table.th} ${table.right} ${styles.colActions}`}>
                      <span className={table.srOnly}>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.data?.items.map((s) => {
                    const state = sessionState(s);
                    return (
                      <tr key={s.id} className={table.row}>
                        <td className={`${table.td} ${table.wrap}`}>
                          <span className={table.stack}>
                            <span className={table.name}>{s.deviceDescription ?? EMPTY}</span>
                            <span className={table.subMono}>{s.ipAddress ?? ''}</span>
                          </span>
                        </td>
                        <td className={`${table.td} ${table.foldTablet}`}>
                          <span className={table.mono}>{formatUtc(s.createdAtUtc)}</span>
                        </td>
                        <td className={table.td}>
                          <span className={table.stack}>
                            <span className={table.mono}>{formatUtc(s.lastSeenAtUtc)}</span>
                            <span className={table.subMono}>idle until {formatUtc(s.idleExpiresAtUtc).slice(11)}</span>
                          </span>
                        </td>
                        <td className={table.td}>
                          <Chip tone={state.tone} dot={state.dot}>{state.label}</Chip>
                        </td>
                        <td className={`${table.td} ${table.wrap}`}>
                          <span className={table.stack}>
                            <span>{s.revocationReason ?? EMPTY}</span>
                            {s.revokedAtUtc ? (
                              <span className={table.subMono}>{formatUtc(s.revokedAtUtc)}</span>
                            ) : null}
                          </span>
                        </td>
                        <td className={table.td}>
                          {s.isActive && canSessions ? (
                            <span className={table.actionsCell}>
                              <Button label="Revoke" icon="link_off" tone="danger" small onClick={() => setDialog({ kind: 'session-revoke', session: s })} />
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      ) : null}

      {u ? <UserDialogs state={dialog} user={u} onClose={() => setDialog(null)} /> : null}
    </div>
  );
}
