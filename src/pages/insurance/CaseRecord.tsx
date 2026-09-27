import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { qk } from '@/api';
import { getCase, photoUrl } from '@/api/insuranceCases';
import {
  InsuranceCaseParty, InsuranceCaseType,
  type InsuranceCaseEventResponse, type InsuranceCasePhotoResponse, type InsuranceCaseResponse, type Uuid,
} from '@/api/dto';
import { isApiError, toFailure } from '@/api/problem';
import {
  CASE_PARTY_LABEL, CASE_STATUS_LABEL, CASE_TYPE_LABEL, LOCAL_TIME_NOTE, atFaultText, caseTitle,
  changeChips, createdByName, formatLocal, handledInfo, handledLong, laterText, lastChangedByName,
  photosDescription, placeText, rentalSub, sinceText, whenLabel,
} from '@/format';
import { useNarrow } from '@/app/useViewport';
import { useAccess } from '@/permissions/usePermissions';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { Fact, FactGrid } from '@/ui/FactGrid';
import { Panel } from '@/ui/Panel';
import { HeaderFact, RecordHeader } from '@/ui/RecordHeader';
import { recordStyles as shell } from '@/ui/RecordTabs';
import { CASE_STATUS_DOT, CASE_STATUS_TONE, CASE_TYPE_DOT } from '@/ui/status';
import { CaseDialogs, type CaseDialog } from './CaseDialogs';
import { CaseStatusChip } from './InsuranceCases';
import { PhotoView, casePhotos } from './PhotoView';
import { CASES_READ, caseHref, caseTabOf, casesHref, type CaseTab } from './caseAddress';
import styles from './CaseRecord.module.css';

/**
 * One insurance case (Follow-up 17, F17-3), as the handover shows it: the breadcrumb back to the view
 * it was opened from; the title "{plate} · {what is damaged}" with the type beside it; the status and
 * the facts Waiting for, Happened or Found, Driver, Rental, Handled by and At fault; and, only when the
 * API says the reader may change the case (`canChange`), Add event, Add note, Edit case and, on a usual
 * case whose accident has no casco case yet, Casco case for this accident, under the title.
 *
 * The panels, in two columns from 1024 px and one below: the Timeline, its first entry the case
 * itself; the Notes; the Insurance; the Photos, grouped by their entry; the other cases of the same
 * accident; the Description; and the Record. An event or a note shows Edit only where the API says the
 * reader may correct it (`canCorrect`). A photo opens the large photo view.
 *
 * The server decides: since when the case waits, when it was closed, its rental and its accident's
 * cases are read from the answer, never worked out here.
 */

const NOT_FOUND = 'insurance_cases.not_found';

/** The case's own photos first, then each event's; the thumbnails' two sizes are the panels'. */
type ThumbSize = 'timeline' | 'panel';

/** A photo's thumbnail: its picture from the API, or a quiet placeholder when it cannot load. */
function Thumb({ caseId, photo, size, onOpen }: {
  caseId: Uuid;
  photo: InsuranceCasePhotoResponse;
  size: ThumbSize;
  onOpen: () => void;
}) {
  const [broken, setBroken] = useState(false);
  return (
    <button
      type="button"
      className={styles.thumb}
      data-size={size}
      aria-label={`Open photo ${photo.fileName}`}
      title={photo.fileName}
      onClick={onOpen}
    >
      {broken ? (
        <span data-icon aria-hidden="true" className={styles.thumbIcon}>image</span>
      ) : (
        <img
          className={styles.thumbImg}
          src={photoUrl(caseId, photo.id)}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
        />
      )}
    </button>
  );
}

function Thumbs({ caseId, photos, size, onOpen }: {
  caseId: Uuid;
  photos: InsuranceCasePhotoResponse[];
  size: ThumbSize;
  onOpen: (photoId: Uuid) => void;
}) {
  if (!photos.length) return null;
  return (
    <div className={styles.thumbs}>
      {photos.map((photo) => (
        <Thumb key={photo.id} caseId={caseId} photo={photo} size={size} onOpen={() => onOpen(photo.id)} />
      ))}
    </div>
  );
}

/** "Edit" under one's own entry: the underlined text button of the timeline and the notes. */
function EditLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className={styles.edit} aria-label={label} onClick={onClick}>Edit</button>
  );
}

/**
 * The timeline, oldest first: the case itself (Happened or Found, the place, what is damaged, the
 * photos it was registered with), then each event with the time since the entry before it, its
 * title, description, photos, the chips of what it changed and who added it.
 */
function Timeline({ kase, onPhoto, onEditEvent }: {
  kase: InsuranceCaseResponse;
  onPhoto: (photoId: Uuid) => void;
  onEditEvent: (event: InsuranceCaseEventResponse) => void;
}) {
  const events = kase.events;
  const many = events.length > 0;
  return (
    <ol className={styles.timeline} data-line={many ? 'true' : undefined}>
      <li className={styles.entry}>
        <span className={styles.rail} aria-hidden="true">
          <span className={styles.dot} data-kind="case" />
        </span>
        <div className={styles.entryBody}>
          <div className={styles.entryWhen}>
            <span className={styles.when}>{formatLocal(kase.happenedAtUtc)}</span>
          </div>
          <span className={styles.entryTitle}>{whenLabel(kase)}</span>
          <span className={styles.place}>
            <span data-icon aria-hidden="true" className={styles.placeIcon}>location_on</span>
            <span className={styles.placeText}>{placeText(kase)}</span>
          </span>
          <p className={styles.entryText}>{kase.damage}</p>
          <Thumbs caseId={kase.id} photos={kase.photos} size="timeline" onOpen={onPhoto} />
          <div className={styles.by}>
            <span>Registered by {createdByName(kase)}, {formatLocal(kase.createdAtUtc)}</span>
          </div>
        </div>
      </li>
      {events.map((event, index) => {
        const previous = index === 0 ? kase.happenedAtUtc : events[index - 1]!.happenedAtUtc;
        const chips = changeChips(event);
        return (
          <li key={event.id} className={styles.entry}>
            <span className={styles.rail} aria-hidden="true">
              <span
                className={styles.dot}
                data-kind={event.statusChangedTo ? 'status' : 'event'}
                data-tone={event.statusChangedTo ? CASE_STATUS_TONE[event.statusChangedTo] : undefined}
              />
            </span>
            <div className={styles.entryBody}>
              <div className={styles.entryWhen}>
                <span className={styles.when}>{formatLocal(event.happenedAtUtc)}</span>
                <span className={styles.later}>{laterText(previous, event.happenedAtUtc)}</span>
              </div>
              <span className={styles.entryTitle}>{event.title}</span>
              {event.description ? <p className={styles.entryText}>{event.description}</p> : null}
              <Thumbs caseId={kase.id} photos={event.photos} size="timeline" onOpen={onPhoto} />
              {chips.length ? (
                <div className={styles.chips}>
                  {chips.map((chip) => <span key={chip} className={styles.change}>{chip}</span>)}
                </div>
              ) : null}
              <div className={styles.by}>
                <span>Added by {createdByName(event)}, {formatLocal(event.createdAtUtc)}</span>
                {event.canCorrect ? <EditLink label={`Edit event ${event.title}`} onClick={() => onEditEvent(event)} /> : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function CaseRecord() {
  const { caseId = '' } = useParams();
  const [params] = useSearchParams();
  const { can } = useAccess();
  const narrow = useNarrow();
  const tab: CaseTab = caseTabOf(params.get('tab')).id;
  const back = casesHref(tab);
  const [dialog, setDialog] = useState<CaseDialog | null>(null);
  const [photoId, setPhotoId] = useState<Uuid | null>(null);

  const record = useQuery({
    queryKey: qk.insuranceCases.detail(caseId),
    queryFn: () => getCase(caseId),
    enabled: can(CASES_READ),
  });
  const kase = record.data;

  if (record.error || !can(CASES_READ)) {
    const failure = record.error ? toFailure(record.error) : null;
    const notFound = isApiError(record.error) && record.error.code === NOT_FOUND;
    return (
      <div className={shell.page}>
        <RecordHeader backTo={back} backLabel="Insurance cases" title="Insurance case" />
        {!failure || failure.kind === 'forbidden' ? (
          <EmptyState icon="lock" title="Not available to you" body={`Opening this page needs ${CASES_READ}.`} />
        ) : (
          <EmptyState
            icon="car_crash"
            title="That case is not available"
            body={'message' in failure ? failure.message : 'The case could not be loaded.'}
            onRetry={notFound ? undefined : () => void record.refetch()}
          />
        )}
      </div>
    );
  }

  const title = kase ? caseTitle(kase) : 'Insurance case';
  const canChange = !!kase?.canChange;
  // Casco case for this accident: on a usual case whose accident has no casco case yet.
  const cascoFree = kase?.type === InsuranceCaseType.Usual
    && !kase.sameAccidentCases.some((other) => other.type === InsuranceCaseType.Casco);
  const handled = kase ? handledInfo(kase) : null;
  const driverTo = kase?.driverId && can('Drivers.Read') ? `/drivers/${kase.driverId}` : null;
  const rentalTo = kase?.rental && can('RentalAssignments.Read') ? `/rental-assignments/${kase.rental.rentalAssignmentId}` : null;
  const photos = kase ? casePhotos(kase) : [];
  const openPhoto = (id: Uuid) => setPhotoId(id);

  const timeline = kase ? (
    <Panel key="timeline" title="Timeline" description={`What happened, oldest first. ${LOCAL_TIME_NOTE}`}>
      <Timeline
        kase={kase}
        onPhoto={openPhoto}
        onEditEvent={(event) => setDialog({ kind: 'event-edit', eventId: event.id })}
      />
    </Panel>
  ) : null;

  const notes = kase ? (
    <Panel
      key="notes"
      title="Notes"
      description={kase.notes.length ? 'Newest first.' : undefined}
      actions={canChange ? <Button label="Add note" icon="add" small onClick={() => setDialog({ kind: 'note-add' })} /> : undefined}
    >
      {kase.notes.length ? (
        <div className={styles.notes}>
          {kase.notes.map((note) => (
            <div key={note.id} className={styles.note}>
              <p className={styles.noteText}>{note.text}</p>
              <div className={styles.by}>
                <span>{createdByName(note)}, {formatLocal(note.createdAtUtc)}</span>
                {note.canCorrect ? <EditLink label="Edit note" onClick={() => setDialog({ kind: 'note-edit', noteId: note.id })} /> : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState variant="panel" icon="sticky_note_2" title="No notes yet." />
      )}
    </Panel>
  ) : null;

  const insurance = kase ? (
    <Panel key="insurance" title="Insurance">
      <FactGrid columns={2}>
        <Fact label="Our insurer" dim={!kase.ourInsurer}>{kase.ourInsurer || 'None'}</Fact>
        <Fact label="Claim number" mono={!!kase.ourClaimNumber} dim={!kase.ourClaimNumber}>{kase.ourClaimNumber || '—'}</Fact>
        <Fact label="The other party’s insurer" dim={!kase.otherInsurer}>{kase.otherInsurer || 'Not known'}</Fact>
        <Fact label="Claim number" mono={!!kase.otherClaimNumber} dim={!kase.otherClaimNumber}>{kase.otherClaimNumber || '—'}</Fact>
        <Fact label="Handled by" dim={!!handled?.dim} span="full">{handledLong(kase)}</Fact>
      </FactGrid>
    </Panel>
  ) : null;

  const photoGroups = kase ? (
    <Panel key="photos" title="Photos" description={photosDescription(photos.length)}>
      {photos.length ? (
        <div className={styles.groups}>
          {[{ id: 'case', title: whenLabel(kase), at: kase.happenedAtUtc, photos: kase.photos },
            ...kase.events.map((event) => ({ id: event.id, title: event.title, at: event.happenedAtUtc, photos: event.photos }))]
            .filter((group) => group.photos.length)
            .map((group) => (
              <div key={group.id} className={styles.group}>
                <div className={styles.groupHead}>
                  <span className={styles.groupTitle}>{group.title}</span>
                  <span className={styles.groupWhen}>{formatLocal(group.at)}</span>
                </div>
                <Thumbs caseId={kase.id} photos={group.photos} size="panel" onOpen={openPhoto} />
              </div>
            ))}
        </div>
      ) : (
        <EmptyState variant="panel" icon="photo_library" title="No photos yet" />
      )}
    </Panel>
  ) : null;

  const same = kase && kase.sameAccidentCases.length ? (
    <Panel
      key="same"
      title="Same accident"
      description={kase.sameAccidentCases.length === 1 ? 'The other case of this accident.' : 'The other cases of this accident.'}
    >
      <div className={styles.links}>
        {kase.sameAccidentCases.map((other) => (
          <div key={other.id} className={styles.linkRow}>
            <span className={styles.linkText}>
              <span className={styles.linkTitleRow}>
                <Link to={caseHref(other.id, tab)} className={styles.linkTitle}>{other.label}</Link>
              </span>
              <span className={styles.linkSub}>{CASE_TYPE_LABEL[other.type]}</span>
            </span>
            <CaseStatusChip status={other.status} />
          </div>
        ))}
      </div>
    </Panel>
  ) : null;

  const description = kase?.description ? (
    <Panel key="description" title="Description">
      <p className={styles.description}>{kase.description}</p>
    </Panel>
  ) : null;

  const recordPanel = kase ? (
    <Panel key="record" title="Record">
      <FactGrid columns={2}>
        <Fact label="Created" mono sub={`by ${createdByName(kase)}`}>{formatLocal(kase.createdAtUtc)}</Fact>
        <Fact
          label="Last updated"
          mono={!!kase.updatedAtUtc}
          dim={!kase.updatedAtUtc}
          sub={kase.updatedAtUtc ? `by ${lastChangedByName(kase)}` : null}
        >
          {kase.updatedAtUtc ? formatLocal(kase.updatedAtUtc) : 'Never'}
        </Fact>
      </FactGrid>
    </Panel>
  ) : null;

  return (
    <div className={shell.page}>
      <RecordHeader
        backTo={back}
        backLabel="Insurance cases"
        title={title}
        badges={kase ? [{ label: CASE_TYPE_LABEL[kase.type], tone: 'plain', dot: CASE_TYPE_DOT[kase.type] }] : undefined}
        headerActionsBelow
        actionsKey={`${canChange}-${cascoFree}`}
        headerActions={kase && canChange ? (
          <>
            <Button label="Add event" icon="add" tone="primary" onClick={() => setDialog({ kind: 'event-add' })} />
            <Button label="Add note" icon="edit_note" onClick={() => setDialog({ kind: 'note-add' })} />
            <Button label="Edit case" icon="edit" onClick={() => setDialog({ kind: 'edit' })} />
            {cascoFree ? (
              <Button label="Casco case for this accident" icon="add_link" onClick={() => setDialog({ kind: 'casco' })} />
            ) : null}
          </>
        ) : undefined}
        chip={kase ? {
          label: CASE_STATUS_LABEL[kase.status],
          tone: CASE_STATUS_TONE[kase.status],
          dot: CASE_STATUS_DOT[kase.status],
        } : undefined}
      >
        <HeaderFact
          label="Waiting for"
          value={kase ? (
            <span className={kase.waitingFor === InsuranceCaseParty.Us ? styles.us : undefined}>{CASE_PARTY_LABEL[kase.waitingFor]}</span>
          ) : '—'}
          sub={kase ? sinceText(kase) : null}
        />
        <HeaderFact
          label={kase ? whenLabel(kase) : 'Happened'}
          value={kase ? formatLocal(kase.happenedAtUtc) : '—'}
          sub={kase ? placeText(kase) : null}
        />
        <HeaderFact
          label="Driver"
          value={kase?.driverDisplayName
            ? driverTo ? <Link to={driverTo} className={styles.heroLink}>{kase.driverDisplayName}</Link> : kase.driverDisplayName
            : <span className={styles.dim}>Not known</span>}
        />
        <HeaderFact
          label="Rental"
          value={kase?.rental
            ? rentalTo ? <Link to={rentalTo} className={styles.heroLink}>{kase.rental.customerDisplayName}</Link> : kase.rental.customerDisplayName
            : <span className={styles.dim}>Not rented then</span>}
          sub={kase?.rental ? rentalSub(kase.rental) : null}
        />
        <HeaderFact
          label="Handled by"
          value={handled ? <span className={handled.dim ? styles.dim : undefined}>{handled.text}</span> : '—'}
          sub={handled?.sub || null}
        />
        <HeaderFact
          label="At fault"
          value={<span className={kase?.atFault ? undefined : styles.dim}>{atFaultText(kase?.atFault)}</span>}
        />
      </RecordHeader>

      {kase ? (
        narrow ? (
          <div className={styles.columns} data-cols="1">
            <div className={styles.column}>{[timeline, notes, insurance, same, photoGroups, description, recordPanel]}</div>
          </div>
        ) : (
          <div className={styles.columns} data-cols="2">
            <div className={styles.column}>{[timeline, photoGroups]}</div>
            <div className={styles.column}>{[notes, insurance, same, description, recordPanel]}</div>
          </div>
        )
      ) : null}

      {kase ? <CaseDialogs dialog={dialog} kase={kase} tab={tab} onClose={() => setDialog(null)} /> : null}
      {kase && photoId ? (
        <PhotoView kase={kase} photoId={photoId} onMove={setPhotoId} onClose={() => setPhotoId(null)} />
      ) : null}
    </div>
  );
}
