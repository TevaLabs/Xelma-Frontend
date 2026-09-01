import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WalletConnect from './WalletConnect';
import { useWalletStore } from '../store/useWalletStore';
import { useAuthStore } from '../store/useAuthStore';

// Mock the stores
vi.mock('../store/useWalletStore', () => ({
  useWalletStore: vi.fn((selector: unknown) => {
    if (typeof selector === 'function') {
      return (selector as (s: typeof mockWalletStore) => unknown)(mockWalletStore);
    }
    return mockWalletStore;
  }),
  selectIsWalletConnected: vi.fn(
    (state: { status: string; publicKey: string | null }) =>
      state.status === 'connected' && Boolean(state.publicKey),
  ),
  selectNeedsFunding: vi.fn(() => false),
}));
vi.mock('../store/useAuthStore');

// Report Freighter as installed so the picker offers it in jsdom.
vi.mock('../lib/wallets', async () => {
  const actual = await vi.importActual<typeof import('../lib/wallets')>('../lib/wallets');
  return {
    ...actual,
    WALLET_ADAPTERS: actual.WALLET_ADAPTERS.map((adapter) =>
      adapter.id === 'freighter'
        ? { ...adapter, isAvailable: async () => ({ isAvailable: true }) }
        : adapter,
    ),
  };
});

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Loader2: ({ className, ...props }: any) => <div data-testid="loader-icon" className={className} {...props} />,
  AlertCircle: ({ className, ...props }: any) => <div data-testid="alert-icon" className={className} {...props} />,
  LogOut: ({ className, ...props }: any) => <div data-testid="logout-icon" className={className} {...props} />,
  Wallet: ({ className, ...props }: any) => <div data-testid="wallet-icon" className={className} {...props} />,
  ShieldCheck: ({ className, ...props }: any) => <div data-testid="shield-icon" className={className} {...props} />,
  RefreshCw: ({ className, ...props }: any) => <div data-testid="refresh-icon" className={className} {...props} />,
  AlertTriangle: ({ className, ...props }: any) => <div data-testid="alert-triangle-icon" className={className} {...props} />,
  Download: ({ className, ...props }: any) => <div data-testid="download-icon" className={className} {...props} />,
  ExternalLink: ({ className, ...props }: any) => <div data-testid="external-link-icon" className={className} {...props} />,
  // Used by the WalletPicker rendered alongside the connect button.
  X: ({ className, ...props }: any) => <div data-testid="close-icon" className={className} {...props} />,
}));

const mockWalletStore = {
  publicKey: null,
  balance: null,
  status: 'idle' as const,
  errorMessage: null,
  networkMismatch: false,
  connect: vi.fn(),
  disconnect: vi.fn(),
  checkConnection: vi.fn(),
  clearError: vi.fn(),
};

const mockAuthStore = {
  isAuthenticated: false,
};

describe('WalletConnect', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    vi.mocked(useWalletStore).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector(mockWalletStore);
      }
      return mockWalletStore;
    });

    vi.mocked(useAuthStore).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector(mockAuthStore);
      }
      return mockAuthStore;
    });
  });

  describe('initialization', () => {
    it('checks connection on mount', () => {
      render(<WalletConnect />);
      expect(mockWalletStore.checkConnection).toHaveBeenCalledTimes(1);
    });
  });

  describe('disconnected state', () => {
    it('shows connect button when wallet is not connected', () => {
      render(<WalletConnect />);

      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      expect(connectButton).toBeInTheDocument();
      expect(screen.getByTestId('wallet-icon')).toBeInTheDocument();
    });

    it('opens the wallet picker when the connect button is clicked', () => {
      render(<WalletConnect />);

      expect(screen.queryByRole('dialog', { name: /connect a wallet/i })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));

      // Wallet choice is now made in the picker rather than connecting immediately.
      expect(screen.getByRole('dialog', { name: /connect a wallet/i })).toBeInTheDocument();
      expect(mockWalletStore.connect).not.toHaveBeenCalled();
    });

    it('calls connect once Freighter is chosen in the picker', async () => {
      mockWalletStore.connect.mockResolvedValue(undefined);
      render(<WalletConnect />);

      fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));

      const freighterOption = await screen.findByRole('button', { name: /freighter/i });
      await waitFor(() => expect(freighterOption).not.toBeDisabled());
      fireEvent.click(freighterOption);

      await waitFor(() => expect(mockWalletStore.connect).toHaveBeenCalledTimes(1));
    });

    it('has correct styling for connect button', () => {
      render(<WalletConnect />);

      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      expect(connectButton).toHaveClass('bg-[#2C4BFD]', 'hover:bg-[#1a3bf0]', 'text-white');
    });
  });

  describe('connecting state', () => {
    beforeEach(() => {
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = { ...mockWalletStore, status: 'connecting' };
        return typeof selector === 'function' ? selector(store) : store;
      });
    });

    it('shows connecting state', () => {
      render(<WalletConnect />);

      expect(screen.getByText('Connecting…')).toBeInTheDocument();
      expect(screen.getByTestId('loader-icon')).toHaveClass('animate-spin');
    });

    it('disables button during connecting', () => {
      render(<WalletConnect />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('checking state', () => {
    beforeEach(() => {
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = { ...mockWalletStore, status: 'checking' };
        return typeof selector === 'function' ? selector(store) : store;
      });
    });

    it('shows checking state', () => {
      render(<WalletConnect />);

      expect(screen.getByText('Checking wallet…')).toBeInTheDocument();
      expect(screen.getByTestId('loader-icon')).toHaveClass('animate-spin');
    });

    it('disables button during checking', () => {
      render(<WalletConnect />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('connected state', () => {
    beforeEach(() => {
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = {
          ...mockWalletStore,
          status: 'connected',
          publicKey: 'GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          balance: '100.50 XLM',
        };
        return typeof selector === 'function' ? selector(store) : store;
      });
    });

    it('shows connected wallet information', () => {
      render(<WalletConnect />);

      expect(screen.getByText('GTES...WXYZ')).toBeInTheDocument(); // Shortened address
      expect(screen.getByText('100.50 XLM')).toBeInTheDocument();
      expect(screen.getByTestId('wallet-icon')).toBeInTheDocument();
    });

    it('shows disconnect button', () => {
      render(<WalletConnect />);

      const disconnectButton = screen.getByRole('button', { name: 'Disconnect wallet' });
      expect(disconnectButton).toBeInTheDocument();
      expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
    });

    it('calls disconnect when disconnect button is clicked', () => {
      render(<WalletConnect />);

      const disconnectButton = screen.getByRole('button', { name: 'Disconnect wallet' });
      fireEvent.click(disconnectButton);

      expect(mockWalletStore.disconnect).toHaveBeenCalledTimes(1);
    });

    it('shows authentication status when authenticated', () => {
      vi.mocked(useAuthStore).mockImplementation((selector: any) => {
        const store = { ...mockAuthStore, isAuthenticated: true };
        return typeof selector === 'function' ? selector(store) : store;
      });

      render(<WalletConnect />);

      const shieldIcon = screen.getByTestId('shield-icon');
      expect(shieldIcon).toBeInTheDocument();
      expect(shieldIcon).toHaveAttribute('aria-label', 'Signed in to server');
      expect(shieldIcon).toHaveClass('text-green-600', 'dark:text-green-400');
    });

    it('handles missing balance gracefully', () => {
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = {
          ...mockWalletStore,
          status: 'connected',
          publicKey: 'GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          balance: null,
        };
        return typeof selector === 'function' ? selector(store) : store;
      });

      render(<WalletConnect />);

      expect(screen.getByText('—')).toBeInTheDocument();
      expect(screen.getByText('Balance unavailable')).toBeInTheDocument();
    });

    it('shows network mismatch warning', () => {
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = {
          ...mockWalletStore,
          status: 'connected',
          publicKey: 'GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          networkMismatch: true,
        };
        return typeof selector === 'function' ? selector(store) : store;
      });

      render(<WalletConnect />);

      const warning = screen.getByRole('status');
      expect(warning).toHaveTextContent('Switch to Testnet in Freighter');
      expect(warning).toHaveClass('text-red-600', 'dark:text-red-400');
      // WalletConnect's own banner and the <NetworkMismatchCard /> both render an
      // <AlertCircle />, so expect at least one.
      expect(screen.getAllByTestId('alert-icon').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('error state', () => {
    it('shows FreighterMissingCard when extension is missing', () => {
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = {
          ...mockWalletStore,
          status: 'error',
          errorCode: 'FREIGHTER_UNAVAILABLE',
          errorMessage: 'Freighter is not installed or not unlocked.',
        };
        return typeof selector === 'function' ? selector(store) : store;
      });

      render(<WalletConnect />);

      expect(screen.getByTestId('freighter-missing-card')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /freighter extension required/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /install freighter extension/i })).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /re-check connection/i });
      fireEvent.click(retryButton);
      expect(mockWalletStore.clearError).toHaveBeenCalledTimes(1);
      expect(mockWalletStore.checkConnection).toHaveBeenCalled();
    });

    it('shows generic connection error and retry button for other errors', () => {
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = {
          ...mockWalletStore,
          status: 'error',
          errorCode: 'ACCESS_DENIED',
          errorMessage: 'User denied access',
        };
        return typeof selector === 'function' ? selector(store) : store;
      });

      render(<WalletConnect />);

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveTextContent('User denied access');

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      expect(mockWalletStore.clearError).toHaveBeenCalledTimes(1);
      expect(mockWalletStore.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('responsive behavior', () => {
    beforeEach(() => {
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = {
          ...mockWalletStore,
          status: 'connected',
          publicKey: 'GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          balance: '100.50 XLM',
          networkMismatch: true,
        };
        return typeof selector === 'function' ? selector(store) : store;
      });
    });

    it('hides network warning on mobile', () => {
      render(<WalletConnect />);

      const warning = screen.getByRole('status');
      expect(warning).toHaveClass('hidden', 'md:flex');
    });

    it('hides balance on mobile', () => {
      render(<WalletConnect />);

      const balanceContainer = screen.getByText('100.50 XLM').closest('div');
      expect(balanceContainer).toHaveClass('hidden', 'md:flex');
    });

    it('applies responsive spacing classes', () => {
      render(<WalletConnect />);

      const container = screen.getByText('GTES...WXYZ').closest('.flex');
      expect(container).toHaveClass('gap-1', 'sm:gap-2');
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA attributes for buttons', () => {
      render(<WalletConnect />);

      const connectButton = screen.getByRole('button');
      expect(connectButton).toHaveAttribute('type', 'button');
    });

    it('has proper ARIA attributes for connected state', () => {
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = {
          ...mockWalletStore,
          status: 'connected',
          publicKey: 'GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          balance: '100.50 XLM',
        };
        return typeof selector === 'function' ? selector(store) : store;
      });

      render(<WalletConnect />);

      const disconnectButton = screen.getByRole('button', { name: 'Disconnect wallet' });
      expect(disconnectButton).toHaveAttribute('aria-label', 'Disconnect wallet');
    });

    it('has proper screen reader text for balance', () => {
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = {
          ...mockWalletStore,
          status: 'connected',
          publicKey: 'GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          balance: '100.50 XLM',
        };
        return typeof selector === 'function' ? selector(store) : store;
      });

      render(<WalletConnect />);

      expect(screen.getByText('Balance:')).toHaveClass('sr-only');
    });

    it('has proper screen reader text for unavailable balance', () => {
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = {
          ...mockWalletStore,
          status: 'connected',
          publicKey: 'GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          balance: null,
        };
        return typeof selector === 'function' ? selector(store) : store;
      });

      render(<WalletConnect />);

      expect(screen.getByText('Balance unavailable')).toHaveClass('sr-only');
    });

    it('uses aria-busy for loading states', () => {
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = { ...mockWalletStore, status: 'connecting' };
        return typeof selector === 'function' ? selector(store) : store;
      });

      render(<WalletConnect />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('focus management', () => {
    it('has proper focus ring classes', () => {
      render(<WalletConnect />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
    });

    it('maintains focus ring in connected state', () => {
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = {
          ...mockWalletStore,
          status: 'connected',
          publicKey: 'GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        };
        return typeof selector === 'function' ? selector(store) : store;
      });

      render(<WalletConnect />);

      const disconnectButton = screen.getByRole('button', { name: 'Disconnect wallet' });
      expect(disconnectButton).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
    });
  });

  describe('dark mode support', () => {
    it('includes dark mode classes for connected state', () => {
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = {
          ...mockWalletStore,
          status: 'connected',
          publicKey: 'GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          balance: '100.50 XLM',
        };
        return typeof selector === 'function' ? selector(store) : store;
      });

      render(<WalletConnect />);

      const balanceContainer = screen.getByText('100.50 XLM').closest('div');
      expect(balanceContainer).toHaveClass('bg-white', 'dark:bg-gray-800');
      expect(balanceContainer).toHaveClass('dark:border-gray-700');
    });

    it('includes dark mode classes for network warning', () => {
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = {
          ...mockWalletStore,
          status: 'connected',
          publicKey: 'GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          networkMismatch: true,
        };
        return typeof selector === 'function' ? selector(store) : store;
      });

      render(<WalletConnect />);

      const warning = screen.getByRole('status');
      expect(warning).toHaveClass('text-red-600', 'dark:text-red-400');
      expect(warning).toHaveClass('bg-red-50', 'dark:bg-red-900/20');
    });
  });

  describe('edge cases', () => {
    it('handles very long public keys', () => {
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = {
          ...mockWalletStore,
          status: 'connected',
          publicKey: 'GVERYLONGPUBLICKEY1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
        };
        return typeof selector === 'function' ? selector(store) : store;
      });

      render(<WalletConnect />);

      // Should still show shortened version
      expect(screen.getByText('GVER...7890')).toBeInTheDocument();
    });

    it('handles empty public key', () => {
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = {
          ...mockWalletStore,
          status: 'idle', // Empty key means not connected
          publicKey: '',
        };
        return typeof selector === 'function' ? selector(store) : store;
      });

      render(<WalletConnect />);

      // Should show connect button instead of connected state
      expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
    });

    it('handles null error message in error state', () => {
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = {
          ...mockWalletStore,
          status: 'error',
          errorMessage: null,
        };
        return typeof selector === 'function' ? selector(store) : store;
      });

      render(<WalletConnect />);

      // Should show connect button instead of error state
      expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
    });

    it('handles rapid state changes', () => {
      const { rerender } = render(<WalletConnect />);

      // Change to connecting
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = { ...mockWalletStore, status: 'connecting' };
        return typeof selector === 'function' ? selector(store) : store;
      });
      rerender(<WalletConnect />);
      expect(screen.getByText('Connecting…')).toBeInTheDocument();

      // Change to connected
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = {
          ...mockWalletStore,
          status: 'connected',
          publicKey: 'GTEST123',
        };
        return typeof selector === 'function' ? selector(store) : store;
      });
      rerender(<WalletConnect />);
      expect(screen.getByText('GTES...T123')).toBeInTheDocument();

      // Change to error
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = {
          ...mockWalletStore,
          status: 'error',
          errorMessage: 'Connection failed',
        };
        return typeof selector === 'function' ? selector(store) : store;
      });
      rerender(<WalletConnect />);
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });
  });
});