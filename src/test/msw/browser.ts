import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * MSW service-worker client for offline development.
 *
 * Enable it by setting `VITE_ENABLE_MSW=true` in your environment and running
 * `pnpm dev`. The worker intercepts the education, stats, and pools endpoints
 * so the Learn, Dashboard, and Pools pages work without a backend.
 *
 * Requires `public/mockServiceWorker.js` (regenerate with
 * `pnpm dlx msw init public/` if it ever goes missing).
 */
export const worker = setupWorker(...handlers);
