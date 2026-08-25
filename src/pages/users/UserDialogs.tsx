import { useState } from 'react';
import {
  ApplicationUserRole,
  type ApplicationUserResponse, type RoleAssignmentResponse, type SessionResponse,
} from '@/api/dto';
import { activateUser, correctUserName, rejectRegistration, reopenRegistration, restoreUser, suspendUser } from '@/api/users';
import { changeRoleExpiry, grantRole, revokeRole } from '@/api/roles';
import { revokeAllUserSessions, revokeUserSession } from '@/api/sessions';
import { endOfDayLocal, toDateOnlyLocal } from '@/format';
import { ROLE_LABEL } from '@/format/labels';
import { useActionMutation } from '@/app/useActionMutation';
import { ReseedScope } from '@/app/reseed';
import { useAccess } from '@/permissions/usePermissions';
import type { Permission } from '@/permissions/permissions';
import { Dialog, DialogNote } from '@/ui/Dialog';
import { Field, fieldStyles as f } from '@/ui/Field';

/** Everything a user record can open. The record page owns which are offered. */
export type UserDialogState =
  | { kind: 'correct-name' }
  | { kind: 'activate' }
  | { kind: 'reject' }
  | { kind: 'reopen' }
  | { kind: 'suspend' }
  | { kind: 'restore' }
  | { kind: 'role-grant' }
  | { kind: 'role-expiry'; assignmentId: string }
  | { kind: 'role-revoke'; assignmentId: string }
  | { kind: 'session-revoke'; sessionId: string }
  | { kind: 'session-revoke-all' };

/** Every user mutation touches the record, the audit trail, and usually roles or sessions. */
const INVALIDATE = [['users'], ['roles'], ['sessions'], ['security-audit']] as const;

interface Common { user: ApplicationUserResponse; onClose: () => void }

const REASON_HINT = 'Recorded in the security audit against this account.';

function ReasonField({ value, error, onChange, label = 'Reason' }: {
  value: string;
  error?: string | undefined;
  onChange: (next: string) => void;
  label?: string;
}) {
  return (
    <Field label={label} hint={REASON_HINT} error={error}>
      <textarea
        className={f.control}
        data-invalid={!!error}
        value={value}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

function CorrectName({ user, onClose }: Common) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [reason, setReason] = useState('');
  const m = useActionMutation({
    op: 'user-correct-name',
    mutationFn: () => correctUserName(user.id, { firstName, lastName, reason }),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title="Correct name"
      icon="shield"
      tone="warn"
      width={560}
      description="A privileged correction. The recorded name changes and the reason is audited."
      submitLabel="Save correction"
      submitTone="warn"
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <Field label="First name" error={m.fields['firstName']}>
        <input
          className={f.control}
          data-invalid={!!m.fields['firstName']}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </Field>
      <Field label="Last name" error={m.fields['lastName']}>
        <input
          className={f.control}
          data-invalid={!!m.fields['lastName']}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </Field>
      <ReasonField value={reason} error={m.fields['reason']} onChange={setReason} />
    </Dialog>
  );
}

const ACTIVATION_ROLES: Array<[ApplicationUserRole, Permission]> = [
  [ApplicationUserRole.Viewer, 'Users.ActivateViewer'],
  [ApplicationUserRole.FleetManager, 'Users.ActivateFleetManager'],
  [ApplicationUserRole.CompanyPrincipal, 'Users.ActivateCompanyPrincipal'],
];

/** role → the expiry date the reviewer typed. A role absent from the map is not being granted. */
type ExpiryDrafts = Partial<Record<ApplicationUserRole, string>>;

/** Viewer starts selected: it is the grant almost every activation makes. */
function initialDrafts(canGrantViewer: boolean): ExpiryDrafts {
  return canGrantViewer ? { [ApplicationUserRole.Viewer]: '' } : {};
}

function Activate({ user, onClose }: Common) {
  const { can } = useAccess();
  const [picked, setPicked] = useState<ExpiryDrafts>(() => initialDrafts(can('Users.ActivateViewer')));
  const m = useActionMutation({
    op: 'user-activate',
    mutationFn: () => activateUser(user.id, {
      roles: Object.entries(picked).map(([role, date]) => ({
        role: Number(role) as ApplicationUserRole,
        expiresAtUtc: date ? endOfDayLocal(date) : null,
      })),
    }),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  const toggle = (role: ApplicationUserRole) => setPicked((prev) => {
    const next: ExpiryDrafts = { ...prev };
    if (role in next) delete next[role];
    else next[role] = '';
    return next;
  });

  const setDraft = (role: ApplicationUserRole, value: string) => setPicked((prev) => {
    const next: ExpiryDrafts = { ...prev };
    next[role] = value;
    return next;
  });

  // The backend refuses a past expiry with one code and does not say which grant failed, so the
  // message appears under every role expiry that is set. Nothing is validated in the browser.
  const expiryError = m.fields['roles[].expiresAtUtc'];

  return (
    <Dialog
      title="Activate registration"
      icon="how_to_reg"
      tone="ok"
      width={600}
      description={`Assigns the Company, Active status and initial roles to ${user.firstName} ${user.lastName}.`}
      submitLabel="Activate account"
      busy={m.busy}
      failure={m.failure}
      info={{
        title: 'One atomic operation',
        body: 'Company assignment, Active status and every selected role grant are applied together, or not at all.',
      }}
      footnote="System Administrator can never be granted here."
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <Field label="Initial roles" group error={m.fields['roles']}>
        <span className={f.choices}>
          {ACTIVATION_ROLES.filter(([, permission]) => can(permission)).map(([role]) => {
            const checked = role in picked;
            const date = picked[role] ?? '';
            return (
              <span key={role} className={f.choice} data-checked={checked}>
                <input type="checkbox" checked={checked} onChange={() => toggle(role)} />
                <span className={f.choiceBody}>
                  <span className={f.choiceRow}>{ROLE_LABEL[role]}</span>
                  {checked ? (
                    <>
                      <span className={f.choiceExpiry}>
                        Expires
                        <input
                          type="date"
                          className={f.date}
                          data-invalid={!!(expiryError && date)}
                          aria-label={`${ROLE_LABEL[role]} expiry`}
                          value={date}
                          onChange={(e) => setDraft(role, e.target.value)}
                        />
                        {date ? null : 'no expiry'}
                      </span>
                      {expiryError && date ? (
                        <span className={f.error}>
                          <span data-icon aria-hidden="true" className={f.errorIcon}>error</span>
                          {expiryError}
                        </span>
                      ) : null}
                    </>
                  ) : null}
                </span>
              </span>
            );
          })}
        </span>
      </Field>
      <DialogNote>
        An expiry date is the last valid day: access ends at the end of that day, Europe/Tallinn.
      </DialogNote>
    </Dialog>
  );
}

function Decision({ user, onClose, kind }: Common & { kind: 'reject' | 'reopen' }) {
  const [reason, setReason] = useState('');
  const reject = kind === 'reject';
  const m = useActionMutation({
    op: reject ? 'user-reject' : 'user-reopen',
    mutationFn: () => (reject
      ? rejectRegistration(user.id, { reason })
      : reopenRegistration(user.id, { reason })),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title={reject ? 'Reject registration' : 'Reopen registration'}
      icon={reject ? 'person_off' : 'restart_alt'}
      tone={reject ? 'bad' : 'info'}
      width={540}
      description={reject
        ? 'The applicant is told their registration was not approved. The reason stays internal.'
        : 'The registration returns to pending. An unconfirmed email gets a fresh seven-day window.'}
      submitLabel={reject ? 'Reject' : 'Reopen'}
      submitTone={reject ? 'danger' : 'primary'}
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <ReasonField value={reason} error={m.fields['reason']} onChange={setReason} />
    </Dialog>
  );
}

function Lifecycle({ user, onClose, kind }: Common & { kind: 'suspend' | 'restore' }) {
  const suspend = kind === 'suspend';
  const m = useActionMutation({
    op: suspend ? 'user-suspend' : 'user-restore',
    mutationFn: () => (suspend ? suspendUser(user.id) : restoreUser(user.id)),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title={suspend ? 'Suspend account' : 'Restore account'}
      icon={suspend ? 'lock_person' : 'lock_open'}
      tone={suspend ? 'bad' : 'ok'}
      width={suspend ? 520 : 480}
      description={`${user.firstName} ${user.lastName} · ${user.email}`}
      submitLabel={suspend ? 'Suspend' : 'Restore'}
      submitTone={suspend ? 'danger' : 'primary'}
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <DialogNote icon={suspend ? 'lock_person' : 'lock_open'}>
        {suspend
          ? 'Signing in stops immediately and every active session ends. The endpoint takes no reason, so none is recorded.'
          : 'Signing in becomes possible again. Roles are unchanged; sessions are not restored.'}
      </DialogNote>
    </Dialog>
  );
}

function RoleGrant({ user, onClose }: Common) {
  const { can } = useAccess();
  const grantable = [
    ...(can('Roles.ManageViewerFleetManager') ? [ApplicationUserRole.Viewer, ApplicationUserRole.FleetManager] : []),
    ...(can('Roles.ManageCompanyPrincipal') ? [ApplicationUserRole.CompanyPrincipal] : []),
  ];
  const [role, setRole] = useState<string>(String(grantable[0] ?? ApplicationUserRole.Viewer));
  const [date, setDate] = useState('');
  const m = useActionMutation({
    op: 'role-grant',
    mutationFn: () => grantRole(user.id, {
      role: Number(role) as ApplicationUserRole,
      expiresAtUtc: date ? endOfDayLocal(date) : null,
    }),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title="Grant role"
      icon="add_moderator"
      tone="ok"
      width={520}
      description="The grant is audited with its expiry. Granting a role the user already holds is refused."
      submitLabel="Grant role"
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <Field label="Role" error={m.fields['role']}>
        <select className={f.control} value={role} onChange={(e) => setRole(e.target.value)}>
          {grantable.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
      </Field>
      <Field label="Expires" optional hint="Leave empty for no expiry. The chosen date is the last valid day." error={m.fields['expiresAtUtc']}>
        <input
          type="date"
          className={f.control}
          data-invalid={!!m.fields['expiresAtUtc']}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Field>
    </Dialog>
  );
}

function RoleExpiry({ user, onClose, assignment }: Common & { assignment: RoleAssignmentResponse }) {
  const [date, setDate] = useState(toDateOnlyLocal(assignment.expiresAtUtc));
  const m = useActionMutation({
    op: 'role-expiry',
    mutationFn: () => changeRoleExpiry(user.id, assignment.id, {
      expiresAtUtc: date ? endOfDayLocal(date) : null,
    }),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title="Change expiry"
      icon="schedule"
      tone="info"
      width={480}
      description={`${ROLE_LABEL[assignment.role]} · granted to ${user.firstName} ${user.lastName}`}
      submitLabel="Save expiry"
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <Field label="Expires" optional hint="Clear the date to remove the expiry. The chosen date is the last valid day." error={m.fields['expiresAtUtc']}>
        <input
          type="date"
          className={f.control}
          data-invalid={!!m.fields['expiresAtUtc']}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Field>
    </Dialog>
  );
}

function RoleRevoke({ user, onClose, assignment }: Common & { assignment: RoleAssignmentResponse }) {
  const [reason, setReason] = useState('');
  const m = useActionMutation({
    op: 'role-revoke',
    mutationFn: () => revokeRole(user.id, assignment.id, { reason }),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title="Revoke role"
      icon="remove_moderator"
      tone="bad"
      width={520}
      description={`${ROLE_LABEL[assignment.role]} · granted to ${user.firstName} ${user.lastName}`}
      submitLabel="Revoke role"
      submitTone="danger"
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <ReasonField value={reason} error={m.fields['reason']} onChange={setReason} />
      <DialogNote icon="lock">
        Revoking a role ends the user's sessions; the session rows carry the reason.
      </DialogNote>
    </Dialog>
  );
}

function SessionRevoke({ user, onClose, session }: Common & { session: SessionResponse }) {
  const m = useActionMutation({
    op: 'session-revoke',
    mutationFn: () => revokeUserSession(user.id, session.id),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title="Revoke session"
      icon="no_accounts"
      tone="bad"
      width={460}
      description={session.deviceDescription ?? 'This session'}
      submitLabel="Revoke session"
      submitTone="danger"
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <DialogNote icon="link_off">
        The session ends at once and is recorded as “Revoked by administrator”. The endpoint takes no
        reason, so the audit entry records none.
      </DialogNote>
    </Dialog>
  );
}

function SessionRevokeAll({ user, onClose }: Common) {
  const m = useActionMutation({
    op: 'session-revoke-all',
    mutationFn: () => revokeAllUserSessions(user.id),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title="Force sign out"
      icon="no_accounts"
      tone="bad"
      width={500}
      description={`Every active session for ${user.firstName} ${user.lastName} ends.`}
      submitLabel="Force sign out"
      submitTone="danger"
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <DialogNote icon="no_accounts">
        Sessions are recorded as “Forced logout by administrator”. The audit entry names the user, not
        a session, and carries no reason.
      </DialogNote>
    </Dialog>
  );
}

/**
 * The record page opens these by id, not by object: after a stale Refresh the fresh row arrives as a
 * prop, and `ReseedScope` remounts the dialog so its inputs re-seed from the current values.
 */
export function UserDialogs({ state, ...rest }: DialogsProps) {
  if (!state) return null;
  return (
    <ReseedScope>
      <Current state={state} {...rest} />
    </ReseedScope>
  );
}

interface DialogsProps {
  state: UserDialogState | null;
  user: ApplicationUserResponse;
  roles: RoleAssignmentResponse[];
  sessions: SessionResponse[];
  onClose: () => void;
}

function Current({ state, user, roles, sessions, onClose }: Omit<DialogsProps, 'state'> & { state: UserDialogState }) {
  const seed = `${user.updatedAtUtc ?? ''}|${user.securityVersion}`;

  switch (state.kind) {
    case 'correct-name': return <CorrectName key={seed} user={user} onClose={onClose} />;
    case 'activate': return <Activate key={seed} user={user} onClose={onClose} />;
    case 'reject': return <Decision user={user} onClose={onClose} kind="reject" />;
    case 'reopen': return <Decision user={user} onClose={onClose} kind="reopen" />;
    case 'suspend': return <Lifecycle user={user} onClose={onClose} kind="suspend" />;
    case 'restore': return <Lifecycle user={user} onClose={onClose} kind="restore" />;
    case 'role-grant': return <RoleGrant user={user} onClose={onClose} />;
    case 'role-expiry': {
      const assignment = roles.find((r) => r.id === state.assignmentId);
      return assignment
        ? <RoleExpiry key={`${assignment.id}|${assignment.expiresAtUtc ?? ''}`} user={user} onClose={onClose} assignment={assignment} />
        : null;
    }
    case 'role-revoke': {
      const assignment = roles.find((r) => r.id === state.assignmentId);
      return assignment ? <RoleRevoke user={user} onClose={onClose} assignment={assignment} /> : null;
    }
    case 'session-revoke': {
      const session = sessions.find((s) => s.id === state.sessionId);
      return session ? <SessionRevoke user={user} onClose={onClose} session={session} /> : null;
    }
    case 'session-revoke-all': return <SessionRevokeAll user={user} onClose={onClose} />;
  }
}
