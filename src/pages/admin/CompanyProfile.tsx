import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/api';
import { createCompany, deleteCompany, getCompany, updateCompany } from '@/api/companies';
import type { CompanyResponse } from '@/api/dto';
import { isApiError, toFailure } from '@/api/problem';
import { formatLocal } from '@/format';
import { useActionMutation } from '@/app/useActionMutation';
import { ReseedScope } from '@/app/reseed';
import { useAccess } from '@/permissions/usePermissions';
import { Button } from '@/ui/Button';
import { Dialog } from '@/ui/Dialog';
import { Fact, FactGrid } from '@/ui/FactGrid';
import { Field, fieldStyles as f } from '@/ui/Field';
import { Panel } from '@/ui/Panel';
import { PageHeader } from '@/ui/PageHeader';
import { RecordBanner, recordStyles as shell } from '@/ui/RecordTabs';
import dialogStyles from '@/pages/fleet/FleetDialogs.module.css';

type DialogState = { kind: 'create' } | { kind: 'edit' } | { kind: 'delete' } | null;

const INVALIDATE = [['company'], ['security-audit']] as const;

function CompanyForm({ company, onClose }: { company: CompanyResponse | null; onClose: () => void }) {
  const editing = !!company;
  const [name, setName] = useState(company?.name ?? '');
  const [registrationNumber, setReg] = useState(company?.registrationNumber ?? '');
  const [vatNumber, setVat] = useState(company?.vatNumber ?? '');
  const [email, setEmail] = useState(company?.email ?? '');
  const [phoneNumber, setPhone] = useState(company?.phoneNumber ?? '');
  const [legalAddress, setAddress] = useState(company?.legalAddress ?? '');

  const body = () => ({
    name: name.trim(),
    registrationNumber: registrationNumber.trim(),
    vatNumber: vatNumber.trim() || null,
    legalAddress: legalAddress.trim(),
    email: email.trim(),
    phoneNumber: phoneNumber.trim() || null,
  });

  const m = useActionMutation({
    op: editing ? 'company-edit' : 'company-create',
    mutationFn: () => (company ? updateCompany(company.id, body()) : createCompany(body())),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title={editing ? 'Edit Company profile' : 'Create operating Company'}
      icon="apartment"
      tone="accent"
      width={640}
      description={editing
        ? undefined
        : 'There is exactly one operating Company. Setup completes once the first non-expiring Company Principal is activated.'}
      submitLabel={editing ? 'Save changes' : 'Create Company'}
      busy={m.busy}
      failure={m.failure}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <div className={dialogStyles.section}>
        <p className={dialogStyles.sectionTitle}>Legal identity</p>
        <div className={dialogStyles.grid} data-cols="2">
          <Field label="Company name" error={m.fields.name}>
            <input className={f.control} data-invalid={!!m.fields.name} maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Registration number" error={m.fields.registrationNumber}>
            <input className={`${f.control} ${f.mono}`} data-invalid={!!m.fields.registrationNumber} maxLength={50} value={registrationNumber} onChange={(e) => setReg(e.target.value)} />
          </Field>
          <Field label="VAT number" optional error={m.fields.vatNumber}>
            <input className={`${f.control} ${f.mono}`} data-invalid={!!m.fields.vatNumber} maxLength={50} value={vatNumber} onChange={(e) => setVat(e.target.value)} />
          </Field>
          <Field label="Email" error={m.fields.email}>
            <input type="email" className={f.control} data-invalid={!!m.fields.email} maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Phone number" optional error={m.fields.phoneNumber}>
            <input type="tel" className={f.control} data-invalid={!!m.fields.phoneNumber} maxLength={30} value={phoneNumber} onChange={(e) => setPhone(e.target.value)} />
          </Field>
        </div>
      </div>
      <div className={dialogStyles.section}>
        <p className={dialogStyles.sectionTitle}>Address</p>
        <div className={dialogStyles.grid} data-cols="1">
          <Field label="Legal address" error={m.fields.legalAddress}>
            <textarea className={f.control} data-invalid={!!m.fields.legalAddress} rows={2} maxLength={2000} value={legalAddress} onChange={(e) => setAddress(e.target.value)} />
          </Field>
        </div>
      </div>
    </Dialog>
  );
}

function DeleteCompany({ company, onClose }: { company: CompanyResponse; onClose: () => void }) {
  const m = useActionMutation({
    op: 'company-delete',
    mutationFn: () => deleteCompany(company.id),
    invalidate: INVALIDATE,
    onDone: onClose,
  });

  return (
    <Dialog
      title="Delete Company"
      icon="delete"
      tone="bad"
      width={520}
      description="Only possible while the Company is completely unreferenced."
      submitLabel="Delete Company"
      submitTone="danger"
      busy={m.busy}
      failure={m.failure}
      info={{
        title: 'This exists for a mistaken creation',
        body: 'If any user, vehicle, customer, driver or assignment references the Company, the API refuses the delete with a conflict.',
      }}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <ul className={dialogStyles.consequences}>
        <li className={dialogStyles.consequence}>The operating Company record is removed permanently.</li>
        <li className={dialogStyles.consequence}>
          A System Administrator must create the Company again before the platform can be used.
        </li>
      </ul>
    </Dialog>
  );
}

export function CompanyProfile() {
  const { can } = useAccess();
  const [dialog, setDialog] = useState<DialogState>(null);

  const company = useQuery({ queryKey: qk.company, queryFn: getCompany, retry: false });
  const co = company.data;
  const failure = company.error ? toFailure(company.error) : null;
  /** 404 is the first-run state, not an error: no operating Company has been created yet. */
  const missing = isApiError(company.error) && company.error.status === 404;

  const canCreate = can('Company.Create');
  const canUpdate = can('Company.Update');
  const canDelete = can('Company.Delete');

  /** The prototype keeps these on the Legal identity panel, not in the header bar. */
  const identityActions = co ? (
    <>
      {canUpdate ? <Button label="Edit" icon="edit" tone="primary" small onClick={() => setDialog({ kind: 'edit' })} /> : null}
      {canDelete ? (
        <Button label="Delete" icon="delete" tone="danger" small hint="Only while completely unreferenced" onClick={() => setDialog({ kind: 'delete' })} />
      ) : null}
    </>
  ) : undefined;

  return (
    <div className={shell.page}>
      <PageHeader
        title="Company profile"
        description="One operating Company. Its details appear on every record created by this platform."
      />

      {missing ? (
        <>
          <RecordBanner
            tone="warn"
            icon="construction"
            title="First-run setup"
            body="No operating Company exists yet. Only a System Administrator can create it, and setup stays incomplete until the first non-expiring Company Principal is activated."
          />
          <Panel
            title="Set up the operating Company"
            description="One Company record underpins every user, vehicle, customer and assignment."
            actions={canCreate
              ? <Button label="Create Company" icon="add" tone="primary" small onClick={() => setDialog({ kind: 'create' })} />
              : undefined}
            note={canCreate ? null : 'Only a System Administrator can create the operating Company.'}
            noteIcon="lock"
          >
            <FactGrid>
              <Fact label="Step 1 · Company record">Not created</Fact>
              <Fact label="Step 2 · First Company Principal" dim>Waiting for step 1</Fact>
              <Fact label="Step 3 · Operational use" dim>Locked</Fact>
            </FactGrid>
          </Panel>
        </>
      ) : failure ? (
        <Panel title="Company profile">
          <FactGrid>
            <Fact label="Not available" span="full">
              {failure.kind === 'forbidden'
                ? 'Reading the Company needs Company.Read.'
                : 'message' in failure ? failure.message : 'The record could not be loaded.'}
            </Fact>
          </FactGrid>
        </Panel>
      ) : (
        <>
          <Panel
            title="Legal identity"
            actions={identityActions}
            note={canUpdate ? null : 'Read-only: editing the Company requires Fleet Manager.'}
            noteIcon="lock"
          >
            <FactGrid>
              <Fact label="Company name">{co?.name ?? '—'}</Fact>
              <Fact label="Registration number" mono>{co?.registrationNumber ?? '—'}</Fact>
              <Fact label="VAT number" mono dim={!co?.vatNumber}>{co?.vatNumber ?? 'Not recorded'}</Fact>
              <Fact label="Email">{co?.email ?? '—'}</Fact>
              <Fact label="Phone" mono dim={!co?.phoneNumber}>{co?.phoneNumber ?? 'Not recorded'}</Fact>
            </FactGrid>
          </Panel>

          <Panel title="Address">
            <FactGrid>
              <Fact label="Legal address" span="full">{co?.legalAddress ?? '—'}</Fact>
            </FactGrid>
          </Panel>

          <Panel
            title="Record"
            note="There is exactly one operating Company. It is never presented as a multi-row list."
          >
            <FactGrid>
              <Fact label="Created" mono dim>{formatLocal(co?.createdAtUtc)}</Fact>
              <Fact label="Last updated" mono={!!co?.updatedAtUtc} dim>
                {co?.updatedAtUtc ? formatLocal(co.updatedAtUtc) : 'Never'}
              </Fact>
            </FactGrid>
          </Panel>
        </>
      )}

      {dialog ? (
        <ReseedScope>
          {dialog.kind === 'delete' && co
            ? <DeleteCompany company={co} onClose={() => setDialog(null)} />
            : <CompanyForm company={dialog.kind === 'edit' ? co ?? null : null} onClose={() => setDialog(null)} />}
        </ReseedScope>
      ) : null}
    </div>
  );
}
