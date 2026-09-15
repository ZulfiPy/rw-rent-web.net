import { useState, type FormEvent, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { me as meApi, qk } from '@/api';
import { useActionMutation } from '@/app/useActionMutation';
import { useTier } from '@/app/useViewport';
import { useAccess } from '@/permissions/usePermissions';
import { formatUtc } from '@/format';
import type { SessionResponse, Uuid } from '@/api/dto';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Dialog } from '@/ui/Dialog';
import { EmptyState } from '@/ui/EmptyState';
import { Field, fieldStyles as f, invalidProps } from '@/ui/Field';
import { PageHeader } from '@/ui/PageHeader';
import { Panel } from '@/ui/Panel';
import { recordStyles as shell } from '@/ui/RecordTabs';
import cards from '@/ui/cards.module.css';
import table from '@/ui/table.module.css';
import { AccountAlert, accountStyles as account } from './AccountLayout';
import { PASSWORD_POLICY } from './Register';

const EMPTY = '—';
const SESSIONS = { IncludeEnded: true, PageSize: 100 } as const;
const INVALIDATE = [['me'], ['sessions']] as const;

const sessionState = (s: SessionResponse) =>
  s.revokedAtUtc
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

type Confirm =
  | { kind: 'session-revoke'; sessionId: Uuid }
  | { kind: 'revoke-others' }
  | null;

/**
 * Your own account, inside the shell. Four panels in the record vocabulary: what an administrator
 * owns is read-only, what you own is a small form of its own, and your sessions read exactly as a
 * user record's do — with the one you are using marked rather than offered for revocation.
 */
export function Profile() {
  const { me } = useAccess();
  const phone = useTier() === 'phone';
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [done, setDone] = useState<string | null>(null);

  const sessions = useQuery({
    queryKey: qk.meSessions(SESSIONS),
    queryFn: () => meApi.listOwnSessions(SESSIONS),
  });

  const [phoneNumber, setPhoneNumber] = useState(me?.phoneNumber ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [passwordMismatch, setPasswordMismatch] = useState<string | undefined>(undefined);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  const savePhone = useActionMutation({
    op: 'profile-phone',
    mutationFn: () => meApi.updateOwnPhone({ phoneNumber: phoneNumber.trim() }),
    invalidate: INVALIDATE,
    onDone: () => setDone('Your phone number is saved.'),
  });

  const changePassword = useActionMutation({
    op: 'profile-password',
    mutationFn: () => meApi.changeOwnPassword({ currentPassword, newPassword }),
    invalidate: INVALIDATE,
    onDone: () => {
      setCurrentPassword('');
      setNewPassword('');
      setRepeatPassword('');
      setDone('Your password is changed. Every other session was signed out.');
    },
  });

  const requestEmail = useActionMutation({
    op: 'profile-email',
    mutationFn: () => meApi.requestOwnEmailChange({
      newEmail: newEmail.trim(),
      currentPassword: emailPassword,
    }),
    invalidate: INVALIDATE,
    onDone: () => {
      setEmailPassword('');
      setDone('Confirm the change through the link we sent to the new address.');
    },
  });

  const revokeOne = useActionMutation({
    op: 'session-revoke',
    mutationFn: (sessionId: Uuid) => meApi.revokeOwnSession(sessionId),
    invalidate: INVALIDATE,
    onDone: () => setConfirm(null),
  });

  const revokeOthers = useActionMutation({
    op: 'session-revoke-others',
    mutationFn: () => meApi.revokeOtherOwnSessions(),
    invalidate: INVALIDATE,
    onDone: () => {
      setConfirm(null);
      setDone('Every other session was signed out.');
    },
  });

  const rows = sessions.data?.items ?? [];
  /** The API marks the session this browser is using; its row is labelled, never revocable here. */
  const others = rows.filter((s) => s.isActive && !s.isCurrent).length;

  const submit = (run: () => void) => (event: FormEvent) => {
    event.preventDefault();
    setDone(null);
    run();
  };

  return (
    <div className={shell.page}>
      <PageHeader
        title="Your profile"
        description="The details of your own account, and the devices it is signed in on."
      />

      {done ? <AccountAlert tone="ok">{done}</AccountAlert> : null}

      <Panel
        title="Account"
        description="Your identity on every record you touch."
        note="Names are corrected by an administrator; ask one if yours is wrong."
        noteIcon="lock"
      >
        <form className={account.form} onSubmit={submit(() => savePhone.submit(undefined))}>
          <Field label="First name">
            <input className={f.control} value={me?.firstName ?? ''} readOnly disabled />
          </Field>
          <Field label="Last name">
            <input className={f.control} value={me?.lastName ?? ''} readOnly disabled />
          </Field>
          <Field label="Email" hint="Changing it needs a confirmation link; see Email below.">
            <input className={f.control} value={me?.email ?? ''} readOnly disabled />
          </Field>
          <Field label="Phone number" required error={savePhone.fields['phoneNumber']}>
            <input
              className={f.control}
              autoComplete="tel"
              inputMode="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              {...invalidProps(savePhone.fields['phoneNumber'])}
            />
          </Field>
          {savePhone.failure && 'message' in savePhone.failure ? (
            <AccountAlert tone="bad">{savePhone.failure.message}</AccountAlert>
          ) : null}
          <div className={account.actions}>
            <Button label="Save the phone number" tone="primary" type="submit" busy={savePhone.busy} />
          </div>
        </form>
      </Panel>

      <Panel title="Password" description="Changing it signs out every other session.">
        <form
          className={account.form}
          onSubmit={submit(() => {
            if (newPassword !== repeatPassword) {
              setPasswordMismatch('The two passwords are different.');
              return;
            }
            setPasswordMismatch(undefined);
            changePassword.submit(undefined);
          })}
        >
          <Field label="Current password" required error={changePassword.fields['currentPassword']}>
            <input
              className={f.control}
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              {...invalidProps(changePassword.fields['currentPassword'])}
            />
          </Field>
          <Field label="New password" required hint={PASSWORD_POLICY} error={changePassword.fields['newPassword']}>
            <input
              className={f.control}
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              {...invalidProps(changePassword.fields['newPassword'])}
            />
          </Field>
          <Field label="Repeat the new password" required error={passwordMismatch}>
            <input
              className={f.control}
              type="password"
              autoComplete="new-password"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              {...invalidProps(passwordMismatch)}
            />
          </Field>
          {changePassword.failure && 'message' in changePassword.failure ? (
            <AccountAlert tone="bad">{changePassword.failure.message}</AccountAlert>
          ) : null}
          <div className={account.actions}>
            <Button label="Change the password" tone="primary" type="submit" busy={changePassword.busy} />
          </div>
        </form>
      </Panel>

      <Panel
        title="Email"
        description="The new address has to confirm the change before it takes effect."
      >
        <form className={account.form} onSubmit={submit(() => requestEmail.submit(undefined))}>
          <Field label="New email" required error={requestEmail.fields['newEmail']}>
            <input
              className={f.control}
              type="email"
              autoComplete="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              {...invalidProps(requestEmail.fields['newEmail'])}
            />
          </Field>
          <Field label="Current password" required error={requestEmail.fields['currentPassword']}>
            <input
              className={f.control}
              type="password"
              autoComplete="current-password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              {...invalidProps(requestEmail.fields['currentPassword'])}
            />
          </Field>
          {requestEmail.failure && 'message' in requestEmail.failure ? (
            <AccountAlert tone="bad">{requestEmail.failure.message}</AccountAlert>
          ) : null}
          <div className={account.actions}>
            <Button label="Send the confirmation link" tone="primary" type="submit" busy={requestEmail.busy} />
          </div>
        </form>
      </Panel>

      <Panel
        title="Sessions"
        description="Every device this account is signed in on. Times in UTC."
        actions={others > 0 ? (
          <Button
            label="Sign out other sessions"
            icon="link_off"
            tone="danger"
            small
            onClick={() => setConfirm({ kind: 'revoke-others' })}
          />
        ) : undefined}
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
                      <span className={cards.sub}>{s.ipAddress ?? ''}</span>
                    </span>
                    <span className={cards.actions}>
                      {s.isCurrent ? <Chip tone="info" dot="50%">This session</Chip> : null}
                      <Chip tone={state.tone} dot={state.dot}>{state.label}</Chip>
                    </span>
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
                        onClick={() => setConfirm({ kind: 'session-revoke', sessionId: s.id })}
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
                  <th scope="col" className={table.th}>Device</th>
                  <th scope="col" className={`${table.th} ${table.foldTablet}`}>Started (UTC)</th>
                  <th scope="col" className={table.th}>Last seen (UTC)</th>
                  <th scope="col" className={table.th}>State</th>
                  <th scope="col" className={table.th}>Reason</th>
                  <th scope="col" className={`${table.th} ${table.right}`}>Actions</th>
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
                          <span className={table.subMono}>{s.ipAddress ?? ''}</span>
                        </span>
                      </td>
                      <td className={`${table.td} ${table.foldTablet}`}>
                        <span className={table.mono}>{formatUtc(s.createdAtUtc)}</span>
                      </td>
                      <td className={table.td}>
                        <span className={table.mono}>{formatUtc(s.lastSeenAtUtc)}</span>
                      </td>
                      <td className={table.td}>
                        <span className={table.stack}>
                          <Chip tone={state.tone} dot={state.dot}>{state.label}</Chip>
                          {s.isCurrent ? <span className={table.sub}>This session</span> : null}
                        </span>
                      </td>
                      <td className={`${table.td} ${table.wrap}`}>
                        <span className={table.stack}>
                          <span>{s.revocationReason ?? EMPTY}</span>
                          {s.revokedAtUtc ? (
                            <span className={table.subMono}>{formatUtc(s.revokedAtUtc)}</span>
                          ) : null}
                        </span>
                      </td>
                      <td className={`${table.td} ${table.right}`}>
                        {s.isActive && !s.isCurrent ? (
                          <Button
                            label="Revoke"
                            icon="link_off"
                            tone="danger"
                            small
                            row
                            onClick={() => setConfirm({ kind: 'session-revoke', sessionId: s.id })}
                          />
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

      {confirm?.kind === 'session-revoke' ? (
        <Dialog
          title="Revoke this session"
          icon="link_off"
          tone="bad"
          description="The device using it is signed out at once."
          submitLabel="Revoke"
          submitIcon="link_off"
          submitTone="danger-solid"
          busy={revokeOne.busy}
          failure={revokeOne.failure}
          onClose={() => setConfirm(null)}
          onSubmit={() => revokeOne.submit(confirm.sessionId)}
          onRefresh={() => {
            void queryClient.refetchQueries({ queryKey: qk.meSessions(SESSIONS) });
            setConfirm(null);
          }}
        />
      ) : null}

      {confirm?.kind === 'revoke-others' ? (
        <Dialog
          title="Sign out other sessions"
          icon="link_off"
          tone="bad"
          description={`${others} other session${others === 1 ? '' : 's'} will be signed out. This one stays.`}
          submitLabel="Sign them out"
          submitIcon="link_off"
          submitTone="danger-solid"
          busy={revokeOthers.busy}
          failure={revokeOthers.failure}
          onClose={() => setConfirm(null)}
          onSubmit={() => revokeOthers.submit(undefined)}
        />
      ) : null}
    </div>
  );
}
