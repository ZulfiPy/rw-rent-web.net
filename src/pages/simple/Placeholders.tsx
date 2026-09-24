import { PageHeader } from '@/ui/PageHeader';
import { INSURANCE, INSURANCE_NOTICE } from '@/pages/overview/sample';
import { SimpleQueue } from './SimpleQueue';

/**
 * Insurance cases as the prototype shows them: the real layout, sample rows, and the "Under
 * development" notice that says so. No backend exists for it, so nothing here is creatable,
 * assignable or closeable. Tasks left this file in Follow-up 12, for its own pages under
 * `src/pages/tasks`; Insurance cases stays as it is, by the owner's decision.
 */
export function InsuranceCases() {
  return (
    <>
      <PageHeader title="Insurance cases" description="Claims and policy records tied to fleet vehicles." />
      <SimpleQueue
        notice={INSURANCE_NOTICE}
        heading="Unresolved cases"
        sub="Claims and policies with an action outstanding."
        count={`${INSURANCE.length} ${INSURANCE.length === 1 ? 'case' : 'cases'}`}
        rows={INSURANCE}
        emptyIcon="verified_user"
        emptyTitle="No open cases"
      />
    </>
  );
}
