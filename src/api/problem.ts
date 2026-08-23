import type { ProblemDetails, ValidationProblemDetails } from './dto';
import { codeToField } from './codes';

/** Every transport rejects with this. Nothing above the api layer throws anything else. */
export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails | ValidationProblemDetails;

  constructor(status: number, problem: ProblemDetails | ValidationProblemDetails) {
    super(problem.detail || problem.title || `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }

  get code(): string | undefined { return this.problem.code; }
  get errors(): Record<string, string[]> | undefined {
    return (this.problem as ValidationProblemDetails).errors;
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

/** What a mutating surface renders. One shape for all three failure states plus the two exits. */
export type Failure =
  /** 400 with errors → messages under their fields. */
  | { kind: 'field'; errors: Record<string, string[]> }
  /** 400 with a code that maps to one input. */
  | { kind: 'field-code'; field: string; message: string; code: string }
  /** 400 with a code that maps to no input → validation message above the footer. */
  | { kind: 'form'; message: string; code?: string }
  /**
   * 409 with a code ending `.concurrency_conflict` → amber stale banner with Refresh. Emitted for
   * users, roles, customers, drivers, vehicles, companies, profile, corrections, rental_assignments,
   * assignment_authorizations, assignment_interruptions and system_administrator, so the suffix is
   * matched rather than a resource list. Sending a token back is limited to DTOs that expose one;
   * the banner and its Refresh apply either way.
   */
  | { kind: 'stale'; message: string }
  /** any other 409 → red conflict banner above the footer. */
  | { kind: 'conflict'; message: string; code?: string }
  /** 403 → the action should never have been offered. */
  | { kind: 'forbidden'; message: string }
  /** 401 → sign-in. */
  | { kind: 'unauthorized' }
  | { kind: 'unknown'; message: string };

export const GENERIC_REFUSAL = 'The API refused this change because the record no longer accepts it.';
export const STALE_MESSAGE = 'This record changed while you had it open.';

const isConcurrency = (code?: string) => !!code && code.endsWith('.concurrency_conflict');

/**
 * `errors` is keyed by FluentValidation's PascalCase property path, collection indices included:
 * "Reason", "Roles", "Roles[0].Role". The UI keys inputs by the JSON name, so each segment's first
 * letter is lowercased and the index is kept: roles[0].role.
 */
const toJsonKey = (k: string) =>
  k.split('.').map((part) => part.replace(/^[A-Za-z]/, (c) => c.toLowerCase())).join('.');

/** roles[0].expiresAtUtc → roles[].expiresAtUtc, for inputs that are not index-keyed. */
const collapseIndices = (k: string) => k.replace(/\[\d+\]/g, '[]');

const normaliseErrors = (errors: Record<string, string[]>) => {
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(errors)) {
    const key = toJsonKey(k);
    out[key] = out[key] ? [...out[key], ...v] : v;
  }
  return out;
};

/**
 * Maps a rejection to the failure the surface renders. `op` selects the code→field table for the
 * mutation being submitted; without it a coded 400 falls back to a form-level message.
 */
export function toFailure(error: unknown, op?: string): Failure {
  if (!isApiError(error)) {
    return { kind: 'unknown', message: error instanceof Error ? error.message : GENERIC_REFUSAL };
  }

  const { status, problem } = error;
  const message = problem.detail || problem.title || GENERIC_REFUSAL;

  if (status === 401) return { kind: 'unauthorized' };
  if (status === 403) return { kind: 'forbidden', message };

  if (status === 400) {
    const errors = error.errors;
    if (errors && Object.keys(errors).length > 0) {
      return { kind: 'field', errors: normaliseErrors(errors) };
    }
    const field = error.code ? codeToField(error.code, op) : undefined;
    if (field) return { kind: 'field-code', field, message, code: error.code as string };
    return { kind: 'form', message, code: error.code };
  }

  if (status === 409) {
    return isConcurrency(error.code)
      ? { kind: 'stale', message: STALE_MESSAGE }
      : { kind: 'conflict', message, code: error.code };
  }

  return { kind: 'unknown', message };
}

/**
 * Lookup map for surfaces that render one message per input. Indexed paths also resolve under their
 * collapsed form (`roles[0].expiresAtUtc` → `roles[].expiresAtUtc`, first index wins) so a dialog
 * whose inputs are not index-keyed still finds the message. `Failure.errors` keeps the server's
 * paths unchanged, so a list view renders each one once.
 */
export function fieldMessages(failure: Failure): Record<string, string> {
  if (failure.kind === 'field') {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(failure.errors)) {
      if (!v[0]) continue;
      out[k] = v[0];
      const alias = collapseIndices(k);
      if (alias !== k && !out[alias]) out[alias] = v[0];
    }
    return out;
  }
  if (failure.kind === 'field-code') return { [failure.field]: failure.message };
  return {};
}
