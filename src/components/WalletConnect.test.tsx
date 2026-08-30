import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WalletConnect from './WalletConnect';
import { useWalletStore } from '../store/useWalletStore';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';
import { toDataURL } from 'qrcode';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('qrcode', () => ({
  toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,qr-code'),
}));

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

vi.stubEnv('VITE_STELLAR_NETWORK', 'TESTNET');

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Loader2: ({ className, ...props }: any) => <div data-testid="loader-icon" className={className} {...props} />,
  AlertCircle: ({ className, ...props }: any) => <div data-testid="alert-icon" className={className} {...props} />,
  LogOut: ({ className, ...props }: any) => <div data-testid="logout-icon" className={className} {...props} />,
  Wallet: ({ className, ...props }: any) => <div data-testid="wallet-icon" className={className} {...props} />,
  ShieldCheck: ({ className, ...props }: any) => <div data-testid="shield-icon" className={className} {...props} />,
  RefreshCw: ({ className, ...props }: any) => <div data-testid="refresh-icon" className={className} {...props} />,
  Copy: ({ className, ...props }: any) => <div data-testid="copy-icon" className={className} {...props} />,
  QrCode: ({ className, ...props }: any) => <div data-testid="qr-icon" className={className} {...props} />,
  Droplets: ({ className, ...props }: any) => <div data-testid="droplets-icon" className={className} {...props} />,
  ExternalLink: ({ className, ...props }: any) => <div data-testid="external-link-icon" className={className} {...props} />,
}));

const mockWalletStore = {
  publicKey: null,
  balance: null,
  status: 'idle' as const,
  errorMessage: null,
  errorCode: null,
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
    vi.mocked(toDataURL).mockResolvedValue('data:image/png;base64,qr-code');
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

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

    it('calls connect when connect button is clicked', () => {
      render(<WalletConnect />);

      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      fireEvent.click(connectButton);

      expect(mockWalletStore.connect).toHaveBeenCalledTimes(1);
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

      expect(screen.getByText('GTES...WXYZ')).toBeInTheDocument();
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

    it('copies the connected public key with a success toast', async () => {
      render(<WalletConnect />);

      fireEvent.click(screen.getByRole('button', { name: /copy public key/i }));

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ');
      });
      expect(toast.success).toHaveBeenCalledWith('Public key copied');
    });

    it('shows a receive panel with a QR code encoding the public key', async () => {
      render(<WalletConnect />);

      fireEvent.click(screen.getByRole('button', { name: /show receive qr code/i }));

      await waitFor(() => {
        expect(toDataURL).toHaveBeenCalledWith(
          'GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          expect.objectContaining({ errorCorrectionLevel: 'M' }),
        );
      });
      expect(screen.getByRole('img', { name: /qr code for connected stellar public key/i })).toHaveAttribute(
        'src',
        'data:image/png;base64,qr-code',
      );
      expect(screen.getByText('GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy address/i })).toBeInTheDocument();
    });

    it('shows a drip link in the receive panel on testnet', async () => {
      render(<WalletConnect />);

      fireEvent.click(screen.getByRole('button', { name: /show receive qr code/i }));

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /get testnet xlm/i })).toBeInTheDocument();
      });

      const dripLink = screen.getByRole('link', { name: /get testnet xlm/i });
      expect(dripLink).toHaveAttribute('href', 'https://github.com/fredericklamar342-prog/Xelma-Frontend/issues/295');
      expect(dripLink).toHaveAttribute('target', '_blank');
      expect(dripLink).toHaveAttribute('rel', 'noopener noreferrer');
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
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message', () => {
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = {
          ...mockWalletStore,
          status: 'error',
          errorMessage: 'Freighter is not installed',
        };
        return typeof selector === 'function' ? selector(store) : store;
      });

      render(<WalletConnect />);

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveTextContent('Freighter is not installed');
    });

    it('shows retry button', () => {
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = {
          ...mockWalletStore,
          status: 'error',
          errorMessage: 'Freighter is not installed',
        };
        return typeof selector === 'function' ? selector(store) : store;
      });

      render(<WalletConnect />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('clears error and reconnects when retry is clicked', () => {
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = {
          ...mockWalletStore,
          status: 'error',
          errorMessage: 'Freighter is not installed',
        };
        return typeof selector === 'function' ? selector(store) : store;
      });

      render(<WalletConnect />);

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

      expect(screen.getByText('GVER...7890')).toBeInTheDocument();
    });

    it('handles empty public key', () => {
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = {
          ...mockWalletStore,
          status: 'idle',
          publicKey: '',
        };
        return typeof selector === 'function' ? selector(store) : store;
      });

      render(<WalletConnect />);

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

      expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
    });

    it('handles rapid state changes', () => {
      const { rerender } = render(<WalletConnect />);

      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = { ...mockWalletStore, status: 'connecting' };
        return typeof selector === 'function' ? selector(store) : store;
      });
      rerender(<WalletConnect />);
      expect(screen.getByText('Connecting…')).toBeInTheDocument();

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
