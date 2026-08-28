import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '../../lib/config';
import {
  educationApi,
  statsApi,
  poolsApi,
  ApiError,
} from '../../lib/api-client';
import { server, setupMswServer } from './server';
import { errorHandlers } from './handlers';
import { mockGuides, mockTip } from './fixtures/education';
import { mockNetworkStats, mockUserStats } from './fixtures/stats';
import { mockPools } from './fixtures/pools';

// Opt this file into MSW — all api-client calls below are answered by the
// fixtures in `./handlers` instead of the default test fetch mock.
setupMswServer();

describe('MSW api-client integration', () => {
  describe('education', () => {
    it('returns the guides and tip fixtures (happy path)', async () => {
      await expect(educationApi.getGuides()).resolves.toEqual(mockGuides);
      await expect(educationApi.getTip()).resolves.toEqual(mockTip);
    });

    it('rejects with an ApiError when the education endpoints fail', async () => {
      server.use(...errorHandlers);

      await expect(educationApi.getGuides()).rejects.toBeInstanceOf(ApiError);
      await expect(educationApi.getGuides()).rejects.toMatchObject({
        status: 503,
        message: 'Education service unavailable',
      });
      await expect(educationApi.getTip()).rejects.toMatchObject({ status: 503 });
    });
  });

  describe('stats', () => {
    it('returns the network and user stats fixtures (happy path)', async () => {
      await expect(statsApi.getNetworkStats()).resolves.toEqual(mockNetworkStats);
      await expect(statsApi.getUserStats()).resolves.toEqual(mockUserStats);
    });

    it('rejects with an ApiError when the stats endpoints fail', async () => {
      server.use(...errorHandlers);

      await expect(statsApi.getNetworkStats()).rejects.toBeInstanceOf(ApiError);
      await expect(statsApi.getNetworkStats()).rejects.toMatchObject({
        status: 500,
        message: 'Stats service unavailable',
      });
      await expect(statsApi.getUserStats()).rejects.toMatchObject({ status: 500 });
    });
  });

  describe('pools', () => {
    it('returns the pool fixtures (happy path)', async () => {
      await expect(poolsApi.getPools()).resolves.toEqual(mockPools);
    });

    it('normalizes a { data } wrapper from the backend', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/pools`, () =>
          HttpResponse.json({ data: mockPools }),
        ),
      );

      await expect(poolsApi.getPools()).resolves.toEqual(mockPools);
    });

    it('rejects with an ApiError when the pools endpoint fails', async () => {
      server.use(...errorHandlers);

      await expect(poolsApi.getPools()).rejects.toBeInstanceOf(ApiError);
      await expect(poolsApi.getPools()).rejects.toMatchObject({
        status: 500,
        message: 'Pools service unavailable',
      });
    });
  });
});
