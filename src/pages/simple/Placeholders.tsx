import { PageHeader } from '@/ui/PageHeader';
import { INSURANCE, INSURANCE_NOTICE, TASKS, TASKS_NOTICE } from '@/pages/overview/sample';
import { SimpleQueue } from './SimpleQueue';

/**
 * Tasks and Insurance cases as the prototype shows them: the real layout, sample rows, and the
 * "Under development" notice that says so. No backend exists for either, so nothing here is
 * creatable, assignable or closeable.
 */
export function Tasks() {
  return (
    <>
      <PageHeader title="Tasks" description="Work items linked to an assignment or a vehicle." />
      <SimpleQueue
        notice={TASKS_NOTICE}
        heading="Open tasks"
        sub="Work items linked to an assignment or a vehicle."
        count={`${TASKS.length} open`}
        rows={TASKS}
        emptyIcon="task_alt"
        emptyTitle="No open tasks"
      />
    </>
  );
}

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
