import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { qk } from '@/api';
import { listAssignments } from '@/api/rentalAssignments';
import { listVehicles } from '@/api/vehicles';
import { listSecurityAudit } from '@/api/securityAudit';
import { AssignmentStatus, type VehicleListItemResponse } from '@/api/dto';
import { ASSIGNMENT_STATUS_LABEL, eventLabel, formatUtcHuman } from '@/format';
import { useAccess } from '@/permissions/usePermissions';
import { PageHeader } from '@/ui/PageHeader';
import { useOpenWork } from './useOpenWork';
import { INSURANCE, SAMPLE_CHIP, TASKS, type SampleRow } from './sample';
import styles from './Overview.module.css';

const PICK = { PageSize: 100 } as const;

interface Metric {
  key: string;
  icon: string;
  color: string;
  label: string;
  value: string;
  unit: string;
  to: string;
}

/** The prototype's four mix segments, in its order, with its colours and dot shapes. */
const MIX: Array<{ status: AssignmentStatus; color: string; shape: string }> = [
  { status: AssignmentStatus.Active, color: 'var(--ok)', shape: '50%' },
  { status: AssignmentStatus.Planned, color: 'var(--info)', shape: '2px' },
  { status: AssignmentStatus.Ended, color: 'var(--mute)', shape: '1px' },
  { status: AssignmentStatus.Cancelled, color: 'var(--bad)', shape: '50% 50% 50% 0' },
];

function SampleRows({ rows }: { rows: SampleRow[] }) {
  return (
    <>
      {rows.map((r) => (
        <div key={r.id} className={styles.row}>
          <span className={styles.tile} data-tone={r.tone === 'plain' ? undefined : r.tone}>
            <span data-icon aria-hidden="true">{r.icon}</span>
          </span>
          <span className={styles.rowText}>
            <span className={styles.rowTitle}>{r.title}</span>
            <span className={styles.rowSub}>{r.sub}</span>
          </span>
          <span className={styles.when}>{r.when}</span>
        </div>
      ))}
    </>
  );
}

export function Overview() {
  const { can } = useAccess();
  const work = useOpenWork();

  const mayReadAssignments = can('RentalAssignments.Read');
  const mayReadVehicles = can('Vehicles.Read');
  const mayReadAudit = can('SecurityAudit.ReadCompany');

  // One page of assignments feeds both the mix and the metric denominators.
  const assignments = useQuery({
    queryKey: qk.assignments.list(PICK),
    queryFn: () => listAssignments(PICK),
    enabled: mayReadAssignments,
  });
  const vehicles = useQuery({
    queryKey: qk.vehicles.list(PICK),
    queryFn: () => listVehicles(PICK),
    enabled: mayReadVehicles,
  });
  const audit = useQuery({
    queryKey: qk.audit.list({ PageSize: 5 }),
    queryFn: () => listSecurityAudit({ PageSize: 5 }),
    enabled: mayReadAudit,
  });

  const rows = assignments.data?.items ?? [];
  const totalAssignments = assignments.data?.totalCount ?? rows.length;
  const heldNow = new Set(
    rows.filter((a) => a.status === AssignmentStatus.Active).map((a) => a.vehicleId),
  );

  /** The prototype's availability(): retired, in use, reserved, otherwise available. */
  const isAvailable = (v: VehicleListItemResponse) =>
    v.isActive && !heldNow.has(v.id) && !v.upcomingPlannedStartAtUtc;
  const fleet = vehicles.data?.items ?? [];
  const activeVehicles = fleet.filter((v) => v.isActive).length;

  // metricsModel(): the permitted counts in order, capped at four, then the two sample cards.
  const metrics: Metric[] = [];
  if (mayReadAssignments) {
    metrics.push({
      key: 'act', icon: 'play_circle', color: 'var(--ok)', label: 'Active assignments',
      value: String(work.activeAssignments), unit: `of ${totalAssignments}`,
      to: `/rental-assignments?status=${AssignmentStatus.Active}`,
    });
    metrics.push({
      key: 'pl', icon: 'event_upcoming', color: 'var(--info)', label: 'Planned, not started',
      value: String(work.plannedAssignments), unit: 'assignments',
      to: `/rental-assignments?status=${AssignmentStatus.Planned}`,
    });
  }
  if (mayReadVehicles) {
    metrics.push({
      key: 'veh', icon: 'directions_car', color: 'var(--fg-2)', label: 'Vehicles available',
      value: String(fleet.filter(isAvailable).length), unit: `of ${activeVehicles} active`,
      to: '/vehicles?active=true',
    });
  }
  if (can('Users.ReviewRegistrations')) {
    metrics.push({
      key: 'reg', icon: 'how_to_reg', color: 'var(--warn)', label: 'Registrations to review',
      value: String(work.pendingRegistrations), unit: 'confirmed', to: '/registrations',
    });
  }
  if (can('Interruptions.Read')) {
    metrics.push({
      key: 'int', icon: 'pause_circle', color: 'var(--bad)', label: 'Open interruptions',
      value: String(work.openInterruptions), unit: 'unclosed',
      to: `/rental-assignments?status=${AssignmentStatus.Active}`,
    });
  }
  const cards = metrics.slice(0, 4);
  cards.push({
    key: 'task', icon: 'checklist', color: 'var(--info)', label: 'Open tasks',
    value: String(TASKS.length), unit: 'unfinished', to: '/tasks',
  });
  cards.push({
    key: 'ins', icon: 'policy', color: 'var(--warn)', label: 'Unresolved insurance cases',
    value: String(INSURANCE.length), unit: 'cases', to: '/insurance-cases',
  });

  const mixTotal = totalAssignments || 1;
  const mix = MIX.map((m) => {
    const count = rows.filter((a) => a.status === m.status).length;
    return {
      ...m,
      count,
      label: ASSIGNMENT_STATUS_LABEL[m.status],
      pct: `${Math.round((count / mixTotal) * 100)}%`,
    };
  });

  // Newest first, explicitly: the card's title promises recency (see README's deviation note).
  const activity = (audit.data?.items ?? [])
    .slice()
    .sort((x, y) => (x.occurredAtUtc < y.occurredAtUtc ? 1 : x.occurredAtUtc > y.occurredAtUtc ? -1 : 0))
    .slice(0, 5)
    .map((a) => ({
    id: a.id,
    event: eventLabel(a.eventType),
    when: formatUtcHuman(a.occurredAtUtc),
    tint: /Failed|Suspend/.test(a.eventType)
      ? 'var(--bad)'
      : /Correct/.test(a.eventType) ? 'var(--warn)' : 'var(--accent)',
  }));

  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  return (
    <>
      <PageHeader title="Overview" description="Your fleet, rentals, and pending work at a glance." />

      <div className={styles.metrics}>
        {cards.map((m) => (
          <Link key={m.key} to={m.to} className={styles.card}>
            <span className={styles.cardHead}>
              <span data-icon aria-hidden="true" className={styles.cardIcon} style={{ color: m.color }}>{m.icon}</span>
              <span className={styles.cardLabel}>{m.label}</span>
            </span>
            <span className={styles.cardValue}>
              <span className={styles.count}>{m.value}</span>
              <span className={styles.unit}>{m.unit}</span>
            </span>
            <span className={styles.cardFoot}>
              <span data-icon aria-hidden="true" className={styles.cardArrow}>arrow_forward</span>
            </span>
          </Link>
        ))}
      </div>

      <div className={styles.grid}>
        <div className={styles.column}>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div className={styles.heading}>
                <h2 className={styles.title}>Needs attention</h2>
                <p className={styles.desc}>Records with an open decision or an unclosed timeline.</p>
              </div>
              <span className={styles.count2}>{plural(work.items.length, 'item', 'items')}</span>
            </div>
            {work.items.length === 0 ? (
              <div className={styles.empty}>
                <span data-icon aria-hidden="true" className={styles.emptyIcon}>task_alt</span>
                <div className={styles.emptyTitle}>Nothing waiting</div>
                <p className={styles.emptyBody}>
                  No registrations to review and no open interruptions across active assignments.
                </p>
              </div>
            ) : work.items.map((q) => (
              q.to ? (
                <Link key={q.id} to={q.to} className={`${styles.row} ${styles.link}`}>
                  <span className={styles.tile} data-tone={q.tone}>
                    <span data-icon aria-hidden="true">{q.icon}</span>
                  </span>
                  <span className={styles.rowText}>
                    <span className={styles.rowTitle}>{q.title}</span>
                    <span className={styles.rowSub}>{q.sub}</span>
                  </span>
                  <span className={styles.rowMeta}>
                    <span className={styles.when}>{q.when}</span>
                    <span data-icon aria-hidden="true" className={styles.chevron}>chevron_right</span>
                  </span>
                </Link>
              ) : (
                <div key={q.id} className={styles.row}>
                  <span className={styles.tile} data-tone={q.tone}>
                    <span data-icon aria-hidden="true">{q.icon}</span>
                  </span>
                  <span className={styles.rowText}>
                    <span className={styles.rowTitle}>{q.title}</span>
                    <span className={styles.rowSub}>{q.sub}</span>
                  </span>
                  <span className={styles.rowMeta}>
                    <span className={styles.when}>{q.when}</span>
                  </span>
                </div>
              )
            ))}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div className={styles.heading}>
                <h2 className={styles.title}>Open tasks</h2>
                <p className={styles.desc}>Work items linked to an assignment or a vehicle.</p>
              </div>
              <span className={styles.count2}>{TASKS.length} open</span>
            </div>
            <SampleRows rows={TASKS} />
          </section>
        </div>

        <div className={styles.column}>
          <section className={`${styles.panel} ${styles.pad}`}>
            <div className={styles.mixHead}>
              <h2 className={styles.title}>Assignment mix</h2>
              <p className={styles.desc}>All assignments by lifecycle status.</p>
            </div>
            <div className={styles.bar}>
              {mix.map((m) => (
                <div
                  key={m.status}
                  className={styles.slice}
                  title={`${m.label}: ${m.count}`}
                  style={{ width: m.pct, background: m.color }}
                />
              ))}
            </div>
            <div className={styles.legend}>
              {mix.map((m) => (
                <div key={m.status} className={styles.legendRow}>
                  <span
                    aria-hidden="true"
                    className={styles.dot}
                    style={{ background: m.color, borderRadius: m.shape }}
                  />
                  <span className={styles.legendLabel}>{m.label}</span>
                  <span className={styles.legendCount}>{m.count}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div className={styles.heading}>
                <div className={styles.titleRow}>
                  <h2 className={styles.title}>Unresolved insurance cases</h2>
                  <span className={styles.sample}>{SAMPLE_CHIP}</span>
                </div>
                <p className={styles.desc}>Claims and policies with an action outstanding.</p>
              </div>
              <span className={styles.count2}>{plural(INSURANCE.length, 'case', 'cases')}</span>
            </div>
            <SampleRows rows={INSURANCE} />
          </section>
        </div>

        <div className={styles.column}>
          <section className={`${styles.panel} ${styles.pad}`}>
            <div className={styles.activityHead}>
              <h2 className={styles.title}>Recent security activity</h2>
              <p className={styles.desc}>Times shown in UTC.</p>
            </div>
            {mayReadAudit ? (
              <div className={styles.activity}>
                {activity.map((a) => (
                  <Link key={a.id} to={`/security-audit/${a.id}`} className={styles.activityRow}>
                    <span aria-hidden="true" className={styles.activityDot} style={{ background: a.tint }} />
                    <span className={styles.activityText}>
                      <span className={styles.activityEvent}>{a.event}</span>
                      <span className={styles.activityWhen}>{a.when}</span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.locked}>
                <span data-icon aria-hidden="true" className={styles.lockedIcon}>lock</span>
                <p className={styles.lockedBody}>
                  Your role does not include audit access. Ask a Company Principal if you need it.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
