import { useEffect, useRef, useState } from 'react';
import { photoUrl } from '@/api/insuranceCases';
import type { Instant, InsuranceCasePhotoResponse, InsuranceCaseResponse, Uuid } from '@/api/dto';
import { caseTitle, createdByName, formatLocal, sizeText, whenLabel } from '@/format';
import styles from './PhotoView.module.css';

/**
 * The large photo view (Follow-up 17, F17-3): one photo of the case at a time, with the entry it
 * belongs to and its date, its file name, who added it, its size and "n of m". ‹ › and the arrow keys
 * move through every photo of the case in timeline order; Esc, × or a click outside close it. It is
 * full-bleed on the phone. A picture that cannot load shows a quiet placeholder with its file name.
 */

/** A photo with the timeline entry it belongs to. */
export interface CasePhoto {
  photo: InsuranceCasePhotoResponse;
  entry: string;
  at: Instant;
}

/** Every photo of a case in timeline order: the registration's, then each event's, oldest first. */
export function casePhotos(kase: InsuranceCaseResponse): CasePhoto[] {
  return [
    ...kase.photos.map((photo) => ({ photo, entry: whenLabel(kase), at: kase.happenedAtUtc })),
    ...kase.events.flatMap((event) => event.photos.map((photo) => ({ photo, entry: event.title, at: event.happenedAtUtc }))),
  ];
}

function Picture({ caseId, photo }: { caseId: Uuid; photo: InsuranceCasePhotoResponse }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [photo.id]);
  if (broken) {
    return (
      <span className={styles.placeholder}>
        <span data-icon aria-hidden="true" className={styles.placeholderIcon}>image</span>
        <span className={styles.placeholderName}>{photo.fileName}</span>
      </span>
    );
  }
  return (
    <img
      key={photo.id}
      className={styles.img}
      src={photoUrl(caseId, photo.id)}
      alt={photo.fileName}
      onError={() => setBroken(true)}
    />
  );
}

export function PhotoView({ kase, photoId, onMove, onClose }: {
  kase: InsuranceCaseResponse;
  photoId: Uuid;
  onMove: (photoId: Uuid) => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const list = casePhotos(kase);
  const index = list.findIndex((item) => item.photo.id === photoId);
  const current = index >= 0 ? list[index]! : null;
  const previous = index > 0 ? list[index - 1]!.photo.id : null;
  const next = index >= 0 && index < list.length - 1 ? list[index + 1]!.photo.id : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && previous) onMove(previous);
      else if (e.key === 'ArrowRight' && next) onMove(next);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [previous, next, onMove, onClose]);

  // Focus enters on × and returns to the thumbnail that opened the view.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    return () => opener?.focus();
  }, []);

  if (!current) return null;
  const { photo } = current;

  return (
    <div className={styles.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label={photo.fileName}>
        <div className={styles.head}>
          <div className={styles.heading}>
            <span className={styles.entry}>{current.entry}</span>
            <span className={styles.when}>{caseTitle(kase)} · {formatLocal(current.at)}</span>
          </div>
          <button type="button" ref={closeRef} className={styles.close} aria-label="Close photo" onClick={onClose}>
            <span data-icon aria-hidden="true" className={styles.closeIcon}>close</span>
          </button>
        </div>
        <div className={styles.stage}>
          <Picture caseId={kase.id} photo={photo} />
          {previous ? (
            <button type="button" className={styles.step} data-side="prev" aria-label="Previous photo" onClick={() => onMove(previous)}>
              <span data-icon aria-hidden="true" className={styles.stepIcon}>chevron_left</span>
            </button>
          ) : null}
          {next ? (
            <button type="button" className={styles.step} data-side="next" aria-label="Next photo" onClick={() => onMove(next)}>
              <span data-icon aria-hidden="true" className={styles.stepIcon}>chevron_right</span>
            </button>
          ) : null}
        </div>
        <div className={styles.foot}>
          <span className={styles.name}>{photo.fileName}</span>
          <span>Added by {createdByName(photo)}, {formatLocal(photo.createdAtUtc)} · {sizeText(photo.sizeInBytes)}</span>
          <span className={styles.counter}>{index + 1} of {list.length}</span>
        </div>
      </div>
    </div>
  );
}
