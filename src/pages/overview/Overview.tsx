import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { qk } from '@/api';
import { getOverviewSummary } from '@/api/overview';
import { useAccess } from '@/permissions/usePermissions';
import { EmptyState } from '@/ui/EmptyState';
import { PageHeader } from '@/ui/PageHeader';
import type { Tone } from '@/ui/status';
import { QueueList } from './QueueList';
import { useOpenWork } from './useOpenWork';
import styles from './Overview.module.css';

/** The overview shows the head of the queue; the full list is one click away. */
const PREVIEW = 5;

interface Metric {
  key: string;
  icon: string;
  tone: Tone;
  label: string;
  value: number | null;
  unit: string;
  to: string;
}

export function Overview() {
  const { can } = useAccess();
  const summary = useQuery({ queryKey: qk.overview, queryFn: getOverviewSummary });
  const work = useOpenWork();
  const s = summary.data;

  // One card per count the persona may read; a card whose probe was refused shows an em dash rather
  // than a zero, because zero would be a claim the API never made.
  const metrics: Metric[] = [];
  if (can('RentalAssignments.Read')) {
    metrics.push({
      key: 'active', icon: 'play_circle', tone: 'ok', label: 'Active assignments',
      value: s?.activeAssignments ?? null, unit: 'running now', to: '/rental-assignments?status=1',
    });
    metrics.push({
      key: 'planned', icon: 'event_upcoming', tone: 'info', label: 'Planned, not started',
      value: s?.plannedAssignments ?? null, unit: 'awaiting handover', to: '/rental-assignments?status=4',
    });
  }
  if (can('Vehicles.Read')) {
    metrics.push({
      key: 'vehicles', icon: 'directions_car', tone: 'plain', label: 'Vehicles in service',
      value: s?.activeVehicles ?? null, unit: 'active in the fleet', to: '/vehicles?active=true',
    });
  }
  if (can('Users.ReviewRegistrations')) {
    metrics.push({
      key: 'registrations', icon: 'how_to_reg', tone: 'warn', label: 'Registrations to review',
      value: s?.pendingRegistrations ?? null, unit: 'confirmed, awaiting a decision', to: '/registrations',
    });
  }
  if (can('Interruptions.Read') && can('RentalAssignments.Read')) {
    metrics.push({
      key: 'interruptions', icon: 'pause_circle', tone: 'bad', label: 'Open interruptions',
      value: work.openInterruptions, unit: 'unclosed on an active rental', to: '/rental-assignments?status=1',
    });
  }

  const preview = work.items.slice(0, PREVIEW);

  return (
    <>
      <PageHeader title="Overview" description="Your fleet, rentals, and pending work at a glance." />

      <div className={styles.stack}>
        {metrics.length > 0 ? (
          <div className={styles.metrics}>
            {metrics.map((m) => (
              <Link key={m.key} to={m.to} className={styles.card}>
                <span className={styles.head}>
                  <span className={styles.icon} data-tone={m.tone}>
                    <span data-icon aria-hidden="true">{m.icon}</span>
                  </span>
                  <span className={styles.label}>{m.label}</span>
                </span>
                <span className={styles.value}>
                  <span className={styles.count}>{m.value === null ? '—' : m.value}</span>
                  <span className={styles.unit}>{m.unit}</span>
                </span>
              </Link>
            ))}
          </div>
        ) : null}

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div className={styles.heading}>
              <h2 className={styles.title}>Needs attention</h2>
              <p className={styles.desc}>Records with an open decision or an unclosed timeline.</p>
            </div>
            {work.items.length > preview.length ? (
              <Link to="/needs-attention" className={styles.more}>
                All {work.items.length}
                <span data-icon aria-hidden="true" className={styles.moreIcon}>arrow_forward</span>
              </Link>
            ) : null}
          </div>

          {preview.length === 0 ? (
            <EmptyState
              icon="task_alt"
              title={work.isPending ? 'Loading the queue' : 'Nothing waiting'}
              body={work.isPending
                ? 'Reading the registrations, rentals and interruptions you can see.'
                : 'Registrations to review, open interruptions and imminent handovers appear here.'}
            />
          ) : (
            <QueueList items={preview} />
          )}
        </section>
      </div>
    </>
  );
}
