import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { qk } from '@/api';
import { listSecurityAudit } from '@/api/securityAudit';
import { listUsers } from '@/api/users';
import type { Uuid } from '@/api/dto';
import { toFailure } from '@/api/problem';
import { diffRows, entityLabel, eventLabel, formatUtc } from '@/format';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { Fact, FactGrid } from '@/ui/FactGrid';
import { Panel } from '@/ui/Panel';
import { RecordHeader } from '@/ui/RecordHeader';
import styles from './AuditEntry.module.css';

/**
 * FOLLOW-UP: swagger has no `GET /api/security-audit/{id}`, so the entry is located in the first
 * page of the unfiltered list. A by-id endpoint would make a deep link exact rather than best-effort.
 */
const LOOKUP = { PageSize: 100 };

export function AuditEntry() {
  const { entryId = '' } = useParams();

  const entries = useQuery({
    queryKey: qk.audit.list(LOOKUP),
    queryFn: () => listSecurityAudit(LOOKUP),
  });
  const directory = useQuery({
    queryKey: qk.users.list({ PageSize: 100 }),
    queryFn: () => listUsers({ PageSize: 100 }),
    staleTime: 60_000,
  });

  const entry = entries.data?.items.find((x) => x.id === entryId);
  const failure = entries.error ? toFailure(entries.error) : null;

  const person = (id: Uuid | null | undefined) => directory.data?.items.find((u) => u.id === id);
  const personCell = (id: Uuid | null | undefined, fallback: string) => {
    const u = person(id);
    return u
      ? <Link to={`/users/${u.id}`}>{u.firstName} {u.lastName}</Link>
      : fallback;
  };

  if (failure || (entries.isSuccess && !entry)) {
    return (
      <div className={styles.page}>
        <RecordHeader backTo="/security-audit" backLabel="Security audit" title="Audit entry" />
        <EmptyState
          icon={failure?.kind === 'forbidden' ? 'lock' : 'policy'}
          title="That entry is not available"
          body={
            failure && 'message' in failure
              ? failure.message
              : 'The entry is not in the current audit window. Open it from the list to be certain of the row.'
          }
          onRetry={() => void entries.refetch()}
        />
      </div>
    );
  }

  const diff = entry ? diffRows(entry.beforeJson, entry.afterJson) : null;
  const hasBefore = !!entry?.beforeJson;

  return (
    <div className={styles.page}>
      <RecordHeader
        backTo="/security-audit"
        backLabel="Security audit"
        title={entry ? eventLabel(entry.eventType) : 'Audit entry'}
        chip={<Chip tone="mute" dot="2px">Audit entry</Chip>}
      />

      <Panel title="Event" description="All times UTC.">
        <FactGrid>
          <Fact label="Event">{entry ? eventLabel(entry.eventType) : '—'}</Fact>
          <Fact label="Occurred" mono>{formatUtc(entry?.occurredAtUtc)}</Fact>
          <Fact label="Actor" dim={!person(entry?.actorUserId)}>
            {personCell(entry?.actorUserId, 'System')}
          </Fact>
          <Fact label="Target user" dim={!entry?.targetUserId}>
            {entry?.targetUserId ? personCell(entry.targetUserId, 'Unknown user') : 'Not user-scoped'}
          </Fact>
          <Fact label="Entity">{entityLabel(entry?.entityType)}</Fact>
          <Fact label="Entity id" mono dim span={2}>{entry?.entityId ?? '—'}</Fact>
        </FactGrid>
      </Panel>

      {diff && diff.length > 0 ? (
        <Panel title={hasBefore ? 'Before → after' : 'Recorded values'}>
          <FactGrid>
            {diff.map((row) => (
              <Fact key={row.label} label={row.label} mono dim={row.unchanged} span={2} pre>
                {row.value}
              </Fact>
            ))}
          </FactGrid>
        </Panel>
      ) : null}

      {diff === null && entry ? (
        <Panel title="Payload">
          <FactGrid>
            <Fact label="Parsing" dim span="full">
              Unrecognised payload shape — see the raw values below
            </Fact>
          </FactGrid>
        </Panel>
      ) : null}

      <Panel title="Reason">
        <FactGrid>
          <Fact label="Recorded reason" dim={!entry?.reason} span="full">
            {entry?.reason ?? 'No reason recorded'}
          </Fact>
        </FactGrid>
      </Panel>

      <Panel
        title="Raw payload"
        note="Audit history is append-only; entries cannot be edited or deleted."
        noteIcon="lock"
      >
        <FactGrid>
          <Fact label="Before" mono dim={!entry?.beforeJson} span="full" pre>
            {entry?.beforeJson ?? '—'}
          </Fact>
          <Fact label="After" mono dim={!entry?.afterJson} span="full" pre>
            {entry?.afterJson ?? '—'}
          </Fact>
        </FactGrid>
      </Panel>
    </div>
  );
}
