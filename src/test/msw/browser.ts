import { setupWorker } from 'msw/browser';
import { allErrorHandlers, handlers } from './handlers';

/**
 * Starts the MSW service worker so the app runs without a backend.
 * Enabled via `VITE_ENABLE_MSW=true`; set `VITE_MSW_SCENARIO=error` to make
 * every mocked endpoint fail instead.
 */
export async function startMockWorker(): Promise<void> {
  const scenario = import.meta.env.VITE_MSW_SCENARIO;
  const worker = setupWorker(...(scenario === 'error' ? allErrorHandlers : handlers));
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  });
}
