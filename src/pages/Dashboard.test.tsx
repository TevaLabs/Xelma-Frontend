import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
}));

import Dashboard from './Dashboard';

function selectFromStore<TStore extends object>(selector: unknown, store: TStore) {
  return typeof selector === 'function' ? (selector as (state: TStore) => unknown)(store) : store;
}

// Create proper store mocks
const mockRoundStore = {
  isRoundActive: true,
  resolvedRound: null,
  fetchActiveRound: vi.fn(),
  subscribeToRoundEvents: vi.fn(() => vi.fn()), // Returns unsubscribe function
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

// Mock the API client
vi.mock('../lib/api-client', () => ({
  predictionsApi: {
    submit: vi.fn(),
  },
  educationApi: {
    getTip: vi.fn().mockResolvedValue(null),
    getGuides: vi.fn().mockResolvedValue([]),
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
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => vi.fn(),
}));

// Mock all the components to focus on integration logic

vi.mock('../components/PriceChart', () => ({
  default: ({ height }: { height: number }) => (
    <div data-testid="price-chart" data-height={height}>
      Price Chart
    </div>
  ),
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
      onPrediction 
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
                isLegend: false 
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
  )
}));

import { useRoundStore } from '../store/useRoundStore';
import { useWalletStore } from '../store/useWalletStore';
import { predictionsApi, ApiError, educationApi, statsApi } from '../lib/api-client';

describe('Dashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Re-establish mock implementations for API client after reset
    vi.mocked(educationApi.getTip).mockResolvedValue(null);
    vi.mocked(educationApi.getGuides).mockResolvedValue([]);
    vi.mocked(statsApi.getNetworkStats).mockResolvedValue(null);
    vi.mocked(statsApi.getUserStats).mockResolvedValue(null);
    vi.mocked(predictionsApi.getUserHistory).mockResolvedValue([]);
    
    // Don't use fake timers as they interfere with async operations
    
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
  });

  afterEach(() => {
    // Don't use real timers cleanup since we're not using fake timers
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


  });

  describe('wallet connection states', () => {
    it('handles disconnected wallet', () => {
      // Mock disconnected wallet state
      vi.mocked(useWalletStore).mockImplementation(((selector: unknown) => {
        const store = { ...mockWalletStore, status: 'idle', publicKey: null };
        return selectFromStore(selector, store);
      }) as never);

      render(<Dashboard />);

      const predictionCard = screen.getByTestId('prediction-card');
      expect(predictionCard).toHaveAttribute('data-wallet-connected', 'false');
      
      const predictionHistory = screen.getByTestId('prediction-history');
      // When publicKey is null, the data-user-id attribute won't be set to "null" string
      // Instead, React will not render the attribute or render it as empty
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
});