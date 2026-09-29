import { useRef, useState } from 'react';
import { qk } from '@/api';
import { createInsurer, updateInsurer } from '@/api/insurers';
import type {
  CreateInsurerRequest, InsurerListItemResponse, InsurerResponse, UpdateInsurerRequest,
} from '@/api/dto';
import { isApiError, type Failure } from '@/api/problem';
import { LOOKS_ALIKE, lookAlikes } from '@/format';
import { useActionMutation } from '@/app/useActionMutation';
import { Button } from '@/ui/Button';
import { Dialog } from '@/ui/Dialog';
import { Field, fieldStyles as f, invalidProps } from '@/ui/Field';
import { OutOfUseChip } from './InsurerPicker';
import styles from './InsurerDialogs.module.css';

/**
 * The Add insurer and Edit insurer windows (Follow-up 18, F18-2c), built with the app's own dialog,
 * fields and the one mutation hook every dialog submits through. Name is required, Email and Phone
 * optional, so that an insurer can be added from a case knowing only its name and completed later on
 * the Insurers page. While a name is typed, from two letters on, the insurers of the list that look
 * like it are shown above the buttons, those out of use marked so. Opened from a case's picker, each
 * one in use carries Use this one, which chooses it on the case instead.
 *
 * The server decides which names are one name (INS-017): the same name in other letters or spaces is
 * its `name_conflict`, shown under Name. Edit sends the insurer's token; a stale one shows the stale
 * banner with Refresh.
 */

/** Adding an insurer changes only the list. */
export const INSURER_ADD_REFRESH = [qk.insurers.all] as const;

/**
 * Editing one, or putting it out of use or back, changes the list and every case that names it: a
 * rename shows on the cases at once.
 */
export const INSURER_CHANGE_REFRESH = [qk.insurers.all, qk.insuranceCases.all] as const;

/** An insurer that no longer exists (404) is a refused change, in the API's words. */
export function insurerRefusal(error: unknown): Failure | null {
  if (!isApiError(error) || error.status !== 404) return null;
  return { kind: 'conflict', message: error.problem.detail || error.problem.title || '', code: error.code };
}

export interface InsurerFormState {
  name: string;
  email: string;
  phone: string;
}

const blankToNull = (value: string) => (value.trim() === '' ? null : value);

/** What Add insurer sends: the name as typed, a blank email or phone as none. The server tidies the rest. */
export const createInsurerRequest = (form: InsurerFormState): CreateInsurerRequest => ({
  name: form.name,
  email: blankToNull(form.email),
  phoneNumber: blankToNull(form.phone),
});

/** What Edit insurer sends: the same, with the insurer's token as the reader last saw it. */
export const updateInsurerRequest = (form: InsurerFormState, insurer: InsurerListItemResponse): UpdateInsurerRequest => ({
  ...createInsurerRequest(form),
  concurrencyToken: insurer.concurrencyToken,
});

/**
 * The insurers that look like the name being typed, above the buttons. Opened from a case, one in use
 * carries Use this one; one out of use is marked so, without the button; on the Insurers page they are
 * only shown.
 */
function LookAlikes({ found, onUse }: {
  found: readonly InsurerListItemResponse[];
  onUse?: ((insurer: InsurerListItemResponse) => void) | undefined;
}) {
  if (!found.length) return null;
  return (
    <div className={styles.alike} role="group" aria-label={LOOKS_ALIKE}>
      <p className={styles.alikeTitle}>
        <span data-icon aria-hidden="true" className={styles.alikeIcon}>content_copy</span>
        {LOOKS_ALIKE}
      </p>
      <ul className={styles.alikeList}>
        {found.map((insurer) => (
          <li key={insurer.id} className={styles.alikeRow}>
            <span className={styles.alikeName}>{insurer.name}</span>
            {insurer.isActive ? null : <OutOfUseChip />}
            {onUse && insurer.isActive ? (
              <span className={styles.alikeAction}>
                <Button label="Use this one" icon="check" small onClick={() => onUse(insurer)} />
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InsurerForm({ insurer, insurers, initialName, onUse, onAdded, onClose, initial }: {
  /** The insurer Edit insurer changes; without it the window adds one. */
  insurer?: InsurerListItemResponse;
  /** The whole list, for the look-alikes. */
  insurers: readonly InsurerListItemResponse[] | undefined;
  /** Opened from a case's picker: what was typed in its find box. */
  initialName?: string;
  /** Opened from a case's picker: choose a look-alike on the case instead of adding one. */
  onUse?: (insurer: InsurerListItemResponse) => void;
  /** The insurer just added, as the API answered it: a case's picker chooses it at once. */
  onAdded?: (insurer: InsurerResponse) => void;
  onClose: () => void;
  initial?: Partial<InsurerFormState>;
}) {
  const [form, setForm] = useState<InsurerFormState>({
    name: insurer?.name ?? initialName ?? '',
    email: insurer?.email ?? '',
    phone: insurer?.phoneNumber ?? '',
    ...initial,
  });
  const added = useRef<InsurerResponse | null>(null);
  const set = (key: keyof InsurerFormState, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const m = useActionMutation({
    op: insurer ? 'insurer-edit' : 'insurer-create',
    mutationFn: async () => {
      if (insurer) return updateInsurer(insurer.id, updateInsurerRequest(form, insurer));
      added.current = await createInsurer(createInsurerRequest(form));
      return added.current;
    },
    invalidate: insurer ? INSURER_CHANGE_REFRESH : INSURER_ADD_REFRESH,
    refusal: insurerRefusal,
    onDone: () => {
      if (added.current) onAdded?.(added.current);
      onClose();
    },
  });

  const fields = m.fields;
  const found = lookAlikes(insurers ?? [], form.name, insurer?.id);

  return (
    <Dialog
      title={insurer ? 'Edit insurer' : 'Add insurer'}
      description={insurer ? insurer.name : undefined}
      icon="shield"
      tone="accent"
      width={520}
      submitLabel={insurer ? 'Save changes' : 'Add insurer'}
      busy={m.busy}
      failure={m.failure}
      footnote={insurer
        ? 'A new name shows at once on every case that names this insurer.'
        : onUse
          ? 'The insurer is chosen on the case and is on the list for everyone.'
          : 'The insurer is on the list for everyone who works with cases.'}
      onClose={onClose}
      onSubmit={() => m.submit(undefined)}
      onRefresh={m.refresh}
    >
      <Field label="Name" required error={fields['name']}>
        <input
          className={f.control}
          {...invalidProps(fields['name'])}
          maxLength={100}
          autoComplete="off"
          placeholder="For example Baltic Mutual"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
        />
      </Field>
      <Field label="Email" optional error={fields['email']}>
        <input
          className={f.control}
          {...invalidProps(fields['email'])}
          type="email"
          inputMode="email"
          maxLength={254}
          autoComplete="off"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
        />
      </Field>
      <Field label="Phone" optional error={fields['phoneNumber']}>
        <input
          className={f.control}
          {...invalidProps(fields['phoneNumber'])}
          type="tel"
          maxLength={30}
          autoComplete="off"
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
        />
      </Field>
      <LookAlikes found={found} onUse={onUse} />
    </Dialog>
  );
}
