import { PageHeader } from '@/ui/PageHeader';
import { useOpenWork } from './useOpenWork';
import { SimpleQueue } from '../simple/SimpleQueue';

export function NeedsAttention() {
  const work = useOpenWork();

  return (
    <>
      <PageHeader
        title="Needs attention"
        description="Every record with an open decision or an unclosed timeline, in one queue."
      />
      <SimpleQueue
        heading="Open queue"
        sub="Sorted by how long the record has been waiting."
        count={`${work.items.length} ${work.items.length === 1 ? 'item' : 'items'}`}
        rows={work.items}
        emptyIcon={work.isPending ? 'hourglass_top' : 'task_alt'}
        emptyTitle={work.isPending ? 'Loading the queue' : 'Nothing waiting'}
        {...(work.isPending
          ? {}
          : { emptyBody: 'No registrations to review and no open interruptions across active assignments.' })}
      />
    </>
  );
}
