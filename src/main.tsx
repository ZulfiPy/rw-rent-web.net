import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { bootstrapApi } from './app/bootstrap';
import { currentPath, endSession, isSessionEnded, ownsUnauthorized } from './app/session';
import { AccessProvider } from './permissions/usePermissions';
import { App } from './App';
import './styles/base.css';

/**
 * The one rule for an ended session (§6.4): a 401 from any request that does not own its own 401 —
 * the me probe, the sign-in form, sign-out — means the cookie is no longer valid. The app switches
 * to the signed-out state from here, so no page has to handle it.
 */
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false, staleTime: 30_000 } },
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (isSessionEnded(error) && !ownsUnauthorized(query.meta)) endSession(currentPath());
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (isSessionEnded(error) && !ownsUnauthorized(mutation.options.meta)) endSession(currentPath());
    },
  }),
});

bootstrapApi();

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AccessProvider>
          <App />
        </AccessProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
