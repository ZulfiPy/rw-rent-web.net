import { readFileSync } from 'node:fs';

/**
 * Follow-up 14's stylesheet reader. A server render carries class names, not a layout, so the tests
 * read what each screen size is given from the CSS itself: every rule with the media query it sits
 * in (`null` outside any) and its declarations. It knows one level of `@media`, which is all the
 * app's modules use. Only the tests import it.
 */
export interface CssRule {
  media: string | null;
  selector: string;
  declarations: Record<string, string>;
}

export function readRules(url: URL): CssRule[] {
  const css = readFileSync(url, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const rules: CssRule[] = [];
  let media: string | null = null;
  let selector: string | null = null;
  let buffer = '';
  for (const char of css) {
    if (char === '{') {
      const head = buffer.trim().replace(/\s+/g, ' ');
      if (head.startsWith('@media')) media = head.slice('@media'.length).trim();
      else selector = head;
      buffer = '';
    } else if (char === '}') {
      if (selector !== null) {
        const declarations: Record<string, string> = {};
        for (const line of buffer.split(';')) {
          const colon = line.indexOf(':');
          if (colon > 0) declarations[line.slice(0, colon).trim()] = line.slice(colon + 1).trim().replace(/\s+/g, ' ');
        }
        rules.push({ media, selector, declarations });
        selector = null;
      } else {
        media = null;
      }
      buffer = '';
    } else {
      buffer += char;
    }
  }
  return rules;
}

/** The declarations a selector is given at one media query (`null`: outside any), merged in order. */
export function declared(rules: CssRule[], selector: string, media: string | null = null): Record<string, string> {
  return Object.assign({}, ...rules.filter((rule) => rule.selector === selector && rule.media === media).map((rule) => rule.declarations));
}

/** The folded band's query, 768–1023. */
export const TABLET = '(max-width: 1023px)';

export const TASKS_CSS = new URL('./tasks/Tasks.module.css', import.meta.url);
export const TABLE_CSS = new URL('../ui/table.module.css', import.meta.url);
