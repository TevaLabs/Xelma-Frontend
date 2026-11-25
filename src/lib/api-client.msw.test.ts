import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';

import { ApiError, educationApi, statsApi } from './api-client';
import {
  mockGuides,
  mockNetworkStats,
  mockTip,
  mockUserStats,
} from '../test/msw/fixtures';
import { errorHandlers } from '../test/msw/handlers';
import { server } from '../test/msw/server';

// Opt into MSW so the api-client functions hit the fixtures instead of a real backend.
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

async function expectApiError(
  promise: Promise<unknown>,
  status: number,
  message: string,
): Promise<void> {
  let error: unknown;
  try {
    await promise;
  } catch (caught) {
    error = caught;
  }
  expect(error).toBeInstanceOf(ApiError);
  expect((error as ApiError).status).toBe(status);
  expect((error as ApiError).message).toBe(message);
}

describe('api-client (MSW)', () => {
  describe('education', () => {
    it('getGuides returns the mocked guides', async () => {
      const guides = await educationApi.getGuides();

      expect(guides).toEqual(mockGuides);
      expect(guides).toHaveLength(3);
      expect(guides.map((guide) => guide.id)).toEqual(['guide-1', 'guide-2', 'guide-3']);
    });

    it('getTip returns the mocked tip', async () => {
      await expect(educationApi.getTip()).resolves.toEqual(mockTip);
    });

    it('getGuides rejects with a 500 ApiError when the handler fails', async () => {
      server.use(...errorHandlers.education);

      await expectApiError(educationApi.getGuides(), 500, 'Failed to load guides');
    });

    it('getTip rejects with a 500 ApiError when the handler fails', async () => {
      server.use(...errorHandlers.education);

      await expectApiError(educationApi.getTip(), 500, 'Failed to load tip');
    });
  });

  describe('stats', () => {
    it('getNetworkStats returns the mocked network stats', async () => {
      await expect(statsApi.getNetworkStats()).resolves.toEqual(mockNetworkStats);
    });

    it('getUserStats returns the mocked user stats', async () => {
      await expect(statsApi.getUserStats()).resolves.toEqual(mockUserStats);
    });

    it('getNetworkStats rejects with a 500 ApiError when the handler fails', async () => {
      server.use(...errorHandlers.stats);

      await expectApiError(statsApi.getNetworkStats(), 500, 'Failed to load network stats');
    });

    it('getUserStats rejects with a 500 ApiError when the handler fails', async () => {
      server.use(...errorHandlers.stats);

      await expectApiError(statsApi.getUserStats(), 500, 'Failed to load stats');
    });
  });
});
