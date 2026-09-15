import { installTransport } from '@/api';
import { createHttpTransport } from '@/api/http';

/**
 * The app has one backend: the real API at VITE_API_BASE_URL. There is no mode switch and no
 * in-app fake; a missing base URL is a configuration error the console names at start.
 */
export function bootstrapApi(): void {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!baseUrl) {
    console.error(
      'VITE_API_BASE_URL is not set. Copy .env.example to .env.local or use the committed ' +
        '.env.development, then restart the dev server.',
    );
  }
  installTransport(createHttpTransport(baseUrl ?? ''));
}
