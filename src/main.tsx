import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { bootstrapApi } from './app/bootstrap';
import { AccessProvider } from './permissions/usePermissions';
import { App } from './App';
import './styles/base.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false, staleTime: 30_000 } },
});

await bootstrapApi();

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AccessProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AccessProvider>
    </QueryClientProvider>
  </StrictMode>,
);
