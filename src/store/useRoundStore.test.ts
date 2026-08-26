import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useRoundStore,
  getChatChannelId,
  selectActiveChatChannelId,
  CHAT_CHANNEL_FALLBACK,
  CHAT_CHANNEL_ROUND_PREFIX,
} from './useRoundStore';
import { ApiError } from '../lib/api';
import type { Round } from '../lib/api-client';

vi.mock('../lib/api-client', () => ({
  roundsApi: {
    getActive: vi.fn(),
  },
}));

import { roundsApi } from '../lib/api-client';

const mockRound: Round = {
  id: 'round-123',
  status: 'active',
  startsAt: '2024-01-01T10:00:00Z',
  endsAt: '2024-01-01T11:00:00Z',
};

const mockResolvedRound: Round = {
  id: 'round-123',
  status: 'resolved',
  startsAt: '2024-01-01T10:00:00Z',
  endsAt: '2024-01-01T11:00:00Z',
  resolvedAt: '2024-01-01T11:05:00Z',
};

describe('useRoundStore', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useRoundStore.setState({
      activeRound: null,
      resolvedRound: null,
      isRoundActive: false,
      isLoading: false,
      error: null,
    });
  });

  describe('initial state', () => {
    it('starts with no active round', () => {
      const state = useRoundStore.getState();
      expect(state.activeRound).toBeNull();
      expect(state.isRoundActive).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchActiveRound', () => {
    it('successfully fetches active round', async () => {
      vi.mocked(roundsApi.getActive).mockResolvedValue(mockRound);

      await useRoundStore.getState().fetchActiveRound();

      const state = useRoundStore.getState();
      expect(state.activeRound).toEqual(mockRound);
      expect(state.isRoundActive).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('handles no active round', async () => {
      vi.mocked(roundsApi.getActive).mockResolvedValue(null);

      await useRoundStore.getState().fetchActiveRound();

      const state = useRoundStore.getState();
      expect(state.activeRound).toBeNull();
      expect(state.isRoundActive).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('sets loading state during fetch', async () => {
      let resolvePromise: (value: Round | null) => void;
      const promise = new Promise<Round | null>((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(roundsApi.getActive).mockReturnValue(promise);

      const fetchPromise = useRoundStore.getState().fetchActiveRound();

      // Check loading state
      expect(useRoundStore.getState().isLoading).toBe(true);
      expect(useRoundStore.getState().error).toBeNull();

      resolvePromise!(mockRound);
      await fetchPromise;

      expect(useRoundStore.getState().isLoading).toBe(false);
    });

    it('handles API error', async () => {
      const error = new ApiError('Server error. Please try again shortly.', 500, 'INTERNAL');
      vi.mocked(roundsApi.getActive).mockRejectedValue(error);

      await useRoundStore.getState().fetchActiveRound();

      const state = useRoundStore.getState();
      expect(state.activeRound).toBeNull();
      expect(state.isRoundActive).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Server error. Please try again shortly.');
    });

    it('handles network error', async () => {
      const error = new Error('Network error');
      vi.mocked(roundsApi.getActive).mockRejectedValue(error);

      await useRoundStore.getState().fetchActiveRound();

      const state = useRoundStore.getState();
      expect(state.error).toBe('Network error');
    });

    it('clears previous error on successful fetch', async () => {
      useRoundStore.setState({ error: 'Previous error' });
      vi.mocked(roundsApi.getActive).mockResolvedValue(mockRound);

      await useRoundStore.getState().fetchActiveRound();

      expect(useRoundStore.getState().error).toBeNull();
    });
  });

  describe('subscribeToRoundEvents', () => {
    beforeEach(() => {
      // Clear any previous EventSource instances
      (global as any).clearEventSourceInstances();
    });

    it('creates EventSource with correct URL', () => {
      useRoundStore.getState().subscribeToRoundEvents();
      
      expect(global.EventSource).toHaveBeenCalledWith(expect.stringContaining('/api/rounds/events'));
    });

    it('handles round:started event', () => {
      const unsubscribe = useRoundStore.getState().subscribeToRoundEvents();
      
      // Get the EventSource instance that was created
      const eventSourceInstance = (global as any).getLatestEventSourceInstance();
      
      // Simulate a round:started event
      eventSourceInstance.simulateMessage('round:started', mockRound);

      const state = useRoundStore.getState();
      expect(state.activeRound).toEqual(mockRound);
      expect(state.isRoundActive).toBe(true);
      expect(state.error).toBeNull();

      unsubscribe();
    });

    it('handles round:resolved event', () => {
      useRoundStore.setState({ activeRound: mockRound, resolvedRound: null, isRoundActive: true });
      const unsubscribe = useRoundStore.getState().subscribeToRoundEvents();
      
      const eventSourceInstance = (global as any).getLatestEventSourceInstance();
      
      // Simulate a round:resolved event
      eventSourceInstance.simulateMessage('round:resolved', mockResolvedRound);

      const state = useRoundStore.getState();
      expect(state.activeRound).toEqual(mockResolvedRound);
      expect(state.resolvedRound).toEqual(mockResolvedRound);
      expect(state.isRoundActive).toBe(false);
      expect(state.error).toBeNull();

      unsubscribe();
    });

    it('dismisses resolved round and resets active state', () => {
      useRoundStore.setState({ activeRound: mockResolvedRound, resolvedRound: mockResolvedRound, isRoundActive: false });
      useRoundStore.getState().dismissResolvedRound();

      const state = useRoundStore.getState();
      expect(state.resolvedRound).toBeNull();
      expect(state.activeRound).toBeNull();
      expect(state.isRoundActive).toBe(false);
    });

    it('handles generic message events with event type', () => {
      const unsubscribe = useRoundStore.getState().subscribeToRoundEvents();
      
      const eventSourceInstance = (global as any).getLatestEventSourceInstance();
      
      // Simulate a generic message with event type
      const eventData = {
        event: 'round:started',
        data: mockRound,
      };
      
      // Trigger the onmessage handler directly
      const messageEvent = new MessageEvent('message', { 
        data: JSON.stringify(eventData) 
      });
      eventSourceInstance.onmessage(messageEvent);

      const state = useRoundStore.getState();
      expect(state.activeRound).toEqual(mockRound);
      expect(state.isRoundActive).toBe(true);

      unsubscribe();
    });

    it('handles connection errors', () => {
      const unsubscribe = useRoundStore.getState().subscribeToRoundEvents();
      
      const eventSourceInstance = (global as any).getLatestEventSourceInstance();
      
      // Simulate an error
      eventSourceInstance.simulateError();

      const state = useRoundStore.getState();
      expect(state.error).toBe('Round event stream disconnected');

      unsubscribe();
    });

    it('returns cleanup function that closes connection', () => {
      const unsubscribe = useRoundStore.getState().subscribeToRoundEvents();
      
      const eventSourceInstance = (global as any).getLatestEventSourceInstance();
      
      unsubscribe();

      expect(eventSourceInstance.readyState).toBe(eventSourceInstance.CLOSED);
    });

    it('handles malformed JSON gracefully', () => {
      const unsubscribe = useRoundStore.getState().subscribeToRoundEvents();
      
      const eventSourceInstance = (global as any).getLatestEventSourceInstance();
      
      // Simulate malformed JSON
      const malformedEvent = new MessageEvent('message', { data: 'invalid-json' });
      eventSourceInstance.onmessage(malformedEvent);

      // Should not crash or change state
      const state = useRoundStore.getState();
      expect(state.activeRound).toBeNull();
      expect(state.isRoundActive).toBe(false);

      unsubscribe();
    });
  });

  describe('concurrent operations', () => {
    it('handles multiple fetchActiveRound calls', async () => {
      vi.mocked(roundsApi.getActive).mockResolvedValue(mockRound);

      const promises = [
        useRoundStore.getState().fetchActiveRound(),
        useRoundStore.getState().fetchActiveRound(),
        useRoundStore.getState().fetchActiveRound(),
      ];

      await Promise.all(promises);

      expect(vi.mocked(roundsApi.getActive)).toHaveBeenCalledTimes(3);
      expect(useRoundStore.getState().activeRound).toEqual(mockRound);
    });

    it('handles fetch during event stream updates', async () => {
      let resolveFetch: (value: Round | null) => void;
      const fetchPromise = new Promise<Round | null>((resolve) => {
        resolveFetch = resolve;
      });
      vi.mocked(roundsApi.getActive).mockReturnValue(fetchPromise);

      const fetchOperation = useRoundStore.getState().fetchActiveRound();
      
      // Simulate event stream update during fetch
      useRoundStore.setState({ activeRound: mockRound, isRoundActive: true });

      resolveFetch!(mockResolvedRound);
      await fetchOperation;

      // Fetch should override event stream state
      const state = useRoundStore.getState();
      expect(state.activeRound).toEqual(mockResolvedRound);
    });
  });
});

describe('Chat channel id derivation (#185)', () => {
  describe('getChatChannelId', () => {
    it('returns round:<id> for string round ids', () => {
      expect(getChatChannelId({ id: 'abc' } as Round)).toBe('round:abc');
    });

    it('returns round:<id> for numeric round ids', () => {
      expect(getChatChannelId({ id: 42 } as Round)).toBe('round:42');
    });

    it('falls back to general when round is null', () => {
      expect(getChatChannelId(null)).toBe(CHAT_CHANNEL_FALLBACK);
    });

    it('falls back to general when round is undefined', () => {
      expect(getChatChannelId(undefined)).toBe(CHAT_CHANNEL_FALLBACK);
    });

    it('falls back to general when round has no id', () => {
      expect(getChatChannelId({} as Round)).toBe(CHAT_CHANNEL_FALLBACK);
    });

    it('exposes CHAT_CHANNEL_FALLBACK as "general"', () => {
      expect(CHAT_CHANNEL_FALLBACK).toBe('general');
    });

    it('exposes CHAT_CHANNEL_ROUND_PREFIX as "round:"', () => {
      expect(CHAT_CHANNEL_ROUND_PREFIX).toBe('round:');
    });
  });

  describe('selectActiveChatChannelId', () => {
    it('reads activeRound and returns round:<id> when present', () => {
      const previous = useRoundStore.getState();
      useRoundStore.setState({ activeRound: { id: 'r1' } as Round });
      try {
        expect(selectActiveChatChannelId(useRoundStore.getState())).toBe('round:r1');
      } finally {
        useRoundStore.setState(previous);
      }
    });

    it('returns the fallback when activeRound is null', () => {
      const previous = useRoundStore.getState();
      useRoundStore.setState({ activeRound: null });
      try {
        expect(selectActiveChatChannelId(useRoundStore.getState())).toBe('general');
      } finally {
        useRoundStore.setState(previous);
      }
    });
  });
});

