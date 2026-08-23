import { installTransport } from '@/api';
import { createHttpTransport } from '@/api/http';

/**
 * The single swap point. Phase 3 sets VITE_API_MODE=http and this file stops importing src/mock —
 * no component changes.
 */
export async function bootstrapApi(): Promise<void> {
  const mode = import.meta.env.VITE_API_MODE ?? 'mock';
  if (mode === 'http') {
    installTransport(createHttpTransport(import.meta.env.VITE_API_BASE_URL ?? ''));
    return;
  }
  const { createMockTransport } = await import('@/mock');
  installTransport(createMockTransport());
}
