import { EmptyState } from '@/ui/EmptyState';
import { PageHeader } from '@/ui/PageHeader';
import filters from '@/ui/Filters.module.css';
import list from '@/ui/list.module.css';
import { QueueList } from './QueueList';
import { useOpenWork } from './useOpenWork';

export function NeedsAttention() {
  const work = useOpenWork();

  return (
    <>
      <PageHeader
        title="Needs attention"
        description="Every record with an open decision or an unclosed timeline, in one queue."
      />

      <section className={list.panel}>
        <div className={filters.toolbar}>
          <span className={filters.count}>
            {work.isPending
              ? ''
              : `${work.items.length} item${work.items.length === 1 ? '' : 's'} · oldest first`}
          </span>
        </div>

        {work.items.length === 0 ? (
          <EmptyState
            icon={work.isPending ? 'hourglass_top' : 'task_alt'}
            title={work.isPending ? 'Loading the queue' : 'Nothing waiting'}
            body={work.isPending
              ? 'Reading the registrations, rentals and interruptions you can see.'
              : 'Registrations to review, open interruptions and handovers inside three days appear here.'}
          />
        ) : (
          <QueueList items={work.items} />
        )}
      </section>
    </>
  );
}
