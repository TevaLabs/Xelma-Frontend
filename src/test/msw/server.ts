import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Node MSW server. Tests opt in explicitly:
 *
 *   beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
 *   afterEach(() => server.resetHandlers());
 *   afterAll(() => server.close());
 *
 * Override a single endpoint with `server.use(...errorHandlers.pools)`.
 */
export const server = setupServer(...handlers);
