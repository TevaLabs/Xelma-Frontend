import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../i18n';
import i18n from '../i18n';

// Configurable search params for testing deep-linking
let mockSearchParams = new URLSearchParams();
const mockSetSearchParams = vi.fn();

// Mock the API client
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
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

import { useRoundStore } from '../store/useRoundStore';
import { useWalletStore } from '../store/useWalletStore';
import { predictionsApi, ApiError, educationApi, statsApi } from '../lib/api-client';
import { useSettingsStore, DEFAULT_SETTINGS } from '../store/useSettingsStore';
import { bindSoundPreference, playRoundResolutionCue } from '../utils/audioController';
import Dashboard from './Dashboard';


function selectFromStore<TStore extends object>(selector: unknown, store: TStore) {
  return typeof selector === 'function' ? (selector as (state: TStore) => unknown)(store) : store;
}

// Create proper store mocks
const mockRoundStore = {
  isRoundActive: true,
  resolvedRound: null,
  fetchActiveRound: vi.fn(),
  subscribeToRoundEvents: vi.fn(() => vi.fn()),
  dismissResolvedRound: vi.fn(),
};

const mockWalletStore = {
  status: 'connected' as const,
  publicKey: 'GTEST123',
};

// Mock the stores with proper Zustand-like behavior
vi.mock('../store/useRoundStore', () => ({
  useRoundStore: Object.assign(
    vi.fn((selector) => {
      if (typeof selector === 'function') {
        return selector(mockRoundStore);
      }
      return mockRoundStore;
    }),
    {
      getState: () => mockRoundStore,
    }
  ),
}));

vi.mock('../store/useWalletStore', () => ({
  useWalletStore: Object.assign(
    vi.fn((selector) => {
      if (typeof selector === 'function') {
        return selector(mockWalletStore);
      }
      return mockWalletStore;
    }),
    {
      getState: () => mockWalletStore,
    }
  ),
  selectIsWalletConnected: vi.fn((state) => state.status === 'connected' && Boolean(state.publicKey)),
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

// Mock all the components to focus on integration logic
vi.mock('../components/PriceChart', () => ({
  default: ({ height }: { height: number; entryPrice?: number | null; onPriceUpdate?: (price: number) => void }) => (
    <div data-testid="price-chart" data-height={height}>
      Price Chart
    </div>
  ),
}));

vi.mock('../components/RoundTimeline', () => ({
  default: () => <div data-testid="round-timeline">Timeline</div>,
}));

type PredictionCardMockProps = {
  isWalletConnected?: boolean;
  isRoundActive?: boolean;
  isConnecting?: boolean;
  isSubmittingPrediction?: boolean;
  onPrediction?: (prediction: {
    direction: 'UP';
    stake: string;
    exactPrice: string;
    isLegend: boolean;
  }) => void;
};

vi.mock('../components/PredictionCard', () => ({
  default: (props: PredictionCardMockProps) => {
    const {
      isWalletConnected,
      isRoundActive,
      isConnecting,
      isSubmittingPrediction,
      onPrediction,
    } = props;

    return (
      <div
        data-testid="prediction-card"
        data-wallet-connected={String(isWalletConnected)}
        data-round-active={String(isRoundActive)}
        data-connecting={String(isConnecting)}
        data-submitting={String(isSubmittingPrediction)}
      >
        <button
          onClick={() => {
            if (onPrediction) {
              onPrediction({
                direction: 'UP',
                stake: '10',
                exactPrice: '100',
                isLegend: false,
              });
            }
          }}
          data-testid="submit-prediction"
        >
          Submit Prediction
        </button>
      </div>
    );
  },
}));

vi.mock('../components/PredictionHistory', () => ({
  default: ({ userId }: { userId: string | null }) => (
    <div data-testid="prediction-history" data-user-id={userId}>
      Prediction History
    </div>
  ),
}));

vi.mock('../components/EndRoundModal', () => ({
  default: ({
    isOpen,
    onClose,
    result,
  }: {
    isOpen: boolean;
    onClose: () => void;
    result?: { isWin?: boolean; amount?: number; tip?: string };
  }) => (
    <div
      data-testid="end-round-modal"
      data-open={String(isOpen)}
      data-is-win={String(result?.isWin)}
      data-amount={String(result?.amount)}
      data-tip={result?.tip}
      onClick={onClose}
      onKeyDown={onClose}
      role="button"
      tabIndex={0}
    >
      End Round Modal
    </div>
  ),
}));

vi.mock('../components/BetModal', () => ({
  default: ({ isOpen, onClose, onSuccess }: any) => (
    <div data-testid="bet-modal" data-open={isOpen}>
      <button onClick={onClose} data-testid="close-bet-modal">Close</button>
      <button onClick={() => onSuccess('tx-123')} data-testid="success-bet-modal">Success</button>
    </div>
  ),
}));

// RoundCard is not mocked — it renders for real so we can assert deep-link highlight
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


describe('Dashboard', () => {

  beforeEach(() => {
    vi.resetAllMocks();

    // Reset search params to default (no round param)
    mockSearchParams = new URLSearchParams();

    // Re-establish mock implementations for API client after reset
    vi.mocked(educationApi.getTip).mockResolvedValue(null);
    vi.mocked(educationApi.getGuides).mockResolvedValue([]);
    vi.mocked(statsApi.getNetworkStats).mockResolvedValue(null);
    vi.mocked(statsApi.getUserStats).mockResolvedValue(null);
    vi.mocked(predictionsApi.getUserHistory).mockResolvedValue([]);

    // Reset store mocks to default state
    Object.assign(mockRoundStore, {
      isRoundActive: true,
      resolvedRound: null,
      fetchActiveRound: vi.fn(),
      subscribeToRoundEvents: vi.fn(() => vi.fn()),
      dismissResolvedRound: vi.fn(),
    });
    Object.assign(mockWalletStore, {
      status: 'connected',
      publicKey: 'GTEST123',
    });

    localStorage.clear();
    useSettingsStore.setState({ ...DEFAULT_SETTINGS });

    // vi.resetAllMocks() above clears the global window.matchMedia
    // implementation from src/test/setup.ts — re-establish it so
    // useReducedMotion() (used by the deep-linked RoundCard scroll effect)
    // doesn't crash on `.matches` of undefined.
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
    await i18n.changeLanguage('en');
  });

  describe('rendering', () => {
    it('renders all main components', () => {
      render(<Dashboard />);

      expect(screen.getByTestId('prediction-card')).toBeInTheDocument();
      expect(screen.getByTestId('price-chart')).toBeInTheDocument();
      expect(screen.getByTestId('prediction-history')).toBeInTheDocument();
    });

    it('passes correct props to PredictionCard', () => {
      render(<Dashboard />);

      const predictionCard = screen.getByTestId('prediction-card');
      expect(predictionCard).toHaveAttribute('data-wallet-connected', 'true');
      expect(predictionCard).toHaveAttribute('data-round-active', 'true');
      expect(predictionCard).toHaveAttribute('data-connecting', 'false');
      expect(predictionCard).toHaveAttribute('data-submitting', 'false');
    });

    it('passes user ID to PredictionHistory', () => {
      render(<Dashboard />);

      const predictionHistory = screen.getByTestId('prediction-history');
      expect(predictionHistory).toHaveAttribute('data-user-id', 'GTEST123');
    });

    it('renders the share button', () => {
      render(<Dashboard />);

      expect(screen.getByTestId('share-rounds-btn')).toBeInTheDocument();
      expect(screen.getByText('Share')).toBeInTheDocument();
    });
  });

  describe('wallet connection states', () => {
    it('handles disconnected wallet', () => {
      vi.mocked(useWalletStore).mockImplementation(((selector: unknown) => {
        const store = { ...mockWalletStore, status: 'idle', publicKey: null };
        return selectFromStore(selector, store);
      }) as never);

      render(<Dashboard />);

      const predictionCard = screen.getByTestId('prediction-card');
      expect(predictionCard).toHaveAttribute('data-wallet-connected', 'false');

      const predictionHistory = screen.getByTestId('prediction-history');
      expect(predictionHistory).toBeInTheDocument();

      expect(screen.getByTestId('dashboard-wallet-prompt')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-connect-now')).toBeInTheDocument();
    });

    it('handles connecting wallet state', () => {
      vi.mocked(useWalletStore).mockImplementation(((selector: unknown) => {
        const store = { ...mockWalletStore, status: 'connecting' };
        return selectFromStore(selector, store);
      }) as never);

      render(<Dashboard />);

      const predictionCard = screen.getByTestId('prediction-card');
      expect(predictionCard).toHaveAttribute('data-connecting', 'true');
    });

    it('handles checking wallet state', () => {
      vi.mocked(useWalletStore).mockImplementation(((selector: unknown) => {
        const store = { ...mockWalletStore, status: 'checking' };
        return selectFromStore(selector, store);
      }) as never);

      render(<Dashboard />);

      const predictionCard = screen.getByTestId('prediction-card');
      expect(predictionCard).toHaveAttribute('data-connecting', 'true');
    });

    it('mounts the profile summary panel when the wallet is connected', () => {
      render(<Dashboard />);

      expect(screen.getByLabelText('Your profile')).toBeInTheDocument();
    });

    it('omits the profile summary panel when the wallet is disconnected', () => {
      vi.mocked(useWalletStore).mockImplementation(((selector: unknown) => {
        const store = { ...mockWalletStore, status: 'idle', publicKey: null };
        return selectFromStore(selector, store);
      }) as never);

      render(<Dashboard />);

      expect(screen.queryByLabelText('Your profile')).not.toBeInTheDocument();
    });
  });

  describe('round states', () => {
    it('handles inactive round', () => {
      vi.mocked(useRoundStore).mockImplementation((selector: any) => {
        const store = { ...mockRoundStore, isRoundActive: false };
        return typeof selector === 'function' ? selector(store) : store;
      });

      render(<Dashboard />);

      expect(screen.getByText('No Active Rounds')).toBeInTheDocument();
      expect(screen.queryByTestId('prediction-card')).not.toBeInTheDocument();
    });

    it('opens the end round modal when a resolved round exists', () => {
      const resolvedRound = {
        id: 'round-123',
        status: 'resolved',
        isWin: true,
        netChange: 42,
        tip: 'Nice finish!',
      };

      vi.mocked(useRoundStore).mockImplementation((selector: any) => {
        const store = { ...mockRoundStore, isRoundActive: false, resolvedRound };
        return typeof selector === 'function' ? selector(store) : store;
      });

      render(<Dashboard />);

      const modal = screen.getByTestId('end-round-modal');
      expect(modal).toHaveAttribute('data-open', 'true');
      expect(modal).toHaveAttribute('data-is-win', 'true');
      expect(modal).toHaveAttribute('data-amount', '42');
      expect(modal).toHaveAttribute('data-tip', 'Nice finish!');
    });

    it('dispatches dismissResolvedRound when the modal close action triggers', () => {
      const resolvedRound = {
        id: 'round-123',
        status: 'resolved',
        isWin: false,
        netChange: -18,
        tip: 'Better luck next round.',
      };

      const dismissResolvedRound = vi.fn();

      vi.mocked(useRoundStore).mockImplementation((selector: any) => {
        const store = { ...mockRoundStore, isRoundActive: false, resolvedRound, dismissResolvedRound };
        return typeof selector === 'function' ? selector(store) : store;
      });

      render(<Dashboard />);

      const modal = screen.getByTestId('end-round-modal');
      fireEvent.click(modal);

      expect(dismissResolvedRound).toHaveBeenCalledTimes(1);
    });
  });

  describe('sound (unified with useSettingsStore)', () => {
    const resolvedRound = {
      id: 'round-123',
      status: 'resolved',
      isWin: true,
      netChange: 42,
      tip: 'Nice finish!',
    };

    function mockResolvedRound() {
      vi.mocked(useRoundStore).mockImplementation((selector: any) => {
        const store = { ...mockRoundStore, isRoundActive: false, resolvedRound };
        return typeof selector === 'function' ? selector(store) : store;
      });
    }

    it('binds the audio controller to the settings store on mount', () => {
      render(<Dashboard />);
      expect(bindSoundPreference).toHaveBeenCalledWith(expect.any(Function));
    });

    it('plays the round-resolution cue when settings sound is enabled', () => {
      useSettingsStore.setState({ soundEnabled: true });
      mockResolvedRound();

      render(<Dashboard />);

      expect(playRoundResolutionCue).toHaveBeenCalledWith(true);
    });

    it('does not play the round-resolution cue when settings sound is disabled', () => {
      useSettingsStore.setState({ soundEnabled: false });
      mockResolvedRound();

      render(<Dashboard />);

      expect(playRoundResolutionCue).not.toHaveBeenCalled();
    });

    it('never writes the legacy xelma_round_sound localStorage key', () => {
      useSettingsStore.setState({ soundEnabled: true });
      mockResolvedRound();

      render(<Dashboard />);

      expect(localStorage.getItem('xelma_round_sound')).toBeNull();
    });

    it('does not render an ad-hoc round sound toggle', () => {
      render(<Dashboard />);
      expect(screen.queryByText('Round sound')).not.toBeInTheDocument();
    });
  });

  describe('initialization', () => {
    it('fetches active round on mount', () => {
      render(<Dashboard />);

      expect(mockRoundStore.fetchActiveRound).toHaveBeenCalledTimes(1);
    });

    it('subscribes to round events on mount', () => {
      render(<Dashboard />);

      expect(mockRoundStore.subscribeToRoundEvents).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes from round events on unmount', () => {
      const unsubscribe = vi.fn();
      mockRoundStore.subscribeToRoundEvents.mockReturnValue(unsubscribe);

      const { unmount } = render(<Dashboard />);
      unmount();

      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('bet modal interaction', () => {
    it('opens bet modal on prediction and closes on close action', async () => {
      render(<Dashboard />);

      const submitButton = screen.getByTestId('submit-prediction');
      fireEvent.click(submitButton);

      const modal = screen.getByTestId('bet-modal');
      expect(modal).toHaveAttribute('data-open', 'true');

      const closeButton = screen.getByTestId('close-bet-modal');
      fireEvent.click(closeButton);

      expect(modal).toHaveAttribute('data-open', 'false');
    });
  });

  describe('localization', () => {
    it('renders Spanish wallet prompt and share button when locale is changed to es', async () => {
      vi.mocked(useWalletStore).mockImplementation(((selector: unknown) => {
        const store = { ...mockWalletStore, status: 'idle', publicKey: null };
        return selectFromStore(selector, store);
      }) as never);

      await i18n.changeLanguage('es');

      render(<Dashboard />);

      expect(screen.getByTestId('dashboard-wallet-prompt')).toHaveTextContent(
        'Conecta tu cartera para enviar predicciones.'
      );
      expect(screen.getByTestId('dashboard-connect-now')).toHaveTextContent('Conectar ahora');
      expect(screen.getByText('Compartir')).toBeInTheDocument();
    });

    it('renders Spanish empty state when no round is active', async () => {
      vi.mocked(useRoundStore).mockImplementation((selector: any) => {
        const store = { ...mockRoundStore, isRoundActive: false };
        return typeof selector === 'function' ? selector(store) : store;
      });

      await i18n.changeLanguage('es');

      render(<Dashboard />);

      expect(screen.getByText('No hay rondas activas')).toBeInTheDocument();
    });
  });

  describe('user stats panel', () => {
    it('renders live stats when connected and API response succeeds', async () => {
      vi.mocked(statsApi.getUserStats).mockResolvedValue({
        balance: 999.5,
        pendingWinnings: 50,
        totalWins: 8,
        totalLosses: 2,
        currentStreak: 5,
        xp: 1200,
        rank: 'Analyst',
      });

      render(<Dashboard />);

      expect(await screen.findByText('999.50 vXLM')).toBeInTheDocument();
      expect(screen.getByText('5 rounds')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('renders empty state without mock numbers when connected and API returns null', async () => {
      vi.mocked(statsApi.getUserStats).mockResolvedValue(null);

      render(<Dashboard />);

      expect(await screen.findByText('User stats unavailable')).toBeInTheDocument();
      expect(screen.queryByText('1000 vXLM')).not.toBeInTheDocument();
      expect(screen.queryByText('3 rounds')).not.toBeInTheDocument();
    });

    it('renders error state when connected and API call fails', async () => {
      vi.mocked(statsApi.getUserStats).mockRejectedValue(new Error('Network failure'));

      render(<Dashboard />);

      expect(await screen.findByText('Network failure')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('does not render stats panel when wallet is disconnected', () => {
      vi.mocked(useWalletStore).mockImplementation(((selector: unknown) => {
        const store = { ...mockWalletStore, status: 'idle', publicKey: null };
        return selectFromStore(selector, store);
      }) as never);

      render(<Dashboard />);

      expect(screen.queryByText('Your Record')).not.toBeInTheDocument();
    });
  });
});

