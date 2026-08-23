/**
 * code → input mapping for the coded 400 shape.
 *
 * Two 400 shapes reach here. A filter-level rejection carries `errors` and no `code`; a service-level
 * validation refusal carries `code` + `detail` and no `errors`. Both end up as field errors when the
 * path or code names an input, and as the form-level validation message when it does not.
 *
 * Entries are added only for codes the backend actually returns — never a guessed field.
 *
 * Keys are the field paths the dialogs use for their inputs. `roles[].expiresAtUtc` addresses every
 * role-expiry input in the activation dialog: the backend does not say which grant failed. Indexed
 * paths from `errors` resolve against the same key through fieldMessages().
 */
const GLOBAL: Record<string, string> = {
  // The role's expiry input; the activation dialog highlights every role-expiry field.
  'users.activation_role_expiry_invalid': 'roles[].expiresAtUtc',
};

/** Per-operation overrides, keyed by the `op` passed to toFailure(). */
const BY_OP: Record<string, Record<string, string>> = {};

export function codeToField(code: string, op?: string): string | undefined {
  if (op && BY_OP[op] && BY_OP[op][code]) return BY_OP[op][code];
  return GLOBAL[code];
}
