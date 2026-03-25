import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/api-client', () => ({
  roundsApi: {
    getActive: vi.fn(),
  },
}));

import { roundsApi } from '../lib/api-client';
import { useRoundStore } from './useRoundStore';
import { ApiError } from '../lib/api';

describe('useRoundStore error handling', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useRoundStore.setState({
      activeRound: null,
      isRoundActive: false,
      isLoading: false,
      error: null,
    });
  });

  it('sets actionable message when round fetch fails with ApiError', async () => {
    vi.mocked(roundsApi.getActive).mockRejectedValueOnce(
      new ApiError('Server error. Please try again shortly.', 500, 'INTERNAL')
    );

    await useRoundStore.getState().fetchActiveRound();

    const state = useRoundStore.getState();
    expect(state.activeRound).toBeNull();
    expect(state.isRoundActive).toBe(false);
    expect(state.error).toBe('Server error. Please try again shortly.');
  });
});

