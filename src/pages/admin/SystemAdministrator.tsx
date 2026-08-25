import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { qk } from '@/api';
import { listUsers } from '@/api/users';
import {
  cancelTransfer, initiateTransfer, listTransfers, resendTransfer,
} from '@/api/systemAdministrator';
import { ApplicationUserRole, type SystemAdministratorTransferResponse, type Uuid } from '@/api/dto';
import { toFailure } from '@/api/problem';
import { formatUtc } from '@/format';
import { useActionMutation } from '@/app/useActionMutation';
import { ReseedScope } from '@/app/reseed';
import { useNarrow } from '@/app/useViewport';
import { useAccess } from '@/permissions/usePermissions';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Dialog } from '@/ui/Dialog';
import { EmptyState } from '@/ui/EmptyState';
import { Fact, FactGrid } from '@/ui/FactGrid';
import { Field, fieldStyles as f } from '@/ui/Field';
import { Panel } from '@/ui/Panel';
import { PageHeader } from '@/ui/PageHeader';
import { RecordBanner, recordStyles as shell } from '@/ui/RecordTabs';
import table from '@/ui/table.module.css';
import dialogStyles from '@/pages/fleet/FleetDialogs.module.css';
import styles from './SystemAdministrator.module.css';

type DialogState =
  | { kind: 'initiate' }
  | { kind: 'resend'; transferId: Uuid }
  | { kind: 'cancel'; transferId: Uuid }
  | null;

const PICK = { PageSize: 100 } as const;
/** A transfer touches the transfer list, the audit trail and, on acceptance, the directory. */
const INVALIDATE = [['system-administrator'], ['security-audit'], ['users']] as const;
const REASON_HINT = 'At least 3 characters. Recorded in the audit trail.';

const isOpen = (t: SystemAdministratorTransferResponse) => !t.cancelledAtUtc && !t.acceptedAtUtc;

function PasswordField({ value, error, onChange }: {
  value: string;
  error?: string | undefined;
  onChange: (next: string) => void;
}) {
  return (
    <Field label="Your current password" error={error}>
      <input
        type="password"
        className={f.control}
        data-invalid={!!error}
        autoComplete="current-password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

function Initiate({ onClose }: { onClose: () => void }) {
  const [targetEmail, setEmail] = useState('');
  const [currentPassword, setPassword] = useState('');
  const [reason, setReason] = useState('');

  const m = useActionMutation({
    op: 'transfer-initiate',
    mutationFn: () => initiateTransfer({ targetEmail: targetEmail.trim(), currentPassword, reason: reason.trim() }),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title="Transfer System Administrator"
      description="Names another confirmed account as the next System Administrator."
      submitLabel="Initiate transfer"
      busy={m.busy}
      failure={m.failure}
      info={{
        title: 'Protected operation',
        body: 'The named account must accept using a single-use link before anything changes. Your access remains until then.',
      }}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <div className={dialogStyles.grid} data-cols="1">
        <Field label="Target account email" error={m.fields.targetEmail}>
          <input
            type="email"
            className={f.control}
            data-invalid={!!m.fields.targetEmail}
            maxLength={254}
            value={targetEmail}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <PasswordField value={currentPassword} error={m.fields.currentPassword} onChange={setPassword} />
        <Field label="Reason" hint={REASON_HINT} error={m.fields.reason}>
          <textarea
            className={f.control}
            data-invalid={!!m.fields.reason}
            rows={3}
            maxLength={1000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
      </div>
    </Dialog>
  );
}

function Resend({ transferId, onClose }: { transferId: Uuid; onClose: () => void }) {
  const [currentPassword, setPassword] = useState('');
  const m = useActionMutation({
    op: 'transfer-resend',
    mutationFn: () => resendTransfer(transferId, { currentPassword }),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title="Rotate and resend"
      description="Issues a fresh single-use token and invalidates the previous one."
      submitLabel="Rotate and resend"
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <div className={dialogStyles.grid} data-cols="1">
        <PasswordField value={currentPassword} error={m.fields.currentPassword} onChange={setPassword} />
      </div>
    </Dialog>
  );
}

function CancelTransfer({ transferId, onClose }: { transferId: Uuid; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const m = useActionMutation({
    op: 'transfer-cancel',
    mutationFn: () => cancelTransfer(transferId, { reason: reason.trim() }),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title="Cancel transfer"
      description="Withdraws the pending transfer and invalidates its token."
      submitLabel="Cancel transfer"
      submitTone="danger"
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <div className={dialogStyles.grid} data-cols="1">
        <Field label="Reason" hint={REASON_HINT} error={m.fields.reason}>
          <textarea
            className={f.control}
            data-invalid={!!m.fields.reason}
            rows={3}
            maxLength={1000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
      </div>
    </Dialog>
  );
}

export function SystemAdministrator() {
  const { can, me } = useAccess();
  const compact = useNarrow();
  const [dialog, setDialog] = useState<DialogState>(null);

  const transfers = useQuery({
    queryKey: qk.transfers,
    queryFn: listTransfers,
    enabled: can('SystemAdministration.Transfer'),
  });
  const directory = useQuery({
    queryKey: qk.users.list(PICK),
    queryFn: () => listUsers(PICK),
    enabled: can('Users.ReadDirectory'),
    staleTime: 60_000,
  });

  const rows = transfers.data?.items ?? [];
  const pending = rows.find(isOpen) ?? null;
  const failure = transfers.error ? toFailure(transfers.error) : null;

  const people = directory.data?.items ?? [];
  /**
   * The account holding the role. The directory read is the only source for it; without
   * Users.ReadDirectory the page still works and names the signed-in administrator instead.
   */
  const admin = people.find((u) => u.effectiveRoles.includes(ApplicationUserRole.SystemAdministrator)) ?? null;
  const adminName = admin
    ? `${admin.firstName} ${admin.lastName}`
    : me ? `${me.firstName} ${me.lastName}` : '—';
  const adminEmail = admin?.email ?? me?.email ?? '—';
  const adminId = admin?.id ?? me?.id ?? null;
  const person = (id: Uuid) => people.find((u) => u.id === id) ?? null;

  const state = (t: SystemAdministratorTransferResponse) => (t.acceptedAtUtc
    ? { label: 'Accepted', tone: 'ok' as const, dot: '50%' }
    : t.cancelledAtUtc
      ? { label: 'Cancelled', tone: 'mute' as const, dot: '2px' }
      : { label: 'Awaiting acceptance', tone: 'warn' as const, dot: '2px' });

  return (
    <div className={shell.page}>
      <PageHeader
        title="System Administrator"
        description="Protected transfer of the single System Administrator account. Separate from ordinary Company administration."
      />

      <RecordBanner
        tone="warn"
        icon="admin_panel_settings"
        title="Protected area"
        body="There is exactly one System Administrator. This is not an activation role and cannot be granted from the registration review queue."
      />

      <Panel
        title="Current System Administrator"
        actions={pending
          ? undefined
          : <Button label="Initiate transfer" icon="swap_horiz" tone="primary" small onClick={() => setDialog({ kind: 'initiate' })} />}
        note="Offline recovery, bootstrap and registration-expiry cleanup are operator commands, not browser workflows."
        noteIcon="terminal"
      >
        <FactGrid>
          <Fact label="Name">
            {adminId && can('Users.ReadDirectory')
              ? <Link to={`/users/${adminId}`}>{adminName}</Link>
              : adminName}
          </Fact>
          <Fact label="Email">{adminEmail}</Fact>
          <Fact label="Since" mono={!!admin?.createdAtUtc} dim>
            {admin?.createdAtUtc ? formatUtc(admin.createdAtUtc) : 'Not recorded'}
          </Fact>
        </FactGrid>
      </Panel>

      <Panel
        title="Transfers"
        description="A transfer completes only when the named account accepts with a single-use link. Times in UTC."
        note="Acceptance happens at /accept-administrator-transfer and needs the target account’s existing password."
        noteIcon="key"
      >
        {failure ? (
          <EmptyState
            icon={failure.kind === 'forbidden' ? 'lock' : 'error'}
            title={failure.kind === 'forbidden' ? 'Not available to you' : 'Transfers could not be loaded'}
            body={failure.kind === 'forbidden'
              ? 'This area needs SystemAdministration.Transfer.'
              : 'message' in failure ? failure.message : 'The request was refused.'}
            onRetry={failure.kind === 'forbidden' ? undefined : () => void transfers.refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="swap_horiz"
            title="No transfers"
            body="Initiating a transfer names another confirmed account as the next administrator."
          />
        ) : (
          <div className={table.scroll}>
            <table className={`${table.table} ${styles.transfers}`}>
              <thead>
                <tr>
                  <th scope="col" className={`${table.th} ${styles.colTarget}`}>Target</th>
                  <th scope="col" className={`${table.th} ${styles.colUtc}`}>Initiated (UTC)</th>
                  <th scope="col" className={`${table.th} ${styles.colUtc} ${table.foldTablet}`}>Expires (UTC)</th>
                  <th scope="col" className={`${table.th} ${styles.colState}`}>State</th>
                  <th scope="col" className={`${table.th} ${table.right} ${styles.colActions}`}>
                    <span className={table.srOnly}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const target = person(t.targetUserId);
                  const s = state(t);
                  return (
                    <tr key={t.id} className={table.row}>
                      <td className={`${table.td} ${table.wrap}`}>
                        <span className={table.stack}>
                          <span className={table.name}>
                            {target ? `${target.firstName} ${target.lastName}` : 'Unknown account'}
                          </span>
                          <span className={table.sub}>{target?.email ?? ''}</span>
                          <span className={`${table.subMono} ${table.showTablet}`}>
                            expires {formatUtc(t.expiresAtUtc)}
                          </span>
                        </span>
                      </td>
                      <td className={`${table.td} ${table.mono}`}>{formatUtc(t.initiatedAtUtc)}</td>
                      <td className={`${table.td} ${table.mono} ${table.dim} ${table.foldTablet}`}>
                        {formatUtc(t.expiresAtUtc)}
                      </td>
                      <td className={table.td}>
                        <Chip tone={s.tone} dot={s.dot}>{s.label}</Chip>
                      </td>
                      <td className={table.td}>
                        <span className={table.actionsCell}>
                          {isOpen(t) ? (
                            <>
                              <Button
                                label="Resend"
                                icon="forward_to_inbox"
                                small
                                compact={compact}
                                onClick={() => setDialog({ kind: 'resend', transferId: t.id })}
                              />
                              <Button
                                label="Cancel"
                                icon="cancel"
                                tone="danger"
                                small
                                compact={compact}
                                onClick={() => setDialog({ kind: 'cancel', transferId: t.id })}
                              />
                            </>
                          ) : null}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {dialog ? (
        <ReseedScope>
          {dialog.kind === 'initiate' ? <Initiate onClose={() => setDialog(null)} /> : null}
          {dialog.kind === 'resend'
            ? <Resend transferId={dialog.transferId} onClose={() => setDialog(null)} />
            : null}
          {dialog.kind === 'cancel'
            ? <CancelTransfer transferId={dialog.transferId} onClose={() => setDialog(null)} />
            : null}
        </ReseedScope>
      ) : null}
    </div>
  );
}
