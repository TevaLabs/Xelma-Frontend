import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '../../lib/config';
import { mockGuides, mockTip } from './fixtures/education';
import { mockNetworkStats, mockUserStats } from './fixtures/stats';
import { mockPools } from './fixtures/pools';

const API_BASE = API_BASE_URL;

/**
 * Default happy-path handlers for the education, stats, and pools endpoints.
 *
 * These power both offline development (browser worker) and unit tests that
 * opt into MSW (node server). Individual tests can override any endpoint with
 * `server.use(...)` — see `errorHandlers` for ready-made failure responses.
 */
export const handlers = [
  // ── Education (Learn page) ──────────────────────────────────────────────
  http.get(`${API_BASE}/api/education/guides`, () => HttpResponse.json(mockGuides)),
  http.get(`${API_BASE}/api/education/tip`, () => HttpResponse.json(mockTip)),

  // ── Stats (Landing network stats + Dashboard user stats) ───────────────
  http.get(`${API_BASE}/api/stats/network`, () => HttpResponse.json(mockNetworkStats)),
  http.get(`${API_BASE}/api/stats`, () => HttpResponse.json(mockUserStats)),

  // ── Pools (Pools page) ─────────────────────────────────────────────────
  http.get(`${API_BASE}/api/pools`, () => HttpResponse.json(mockPools)),
];

/**
 * Error-path handlers — one per endpoint. Apply with `server.use(...errorHandlers)`
 * (or a single handler) inside a test to exercise the UI's failure behavior.
 */
export const errorHandlers = [
  http.get(`${API_BASE}/api/education/guides`, () =>
    HttpResponse.json({ message: 'Education service unavailable' }, { status: 503 }),
  ),
  http.get(`${API_BASE}/api/education/tip`, () =>
    HttpResponse.json({ message: 'Education service unavailable' }, { status: 503 }),
  ),
  http.get(`${API_BASE}/api/stats/network`, () =>
    HttpResponse.json({ message: 'Stats service unavailable' }, { status: 500 }),
  ),
  http.get(`${API_BASE}/api/stats`, () =>
    HttpResponse.json({ message: 'Stats service unavailable' }, { status: 500 }),
  ),
  http.get(`${API_BASE}/api/pools`, () =>
    HttpResponse.json({ message: 'Pools service unavailable' }, { status: 500 }),
  ),
];
