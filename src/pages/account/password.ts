/**
 * The prototype's `pwRules()`: the live checklist under a new-password field, and the check the
 * form runs before it submits. The labels are the prototype's.
 *
 * Two differences from the prototype, both so that the checklist says exactly what the API
 * enforces. The prototype's fifth rule asks for a lowercase letter, which Identity does not
 * require, so a password the server would accept was refused by the form; the owner dropped that
 * line on 2026-09-16 and four rules remain. And the prototype counts any non-alphanumeric as the
 * symbol, where the API's validator wants a non-whitespace punctuation or symbol character, so the
 * symbol rule excludes whitespace.
 */
export interface PasswordRule {
  key: string;
  ok: boolean;
  label: string;
  icon: string;
}

export function passwordRules(value: string): PasswordRule[] {
  const v = value || '';
  return [
    { key: 'len', ok: v.length >= 12, label: 'At least 12 characters' },
    { key: 'upper', ok: /[A-Z]/.test(v), label: 'One uppercase letter' },
    { key: 'digit', ok: /[0-9]/.test(v), label: 'One digit' },
    { key: 'sym', ok: /[^A-Za-z0-9\s]/.test(v), label: 'One symbol' },
  ].map((r) => ({ ...r, icon: r.ok ? 'check_circle' : 'radio_button_unchecked' }));
}

export const passwordMeetsRules = (value: string): boolean =>
  passwordRules(value).every((r) => r.ok);

/** The prototype's own refusal when a rule is unmet. */
export const PASSWORD_NOT_MET = 'Password does not meet the requirements.';

/** The prototype's client-side email check, with its message. */
export const EMAIL_INVALID = "'Email' is not a valid email address.";
export const emailLooksValid = (value: string): boolean => value.indexOf('@') >= 0;
