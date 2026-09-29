import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { qk } from '@/api';
import { listDrivers } from '@/api/drivers';
import {
  addEvent, addNote, correctEvent, correctNote, listAccidentChoices, photoUrl, registerCase,
  suggestDriver, updateCase, type PhotoUpload,
} from '@/api/insuranceCases';
import { listInsurers } from '@/api/insurers';
import { listVehicles } from '@/api/vehicles';
import {
  AtFaultParty, InsuranceCaseDriverSituation, InsuranceCaseParty, InsuranceCaseStatus, InsuranceCaseType,
  InsurerSide,
  type AddInsuranceCaseEventRequest, type CorrectInsuranceCaseEventRequest, type InsuranceCaseEventResponse,
  type InsuranceCaseNoteResponse, type InsuranceCasePhotoResponse, type InsuranceCaseResponse,
  type RegisterInsuranceCaseRequest, type UpdateInsuranceCaseRequest, type Uuid,
} from '@/api/dto';
import { isApiError, type Failure } from '@/api/problem';
import {
  AT_FAULT_LABEL, AT_FAULT_PARTIES, CASE_PARTIES, CASE_PARTY_LABEL, CASE_STATUSES, CASE_STATUS_LABEL,
  CASE_TYPE_LABEL, caseTitle, changedText, driverHint, fromLocalInput, fromPrefilledInput, sizeText,
  toLocalInput,
} from '@/format';
import { ReseedScope } from '@/app/reseed';
import { useActionMutation } from '@/app/useActionMutation';
import { useAccess } from '@/permissions/usePermissions';
import { CheckCard } from '@/ui/CheckCard';
import { Dialog, DialogNote, dialogStyles } from '@/ui/Dialog';
import { Field, fieldStyles as f, invalidProps } from '@/ui/Field';
import { CASES_MANAGE, CASE_REFRESH, caseHref, type CaseTab } from './caseAddress';
import { InsurerForm } from './InsurerDialogs';
import { InsurerPicker, chosenInsurer } from './InsurerPicker';
import { MAX_PHOTOS, preparePhoto } from './photos';
import styles from './CaseDialogs.module.css';

/**
 * Register case and Edit case (F17-4), Add event and Edit event, Add note and Edit note (F17-5), with
 * the photos made ready in the browser (F17-6), from the handover's dialogs and built with the app's
 * own: the shared `Dialog`, `Field`, `CheckCard` and `invalidProps`, the one mutation hook every dialog
 * submits through, and the stale banner's Refresh.
 *
 * The app judges nothing before it sends but the photos it cannot open: a missing car, a time in the
 * future, an event before its case, a handler without its insurer are all the API's refusals, and
 * each lands where it belongs (F17-7) — a field's under the field, a photo's under its tile, who may
 * correct an entry in the dialog's banner, a lost race as the stale banner with Refresh, and a body
 * too large together as a banner that says to add fewer at a time.
 */

export type CaseDialog =
  | { kind: 'edit' }
  | { kind: 'casco' }
  | { kind: 'event-add' }
  | { kind: 'event-edit'; eventId: Uuid }
  | { kind: 'note-add' }
  | { kind: 'note-edit'; noteId: Uuid };

/** The first 100 of a list, as the app's other dialogs offer them; only the active ones are offered. */
const ACTIVE = { IsActive: true, PageSize: 100 } as const;

/** A 413: the request's photos together are over the API's limit. */
export const TOO_LARGE_TOGETHER = 'The photos are too large to send together. Add fewer at a time.';

/**
 * A refusal of a case's write that is about the whole request, not a field: a body over the API's
 * limit, and a case, event or note that no longer exists. Shown as a refused change, with its title.
 */
export function caseRefusal(error: unknown): Failure | null {
  if (!isApiError(error)) return null;
  if (error.status === 413) return { kind: 'conflict', message: TOO_LARGE_TOGETHER, code: error.code };
  if (error.status === 404) {
    return { kind: 'conflict', message: error.problem.detail || error.problem.title || '', code: error.code };
  }
  return null;
}

/** A datetime-local value as the instant it names, or null while it names none. */
function instantOf(value: string, stored?: string | null): string | null {
  if (!value) return null;
  try {
    return stored ? fromPrefilledInput(value, stored) : fromLocalInput(value);
  } catch {
    return null;
  }
}

/** Now, to the minute, as the time controls open. */
const nowInput = () => toLocalInput(new Date().toISOString());

const blankToNull = (value: string) => (value.trim() === '' ? null : value);

/* photos ------------------------------------------------------------------------------------------ */

/** A chosen photo as its tile shows it, while it is made ready and once it is. */
export interface PhotoTile {
  key: string;
  name: string;
  size: number;
  state: 'checking' | 'ready' | 'refused';
  error?: string;
  upload?: PhotoUpload;
  preview?: string;
}

let nextTile = 0;

/**
 * The photos of one dialog: each chosen file becomes a tile at once and is made ready in the
 * background; at most 20 in one dialog. `initial` seeds the tiles (the render tests use it).
 */
export function usePhotoTiles(initial: PhotoTile[] = []) {
  const [tiles, setTiles] = useState<PhotoTile[]>(initial);
  const [overflow, setOverflow] = useState(false);
  const previews = useRef<string[]>([]);

  useEffect(() => () => previews.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const add = (files: File[]) => {
    const room = Math.max(0, MAX_PHOTOS - tiles.length);
    setOverflow(files.length > room);
    const chosen = files.slice(0, room).map((file) => ({ file, key: `photo-${(nextTile += 1)}` }));
    setTiles((list) => [
      ...list,
      ...chosen.map(({ file, key }) => ({ key, name: file.name || 'photo', size: file.size, state: 'checking' as const })),
    ]);
    for (const { file, key } of chosen) {
      void preparePhoto(file).then((ready) => {
        let preview: string | undefined;
        if (ready.ok && typeof URL.createObjectURL === 'function') {
          preview = URL.createObjectURL(ready.file);
          previews.current.push(preview);
        }
        setTiles((list) => list.map((tile) => (tile.key !== key ? tile : ready.ok
          ? { ...tile, state: 'ready', upload: { file: ready.file, fileName: ready.fileName }, ...(preview ? { preview } : {}) }
          : { ...tile, state: 'refused', error: ready.error })));
      });
    }
  };

  const remove = (key: string) => {
    setOverflow(false);
    setTiles((list) => list.filter((tile) => tile.key !== key));
  };

  const blocked = tiles.some((tile) => tile.state === 'checking')
    ? 'Wait until the photos are ready.'
    : tiles.some((tile) => tile.state === 'refused')
      ? 'Remove the files that cannot be added first.'
      : null;

  return {
    tiles,
    overflow,
    add,
    remove,
    blocked,
    uploads: () => tiles.flatMap((tile) => (tile.upload ? [tile.upload] : [])),
  };
}

type PhotoTiles = ReturnType<typeof usePhotoTiles>;

/**
 * The Photos section: a tile for each chosen photo with its name, its size and Remove, the refusal
 * that names it under it, and Add photos, which opens the device's picker for several at once.
 * `sent` holds the tiles' keys in the order they were sent, so the API's `Photos[i]` finds its tile.
 */
function PhotosSection({ photos, fields, sent, hint }: {
  photos: PhotoTiles;
  fields: Record<string, string>;
  sent: readonly string[];
  hint: string;
}) {
  const sectionError = fields['photos'];
  return (
    <div className={dialogStyles.section}>
      <p className={dialogStyles.sectionTitle}>Photos</p>
      <div className={styles.photos}>
        {photos.tiles.length ? (
          <div className={styles.tiles}>
            {photos.tiles.map((tile) => {
              const index = sent.indexOf(tile.key);
              const refusal = tile.error ?? (index >= 0 ? fields[`photos[${index}]`] : undefined);
              return (
                <div key={tile.key} className={styles.tile} data-refused={refusal ? 'true' : undefined}>
                  <span className={styles.tilePicture}>
                    {tile.preview
                      ? <img className={styles.tileImg} src={tile.preview} alt="" />
                      : <span data-icon aria-hidden="true" className={styles.tileIcon}>{tile.state === 'checking' ? 'hourglass_empty' : 'image'}</span>}
                  </span>
                  <span className={styles.tileName} title={tile.name}>{tile.name}</span>
                  <span className={styles.tileSize}>{sizeText(tile.size)}</span>
                  <button type="button" className={styles.tileRemove} aria-label={`Remove ${tile.name}`} onClick={() => photos.remove(tile.key)}>
                    <span data-icon aria-hidden="true" className={styles.tileRemoveIcon}>close</span>
                    Remove
                  </button>
                  {refusal ? (
                    <span role="alert" className={`${f.error} ${styles.tileError}`}>
                      <span data-icon aria-hidden="true" className={f.errorIcon}>error</span>
                      {refusal}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
        <label className={styles.add} data-full={photos.tiles.length >= MAX_PHOTOS ? 'true' : undefined}>
          <span data-icon aria-hidden="true" className={styles.addIcon}>add_photo_alternate</span>
          Add photos
          <input
            type="file"
            accept="image/*"
            multiple
            className={styles.addInput}
            disabled={photos.tiles.length >= MAX_PHOTOS}
            {...invalidProps(sectionError)}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = '';
              if (files.length) photos.add(files);
            }}
          />
        </label>
        {photos.overflow ? (
          <span className={f.warning}>
            <span data-icon aria-hidden="true" className={f.warningIcon}>warning</span>
            <span>At most {MAX_PHOTOS} photos can be added at once. Add the rest with an event.</span>
          </span>
        ) : null}
        {sectionError ? (
          <span role="alert" className={f.error}>
            <span data-icon aria-hidden="true" className={f.errorIcon}>error</span>
            {sectionError}
          </span>
        ) : null}
        <p className={styles.hint}>{hint}</p>
      </div>
    </div>
  );
}

/* register and edit a case ------------------------------------------------------------------------ */

export interface CaseFormState {
  vehicleId: string;
  type: string;
  damage: string;
  description: string;
  happened: string;
  timeIsWhenFound: boolean;
  place: string;
  placeIsWhereFound: boolean;
  driverId: string;
  /** Each insurer is one of the list, by its id (Follow-up 18); '' for none. */
  ourInsurerId: string;
  ourClaimNumber: string;
  otherInsurerId: string;
  otherClaimNumber: string;
  handledBy: string;
  status: string;
  waitingFor: string;
  atFault: string;
  sameAccidentCaseId: string;
}

/** A new case (handover d): Usual, happened now, both ticks off, Happened and Us, no other case. */
export const blankCase = (): CaseFormState => ({
  vehicleId: '', type: String(InsuranceCaseType.Usual), damage: '', description: '', happened: nowInput(),
  timeIsWhenFound: false, place: '', placeIsWhereFound: false, driverId: '', ourInsurerId: '', ourClaimNumber: '',
  otherInsurerId: '', otherClaimNumber: '', handledBy: '', status: String(InsuranceCaseStatus.Happened),
  waitingFor: String(InsuranceCaseParty.Us), atFault: '', sameAccidentCaseId: '',
});

/** The form as Edit case opens it: the case as its page read it. */
export const caseFormOf = (kase: InsuranceCaseResponse): CaseFormState => ({
  vehicleId: kase.vehicleId,
  type: String(kase.type),
  damage: kase.damage,
  description: kase.description ?? '',
  happened: toLocalInput(kase.happenedAtUtc),
  timeIsWhenFound: kase.timeIsWhenFound,
  place: kase.place,
  placeIsWhereFound: kase.placeIsWhereFound,
  driverId: kase.driverId ?? '',
  ourInsurerId: kase.ourInsurer?.id ?? '',
  ourClaimNumber: kase.ourClaimNumber ?? '',
  otherInsurerId: kase.otherInsurer?.id ?? '',
  otherClaimNumber: kase.otherClaimNumber ?? '',
  handledBy: kase.handledBy ? String(kase.handledBy) : '',
  status: String(kase.status),
  waitingFor: String(kase.waitingFor),
  atFault: kase.atFault ? String(kase.atFault) : '',
  sameAccidentCaseId: kase.sameAccidentCaseId ?? '',
});

/**
 * Casco case for this accident (handover d): the car, what is damaged, the description, the time and
 * the place with their ticks, the driver, and our insurer with Handled by ours when there is one; the
 * type Casco and the accident's first case as Same accident. Everything else as a new case has it.
 * Our insurer is copied only while it is in use (Follow-up 18): one out of use cannot go on a new case.
 */
export const cascoFormOf = (source: InsuranceCaseResponse): CaseFormState => ({
  ...blankCase(),
  vehicleId: source.vehicleId,
  type: String(InsuranceCaseType.Casco),
  damage: source.damage,
  description: source.description ?? '',
  happened: toLocalInput(source.happenedAtUtc),
  timeIsWhenFound: source.timeIsWhenFound,
  place: source.place,
  placeIsWhereFound: source.placeIsWhereFound,
  driverId: source.driverId ?? '',
  ourInsurerId: source.ourInsurer?.isActive ? source.ourInsurer.id : '',
  handledBy: source.ourInsurer?.isActive ? String(InsurerSide.Ours) : '',
  sameAccidentCaseId: source.sameAccidentCaseId ?? source.id,
});

const optionalNumber = <T extends number>(value: string) => (value === '' ? null : (Number(value) as T));

/**
 * A side's insurer chosen, or cleared (Follow-up 18): clearing the side Handled by names resets
 * Handled by (handover d), since the API refuses a handler without its insurer.
 */
export function withInsurer(form: CaseFormState, key: 'ourInsurerId' | 'otherInsurerId', insurerId: string): CaseFormState {
  const side = key === 'ourInsurerId' ? String(InsurerSide.Ours) : String(InsurerSide.Theirs);
  return { ...form, [key]: insurerId, handledBy: !insurerId && form.handledBy === side ? '' : form.handledBy };
}

/** What Register case sends: the form as the person left it; blanks go as none. */
export function registerRequest(form: CaseFormState, stored?: string | null): RegisterInsuranceCaseRequest {
  return {
    type: Number(form.type) as InsuranceCaseType,
    vehicleId: form.vehicleId || null,
    damage: form.damage,
    description: blankToNull(form.description),
    happenedAtUtc: instantOf(form.happened, stored),
    timeIsWhenFound: form.timeIsWhenFound,
    place: form.place,
    placeIsWhereFound: form.placeIsWhereFound,
    driverId: form.driverId || null,
    ourInsurerId: form.ourInsurerId || null,
    ourClaimNumber: blankToNull(form.ourClaimNumber),
    otherInsurerId: form.otherInsurerId || null,
    otherClaimNumber: blankToNull(form.otherClaimNumber),
    handledBy: optionalNumber<InsurerSide>(form.handledBy),
    status: Number(form.status) as InsuranceCaseStatus,
    waitingFor: Number(form.waitingFor) as InsuranceCaseParty,
    sameAccidentCaseId: form.sameAccidentCaseId || null,
  };
}

/**
 * What Edit case sends: everything but the status and who the case waits for, with the case's token.
 * The time the person did not touch goes back exactly as it was stored.
 */
export function updateRequest(form: CaseFormState, kase: InsuranceCaseResponse): UpdateInsuranceCaseRequest {
  const { status: _status, waitingFor: _waitingFor, ...fields } = registerRequest(form, kase.happenedAtUtc);
  return {
    ...fields,
    atFault: optionalNumber<AtFaultParty>(form.atFault),
    concurrencyToken: kase.concurrencyToken,
  };
}

/** The side of a case whose insurer the Add insurer window is adding, with what was typed in its picker. */
type Adding = { key: 'ourInsurerId' | 'otherInsurerId'; typed: string };

export function CaseForm({ kase, from, tab, onClose, initial, initialPhotos, initialPicker, initialAdding }: {
  /** The case Edit case opens on; without it the dialog registers a new case. */
  kase?: InsuranceCaseResponse;
  /** The usual case whose casco case is registered (Casco case for this accident). */
  from?: InsuranceCaseResponse;
  tab: CaseTab;
  onClose: () => void;
  initial?: Partial<CaseFormState>;
  initialPhotos?: PhotoTile[];
  /** One insurer picker open, with a find typed: the render tests use it. */
  initialPicker?: { key: 'ourInsurerId' | 'otherInsurerId'; find: string };
  /** The Add insurer window open over the form: the render tests use it. */
  initialAdding?: Adding;
}) {
  const navigate = useNavigate();
  const { can } = useAccess();
  const [adding, setAdding] = useState<Adding | null>(initialAdding ?? null);
  const seed = { ...(kase ? caseFormOf(kase) : from ? cascoFormOf(from) : blankCase()), ...initial };
  const [form, setForm] = useState<CaseFormState>(seed);
  const photos = usePhotoTiles(initialPhotos);
  /** The tiles in the order they were sent: a refusal's `Photos[i]` belongs to the tile sent i-th. */
  const sent = useRef<string[]>((initialPhotos ?? []).map((tile) => tile.key));
  const created = useRef<Uuid | null>(null);
  // Whether the next suggestion fills the driver in: after the car or the time changed, not on opening.
  const fill = useRef(false);

  const set = <K extends keyof CaseFormState>(key: K, value: CaseFormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const vehicles = useQuery({ queryKey: qk.vehicles.list(ACTIVE), queryFn: () => listVehicles(ACTIVE) });
  const drivers = useQuery({ queryKey: qk.drivers.list(ACTIVE), queryFn: () => listDrivers(ACTIVE) });
  // The whole list, in use and out of use: the pickers offer those in use and the case's own.
  const insurers = useQuery({ queryKey: qk.insurers.list({}), queryFn: () => listInsurers({}) });
  const choicesQuery = kase ? { ForCaseId: kase.id } : {};
  const choices = useQuery({
    queryKey: qk.insuranceCases.accidentChoices(choicesQuery),
    queryFn: () => listAccidentChoices(choicesQuery),
  });

  const atUtc = instantOf(form.happened, kase?.happenedAtUtc);
  const suggestionQuery = form.vehicleId && atUtc ? { VehicleId: form.vehicleId, AtUtc: atUtc } : null;
  const suggestion = useQuery({
    queryKey: qk.insuranceCases.driverSuggestion(suggestionQuery ?? {}),
    queryFn: () => suggestDriver(suggestionQuery ?? {}),
    enabled: !!suggestionQuery,
  });
  const found = suggestionQuery ? suggestion.data : undefined;

  // The driver is filled in again from the rental each time the car or the time changes (F17-4).
  useEffect(() => {
    if (!fill.current || !found) return;
    fill.current = false;
    set('driverId', found.suggestedDriverId ?? '');
  }, [found]);

  /** The car or the time changed: fill the driver in from the rental at that moment, or clear it. */
  const setRentalKey = (key: 'vehicleId' | 'happened', value: string) => {
    const next = { ...form, [key]: value };
    const complete = !!next.vehicleId && !!instantOf(next.happened, kase?.happenedAtUtc);
    fill.current = complete;
    setForm(complete ? next : { ...next, driverId: '' });
  };

  const setInsurer = (key: 'ourInsurerId' | 'otherInsurerId', insurerId: string) =>
    setForm((current) => withInsurer(current, key, insurerId));

  const m = useActionMutation({
    op: kase ? 'case-edit' : 'case-register',
    mutationFn: async () => {
      if (kase) return updateCase(kase.id, updateRequest(form, kase));
      sent.current = photos.tiles.map((tile) => tile.key);
      const answer = await registerCase(registerRequest(form), photos.uploads());
      created.current = answer.id;
      return answer;
    },
    invalidate: CASE_REFRESH,
    refusal: caseRefusal,
    onDone: () => {
      const id = created.current;
      onClose();
      // After Register the new case's page opens.
      if (id) navigate(caseHref(id, tab));
    },
  });

  const fields = m.fields;
  const source = kase ?? from;
  const vehicleOptions = (vehicles.data?.items ?? []).map((v) => ({ value: v.id, label: `${v.plateNumber} · ${v.make} ${v.model}` }));
  // On an edit, an inactive car already on the case is still shown (F17-4).
  if (source && form.vehicleId === source.vehicleId && !vehicleOptions.some((o) => o.value === source.vehicleId)) {
    vehicleOptions.push({ value: source.vehicleId, label: source.vehicleLabel });
  }
  const plate = vehicles.data?.items.find((v) => v.id === form.vehicleId)?.plateNumber
    ?? (source && form.vehicleId === source.vehicleId ? source.vehiclePlate : null);

  const several = found?.situation === InsuranceCaseDriverSituation.SeveralDrivers;
  const onRental = found && (several || found.situation === InsuranceCaseDriverSituation.OneDriver) ? found.drivers : [];
  const driverOptions = [
    ...onRental.map((d) => ({ value: d.driverId, label: `${d.displayName} · on the rental then` })),
    ...(drivers.data?.items ?? [])
      .filter((d) => !onRental.some((r) => r.driverId === d.id))
      .map((d) => ({ value: d.id, label: `${d.firstName} ${d.lastName}` })),
  ];
  // An inactive driver already on the case is still shown.
  if (form.driverId && !driverOptions.some((o) => o.value === form.driverId)) {
    const name = source && source.driverId === form.driverId ? source.driverDisplayName : null;
    driverOptions.push({ value: form.driverId, label: name ?? 'The driver on the case' });
  }

  // On an edit, the case's own insurers stay offered and chosen even when they are out of use; a
  // casco case's copy of its usual case's insurer, which is in use, is named while the list loads.
  const keptOur = kase?.ourInsurer ?? (from?.ourInsurer?.isActive ? from.ourInsurer : null);
  const keptOther = kase?.otherInsurer ?? null;
  const our = chosenInsurer(form.ourInsurerId, insurers.data, keptOur)?.name ?? '';
  const other = chosenInsurer(form.otherInsurerId, insurers.data, keptOther)?.name ?? '';
  // Handled by keeps its options from the two insurers chosen (F18-2d).
  const handledOptions = [
    { value: '', label: 'Not known yet' },
    ...(form.ourInsurerId ? [{ value: String(InsurerSide.Ours), label: our ? `Our insurer · ${our}` : 'Our insurer' }] : []),
    ...(form.otherInsurerId ? [{ value: String(InsurerSide.Theirs), label: other ? `The other party’s insurer · ${other}` : 'The other party’s insurer' }] : []),
  ];
  const canAdd = can(CASES_MANAGE);
  const picker = (key: 'ourInsurerId' | 'otherInsurerId', label: string) => (
    <InsurerPicker
      label={label}
      value={form[key]}
      insurers={insurers.data}
      kept={key === 'ourInsurerId' ? keptOur : keptOther}
      canAdd={canAdd}
      error={fields[key]}
      onChange={(id) => setInsurer(key, id)}
      onAdd={(typed) => setAdding({ key, typed })}
      {...(initialPicker?.key === key ? { initialOpen: true, initialFind: initialPicker.find } : {})}
    />
  );

  const sameOptions = (choices.data ?? []).map((c) => ({ value: c.id, label: `${c.label} · ${CASE_TYPE_LABEL[c.type]}` }));
  if (form.sameAccidentCaseId && !sameOptions.some((o) => o.value === form.sameAccidentCaseId)) {
    const known = [...(source?.sameAccidentCases ?? []), ...(from ? [{ id: from.id, label: caseTitle(from), type: from.type }] : [])]
      .find((c) => c.id === form.sameAccidentCaseId);
    sameOptions.push({
      value: form.sameAccidentCaseId,
      label: known ? `${known.label} · ${CASE_TYPE_LABEL[known.type]}` : 'The case of this accident',
    });
  }

  const timeError = fields['happenedAtUtc'];

  return (
    <>
      <Dialog
        title={kase ? 'Edit case' : 'Register case'}
        description={kase ? caseTitle(kase) : from ? `Filled in from ${caseTitle(from)}, as its casco case.` : undefined}
        icon="car_crash"
        tone="accent"
        width={720}
        submitLabel={kase ? 'Save changes' : 'Register case'}
        submitBlocked={kase ? null : photos.blocked}
        busy={m.busy}
        failure={m.failure}
        footnote={kase
          ? 'Status and Waiting for change only through an event.'
          : 'After this, the status and who the case waits for change only through an event.'}
        onClose={onClose}
        onSubmit={() => m.submit(undefined)}
        onRefresh={m.refresh}
      >
        <div className={dialogStyles.section}>
          <p className={dialogStyles.sectionTitle}>The damage</p>
          <div className={styles.grid}>
            <Field label="Car" required error={fields['vehicleId']}>
              <select className={f.control} {...invalidProps(fields['vehicleId'])} value={form.vehicleId} onChange={(e) => setRentalKey('vehicleId', e.target.value)}>
                <option value="">Choose a car</option>
                {vehicleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field
              label="Type"
              required
              error={fields['type']}
              hint={form.type === String(InsuranceCaseType.Casco)
                ? 'Our casco repairs the car now; the company pays the 500-euro deductible.'
                : 'The insurers decide who is at fault.'}
            >
              <select className={f.control} {...invalidProps(fields['type'])} value={form.type} onChange={(e) => set('type', e.target.value)}>
                <option value={InsuranceCaseType.Usual}>{CASE_TYPE_LABEL[InsuranceCaseType.Usual]}</option>
                <option value={InsuranceCaseType.Casco}>{CASE_TYPE_LABEL[InsuranceCaseType.Casco]}</option>
              </select>
            </Field>
            <span className={styles.span}>
              <Field label="What is damaged" required error={fields['damage']}>
                <input
                  className={f.control}
                  {...invalidProps(fields['damage'])}
                  maxLength={200}
                  placeholder="For example Rear bumper dented"
                  value={form.damage}
                  onChange={(e) => set('damage', e.target.value)}
                />
              </Field>
            </span>
            <span className={styles.span}>
              <Field label="Description" optional error={fields['description']}>
                <textarea
                  className={f.control}
                  {...invalidProps(fields['description'])}
                  rows={3}
                  maxLength={4000}
                  placeholder="What happened, in as many words as needed"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </Field>
            </span>
          </div>
        </div>

        <div className={dialogStyles.section}>
          <p className={dialogStyles.sectionTitle}>When and where</p>
          <div className={styles.grid}>
            <Field label={form.timeIsWhenFound ? 'Found' : 'Happened'} required error={timeError}>
              <input
                type="datetime-local"
                className={f.control}
                {...invalidProps(timeError)}
                value={form.happened}
                onChange={(e) => setRentalKey('happened', e.target.value)}
              />
            </Field>
          </div>
          <CheckCard
            label="We don’t know when"
            hint="This is when it was found."
            checked={form.timeIsWhenFound}
            error={fields['timeIsWhenFound']}
            onChange={(next) => set('timeIsWhenFound', next)}
          />
          <Field label={form.placeIsWhereFound ? 'Where it was found' : 'Place'} required error={fields['place']}>
            <input
              className={f.control}
              {...invalidProps(fields['place'])}
              maxLength={200}
              value={form.place}
              onChange={(e) => set('place', e.target.value)}
            />
          </Field>
          <CheckCard
            label="We don’t know where"
            hint="This is where it was found."
            checked={form.placeIsWhereFound}
            error={fields['placeIsWhereFound']}
            onChange={(next) => set('placeIsWhereFound', next)}
          />
        </div>

        <div className={dialogStyles.section}>
          <p className={dialogStyles.sectionTitle}>Driver</p>
          <Field label="Driver" optional error={fields['driverId']} hint={driverHint(found, suggestionQuery ? plate : null)}>
            <select className={f.control} {...invalidProps(fields['driverId'])} value={form.driverId} onChange={(e) => set('driverId', e.target.value)}>
              <option value="">{several ? 'Choose who drove' : 'Not known'}</option>
              {driverOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>

        <div className={dialogStyles.section}>
          <p className={dialogStyles.sectionTitle}>Insurance</p>
          <div className={styles.grid}>
            <Field label="Our insurer" optional group error={fields['ourInsurerId']}>
              {picker('ourInsurerId', 'Our insurer')}
            </Field>
            <Field label="Claim number" optional error={fields['ourClaimNumber']}>
              <input className={`${f.control} ${f.mono}`} {...invalidProps(fields['ourClaimNumber'])} maxLength={50} value={form.ourClaimNumber} onChange={(e) => set('ourClaimNumber', e.target.value)} />
            </Field>
            <Field label="The other party’s insurer" optional group error={fields['otherInsurerId']}>
              {picker('otherInsurerId', 'The other party’s insurer')}
            </Field>
            <Field label="Claim number" optional error={fields['otherClaimNumber']}>
              <input className={`${f.control} ${f.mono}`} {...invalidProps(fields['otherClaimNumber'])} maxLength={50} value={form.otherClaimNumber} onChange={(e) => set('otherClaimNumber', e.target.value)} />
            </Field>
            <span className={styles.span}>
              <Field
                label="Handled by"
                optional
                error={fields['handledBy']}
                hint={form.ourInsurerId || form.otherInsurerId ? 'The insurer that handles the case, once the two have agreed.' : 'Offers the insurers filled in above.'}
              >
                <select className={f.control} {...invalidProps(fields['handledBy'])} value={form.handledBy} onChange={(e) => set('handledBy', e.target.value)}>
                  {handledOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
            </span>
          </div>
        </div>

        {kase ? (
          <div className={dialogStyles.section}>
            <p className={dialogStyles.sectionTitle}>Decision</p>
            <div className={styles.grid}>
              <Field label="At fault" optional error={fields['atFault']} hint="Set it once the decision is known.">
                <select className={f.control} {...invalidProps(fields['atFault'])} value={form.atFault} onChange={(e) => set('atFault', e.target.value)}>
                  <option value="">Not decided yet</option>
                  {AT_FAULT_PARTIES.map((p) => <option key={p} value={p}>{AT_FAULT_LABEL[p]}</option>)}
                </select>
              </Field>
            </div>
          </div>
        ) : (
          <>
            <div className={dialogStyles.section}>
              <p className={dialogStyles.sectionTitle}>Where it stands</p>
              <div className={styles.grid}>
                <Field label="Status" required error={fields['status']}>
                  <select className={f.control} {...invalidProps(fields['status'])} value={form.status} onChange={(e) => set('status', e.target.value)}>
                    {CASE_STATUSES.map((s) => <option key={s} value={s}>{CASE_STATUS_LABEL[s]}</option>)}
                  </select>
                </Field>
                <Field label="Waiting for" required error={fields['waitingFor']}>
                  <select className={f.control} {...invalidProps(fields['waitingFor'])} value={form.waitingFor} onChange={(e) => set('waitingFor', e.target.value)}>
                    {CASE_PARTIES.map((p) => <option key={p} value={p}>{CASE_PARTY_LABEL[p]}</option>)}
                  </select>
                </Field>
              </div>
            </div>
            <PhotosSection
              photos={photos}
              fields={fields}
              sent={sent.current}
              hint="Optional, several at once. Photos only: documents stay in the mailbox."
            />
          </>
        )}

        <div className={dialogStyles.section}>
          <p className={dialogStyles.sectionTitle}>Same accident</p>
          <Field label="Same accident as" optional error={fields['sameAccidentCaseId']}>
            <select className={f.control} {...invalidProps(fields['sameAccidentCaseId'])} value={form.sameAccidentCaseId} onChange={(e) => set('sameAccidentCaseId', e.target.value)}>
              <option value="">No other case</option>
              {sameOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>
      </Dialog>
      {/* Add an insurer (F18-2d): its own window over the form, with its own Refresh, so a stale answer
          there never re-seeds the case being filled in. */}
      {adding ? (
        <ReseedScope>
          <InsurerForm
            insurers={insurers.data}
            initialName={adding.typed}
            onUse={(insurer) => {
              setInsurer(adding.key, insurer.id);
              setAdding(null);
            }}
            onAdded={(insurer) => setInsurer(adding.key, insurer.id)}
            onClose={() => setAdding(null)}
          />
        </ReseedScope>
      ) : null}
    </>
  );
}

/* events ------------------------------------------------------------------------------------------ */

/** What Add event sends: the person's values, the statuses as chosen, and the case's token. */
export function addEventRequest(
  form: { happened: string; title: string; description: string; status: string; waitingFor: string },
  kase: InsuranceCaseResponse,
): AddInsuranceCaseEventRequest {
  return {
    happenedAtUtc: instantOf(form.happened),
    title: form.title,
    description: blankToNull(form.description),
    statusNow: Number(form.status) as InsuranceCaseStatus,
    waitingForNow: Number(form.waitingFor) as InsuranceCaseParty,
    concurrencyToken: kase.concurrencyToken,
  };
}

/** What Edit event sends: its time (the stored one while untouched), title, description, and the photos it removes. */
export function correctEventRequest(
  form: { happened: string; title: string; description: string },
  event: InsuranceCaseEventResponse,
  removed: readonly Uuid[],
): CorrectInsuranceCaseEventRequest {
  return {
    happenedAtUtc: instantOf(form.happened, event.happenedAtUtc),
    title: form.title,
    description: blankToNull(form.description),
    removePhotoIds: [...removed],
  };
}

/** An event's own photos in Edit event: each with Remove, and Keep once removed, until saved. */
function EventPhotos({ caseId, photos, removed, fields, onToggle }: {
  caseId: Uuid;
  photos: InsuranceCasePhotoResponse[];
  removed: readonly Uuid[];
  fields: Record<string, string>;
  onToggle: (photoId: Uuid) => void;
}) {
  return (
    <div className={dialogStyles.section}>
      <p className={dialogStyles.sectionTitle}>Photos</p>
      <div className={styles.photos}>
        <div className={styles.tiles}>
          {photos.map((photo) => {
            const at = removed.indexOf(photo.id);
            const gone = at >= 0;
            const refusal = gone ? fields[`removePhotoIds[${at}]`] : undefined;
            return (
              <div key={photo.id} className={styles.tile} data-removed={gone ? 'true' : undefined} data-refused={refusal ? 'true' : undefined}>
                <span className={styles.tilePicture}>
                  <img className={styles.tileImg} src={photoUrl(caseId, photo.id)} alt="" loading="lazy" />
                  {gone ? <span className={styles.tileGone}>Removed</span> : null}
                </span>
                <span className={styles.tileName} title={photo.fileName}>{photo.fileName}</span>
                <span className={styles.tileSize}>{sizeText(photo.sizeInBytes)}</span>
                <button
                  type="button"
                  className={styles.tileRemove}
                  aria-label={gone ? `Keep ${photo.fileName}` : `Remove ${photo.fileName}`}
                  onClick={() => onToggle(photo.id)}
                >
                  <span data-icon aria-hidden="true" className={styles.tileRemoveIcon}>{gone ? 'undo' : 'close'}</span>
                  {gone ? 'Keep' : 'Remove'}
                </button>
                {refusal ? (
                  <span role="alert" className={`${f.error} ${styles.tileError}`}>
                    <span data-icon aria-hidden="true" className={f.errorIcon}>error</span>
                    {refusal}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
        {fields['removePhotoIds'] ? (
          <span role="alert" className={f.error}>
            <span data-icon aria-hidden="true" className={f.errorIcon}>error</span>
            {fields['removePhotoIds']}
          </span>
        ) : null}
        <p className={styles.hint}>You can remove a photo you added. New photos go with a new event.</p>
      </div>
    </div>
  );
}

export function EventForm({ kase, event, onClose, initial, initialPhotos }: {
  kase: InsuranceCaseResponse;
  /** The event Edit event corrects; without it the dialog adds one. */
  event?: InsuranceCaseEventResponse;
  onClose: () => void;
  initial?: Partial<{ happened: string; title: string; description: string; status: string; waitingFor: string; removed: Uuid[] }>;
  initialPhotos?: PhotoTile[];
}) {
  const [happened, setHappened] = useState(initial?.happened ?? (event ? toLocalInput(event.happenedAtUtc) : nowInput()));
  const [title, setTitle] = useState(initial?.title ?? event?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? event?.description ?? '');
  // Add event presets Status now and Waiting for now to the case's current values.
  const [status, setStatus] = useState(initial?.status ?? String(kase.status));
  const [waitingFor, setWaitingFor] = useState(initial?.waitingFor ?? String(kase.waitingFor));
  const [removed, setRemoved] = useState<Uuid[]>(initial?.removed ?? []);
  const photos = usePhotoTiles(initialPhotos);
  const sent = useRef<string[]>((initialPhotos ?? []).map((tile) => tile.key));

  const m = useActionMutation({
    op: event ? 'case-event-edit' : 'case-event-add',
    mutationFn: () => {
      if (event) return correctEvent(kase.id, event.id, correctEventRequest({ happened, title, description }, event, removed));
      sent.current = photos.tiles.map((tile) => tile.key);
      return addEvent(kase.id, addEventRequest({ happened, title, description, status, waitingFor }, kase), photos.uploads());
    },
    invalidate: CASE_REFRESH,
    refusal: caseRefusal,
    onDone: onClose,
  });
  const fields = m.fields;

  return (
    <Dialog
      title={event ? 'Edit event' : 'Add event'}
      description={caseTitle(kase)}
      icon="event_note"
      tone="accent"
      width={640}
      submitLabel={event ? 'Save changes' : 'Add event'}
      submitBlocked={event ? null : photos.blocked}
      busy={m.busy}
      failure={m.failure}
      footnote={event ? 'Only you, who added this event, can correct it.' : undefined}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <div className={dialogStyles.section}>
        <p className={dialogStyles.sectionTitle}>The event</p>
        <div className={styles.grid}>
          <Field label="When" required error={fields['happenedAtUtc']} hint="The day it happened, even when you type it in later.">
            <input
              type="datetime-local"
              className={f.control}
              {...invalidProps(fields['happenedAtUtc'])}
              value={happened}
              onChange={(e) => setHappened(e.target.value)}
            />
          </Field>
          <span className={styles.span}>
            <Field label="Title" required error={fields['title']}>
              <input
                className={f.control}
                {...invalidProps(fields['title'])}
                maxLength={200}
                placeholder="The insurer asked for the driver’s licence"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
          </span>
          <span className={styles.span}>
            <Field label="Description" optional error={fields['description']}>
              <textarea
                className={f.control}
                {...invalidProps(fields['description'])}
                rows={3}
                maxLength={4000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
          </span>
        </div>
      </div>

      {event ? (
        <>
          {event.photos.length ? (
            <EventPhotos
              caseId={kase.id}
              photos={event.photos}
              removed={removed}
              fields={fields}
              onToggle={(id) => setRemoved((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))}
            />
          ) : null}
          <div className={dialogStyles.section}>
            <p className={dialogStyles.sectionTitle}>Where it stands</p>
            <Field label="What this event changed" group>
              <p className={dialogStyles.static}>{changedText(event)}</p>
            </Field>
          </div>
        </>
      ) : (
        <>
          <PhotosSection photos={photos} fields={fields} sent={sent.current} hint="Optional. Photos only: documents stay in the mailbox." />
          <div className={dialogStyles.section}>
            <p className={dialogStyles.sectionTitle}>Where it stands</p>
            <div className={styles.grid}>
              <Field label="Status now" required error={fields['statusNow']}>
                <select className={f.control} {...invalidProps(fields['statusNow'])} value={status} onChange={(e) => setStatus(e.target.value)}>
                  {CASE_STATUSES.map((s) => <option key={s} value={s}>{CASE_STATUS_LABEL[s]}</option>)}
                </select>
              </Field>
              <Field label="Waiting for now" required error={fields['waitingForNow']}>
                <select className={f.control} {...invalidProps(fields['waitingForNow'])} value={waitingFor} onChange={(e) => setWaitingFor(e.target.value)}>
                  {CASE_PARTIES.map((p) => <option key={p} value={p}>{CASE_PARTY_LABEL[p]}</option>)}
                </select>
              </Field>
            </div>
            <DialogNote>Preset to the case’s current values. Most events change neither.</DialogNote>
          </div>
        </>
      )}
    </Dialog>
  );
}

/* notes ------------------------------------------------------------------------------------------- */

export function NoteForm({ kase, note, onClose, initialText }: {
  kase: InsuranceCaseResponse;
  /** The note Edit note corrects; without it the dialog adds one. */
  note?: InsuranceCaseNoteResponse;
  onClose: () => void;
  initialText?: string;
}) {
  const [text, setText] = useState(initialText ?? note?.text ?? '');
  const m = useActionMutation({
    op: note ? 'case-note-edit' : 'case-note-add',
    mutationFn: () => (note ? correctNote(kase.id, note.id, { text }) : addNote(kase.id, { text })),
    invalidate: CASE_REFRESH,
    refusal: caseRefusal,
    onDone: onClose,
  });
  return (
    <Dialog
      title={note ? 'Edit note' : 'Add note'}
      description={caseTitle(kase)}
      icon="edit_note"
      tone="accent"
      width={560}
      submitLabel={note ? 'Save changes' : 'Add note'}
      busy={m.busy}
      failure={m.failure}
      footnote={note ? 'Only you, who wrote this note, can correct it.' : 'A note changes nothing on the case.'}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <Field label="Text" required error={m.fields['text']}>
        <textarea
          className={f.control}
          {...invalidProps(m.fields['text'])}
          rows={5}
          maxLength={4000}
          placeholder="The driver says a witness saw the other car’s plate"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </Field>
    </Dialog>
  );
}

/* the switches ------------------------------------------------------------------------------------ */

export function RegisterCaseDialog({ open, tab, onClose }: { open: boolean; tab: CaseTab; onClose: () => void }) {
  if (!open) return null;
  return (
    <ReseedScope>
      <CaseForm tab={tab} onClose={onClose} />
    </ReseedScope>
  );
}

/**
 * A case page's dialogs. Each reads the case as the page holds it; the stale banner's Refresh reloads
 * it and re-seeds the dialog from what came back. An event or a note that is gone from the case when
 * its dialog opens is not opened.
 */
export function CaseDialogs({ dialog, kase, tab, onClose }: {
  dialog: CaseDialog | null;
  kase: InsuranceCaseResponse;
  tab: CaseTab;
  onClose: () => void;
}) {
  if (!dialog) return null;
  const event = dialog.kind === 'event-edit' ? kase.events.find((e) => e.id === dialog.eventId) : undefined;
  const note = dialog.kind === 'note-edit' ? kase.notes.find((n) => n.id === dialog.noteId) : undefined;
  if ((dialog.kind === 'event-edit' && !event) || (dialog.kind === 'note-edit' && !note)) return null;
  return (
    <ReseedScope>
      {dialog.kind === 'edit' ? <CaseForm kase={kase} tab={tab} onClose={onClose} />
        : dialog.kind === 'casco' ? <CaseForm from={kase} tab={tab} onClose={onClose} />
          : dialog.kind === 'event-add' || dialog.kind === 'event-edit' ? <EventForm kase={kase} event={event} onClose={onClose} />
            : <NoteForm kase={kase} note={note} onClose={onClose} />}
    </ReseedScope>
  );
}
