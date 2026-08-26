import { ws } from 'msw';
import type {
  PriceUpdatePayload,
  LiveStatsPayload,
  RoundStartedPayload,
  RoundResolvedPayload,
  PredictionCreatedPayload,
  ChatMessagePayload,
  ChatSendPayload,
  NotificationEventPayload,
} from '../lib/socket-events';

// ==========================================
// Example Mock Payloads by Event Category
// ==========================================

/** Price category mock payloads */
export const mockPriceUpdatePayload: PriceUpdatePayload = {
  time: 1718000000,
  value: 0.425,
};

export const mockPriceHistoryPayload: PriceUpdatePayload[] = [
  { time: 1717999800, value: 0.418 },
  { time: 1717999900, value: 0.421 },
  { time: 1718000000, value: 0.425 },
];

/** Stats category mock payloads */
export const mockLiveGameStatsPayload: LiveStatsPayload = {
  activePlayers: 42,
  recentPredictions: 156,
};

export const mockRoundStartedPayload: RoundStartedPayload = {
  roundId: 'round-101',
  startTime: 1718000000,
  asset: 'XLM/USD',
};

export const mockRoundResolvedPayload: RoundResolvedPayload = {
  roundId: 'round-101',
  outcome: 'UP',
  price: 0.430,
  resolvedAt: 1718000300,
};

export const mockPredictionCreatedPayload: PredictionCreatedPayload = {
  id: 'pred-001',
  roundId: 'round-101',
  userId: 'user-789',
  prediction: 'UP',
  amount: 50,
};

/** Chat category mock payloads */
export const mockChatMessagePayload: ChatMessagePayload = {
  id: 'msg-001',
  username: 'StellarTrader',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=StellarTrader',
  content: 'XLM is looking bullish for this round!',
  createdAt: '2026-07-26T18:00:00.000Z',
};

export const mockChatSendPayload: ChatSendPayload = {
  content: 'Hello community!',
  channelId: 'round:round-101',
};

/** Notifications category mock payloads */
export const mockNotificationPayload: NotificationEventPayload = {
  id: 'notif-001',
  title: 'Round Victory!',
  message: 'Your UP prediction on round #101 was correct. You won 100 XLM.',
  createdAt: '2026-07-26T18:05:00.000Z',
};

/** Consolidated socket event mock fixtures object */
export const mockSocketFixtures = {
  price: {
    single: mockPriceUpdatePayload,
    history: mockPriceHistoryPayload,
  },
  stats: {
    liveStats: mockLiveGameStatsPayload,
    roundStarted: mockRoundStartedPayload,
    roundResolved: mockRoundResolvedPayload,
    predictionCreated: mockPredictionCreatedPayload,
  },
  chat: {
    message: mockChatMessagePayload,
    send: mockChatSendPayload,
  },
  notifications: {
    single: mockNotificationPayload,
  },
};

/**
 * Creates MSW WebSocket handlers using `msw/ws` for intercepting and mocking
 * Socket.IO connections and emitting mock payloads in local demos or integration tests.
 *
 * @param socketUrl The WebSocket server endpoint to mock (defaults to http://localhost:3000)
 * @returns Array of MSW WebSocket handlers
 */
export function createSocketMSWHandlers(socketUrl = 'http://localhost:3000') {
  const socketWs = ws.link(socketUrl);

  return [
    socketWs.addEventListener('connection', ({ client }) => {
      // Broadcast mock price update on connection for local demos
      client.send(JSON.stringify({ event: 'price:update', data: mockPriceUpdatePayload }));
    }),
  ];
}
