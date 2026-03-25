import { create } from 'zustand';
import { roundsApi, type Round } from '../lib/api-client';
import { getErrorMessage } from '../lib/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

interface RoundEventEnvelope {
  event?: string;
  type?: string;
  data?: unknown;
  payload?: unknown;
  round?: unknown;
}

interface RoundStore {
  activeRound: Round | null;
  isRoundActive: boolean;
  isLoading: boolean;
  error: string | null;
  fetchActiveRound: () => Promise<void>;
  subscribeToRoundEvents: () => () => void;
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function toRound(value: unknown): Round | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const maybeRound = value as Record<string, unknown>;
  const id = maybeRound.id;
  if (typeof id !== 'string' && typeof id !== 'number') {
    return null;
  }

  return maybeRound as Round;
}

function getEventRound(payload: unknown): Round | null {
  const directRound = toRound(payload);
  if (directRound) return directRound;

  if (!payload || typeof payload !== 'object') return null;

  const envelope = payload as RoundEventEnvelope;
  return (
    toRound(envelope.round) ??
    toRound(envelope.data) ??
    toRound(envelope.payload) ??
    null
  );
}

function getEventType(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;

  const envelope = payload as RoundEventEnvelope;
  const eventType = envelope.event ?? envelope.type;
  return typeof eventType === 'string' ? eventType : null;
}

export const useRoundStore = create<RoundStore>((set) => ({
  activeRound: null,
  isRoundActive: false,
  isLoading: false,
  error: null,

  fetchActiveRound: async () => {
    set({ isLoading: true, error: null });

    try {
      const activeRound = await roundsApi.getActive();
      set({ activeRound, isRoundActive: !!activeRound, isLoading: false });
    } catch (error) {
      const normalized = normalizeApiError(error, 'Failed to fetch active round');
      set({
        activeRound: null,
        isRoundActive: false,
        isLoading: false,
error: getErrorMessage(error),
      });
    }
  },

  subscribeToRoundEvents: () => {
    const stream = new EventSource(`${API_BASE}/api/rounds/events`);

    const handleRoundStarted = (payload: unknown) => {
      const startedRound = getEventRound(payload);
      set({
        activeRound: startedRound,
        isRoundActive: true,
        error: null,
      });
    };

    const handleRoundResolved = (payload: unknown) => {
      const resolvedRound = getEventRound(payload);
      set({
        activeRound: resolvedRound,
        isRoundActive: false,
        error: null,
      });
    };

    const handleNamedRoundStarted = (event: MessageEvent) => {
      handleRoundStarted(parseJson(event.data));
    };

    const handleNamedRoundResolved = (event: MessageEvent) => {
      handleRoundResolved(parseJson(event.data));
    };

    const handleGenericMessage = (event: MessageEvent) => {
      const payload = parseJson(event.data);
      const eventType = getEventType(payload);

      if (eventType === 'round:started') {
        handleRoundStarted(payload);
      }

      if (eventType === 'round:resolved') {
        handleRoundResolved(payload);
      }
    };

    stream.addEventListener('round:started', handleNamedRoundStarted);
    stream.addEventListener('round:resolved', handleNamedRoundResolved);
    stream.onmessage = handleGenericMessage;
    stream.onerror = () => {
      set({ error: 'Round event stream disconnected' });
    };

    return () => {
      stream.removeEventListener('round:started', handleNamedRoundStarted);
      stream.removeEventListener('round:resolved', handleNamedRoundResolved);
      stream.close();
    };
  },
}));
