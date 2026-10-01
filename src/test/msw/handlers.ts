import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '../../lib/config';
import {
  mockGuides,
  mockNetworkStats,
  mockPools,
  mockTip,
  mockUserStats,
} from './fixtures';

const url = (path: string) => `${API_BASE_URL}${path}`;

const serverError = (message: string) =>
  HttpResponse.json({ message, code: 'MOCK_SERVER_ERROR' }, { status: 500 });

/** Happy-path handlers for the education, stats and pools endpoints. */
export const handlers = [
  http.get(url('/api/education/guides'), () => HttpResponse.json(mockGuides)),
  http.get(url('/api/education/tip'), () => HttpResponse.json(mockTip)),
  http.get(url('/api/stats/network'), () => HttpResponse.json(mockNetworkStats)),
  http.get(url('/api/stats'), () => HttpResponse.json(mockUserStats)),
  http.get(url('/api/pools'), () => HttpResponse.json(mockPools)),
];

/** Per-endpoint error handlers. Use with `server.use(...errorHandlers.pools)`. */
export const errorHandlers = {
  education: [
    http.get(url('/api/education/guides'), () => serverError('Failed to load guides')),
    http.get(url('/api/education/tip'), () => serverError('Failed to load tip')),
  ],
  stats: [
    http.get(url('/api/stats/network'), () => serverError('Failed to load network stats')),
    http.get(url('/api/stats'), () => serverError('Failed to load stats')),
  ],
  pools: [http.get(url('/api/pools'), () => serverError('Failed to load pools'))],
};

/** Every error handler, for simulating a fully failing backend. */
export const allErrorHandlers = [
  ...errorHandlers.education,
  ...errorHandlers.stats,
  ...errorHandlers.pools,
];
