import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, test } from 'vitest';

/**
 * Follow-up 22, F22-4: no sentence a person reads names the API, the backend, an endpoint, a
 * payload, HTTP, JSON, a UUID, concurrency or a status number. Such words were written for the
 * people who built the app, and round 15 already wrote the API's own refusals for a person.
 *
 * So that it stays so, this reads every text the app holds: each string, each template's words and
 * each piece of JSX text of every source file under `src/`, the tests and their fixtures aside. A
 * comment is not a text and is not read. A text with one of the words fails, unless it is one of the
 * rightful exceptions named below, each with what it is: an address the app calls, a name the API
 * gave, a programmer's own error message, or a number that is a sum of money.
 */
const SRC = fileURLToPath(new URL('..', import.meta.url));

interface Text { file: string; line: number; text: string; holder: string; attribute: string | null }

const NOT_THE_APP = /\.test\.|\.support\.|\.practice\.|\.harness\.|followup\d+\.stylesheet/;

function sourceFiles(): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.tsx?$/.test(name) && !NOT_THE_APP.test(name)) found.push(path);
    }
  };
  walk(SRC);
  return found.sort();
}

/** Every text of the app's source: string literals, templates with `${…}` for what they fill in, JSX text. */
function texts(): Text[] {
  const all: Text[] = [];
  for (const path of sourceFiles()) {
    const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, path.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const visit = (node: ts.Node) => {
      let text: string | null = null;
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) text = node.text;
      else if (ts.isTemplateExpression(node)) text = [node.head.text, ...node.templateSpans.map((span) => `\${…}${span.literal.text}`)].join('');
      else if (ts.isJsxText(node)) text = node.text.replace(/\s+/g, ' ').trim();
      const parent = node.parent;
      const imported = parent && (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent));
      if (text !== null && text.trim() && !imported) {
        const attribute = parent && ts.isJsxAttribute(parent) ? parent.name.getText(source)
          : parent && ts.isJsxExpression(parent) && ts.isJsxAttribute(parent.parent) ? parent.parent.name.getText(source) : null;
        all.push({
          file: relative(SRC, path),
          line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
          text,
          holder: ts.SyntaxKind[parent.kind],
          attribute,
        });
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return all;
}

/** The words §22 names. A status number is one of HTTP's own, so "1900 or later" and "100 items" are not. */
const NAMED = /\bapi\b|backend|endpoint|payload|\bhttp\b|\bjson\b|\buuid\b|concurrency|\b(?:400|401|403|404|405|408|409|410|413|415|422|429|500|502|503|504)\b/i;

/** What a text with a named word may rightfully be. */
const EXCEPTIONS: Array<{ what: string; is: (text: Text) => boolean }> = [
  { what: 'an address the app calls, never shown', is: (t) => t.file.startsWith('api/') && /^(?:\$\{…\})?\/api\/[\w\-/${}…]*$/.test(t.text) },
  { what: 'the type the app sends its requests in', is: (t) => t.file === 'api/http.ts' && t.text === 'application/json' },
  { what: 'the ending of a code the API gives, compared and never shown', is: (t) => t.file === 'api/problem.ts' && t.text === '.concurrency_conflict' },
  { what: 'the name of a member in the audit’s stored content, which stays as stored', is: (t) => t.file === 'format/auditPayload.ts' && t.text === 'ConcurrencyToken' },
  { what: 'an error’s own message for the programmer’s console; every screen shows the API’s sentence or the app’s own', is: (t) => t.file === 'api/problem.ts' && t.text === 'HTTP ${…}' },
  { what: 'a programmer’s mistake caught at start, never a screen', is: (t) => t.file === 'api/transport.ts' && t.text.startsWith('No transport installed') },
  { what: 'a sum of money, the deductible', is: (t) => t.file === 'pages/insurance/CaseDialogs.tsx' && t.text === 'Our casco repairs the car now; the company pays the 500-euro deductible.' },
];

const ALL = texts();

describe('F22-4: no sentence a person reads names the API, the backend, an endpoint, a payload, HTTP or a status number', () => {
  test('the reading finds the app’s texts: thousands of them, in every folder', () => {
    expect(ALL.length).toBeGreaterThan(5000);
    expect(new Set(ALL.map((t) => t.file.split('/')[0]))).toEqual(new Set(['App.tsx', 'api', 'app', 'format', 'main.tsx', 'pages', 'permissions', 'ui']));
    // It reads what a person sees: a page's title, a hint, a button's words and a placeholder.
    for (const seen of ['Drivers', 'Exact year, 1900 or later.', 'Add driver', 'Name, licence number or email']) {
      expect(ALL.some((t) => t.text === seen), seen).toBe(true);
    }
  });

  test('no text holds a named word, the rightful exceptions aside', () => {
    const found = ALL.filter((t) => NAMED.test(t.text) && !EXCEPTIONS.some((exception) => exception.is(t)));
    expect(found.map((t) => `${t.file}:${t.line} ${t.text}`)).toEqual([]);
  });

  test('each exception is still needed, and there are no more of them than this', () => {
    const named = ALL.filter((t) => NAMED.test(t.text));
    for (const exception of EXCEPTIONS) expect(named.some(exception.is), exception.what).toBe(true);
    // The exceptions that are not addresses are six texts, each one named above.
    const few = named.filter((t) => !EXCEPTIONS[0]!.is(t));
    expect(few.map((t) => `${t.file} ${t.text}`).sort()).toEqual([
      'api/http.ts application/json',
      'api/problem.ts .concurrency_conflict',
      'api/problem.ts HTTP ${…}',
      'api/transport.ts No transport installed — call installTransport() before any api call.',
      'format/auditPayload.ts ConcurrencyToken',
      'pages/insurance/CaseDialogs.tsx Our casco repairs the car now; the company pays the 500-euro deductible.',
    ]);
  });

  test('the error’s own message never reaches a screen: a refusal is shown in the API’s sentence or the app’s', () => {
    // `HTTP ${status}` is what an ApiError calls itself when the API sent no sentence. No page reads
    // an ApiError's `message`: the readers of an error's own message take it for other errors only.
    const readers = sourceFiles().flatMap((path) => readFileSync(path, 'utf8').split('\n')
      .map((line, at) => ({ file: relative(SRC, path), line: at + 1, code: line.trim() }))
      .filter((line) => /\berror\.message\b/.test(line.code)));
    expect(readers.map((line) => `${line.file} ${line.code}`)).toEqual([
      "api/problem.ts return { kind: 'unknown', message: error instanceof Error ? error.message : GENERIC_REFUSAL };",
      "pages/account/failure.ts return { ...NO_FAILURE, message: error instanceof Error ? error.message || UNREACHABLE : UNREACHABLE };",
      "pages/tasks/StepAction.tsx return error instanceof Error ? error.message : GENERIC_REFUSAL;",
      "permissions/usePermissions.tsx error: status === 'unreachable' ? (error instanceof Error ? error.message : 'Unknown error') : undefined,",
    ]);
    const problem = readFileSync(join(SRC, 'api/problem.ts'), 'utf8');
    expect(problem).toMatch(/if \(!isApiError\(error\)\) \{\n\s+return \{ kind: 'unknown', message: error instanceof Error \? error\.message : GENERIC_REFUSAL \};/);
    expect(problem).toContain('const message = problem.detail || problem.title || GENERIC_REFUSAL;');
    const failure = readFileSync(join(SRC, 'pages/account/failure.ts'), 'utf8');
    expect(failure.indexOf('if (!isApiError(error)) {')).toBeLessThan(failure.indexOf('error.message || UNREACHABLE'));
    const step = readFileSync(join(SRC, 'pages/tasks/StepAction.tsx'), 'utf8');
    expect(step).toContain('if (isApiError(error)) return error.problem.detail || error.problem.title || GENERIC_REFUSAL;');
    // The last keeps the text for whoever asks; since F22-2 the screen it fed no longer shows it.
    expect(readFileSync(join(SRC, 'App.tsx'), 'utf8')).not.toMatch(/useAccess\(\)[^\n]*\berror\b|\{error\b/);
  });
});

/** Every sentence this follow-up changed: where it is, what it said, what it says. */
const CHANGED: Array<{ file: string; was: string; now: string | null }> = [
  // F22-1
  { file: 'pages/account/Register.tsx', was: '+371 20 000 000', now: '+372 5000 0000' },
  // F22-2
  { file: 'App.tsx', was: 'The API did not answer', now: 'RW-Rent cannot be reached right now' },
  { file: 'App.tsx', was: 'The app could not reach the RW-Rent API. Start it and reload this page.', now: 'Check your internet connection and reload this page. If it stays like this, try again in a few minutes.' },
  // F22-3
  { file: 'pages/fleet/AssignmentRecord.tsx', was: 'Concurrency token', now: null },
  { file: 'pages/fleet/AssignmentRecord.tsx', was: 'Sent with each correction; a stale token returns 409 Conflict.', now: null },
  { file: 'pages/users/UserRecord.tsx', was: 'Security version', now: null },
  { file: 'pages/users/UserRecord.tsx', was: 'Increments on credential and access changes.', now: null },
  { file: 'pages/audit/AuditEntry.tsx', was: 'Raw payload', now: 'The entry as stored' },
  // F22-4, the eight §22 lists
  { file: 'api/problem.ts', was: 'The API refused this change because the record no longer accepts it.', now: 'This change was refused because the record no longer accepts it.' },
  { file: 'pages/users/UserDialogs.tsx', was: 'Signing in stops immediately and every active session ends. The endpoint takes no reason, so none is recorded.', now: 'Signing in stops immediately and every active session ends. No reason is asked for here, so none is recorded.' },
  { file: 'pages/admin/CompanyProfile.tsx', was: 'If any user, vehicle, customer, driver or assignment references the Company, the API refuses the delete with a conflict.', now: 'If any user, vehicle, customer, driver or assignment refers to the Company, the delete is refused.' },
  { file: 'pages/fleet/Vehicles.tsx', was: 'Exact year; the API accepts 1900 or later.', now: 'Exact year, 1900 or later.' },
  { file: 'pages/fleet/AssignmentDialogs.tsx', was: 'Closes the assignment. Open driver authorizations are stopped by the backend.', now: 'Closes the assignment. Open driver authorizations are stopped with it.' },
  { file: 'pages/account/Profile.tsx', was: 'What the API reports for your account right now.', now: 'Your roles and what they allow, as they are right now.' },
  { file: 'pages/fleet/FleetDialogs.tsx', was: 'The API rejects a driver link on a business customer.', now: 'A business customer cannot be linked to a driver.' },
  { file: 'pages/account/Profile.tsx', was: 'A successful change refreshes your session.', now: 'You stay signed in after the change.' },
  // F22-4, the others found by reading all of what the app shows
  { file: 'pages/account/Profile.tsx', was: 'The frontend renders actions from the permissions returned by GET /api/me, not from role names.', now: 'What you can do in the app follows these permissions, not the names of your roles.' },
  { file: 'pages/users/UserDialogs.tsx', was: 'The session ends at once and is recorded as “Revoked by administrator”. The endpoint takes no reason, so the audit entry records none.', now: 'The session ends at once and is recorded as “Revoked by administrator”. No reason is asked for here, so the audit entry records none.' },
  { file: 'pages/fleet/AssignmentDialogs.tsx', was: 'No driver is authorized yet. The api refuses activation until this assignment has coverage.', now: 'No driver is authorized yet. Activation is refused until this assignment has coverage.' },
  { file: 'pages/audit/AuditEntry.tsx', was: 'Payload', now: 'Recorded values' },
  { file: 'pages/audit/AuditEntry.tsx', was: 'Parsing', now: 'Reading' },
  { file: 'pages/audit/AuditEntry.tsx', was: 'Unrecognised payload shape — see the raw values below', now: 'These values could not be set out here. See the entry as stored, below.' },
];

describe('every sentence Follow-up 22 changed reads as it was decided', () => {
  test('each new sentence stands in its file, and no old one is left anywhere in the app', () => {
    for (const { file, was, now } of CHANGED) {
      if (now !== null) expect(ALL.some((t) => t.file === file && t.text === now), `${file}: ${now}`).toBe(true);
      expect(ALL.filter((t) => t.text === was).map((t) => t.file), was).toEqual([]);
    }
    expect(CHANGED).toHaveLength(22);
  });

  test('the phone number’s example is Estonian, and no other field shows a country’s example', () => {
    const examples = ALL.filter((t) => /\+3\d\d[ \d]/.test(t.text));
    expect(examples.map((t) => `${t.file} ${t.attribute} ${t.text}`)).toEqual(['pages/account/Register.tsx placeholder +372 5000 0000']);
  });
});
