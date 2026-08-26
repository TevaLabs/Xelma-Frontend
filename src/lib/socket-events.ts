import type { NotificationEventPayload } from '../types/notification';

// ==========================================
// 1. Price Category
// ==========================================

export interface PricePointPayload {
  time: number;
  value: number;
}

export interface PriceUpdatePayload {
  time?: number | string;
  timestamp?: number | string;
  value?: number | string;
  price?: number | string;
  data?: unknown;
  payload?: unknown;
  prices?: unknown;
  history?: unknown;
}

// ==========================================
// 2. Stats Category
// ==========================================

export interface LiveStatsPayload {
  activePlayers?: number;
  playersOnline?: number;
  playerCount?: number;
  onlinePlayers?: number;
  recentPredictions?: number;
  recentPredictionsCount?: number;
  predictionsCount?: number;
  predictionCount?: number;
  totalPredictions?: number;
  stats?: unknown;
  data?: unknown;
}

export interface RoundStartedPayload {
  roundId: string;
  startTime?: number | string;
  asset?: string;
  [key: string]: unknown;
}

export interface RoundResolvedPayload {
  roundId: string;
  outcome?: string;
  price?: number;
  resolvedAt?: number | string;
  [key: string]: unknown;
}

export interface PredictionCreatedPayload {
  id?: string;
  roundId?: string;
  userId?: string;
  prediction?: 'UP' | 'DOWN';
  amount?: number;
  [key: string]: unknown;
}

// ==========================================
// 3. Chat Category
// ==========================================

export interface ChatMessagePayload {
  id: string;
  username: string;
  avatar?: string;
  content: string;
  createdAt: string;
}

export interface ChatSendPayload {
  content: string;
  channelId?: string;
  [key: string]: unknown;
}

// ==========================================
// 4. Notifications Category
// ==========================================

export type { NotificationEventPayload };

// ==========================================
// Socket.IO Event Maps
// ==========================================

/**
 * Server-to-Client Listen Events Map
 * Maps event name to callback signature.
 */
export interface ServerToClientEvents {
  // Manager lifecycle events
  reconnect_attempt: (attemptNumber: number) => void;
  reconnect: (attemptNumber: number) => void;
  reconnect_failed: () => void;
  reconnect_error: (error: Error) => void;

  // Price category
  'price:update': (data: PriceUpdatePayload | PriceUpdatePayload[]) => void;

  // Stats category
  'game:stats': (data: LiveStatsPayload) => void;
  'game:stats:update': (data: LiveStatsPayload) => void;
  'stats:update': (data: LiveStatsPayload) => void;
  'round:stats': (data: LiveStatsPayload) => void;
  'round:started': (data: RoundStartedPayload) => void;
  'round:resolved': (data: RoundResolvedPayload) => void;
  'prediction:created': (data: PredictionCreatedPayload) => void;
  'prediction:submitted': (data: PredictionCreatedPayload) => void;

  // Chat category
  'chat:message': (data: ChatMessagePayload) => void;

  // Notifications category
  notification: (data: NotificationEventPayload) => void;
}

/**
 * Client-to-Server Emit Events Map
 * Maps event name to emission parameters signature.
 */
export interface ClientToServerEvents {
  // Stats category
  'join:round': (roundId: string) => void;

  // Chat category
  'join:chat': (channelId: string) => void;
  'leave:chat': (channelId: string) => void;
  'chat:send': (payload: ChatSendPayload) => void;

  // Notifications category
  'join:notifications': (userId: string) => void;
}
