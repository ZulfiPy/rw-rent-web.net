/**
 * The words of the insurers the company keeps (Follow-up 18, F18-2), and the two ways the app offers
 * them while a name is typed: the picker's find box, and the insurers that look alike in the Add
 * insurer and Edit insurer windows. The server decides which names are one name (INS-017: whatever
 * the case of the letters or the spaces); the look-alikes only help a person see an insurer that is
 * already on the list before adding it again.
 */

/** An insurer no longer used, in the API's own words. */
export const OUT_OF_USE = 'Out of use';

export const CHOOSE_INSURER = 'Choose an insurer';
export const NOT_CHOSEN = 'Not chosen';
export const NO_INSURERS = 'No insurers yet';
export const LOOKS_ALIKE = 'Already on the list, and looks alike';
export const INSURERS_DESCRIPTION = 'The insurers the company works with. A case picks its insurers from this list.';

/** "1 insurer", "4 insurers". */
export const insurerCount = (n: number) => `${n} ${n === 1 ? 'insurer' : 'insurers'}`;

/** A name as the find box and the look-alikes compare it: letter case, accents and runs of spaces ignored. */
export function insurerKey(text: string): string {
  return text.normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** The find box of the picker: an insurer whose name holds what is typed. Nothing typed holds every name. */
export const holdsFind = (name: string, find: string) => insurerKey(name).includes(insurerKey(find));

/** A name's words, each without the marks around it ("P&C" is "pc", "AS." is "as"). */
const wordsOf = (key: string) => key.split(' ').map((word) => word.replace(/[^\p{L}\p{N}]/gu, '')).filter(Boolean);

/**
 * Whether an insurer looks like the name being typed (the mock-up the owner approved): its name holds
 * what is typed; what is typed holds a word of four letters or more of its name; or what is typed,
 * without spaces, is its name's initials, so "BM" shows Baltic Mutual. From two letters on.
 */
export function looksAlike(name: string, typed: string): boolean {
  const t = insurerKey(typed);
  const bare = t.replace(/ /g, '');
  if (bare.length < 2) return false;
  const n = insurerKey(name);
  if (n.includes(t)) return true;
  const words = wordsOf(n);
  if (words.some((word) => word.length >= 4 && t.includes(word))) return true;
  const initials = words.map((word) => word.charAt(0)).join('');
  return initials.length >= 2 && bare === initials;
}

/** The insurers of the list that look like a name, in the list's order; an edited insurer is not its own look-alike. */
export function lookAlikes<T extends { id: string; name: string }>(list: readonly T[], typed: string, except?: string | null): T[] {
  return list.filter((insurer) => insurer.id !== except && looksAlike(insurer.name, typed));
}

/** Where an insurer's email opens the mail program. */
export const mailHref = (email: string) => `mailto:${email}`;

/** Where an insurer's phone number is called: its digits and a leading plus. */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;
