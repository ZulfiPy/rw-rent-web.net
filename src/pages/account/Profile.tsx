import { useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { me as meApi, qk } from '@/api';
import type { SessionResponse, Uuid } from '@/api/dto';
import { useActionMutation } from '@/app/useActionMutation';
import { useCompanyName } from '@/app/useCompanyName';
import { useSheetTier } from '@/app/useViewport';
import { useAccess } from '@/permissions/usePermissions';
import { EMPTY, formatUtc } from '@/format';
import { NO_ROLE_LABEL, USER_STATUS_LABEL, rolesLabel } from '@/format/labels';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Dialog, DialogSection, dialogStyles } from '@/ui/Dialog';
import { EmptyState } from '@/ui/EmptyState';
import { Fact, FactGrid } from '@/ui/FactGrid';
import { Field, fieldStyles as f, invalidProps } from '@/ui/Field';
import { PageHeader } from '@/ui/PageHeader';
import { Panel } from '@/ui/Panel';
import { RecordTabs, recordStyles as shell, type RecordTab } from '@/ui/RecordTabs';
import cards from '@/ui/cards.module.css';
import table from '@/ui/table.module.css';
import styles from './Profile.module.css';

type TabId = 'profile' | 'security' | 'sessions';

const TABS: Array<RecordTab<TabId>> = [
  { id: 'profile', label: 'Profile', icon: 'person' },
  { id: 'security', label: 'Sign-in & security', icon: 'lock' },
  { id: 'sessions', label: 'Your sessions', icon: 'devices' },
];

const SESSIONS = { IncludeEnded: true, PageSize: 100 } as const;
const INVALIDATE = [['me'], ['sessions']] as const;

const PASSWORD_RULE = 'At least 12 characters with upper case, lower case, a digit and a symbol.';

const sessionState = (s: SessionResponse) =>
  s.isCurrent
    ? { label: 'Current', tone: 'accent' as const, dot: '50%' }
    : s.revokedAtUtc
      ? { label: 'Revoked', tone: 'bad' as const, dot: '1px' }
      : s.isActive
        ? { label: 'Active', tone: 'ok' as const, dot: '50%' }
        : { label: 'Expired', tone: 'mute' as const, dot: '1px' };

function CardFact({ label, value, mono, end, full }: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  end?: boolean;
  full?: boolean;
}) {
  const cls = `${cards.fact}${end ? ` ${cards.cardFactEnd}` : ''}${full ? ` ${cards.cardFactFull}` : ''}`;
  return (
    <span className={cls}>
      <span className={cards.factLabel}>{label}</span>
      <span className={mono ? cards.factMono : cards.factValue}>{value}</span>
    </span>
  );
}

type DialogState =
  | { kind: 'phone' }
  | { kind: 'password' }
  | { kind: 'email' }
  | { kind: 'access' }
  | { kind: 'session-revoke'; sessionId: Uuid }
  | { kind: 'revoke-others' }
  | null;

/**
 * "Your account", ported from the prototype's `profile` route: three tabs, panels that read what
 * the API reports, and a dialog for every change. What an administrator owns is not editable here;
 * what the account owns is one action away.
 */
export function Profile() {
  const { me } = useAccess();
  const companyName = useCompanyName();
  const phone = useSheetTier();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [dialog, setDialog] = useState<DialogState>(null);

  const requested = params.get('tab');
  const tab: TabId = requested === 'security' || requested === 'sessions' ? requested : 'profile';
  const selectTab = (next: TabId) => {
    const q = new URLSearchParams(params);
    if (next === 'profile') q.delete('tab');
    else q.set('tab', next);
    setParams(q, { replace: true });
  };

  const sessions = useQuery({
    queryKey: qk.meSessions(SESSIONS),
    queryFn: () => meApi.listOwnSessions(SESSIONS),
  });

  const rows = sessions.data?.items ?? [];
  /** The API marks the session this browser is using; its row is labelled, never revocable here. */
  const others = rows.filter((s) => s.isActive && !s.isCurrent).length;
  const active = rows.filter((s) => s.isActive).length;

  const close = () => setDialog(null);

  const revokeOne = useActionMutation({
    op: 'session-revoke',
    mutationFn: (sessionId: Uuid) => meApi.revokeOwnSession(sessionId),
    invalidate: INVALIDATE,
    onDone: close,
  });

  const revokeOthers = useActionMutation({
    op: 'session-revoke-others',
    mutationFn: () => meApi.revokeOtherOwnSessions(),
    invalidate: INVALIDATE,
    onDone: close,
  });

  const tabs = TABS.map((t) => (t.id === 'sessions' ? { ...t, count: active } : t));

  return (
    <div className={shell.page}>
      <PageHeader title="Your account" />

      <RecordTabs tabs={tabs} active={tab} onSelect={selectTab} />

      {tab === 'profile' ? (
        <>
          <Panel
            title="Your details"
            description="Name changes go through a privileged correction; ask a Company Principal."
            actions={<Button label="Update phone" icon="call" tone="primary" small onClick={() => setDialog({ kind: 'phone' })} />}
          >
            <FactGrid columns={4}>
              <Fact label="First name">{me?.firstName ?? EMPTY}</Fact>
              <Fact label="Last name">{me?.lastName ?? EMPTY}</Fact>
              <Fact label="Login email">{me?.email ?? EMPTY}</Fact>
              <Fact label="Phone" mono hint="Required on every account.">{me?.phoneNumber ?? EMPTY}</Fact>
            </FactGrid>
          </Panel>

          <Panel
            title="Access"
            description="What the API reports for your account right now."
            actions={<Button label="Show permissions" icon="verified_user" small onClick={() => setDialog({ kind: 'access' })} />}
          >
            <FactGrid columns={4}>
              <Fact label="Roles">{me && me.roles.length ? rolesLabel(me.roles) : NO_ROLE_LABEL}</Fact>
              <Fact label="Effective permissions" mono>{`${me?.permissions.length ?? 0} granted`}</Fact>
              <Fact label="Company" dim={!me?.companyId}>{me?.companyId ? companyName : 'Not assigned'}</Fact>
              <Fact label="Status">{me ? USER_STATUS_LABEL[me.status] : EMPTY}</Fact>
            </FactGrid>
          </Panel>
        </>
      ) : null}

      {tab === 'security' ? (
        <>
          <Panel
            title="Password"
            description={PASSWORD_RULE}
            actions={<Button label="Change password" icon="password" tone="primary" small onClick={() => setDialog({ kind: 'password' })} />}
            note="Changing your password refreshes this session and signs out the others."
          >
            <FactGrid>
              <Fact label="Password" mono>••••••••••••</Fact>
              <Fact label="Last changed" dim hint="The API does not report this yet.">{EMPTY}</Fact>
            </FactGrid>
          </Panel>

          <Panel
            title="Login email"
            description="A change applies only after you confirm it from the new address."
            actions={<Button label="Change email" icon="alternate_email" small onClick={() => setDialog({ kind: 'email' })} />}
            note="The confirmation link opens /confirm-email-change and needs an authenticated session."
            noteIcon="mail"
          >
            <FactGrid>
              <Fact label="Current address">{me?.email ?? EMPTY}</Fact>
              <Fact label="Pending change" dim hint="The API does not report this yet.">{EMPTY}</Fact>
            </FactGrid>
          </Panel>
        </>
      ) : null}

      {tab === 'sessions' ? (
        <Panel
          title="Where you are signed in"
          description="Times in UTC. Sessions end after two hours idle or twelve hours in total."
          actions={(
            <Button
              label="Revoke other sessions"
              icon="no_accounts"
              tone="danger"
              small
              blockedReason={others === 0 ? 'This is your only active session.' : null}
              onClick={() => setDialog({ kind: 'revoke-others' })}
            />
          )}
        >
          {sessions.data && rows.length === 0 ? (
            <EmptyState
              variant="panel"
              icon="devices_off"
              title="No sessions"
              body="Signing in creates one."
            />
          ) : phone ? (
            <div className={cards.cards}>
              {rows.map((s) => {
                const state = sessionState(s);
                return (
                  <div key={s.id} className={cards.card}>
                    <div className={cards.head}>
                      <span className={cards.heading}>
                        <span className={cards.title}>{s.deviceDescription ?? EMPTY}</span>
                        <span className={cards.sub}>
                          {s.isCurrent ? `This device · ${s.ipAddress ?? ''}` : s.ipAddress ?? ''}
                        </span>
                      </span>
                      <Chip tone={state.tone} dot={state.dot}>{state.label}</Chip>
                    </div>
                    <div className={cards.facts}>
                      <CardFact label="Started (UTC)" value={formatUtc(s.createdAtUtc)} mono />
                      <CardFact label="Last seen (UTC)" value={formatUtc(s.lastSeenAtUtc)} mono end />
                      {s.revocationReason ? <CardFact label="Reason" value={s.revocationReason} full /> : null}
                    </div>
                    {s.isActive && !s.isCurrent ? (
                      <div className={cards.actions}>
                        <Button
                          label="Revoke"
                          icon="link_off"
                          tone="danger"
                          small
                          row
                          onClick={() => setDialog({ kind: 'session-revoke', sessionId: s.id })}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={table.scroll}>
              <table className={table.table} data-panel="">
                <thead>
                  <tr>
                    <th scope="col" className={`${table.th} ${styles.colDevice}`}>Device</th>
                    <th scope="col" className={`${table.th} ${styles.colUtc} ${table.foldTablet}`}>Started (UTC)</th>
                    <th scope="col" className={`${table.th} ${styles.colUtc}`}>Last seen (UTC)</th>
                    <th scope="col" className={`${table.th} ${styles.colState}`}>State</th>
                    <th scope="col" className={table.th}>Reason</th>
                    <th scope="col" className={`${table.th} ${table.right} ${styles.colActions}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => {
                    const state = sessionState(s);
                    return (
                      <tr key={s.id} className={table.row}>
                        <td className={`${table.td} ${table.wrap}`}>
                          <span className={table.stack}>
                            <span className={table.name}>{s.deviceDescription ?? EMPTY}</span>
                            <span className={table.subMono}>
                              {s.isCurrent ? `This device · ${s.ipAddress ?? ''}` : s.ipAddress ?? ''}
                            </span>
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
                          {s.isActive && !s.isCurrent ? (
                            <span className={table.actionsCell}>
                              <Button
                                label="Revoke"
                                icon="link_off"
                                tone="danger"
                                small
                                row
                                onClick={() => setDialog({ kind: 'session-revoke', sessionId: s.id })}
                              />
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

      {dialog?.kind === 'phone' ? <PhoneDialog onClose={close} /> : null}
      {dialog?.kind === 'password' ? <PasswordDialog onClose={close} /> : null}
      {dialog?.kind === 'email' ? <EmailDialog onClose={close} /> : null}

      {dialog?.kind === 'access' ? (
        <Dialog
          title="Your effective access"
          description="The frontend renders actions from the permissions returned by GET /api/me, not from role names."
          icon="verified_user"
          width={560}
          submitLabel="Close"
          hideCancel
          busy={false}
          failure={null}
          onClose={close}
          onSubmit={close}
        >
          <DialogSection title="Roles held" cols={1}>
            <Field label="Roles">
              <p className={styles.permissions}>
                {me && me.roles.length ? rolesLabel(me.roles) : NO_ROLE_LABEL}
              </p>
            </Field>
          </DialogSection>
          <DialogSection title={`Effective permissions (${me?.permissions.length ?? 0})`} cols={1}>
            <Field label="Permissions">
              <p className={styles.permissions}>
                {me && me.permissions.length
                  ? [...me.permissions].sort().join('\n')
                  : 'None — no business permissions are in effect.'}
              </p>
            </Field>
          </DialogSection>
        </Dialog>
      ) : null}

      {dialog?.kind === 'session-revoke' ? (
        <Dialog
          title="Revoke session"
          description="Ends this server session immediately."
          icon="no_accounts"
          tone="bad"
          width={460}
          submitLabel="Revoke session"
          submitIcon="no_accounts"
          submitTone="danger-solid"
          busy={revokeOne.busy}
          failure={revokeOne.failure}
          onClose={close}
          onSubmit={() => revokeOne.submit(dialog.sessionId)}
          onRefresh={() => {
            void queryClient.refetchQueries({ queryKey: qk.meSessions(SESSIONS) });
            close();
          }}
        />
      ) : null}

      {dialog?.kind === 'revoke-others' ? (
        <Dialog
          title="Sign out everywhere"
          description="Revokes every session except the one you are using now."
          icon="no_accounts"
          tone="bad"
          width={500}
          submitLabel="Revoke other sessions"
          submitIcon="no_accounts"
          submitTone="danger-solid"
          busy={revokeOthers.busy}
          failure={revokeOthers.failure}
          onClose={close}
          onSubmit={() => revokeOthers.submit(undefined)}
        >
          <ul className={dialogStyles.consequences}>
            <li className={dialogStyles.consequence}>Your current session stays signed in.</li>
          </ul>
        </Dialog>
      ) : null}
    </div>
  );
}

function PhoneDialog({ onClose }: { onClose: () => void }) {
  const { me } = useAccess();
  const [phoneNumber, setPhoneNumber] = useState(me?.phoneNumber ?? '');
  const save = useActionMutation({
    op: 'profile-phone',
    mutationFn: () => meApi.updateOwnPhone({ phoneNumber: phoneNumber.trim() }),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title="Update phone number"
      description="Your phone number is required on every account."
      icon="call"
      width={460}
      submitLabel="Save"
      busy={save.busy}
      failure={save.failure}
      onClose={onClose}
      onSubmit={() => save.submit(undefined)}
    >
      <DialogSection cols={1}>
        <Field label="Phone number" required error={save.fields['phoneNumber']}>
          <input
            className={f.control}
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            maxLength={30}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            {...invalidProps(save.fields['phoneNumber'])}
          />
        </Field>
      </DialogSection>
    </Dialog>
  );
}

function PasswordDialog({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const change = useActionMutation({
    op: 'profile-password',
    mutationFn: () => meApi.changeOwnPassword({ currentPassword, newPassword }),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title="Change password"
      description="A successful change refreshes your session."
      icon="password"
      width={500}
      submitLabel="Change password"
      busy={change.busy}
      failure={change.failure}
      onClose={onClose}
      onSubmit={() => change.submit(undefined)}
    >
      <DialogSection cols={1}>
        <Field label="Current password" required error={change.fields['currentPassword']}>
          <input
            className={f.control}
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            {...invalidProps(change.fields['currentPassword'])}
          />
        </Field>
        <Field label="New password" required hint={PASSWORD_RULE} error={change.fields['newPassword']}>
          <input
            className={f.control}
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            {...invalidProps(change.fields['newPassword'])}
          />
        </Field>
      </DialogSection>
    </Dialog>
  );
}

function EmailDialog({ onClose }: { onClose: () => void }) {
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const request = useActionMutation({
    op: 'profile-email',
    mutationFn: () => meApi.requestOwnEmailChange({
      newEmail: newEmail.trim(),
      currentPassword,
    }),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title="Change login email"
      description="A confirmation link is sent to the new address. The change applies only after you confirm it."
      icon="alternate_email"
      width={520}
      submitLabel="Send confirmation"
      footnote="Your current address keeps working until confirmation."
      busy={request.busy}
      failure={request.failure}
      onClose={onClose}
      onSubmit={() => request.submit(undefined)}
    >
      <DialogSection cols={1}>
        <Field label="New email address" required error={request.fields['newEmail']}>
          <input
            className={f.control}
            type="email"
            autoComplete="email"
            maxLength={254}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            {...invalidProps(request.fields['newEmail'])}
          />
        </Field>
        <Field label="Current password" required error={request.fields['currentPassword']}>
          <input
            className={f.control}
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            {...invalidProps(request.fields['currentPassword'])}
          />
        </Field>
      </DialogSection>
    </Dialog>
  );
}
