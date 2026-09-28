/**
 * Issue #587 — Dashboard spectate-mode render tests
 *
 * "Spectate mode" is the dashboard state where no wallet is connected.
 * Visitors can view live rounds, the price chart, and asset tabs but
 * cannot submit predictions.  These tests assert the correct UI is
 * rendered and that the wallet-prompt CTA is present and accessible —
 * without requiring a live Freighter extension.
 *
 * Acceptance criteria (from issue #587):
 *   ✅  Test fails if the spectate CTA/card is removed
 *   ✅  Does not require live Freighter
 *   ✅  Passes in CI
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../i18n';
import i18n from '../i18n';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports of the mocked modules
// ---------------------------------------------------------------------------

vi.mock('../lib/api-client', () => ({
  predictionsApi: {
    submit: vi.fn(),
    getUserHistory: vi.fn().mockResolvedValue([]),
  },
  educationApi: {
    getTip: vi.fn().mockResolvedValue(null),
    getGuides: vi.fn().mockResolvedValue([]),
  },
  statsApi: {
    getNetworkStats: vi.fn().mockResolvedValue(null),
    getUserStats: vi.fn().mockResolvedValue(null),
  },
  roundsApi: {
    getActive: vi.fn().mockResolvedValue(null),
    getHistory: vi.fn().mockResolvedValue([]),
  },
  priceApi: {
    getLatestPrice: vi.fn().mockResolvedValue(null),
    getPriceHistory: vi.fn().mockResolvedValue([]),
  },
  ApiError: class ApiError extends Error {
    constructor(message: string, status: number) {
      super(message);
      this.name = 'ApiError';
      Object.assign(this, { status });
    }
  },
}));

vi.mock('react-router-dom', () => ({
  Link: ({
    children,
    to,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

vi.mock('../components/PriceChart', () => ({
  default: ({ height }: { height: number }) => (
    <div data-testid="price-chart" data-height={height}>
      Price Chart
    </div>
  ),
}));

vi.mock('../components/RoundTimeline', () => ({
  default: () => <div data-testid="round-timeline">Timeline</div>,
}));

vi.mock('../components/PredictionCard', () => ({
  default: ({
    isWalletConnected,
    isRoundActive,
    isConnecting,
    isSubmittingPrediction,
  }: {
    isWalletConnected?: boolean;
    isRoundActive?: boolean;
    isConnecting?: boolean;
    isSubmittingPrediction?: boolean;
    onPrediction?: () => void;
    walletBalance?: string | null;
  }) => (
    <div
      data-testid="prediction-card"
      data-wallet-connected={String(isWalletConnected)}
      data-round-active={String(isRoundActive)}
      data-connecting={String(isConnecting)}
      data-submitting={String(isSubmittingPrediction)}
    >
      Prediction Card
    </div>
  ),
}));

vi.mock('../components/PredictionHistory', () => ({
  default: ({ userId }: { userId: string | null }) => (
    <div data-testid="prediction-history" data-user-id={userId ?? ''}>
      Prediction History
    </div>
  ),
}));

vi.mock('../components/EndRoundModal', () => ({
  default: ({ isOpen }: { isOpen: boolean; onClose: () => void }) => (
    <div data-testid="end-round-modal" data-open={String(isOpen)} />
  ),
}));

vi.mock('../components/BetModal', () => ({
  default: ({
    isOpen,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onPending: () => void;
    onPredictionError: () => void;
    predictionData: unknown;
  }) => <div data-testid="bet-modal" data-open={String(isOpen)} />,
}));

vi.mock('../components/CountdownTimer', () => ({
  default: ({ endTime }: { endTime: Date }) => (
    <span data-testid="countdown-timer">{endTime.toISOString()}</span>
  ),
}));

vi.mock('../utils/audioController', () => ({
  bindSoundPreference: vi.fn(),
  clearSoundPreferenceBinding: vi.fn(),
  playRoundResolutionCue: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Store mocks — wallet disconnected (spectate), round active
// ---------------------------------------------------------------------------

const mockRoundStore = {
  isRoundActive: true,
  isLoading: false,
  sseConnection: null,
  resolvedRound: null,
  activeRound: null,
  fetchActiveRound: vi.fn(),
  subscribeToRoundEvents: vi.fn(() => vi.fn()),
  dismissResolvedRound: vi.fn(),
};

/** Spectate state: no public key, status idle — mirrors a visitor with no wallet. */
const mockWalletStoreSpectate = {
  status: 'idle' as const,
  publicKey: null as string | null,
  balance: null as string | null,
  connect: vi.fn(),
};

vi.mock('../store/useRoundStore', () => ({
  useRoundStore: Object.assign(
    vi.fn((selector: unknown) => {
      if (typeof selector === 'function') {
        return (selector as (s: typeof mockRoundStore) => unknown)(mockRoundStore);
      }
      return mockRoundStore;
    }),
    { getState: () => mockRoundStore },
  ),
}));

vi.mock('../store/useWalletStore', () => ({
  useWalletStore: Object.assign(
    vi.fn((selector: unknown) => {
      if (typeof selector === 'function') {
        return (selector as (s: typeof mockWalletStoreSpectate) => unknown)(
          mockWalletStoreSpectate,
        );
      }
      return mockWalletStoreSpectate;
    }),
    { getState: () => mockWalletStoreSpectate },
  ),
  /** selectIsWalletConnected — false because publicKey is null */
  selectIsWalletConnected: vi.fn(
    (state: { status: string; publicKey: string | null }) =>
      state.status === 'connected' && Boolean(state.publicKey),
  ),
  selectNeedsFunding: vi.fn(() => false),
}));

vi.mock('../hooks/useConnectionStatus', () => ({
  useConnectionStatus: () => ({
    status: 'connected',
    error: null,
    lastConnected: new Date('2026-01-01T00:00:00.000Z'),
    reconnectAttempts: 0,
    isConnected: true,
    isConnecting: false,
    isReconnecting: false,
    isDisconnected: false,
    reconnect: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Deferred import of mocked API modules so we can re-establish implementations
// after vi.resetAllMocks() wipes them in beforeEach
// ---------------------------------------------------------------------------

import { educationApi, statsApi, predictionsApi } from '../lib/api-client';
import Dashboard from './Dashboard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderDashboard() {
  return render(<Dashboard />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Dashboard — spectate mode (wallet disconnected)', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Re-establish API mock implementations cleared by vi.resetAllMocks().
    // This mirrors the pattern in Dashboard.test.tsx.
    vi.mocked(educationApi.getTip).mockResolvedValue(null);
    vi.mocked(educationApi.getGuides).mockResolvedValue([]);
    vi.mocked(statsApi.getNetworkStats).mockResolvedValue(null);
    vi.mocked(statsApi.getUserStats).mockResolvedValue(null);
    vi.mocked(predictionsApi.getUserHistory).mockResolvedValue([]);

    // Restore store state after vi.resetAllMocks()
    Object.assign(mockRoundStore, {
      isRoundActive: true,
      isLoading: false,
      sseConnection: null,
      resolvedRound: null,
      activeRound: null,
      fetchActiveRound: vi.fn(),
      subscribeToRoundEvents: vi.fn(() => vi.fn()),
      dismissResolvedRound: vi.fn(),
    });
    Object.assign(mockWalletStoreSpectate, {
      status: 'idle',
      publicKey: null,
      balance: null,
      connect: vi.fn(),
    });

    // Re-establish matchMedia stub cleared by vi.resetAllMocks()
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(async () => {
    // Restore locale after any i18n tests
    await i18n.changeLanguage('en');
  });

  // -------------------------------------------------------------------------
  // Spectate CTA / card — primary acceptance criterion: test fails if removed
  // -------------------------------------------------------------------------

  describe('spectate banner (CTA card)', () => {
    it('renders the spectate card wrapper (data-testid="dashboard-spectate-card")', () => {
      renderDashboard();
      // This is the primary acceptance criterion for issue #587:
      // if the spectate card is removed from Dashboard.tsx this test breaks.
      expect(screen.getByTestId('dashboard-spectate-card')).toBeInTheDocument();
    });

    it('renders the wallet-prompt message inside the spectate card', () => {
      renderDashboard();
      const card = screen.getByTestId('dashboard-spectate-card');
      const prompt = screen.getByTestId('dashboard-wallet-prompt');
      // Prompt must be a descendant of the spectate card
      expect(card).toContainElement(prompt);
      expect(prompt).toHaveTextContent('Connect your wallet to make predictions.');
    });

    it('renders the "Connect Now" CTA link inside the spectate card', () => {
      renderDashboard();
      const card = screen.getByTestId('dashboard-spectate-card');
      const cta = screen.getByTestId('dashboard-connect-now');
      expect(card).toContainElement(cta);
      expect(cta).toHaveTextContent('Connect Now');
    });

    it('CTA link points to the /connect route', () => {
      renderDashboard();
      const cta = screen.getByTestId('dashboard-connect-now');
      expect(cta).toHaveAttribute('href', '/connect');
    });

    it('CTA link meets the 44 px minimum touch-target requirement (issue #175)', () => {
      renderDashboard();
      const cta = screen.getByTestId('dashboard-connect-now');
      expect(cta.className).toMatch(/inline-flex/);
      expect(cta.className).toMatch(/min-h-\[44px\]/);
    });

    it('spectate card banner stacks vertically on mobile and becomes a row on sm+ viewports', () => {
      renderDashboard();
      const card = screen.getByTestId('dashboard-spectate-card');
      expect(card.className).toMatch(/flex-col/);
      expect(card.className).toMatch(/sm:flex-row/);
    });

    it('spectate card does NOT render when wallet is connected', () => {
      // Temporarily patch the shared mock state to simulate a connected wallet
      Object.assign(mockWalletStoreSpectate, {
        status: 'connected',
        publicKey: 'GTEST123',
        balance: '100 XLM',
      });

      renderDashboard();

      expect(screen.queryByTestId('dashboard-spectate-card')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Prediction card — must be present but gated in spectate mode
  // -------------------------------------------------------------------------

  describe('prediction card in spectate mode', () => {
    it('renders the prediction card', () => {
      renderDashboard();
      expect(screen.getByTestId('prediction-card')).toBeInTheDocument();
    });

    it('prediction card receives isWalletConnected=false', () => {
      renderDashboard();
      expect(screen.getByTestId('prediction-card')).toHaveAttribute(
        'data-wallet-connected',
        'false',
      );
    });

    it('prediction card receives isRoundActive=true', () => {
      renderDashboard();
      expect(screen.getByTestId('prediction-card')).toHaveAttribute('data-round-active', 'true');
    });

    it('prediction card receives isConnecting=false when wallet is idle', () => {
      renderDashboard();
      expect(screen.getByTestId('prediction-card')).toHaveAttribute('data-connecting', 'false');
    });
  });

  // -------------------------------------------------------------------------
  // Read-only market data — must be fully visible to spectators
  // -------------------------------------------------------------------------

  describe('read-only market data visible to spectators', () => {
    it('renders the price chart', () => {
      renderDashboard();
      expect(screen.getByTestId('price-chart')).toBeInTheDocument();
    });

    it('renders the round timeline', () => {
      renderDashboard();
      expect(screen.getByTestId('round-timeline')).toBeInTheDocument();
    });

    it('renders the share-rounds button', () => {
      renderDashboard();
      expect(screen.getByTestId('share-rounds-btn')).toBeInTheDocument();
    });

    it('renders the open-positions trigger button', () => {
      renderDashboard();
      expect(screen.getByTestId('open-positions-trigger')).toBeInTheDocument();
    });

    it('renders the mode toggle so spectators can see available modes', () => {
      renderDashboard();
      expect(screen.getByTestId('dashboard-mode-toggle')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Wallet-gated panels — must NOT appear in spectate mode
  // -------------------------------------------------------------------------

  describe('wallet-gated panels absent in spectate mode', () => {
    it('does NOT render the profile summary panel', () => {
      renderDashboard();
      expect(screen.queryByLabelText('Your profile')).not.toBeInTheDocument();
    });

    it('does NOT render the user stats panel', () => {
      renderDashboard();
      // StatsCard is only mounted when isWalletConnected is true
      expect(screen.queryByText('Your Record')).not.toBeInTheDocument();
    });

    it('does NOT render the recent activity panel', () => {
      renderDashboard();
      // RecentActivity is conditionally mounted on isWalletConnected
      expect(screen.queryByTestId('recent-activity')).not.toBeInTheDocument();
    });

    it('does NOT render the Soroban inspector panel', () => {
      renderDashboard();
      expect(screen.queryByText('Soroban Inspector')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Mobile predict bar — always visible when round is active
  // -------------------------------------------------------------------------

  describe('mobile predict bar', () => {
    it('renders the mobile predict bar even in spectate mode (round is active)', () => {
      renderDashboard();
      // The mobile sticky bar renders whenever isRoundActive is true;
      // it is not wallet-gated. This test documents the current behaviour
      // and prevents accidental removal of the bar in the spectate path.
      expect(screen.getByTestId('mobile-predict-bar')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Prediction history — always rendered; userId is null in spectate mode
  // -------------------------------------------------------------------------

  describe('prediction history', () => {
    it('renders prediction history with an empty userId in spectate mode', () => {
      renderDashboard();
      const history = screen.getByTestId('prediction-history');
      expect(history).toBeInTheDocument();
      expect(history).toHaveAttribute('data-user-id', '');
    });
  });

  // -------------------------------------------------------------------------
  // i18n — spectate banner text is localised
  // -------------------------------------------------------------------------

  describe('i18n — spectate banner localisation', () => {
    it('renders English wallet-prompt text by default', () => {
      renderDashboard();
      expect(screen.getByTestId('dashboard-wallet-prompt')).toHaveTextContent(
        'Connect your wallet to make predictions.',
      );
      expect(screen.getByTestId('dashboard-connect-now')).toHaveTextContent('Connect Now');
    });

    it('renders Spanish wallet-prompt text when locale is es', async () => {
      await i18n.changeLanguage('es');
      renderDashboard();
      expect(screen.getByTestId('dashboard-wallet-prompt')).toHaveTextContent(
        'Conecta tu cartera para enviar predicciones.',
      );
      expect(screen.getByTestId('dashboard-connect-now')).toHaveTextContent('Conectar ahora');
    });
  });

  // -------------------------------------------------------------------------
  // Freighter-free — banner must survive without the extension present
  // -------------------------------------------------------------------------

  describe('Freighter-free environment', () => {
    it('renders the spectate banner without Freighter installed', () => {
      // The component must not attempt to call @stellar/freighter-api in the
      // disconnected path.  If it did, the mock wallet store (which never
      // invokes freighter-api) would still resolve, but the test below
      // verifies the banner is present purely from React + store state —
      // proving the page is fully functional without the extension.
      renderDashboard();
      expect(screen.getByTestId('dashboard-spectate-card')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-connect-now')).toBeInTheDocument();
    });
  });
});
