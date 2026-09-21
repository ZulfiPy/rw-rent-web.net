import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { qk } from '@/api';
import { getAuditEntry } from '@/api/securityAudit';
import { listUsers } from '@/api/users';
import type { Uuid } from '@/api/dto';
import { toFailure } from '@/api/problem';
import {
  LOCAL_TIME_NOTE, auditActorName, auditTargetName, deletedRecord, diffRows, entityLabel, eventLabel,
  formatLocalStamp, isSystemActor, type DeletedFact,
} from '@/format';
import { EmptyState } from '@/ui/EmptyState';
import { Fact, FactGrid } from '@/ui/FactGrid';
import { Panel } from '@/ui/Panel';
import { RecordHeader } from '@/ui/RecordHeader';
import styles from './AuditEntry.module.css';

/** One member of a deleted record's copy. */
const factOf = (f: DeletedFact) => (
  <Fact key={f.key} label={f.label} mono={f.mono} dim={f.value === '—'}>{f.value}</Fact>
);

export function AuditEntry() {
  const { entryId = '' } = useParams();

  /** The entry itself. An unknown id and one outside the reader's scope both answer 404. */
  const entries = useQuery({
    queryKey: qk.audit.entry(entryId),
    queryFn: () => getAuditEntry(entryId),
    enabled: !!entryId,
  });
  const directory = useQuery({
    queryKey: qk.users.list({ PageSize: 100 }),
    queryFn: () => listUsers({ PageSize: 100 }),
    staleTime: 60_000,
  });

  const entry = entries.data;
  const failure = entries.error ? toFailure(entries.error) : null;

  /* The entry names its actor and target itself (F7-4); the reader's directory decides only
     whether the name links to the user record. */
  const person = (id: Uuid | null | undefined) => directory.data?.items.find((u) => u.id === id);
  const personCell = (id: Uuid | null | undefined, name: string) =>
    person(id) ? <Link to={`/users/${id}`}>{name}</Link> : name;

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
              : 'The entry does not exist, or it is outside the history you may read.'
          }
          onRetry={() => void entries.refetch()}
        />
      </div>
    );
  }

  const diff = entry ? diffRows(entry.beforeJson, entry.afterJson) : null;
  const hasBefore = !!entry?.beforeJson;
  /** A deletion's copy of the record it removed (Follow-up 8); null for every other entry. */
  const deleted = entry ? deletedRecord(entry.eventType, entry.beforeJson) : null;

  return (
    <div className={styles.page}>
      <RecordHeader
        backTo="/security-audit"
        backLabel="Security audit"
        title={entry ? eventLabel(entry.eventType) : 'Audit entry'}
      />

      <Panel title="Event" description={LOCAL_TIME_NOTE}>
        {/* Six facts as two rows of three: auto-fit laid five across and left the id alone beside
            a grey remainder that moved with the panel. */}
        <FactGrid columns={3}>
          <Fact label="Event">{entry ? eventLabel(entry.eventType) : '—'}</Fact>
          <Fact label="Occurred" mono>{formatLocalStamp(entry?.occurredAtUtc)}</Fact>
          <Fact label="Actor" dim={!entry || isSystemActor(entry)}>
            {entry ? personCell(entry.actorUserId, auditActorName(entry)) : '—'}
          </Fact>
          <Fact label="Target user" dim={!entry?.targetUserId}>
            {entry?.targetUserId ? personCell(entry.targetUserId, auditTargetName(entry) ?? '') : 'Not user-scoped'}
          </Fact>
          <Fact label="Entity">{entityLabel(entry?.entityType)}</Fact>
          <Fact label="Entity id" mono dim>{entry?.entityId ?? '—'}</Fact>
          {deleted ? (
            <Fact label="Record" span="full" hint="The record was deleted, so there is nothing to open.">
              {deleted.recordLabel ?? entry?.entityId ?? '—'}
            </Fact>
          ) : null}
        </FactGrid>
      </Panel>

      {deleted ? (
        <>
          <Panel title="Deleted record" description="The values the record held when it was deleted.">
            <FactGrid>{deleted.facts.map(factOf)}</FactGrid>
          </Panel>
          {deleted.authorizations.length > 0 ? (
            <Panel title="Deleted authorizations">
              {deleted.authorizations.map((group, index) => (
                <div key={index} className={styles.group}>
                  <p className={styles.groupTitle}>Authorization {index + 1}</p>
                  <FactGrid>{group.map(factOf)}</FactGrid>
                </div>
              ))}
            </Panel>
          ) : null}
          {deleted.interruptions.length > 0 ? (
            <Panel title="Deleted interruptions">
              {deleted.interruptions.map((group, index) => (
                <div key={index} className={styles.group}>
                  <p className={styles.groupTitle}>Interruption {index + 1}</p>
                  <FactGrid>{group.map(factOf)}</FactGrid>
                </div>
              ))}
            </Panel>
          ) : null}
        </>
      ) : null}

      {!deleted && diff && diff.length > 0 ? (
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

      {!deleted && diff === null && entry ? (
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
