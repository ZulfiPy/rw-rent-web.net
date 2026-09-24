import { createElement as h, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider, type QueryKey } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { qk } from '@/api';
import { ApiError } from '@/api/problem';
import type { CurrentUserResponse, ProblemDetails } from '@/api/dto';
import { AccessProvider } from '@/permissions/usePermissions';

/**
 * Follow-up 12's render harness: a page rendered to markup the way the browser receives it, from a
 * query cache already holding the API's answers, as `followup7b.support`'s `renderPage` does; here a
 * read the API refused can be in the cache too (a task not shared with the reader, one not found),
 * and the cache is handed back so a test can read what the page asked for. Only the tests import it.
 */
const clients: QueryClient[] = [];

/** Drops every cache a render made; the tests call it after each test. */
export const clearTaskRenders = () => clients.splice(0).forEach((client) => client.clear());

/** A refusal as the transport raises it, from the API's own answer. */
export const refused = (body: ProblemDetails) => new ApiError(body.status ?? 0, body);

export interface Rendered {
  markup: string;
  client: QueryClient;
}

export function renderAs(element: ReactElement, { at, route, me, data = [], errors = [] }: {
  at: string;
  route: string;
  me: CurrentUserResponse;
  data?: Array<[QueryKey, unknown]>;
  errors?: Array<[QueryKey, ProblemDetails]>;
}): Rendered {
  // retryOnMount off: a refused read stays refused on the first render instead of reading as pending.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, retryOnMount: false } } });
  clients.push(client);
  client.setQueryData(qk.me, me);
  for (const [key, value] of data) client.setQueryData(key, value);
  for (const [key, body] of errors) {
    const query = client.getQueryCache().build(client, { queryKey: key });
    query.setState({ ...query.state, status: 'error', error: refused(body), errorUpdateCount: 1, errorUpdatedAt: Date.now() });
  }
  const markup = renderToStaticMarkup(
    h(QueryClientProvider, { client },
      h(AccessProvider, null,
        h(MemoryRouter, { initialEntries: [at] },
          h(Routes, null, h(Route, { path: route, element }))))),
  );
  return { markup, client };
}

/** The markup from an opening tag that holds `text` to that element's end, for a closer look. */
export function around(markup: string, text: string, tag: string): string {
  const at = markup.indexOf(text);
  if (at < 0) throw new Error(`no "${text}" in the markup`);
  const start = markup.lastIndexOf(`<${tag}`, at);
  const end = markup.indexOf(`</${tag}>`, at);
  return markup.slice(start, end + tag.length + 3);
}

/** How many times a text appears. */
export const count = (markup: string, text: string) => markup.split(text).length - 1;
