import { create } from 'zustand';
import { roundsApi, type Round } from '../lib/api-client';
import { normalizeApiError } from '../lib/api';
import { getSseUrl } from '../lib/apiConfig';

const API_BASE = getSseUrl();

/** Fallback chat channel used when no active round is known. */
export const CHAT_CHANNEL_FALLBACK = 'general';

/** Prefix for round-scoped chat channels (`round:<id>`). */
export const CHAT_CHANNEL_ROUND_PREFIX = 'round:';

/**
 * Derive the chat channel id for a given round. Falls back to `general`
 * when the round is missing or has no usable id, so chat keeps working
 * outside an active round.
 */
export function getChatChannelId(round: Round | null | undefined): string {
  if (round && (typeof round.id === 'string' || typeof round.id === 'number')) {
    return `${CHAT_CHANNEL_ROUND_PREFIX}${round.id}`;
  }
  return CHAT_CHANNEL_FALLBACK;
}

/**
 * Zustand selector hook form of `getChatChannelId`. Use as
 * `const channelId = useRoundStore(selectActiveChatChannelId)`.
 */
export const selectActiveChatChannelId = (state: RoundStore): string =>
  getChatChannelId(state.activeRound);

interface RoundEventEnvelope {
  event?: string;
  type?: string;
  data?: unknown;
  payload?: unknown;
  round?: unknown;
}

interface SSEConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  error: string | null;
  reconnectAttempts: number;
  lastConnected: Date | null;
}

interface RoundStore {
  activeRound: Round | null;
  resolvedRound: Round | null;
  isRoundActive: boolean;
  isLoading: boolean;
  error: string | null;
  sseConnection: SSEConnectionState;
  fetchActiveRound: () => Promise<void>;
  subscribeToRoundEvents: () => () => void;
  reconnectSSE: () => void;
  dismissResolvedRound: () => void;
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

// SSE Reconnection Manager
class SSEReconnectionManager {
  private reconnectTimeouts = new Map<string, NodeJS.Timeout>();
  private maxReconnectAttempts = 5;
  private baseDelay = 1000;
  private maxDelay = 30000;

  calculateDelay(attempt: number): number {
    const delay = Math.min(this.baseDelay * Math.pow(2, attempt), this.maxDelay);
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  scheduleReconnect(
    key: string, 
    attempt: number, 
    callback: () => void,
    onScheduled?: (delay: number) => void
  ): void {
    if (attempt >= this.maxReconnectAttempts) {
      return;
    }

    const delay = this.calculateDelay(attempt);
    onScheduled?.(delay);

    const timeout = setTimeout(() => {
      this.reconnectTimeouts.delete(key);
      callback();
    }, delay);

    this.reconnectTimeouts.set(key, timeout);
  }

  cancelReconnect(key: string): void {
    const timeout = this.reconnectTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.reconnectTimeouts.delete(key);
    }
  }

  clear(): void {
    for (const timeout of this.reconnectTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.reconnectTimeouts.clear();
  }
}

const sseReconnectionManager = new SSEReconnectionManager();

export const useRoundStore = create<RoundStore>((set, get) => ({
  activeRound: null,
  resolvedRound: null,
  isRoundActive: false,
  isLoading: false,
  error: null,
  sseConnection: {
    status: 'disconnected',
    error: null,
    reconnectAttempts: 0,
    lastConnected: null,
  },

  fetchActiveRound: async () => {
    set({ isLoading: true, error: null });

    try {
      const activeRound = await roundsApi.getActive();
      set({
        activeRound,
        resolvedRound: null,
        isRoundActive: Boolean(activeRound && activeRound.status !== 'resolved'),
        isLoading: false,
      });
    } catch (error) {
      const normalized = normalizeApiError(error, 'Failed to fetch active round');
      set({
        activeRound: null,
        isRoundActive: false,
        isLoading: false,
        error: normalized.message,
      });
    }
  },

  reconnectSSE: () => {
    const state = get();
    sseReconnectionManager.cancelReconnect('rounds');
    
    // Reset connection state and attempt reconnection
    set({
      sseConnection: {
        ...state.sseConnection,
        status: 'connecting',
        reconnectAttempts: 0,
      }
    });

    // Re-subscribe will create a new connection
    state.subscribeToRoundEvents();
  },
  dismissResolvedRound: () => {
    set((state) => ({
      resolvedRound: null,
      activeRound: state.activeRound?.status === 'resolved' ? null : state.activeRound,
      isRoundActive: state.activeRound?.status === 'resolved' ? false : state.isRoundActive,
    }));
  },

  subscribeToRoundEvents: () => {
    const createConnection = (): EventSource => {
      set((state) => ({
        sseConnection: {
          ...state.sseConnection,
          status: 'connecting',
        }
      }));

      const stream = new EventSource(`${API_BASE}/api/rounds/events`);

      const handleRoundStarted = (payload: unknown) => {
        const startedRound = getEventRound(payload);
        set({
          activeRound: startedRound,
          resolvedRound: null,
          isRoundActive: true,
          error: null,
        });
      };

      const handleRoundResolved = (payload: unknown) => {
        const resolvedRound = getEventRound(payload);
        set({
          activeRound: resolvedRound,
          resolvedRound,
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

      stream.onopen = () => {
        set(() => ({
          sseConnection: {
            status: 'connected',
            error: null,
            reconnectAttempts: 0,
            lastConnected: new Date(),
          }
        }));
      };

      stream.onerror = () => {
        const currentState = get();
        const newAttempts = currentState.sseConnection.reconnectAttempts + 1;
        
        set((state) => ({
          sseConnection: {
            ...state.sseConnection,
            status: 'reconnecting',
            error: 'Round event stream disconnected',
            reconnectAttempts: newAttempts,
          },
          error: 'Round event stream disconnected', // Also set main error for backward compatibility
        }));

        // Schedule reconnection with exponential backoff
        sseReconnectionManager.scheduleReconnect(
          'rounds',
          newAttempts,
          () => {
            // Close current stream and create new one
            stream.close();
            const newStream = createConnection();
            // Update the cleanup function to use the new stream
            cleanup = () => {
              sseReconnectionManager.cancelReconnect('rounds');
              newStream.removeEventListener('round:started', handleNamedRoundStarted);
              newStream.removeEventListener('round:resolved', handleNamedRoundResolved);
              newStream.close();
            };
          },
          (delay) => {
            console.log(`SSE reconnecting in ${delay}ms (attempt ${newAttempts})`);
          }
        );
      };

      return stream;
    };

    const stream = createConnection();
    
    let cleanup = () => {
      sseReconnectionManager.cancelReconnect('rounds');
      stream.removeEventListener('round:started', () => {});
      stream.removeEventListener('round:resolved', () => {});
      stream.close();
      set((state) => ({
        sseConnection: {
          ...state.sseConnection,
          status: 'disconnected',
        }
      }));
    };

    return cleanup;
  },
}));
