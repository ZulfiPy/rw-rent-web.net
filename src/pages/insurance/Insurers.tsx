import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { qk } from '@/api';
import { listInsurers } from '@/api/insurers';
import type { InsurerListItemResponse, InsurerQuery, Uuid } from '@/api/dto';
import { toFailure } from '@/api/problem';
import { INSURERS_DESCRIPTION, NO_INSURERS, insurerCount, mailHref, telHref } from '@/format';
import { useTier } from '@/app/useViewport';
import { ReseedScope } from '@/app/reseed';
import { useAccess } from '@/permissions/usePermissions';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { SelectFilter, type FilterOption } from '@/ui/Filters';
import { PageHeader } from '@/ui/PageHeader';
import cards from '@/ui/cards.module.css';
import filters from '@/ui/Filters.module.css';
import list from '@/ui/list.module.css';
import table from '@/ui/table.module.css';
import { CASES_MANAGE, CASES_READ, casesHandledByHref } from './caseAddress';
import { InsurerForm, InsurerToggle } from './InsurerDialogs';
import { OutOfUseChip } from './InsurerPicker';
import styles from './Insurers.module.css';

/**
 * The Insurers page (Follow-up 18, F18-2b): the list the company keeps, so that a case names
 * "absolutely the same insurer if it's the same insurer". Everyone who reads cases sees it; whoever
 * manages cases adds an insurer, edits it and puts it out of use or back, each through its own window.
 * Each insurer shows the open cases it handles, a link to the cases list filtered to it, and how many
 * cases name it; the server counts both. Show picks In use (the default), Out of use or All, in the
 * address. Nothing deletes an insurer: one no longer used is put out of use and kept on its cases.
 */

type Show = { id: string; label: string; query: InsurerQuery };

/** Show's three choices; In use is the bare address. */
const SHOWS: readonly Show[] = [
  { id: '', label: 'In use', query: { IsActive: true } },
  { id: 'out', label: 'Out of use', query: { IsActive: false } },
  { id: 'all', label: 'All', query: {} },
];
const SHOW_OPTIONS: FilterOption[] = SHOWS.map((show) => ({ value: show.id, label: show.label }));

type InsurerDialog = { kind: 'add' } | { kind: 'edit'; id: Uuid } | { kind: 'toggle'; id: Uuid };

/** Open cases it handles: a link to them on the cases list, a plain 0 when there are none. */
function OpenCases({ insurer }: { insurer: InsurerListItemResponse }) {
  if (!insurer.openCasesHandled) return <span className={`${styles.number} ${styles.dim}`}>0</span>;
  return (
    <Link
      to={casesHandledByHref(insurer.id)}
      className={styles.openLink}
      aria-label={`${insurer.openCasesHandled} open ${insurer.openCasesHandled === 1 ? 'case' : 'cases'} handled by ${insurer.name}`}
    >
      {insurer.openCasesHandled}
    </Link>
  );
}

function Email({ insurer }: { insurer: InsurerListItemResponse }) {
  return insurer.email
    ? <a className={styles.contact} href={mailHref(insurer.email)}>{insurer.email}</a>
    : <span className={styles.dim}>—</span>;
}

function Phone({ insurer }: { insurer: InsurerListItemResponse }) {
  return insurer.phoneNumber
    ? <a className={`${styles.contact} ${styles.number}`} href={telHref(insurer.phoneNumber)}>{insurer.phoneNumber}</a>
    : <span className={styles.dim}>—</span>;
}

function Name({ insurer }: { insurer: InsurerListItemResponse }) {
  return (
    <span className={styles.nameLine}>
      <span className={`${table.name} ${styles.nameText}`}>{insurer.name}</span>
      {insurer.isActive ? null : <OutOfUseChip />}
    </span>
  );
}

/** Edit, and Put out of use or Put back in use, for a holder of `InsuranceCases.Manage`. */
function Actions({ insurer, block, onDialog }: {
  insurer: InsurerListItemResponse;
  block?: boolean;
  onDialog: (dialog: InsurerDialog) => void;
}) {
  return (
    <>
      <Button label="Edit" icon="edit" small row={!block} block={block} onClick={() => onDialog({ kind: 'edit', id: insurer.id })} />
      <Button
        label={insurer.isActive ? 'Put out of use' : 'Put back in use'}
        icon={insurer.isActive ? 'toggle_off' : 'toggle_on'}
        small
        row={!block}
        block={block}
        onClick={() => onDialog({ kind: 'toggle', id: insurer.id })}
      />
    </>
  );
}

export function Insurers() {
  const [params, setParams] = useSearchParams();
  const { can } = useAccess();
  const phone = useTier() === 'phone';
  const allowed = can(CASES_READ);
  const manages = can(CASES_MANAGE);
  const [dialog, setDialog] = useState<InsurerDialog | null>(null);

  const show = SHOWS.find((choice) => choice.id === (params.get('show') ?? '')) ?? SHOWS[0]!;
  const shown = useQuery({ queryKey: qk.insurers.list(show.query), queryFn: () => listInsurers(show.query), enabled: allowed });
  // The whole list: whether the company has any insurer yet, and the look-alikes of the windows.
  const all = useQuery({ queryKey: qk.insurers.list({}), queryFn: () => listInsurers({}), enabled: allowed });

  const setShow = (next: string) => {
    const merged = new URLSearchParams(params);
    if (next) merged.set('show', next);
    else merged.delete('show');
    setParams(merged, { replace: true });
  };

  const header = (
    <PageHeader
      title="Insurers"
      description={INSURERS_DESCRIPTION}
      crumbs={[{ label: 'Insurance cases', to: '/insurance-cases' }, { label: 'Insurers' }]}
      actionsKey={String(manages)}
      actions={manages ? <Button label="Add insurer" icon="add" tone="primary" onClick={() => setDialog({ kind: 'add' })} /> : undefined}
    />
  );

  const failure = shown.error ? toFailure(shown.error) : null;
  if (!allowed || failure?.kind === 'forbidden') {
    return (
      <>
        {header}
        <EmptyState icon="lock" title="Not available to you" body={`Opening this page needs ${CASES_READ}.`} />
      </>
    );
  }

  const rows = shown.data ?? [];
  const none = all.data?.length === 0;
  const outOfUse = (all.data ?? []).filter((insurer) => !insurer.isActive).length;
  const target = dialog && dialog.kind !== 'add'
    ? rows.find((insurer) => insurer.id === dialog.id) ?? all.data?.find((insurer) => insurer.id === dialog.id)
    : undefined;

  const emptyState = none ? (
    <EmptyState
      icon="shield"
      title={NO_INSURERS}
      body="Add the insurers the company works with."
      action={manages ? { label: 'Add insurer', icon: 'add', onClick: () => setDialog({ kind: 'add' }) } : undefined}
    />
  ) : show.id === '' ? (
    <EmptyState
      icon="toggle_off"
      title="No insurers in use"
      body={`${insurerCount(outOfUse)} out of use ${outOfUse === 1 ? 'is' : 'are'} under Out of use.`}
      action={{ label: 'Show out of use', icon: 'visibility', onClick: () => setShow('out') }}
    />
  ) : (
    <EmptyState icon="toggle_on" title="No insurers out of use" body="Every insurer on the list is in use." />
  );

  return (
    <>
      {header}

      <section className={list.panel}>
        <div className={filters.toolbar}>
          <SelectFilter value={show.id} options={SHOW_OPTIONS} label="Show" onChange={setShow} />
          <span className={filters.spacer} />
          <span className={filters.count}>{shown.data ? insurerCount(rows.length) : ''}</span>
        </div>

        {failure ? (
          <EmptyState
            icon="error"
            title="The insurers could not be loaded"
            body={'message' in failure ? failure.message : 'The request was refused.'}
            onRetry={() => void shown.refetch()}
          />
        ) : shown.data && rows.length === 0 ? (
          emptyState
        ) : phone ? (
          <div className={cards.cards}>
            {rows.map((insurer) => (
              <div key={insurer.id} className={`${cards.card} ${styles.card}`}>
                <div className={cards.head}>
                  <span className={cards.heading}>
                    <span className={cards.title}>{insurer.name}</span>
                  </span>
                  {insurer.isActive ? null : <OutOfUseChip />}
                </div>
                <div className={styles.cardFacts}>
                  <span className={`${cards.fact} ${cards.cardFactFull}`}>
                    <span className={cards.factLabel}>Email</span>
                    <span className={cards.factValue}><Email insurer={insurer} /></span>
                  </span>
                  <span className={`${cards.fact} ${cards.cardFactFull}`}>
                    <span className={cards.factLabel}>Phone</span>
                    <span className={cards.factValue}><Phone insurer={insurer} /></span>
                  </span>
                  <span className={cards.fact}>
                    <span className={cards.factLabel}>Open cases it handles</span>
                    <span className={cards.factValue}><OpenCases insurer={insurer} /></span>
                  </span>
                  <span className={`${cards.fact} ${cards.cardFactEnd}`}>
                    <span className={cards.factLabel}>Cases</span>
                    <span className={`${cards.factValue} ${styles.number}`}>{insurer.casesNamed}</span>
                  </span>
                </div>
                {manages ? (
                  <div className={cards.actions}>
                    <Actions insurer={insurer} block onDialog={setDialog} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className={table.scroll}>
            <table className={`${table.table} ${styles.table}`}>
              <thead>
                <tr>
                  <th scope="col" className={`${table.th} ${styles.cName}`}>Name</th>
                  <th scope="col" className={`${table.th} ${styles.cEmail} ${table.foldWide}`}>Email</th>
                  <th scope="col" className={`${table.th} ${styles.cPhone} ${table.foldWide}`}>Phone</th>
                  <th scope="col" className={`${table.th} ${styles.cOpen}`}>Open cases it handles</th>
                  <th scope="col" className={`${table.th} ${styles.cCases}`}>Cases</th>
                  {manages ? (
                    <th scope="col" className={`${table.th} ${table.right} ${styles.cActions}`}>
                      <span className={table.srOnly}>Actions</span>
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((insurer) => (
                  <tr key={insurer.id} className={table.row}>
                    <td className={table.td}>
                      <span className={table.stack}>
                        <Name insurer={insurer} />
                        {/* Below 1280: Email and Phone come under the name. */}
                        {insurer.email ? <span className={`${table.sub} ${table.showWide}`}><Email insurer={insurer} /></span> : null}
                        {insurer.phoneNumber ? <span className={`${table.sub} ${table.showWide}`}><Phone insurer={insurer} /></span> : null}
                      </span>
                    </td>
                    <td className={`${table.td} ${table.foldWide}`}><Email insurer={insurer} /></td>
                    <td className={`${table.td} ${table.foldWide}`}><Phone insurer={insurer} /></td>
                    <td className={table.td}><OpenCases insurer={insurer} /></td>
                    <td className={table.td}><span className={styles.number}>{insurer.casesNamed}</span></td>
                    {manages ? (
                      <td className={`${table.td} ${table.right}`}>
                        <span className={table.actionsCell}>
                          <Actions insurer={insurer} onDialog={setDialog} />
                        </span>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {dialog ? (
        <ReseedScope>
          {dialog.kind === 'add' ? <InsurerForm insurers={all.data} onClose={() => setDialog(null)} />
            : !target ? null
              : dialog.kind === 'edit' ? <InsurerForm insurer={target} insurers={all.data} onClose={() => setDialog(null)} />
                : <InsurerToggle insurer={target} onClose={() => setDialog(null)} />}
        </ReseedScope>
      ) : null}
    </>
  );
}
