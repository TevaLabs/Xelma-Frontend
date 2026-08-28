import { setupServer } from 'msw/node';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { handlers } from './handlers';

/**
 * MSW server for unit tests (Node environment).
 *
 * Requests that match a handler are answered from the fixtures; anything else
 * is bypassed to the default test fetch mock (see `src/test/setup.ts`).
 */
export const server = setupServer(...handlers);

/**
 * Opt a test file into MSW.
 *
 * Call this once at the top of a test file (outside any `describe`) to start
 * the server, reset handlers between tests, and shut it down at the end:
 *
 * ```ts
 * import { server, setupMswServer } from './server';
 * import { errorHandlers } from './handlers';
 *
 * setupMswServer();
 *
 * it('fails gracefully', async () => {
 *   server.use(...errorHandlers); // override for this test only
 *   // ...
 * });
 * ```
 */
export function setupMswServer(): void {
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}
