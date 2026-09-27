import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock useStellarAddressValidation
vi.mock('../hooks/useStellarAddressValidation', () => ({
  useStellarAddressValidation: vi.fn(() => ({
    state: 'idle',
    isValid: false,
    isValidating: false,
    errorMessage: null,
  })),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock WalletConnect component
vi.mock('../components/WalletConnect', () => ({
  default: () => <div data-testid="wallet-connect">WalletConnect Mock</div>,
}));

// Mock useWalletStore
vi.mock('../store/useWalletStore', () => ({
  useWalletStore: vi.fn(),
  selectIsWalletConnected: vi.fn((state: { status: string; publicKey: string | null }) => state.status === 'connected' && Boolean(state.publicKey)),
  selectNeedsFunding: vi.fn(() => false),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import Connect from './Connect';
import { useWalletStore } from '../store/useWalletStore';
import { useStellarAddressValidation } from '../hooks/useStellarAddressValidation';
import { toast } from 'sonner';

const mockUseWalletStore = vi.mocked(useWalletStore);
const mockUseValidation = vi.mocked(useStellarAddressValidation);

function mockWalletState(status: string, publicKey: string | null, isWatchOnly = false) {
  mockUseWalletStore.mockImplementation((selector: any) => {
    const store = {
      status,
      publicKey,
      isWatchOnly,
      disconnect: vi.fn(),
      setWatchOnly: vi.fn(),
      connect: vi.fn(),
    };
    if (typeof selector === 'function') return selector(store);
    return store;
  });
}

/** Sets the validation hook result; defaults to the idle/invalid state. */
function mockValidation(overrides: { state?: string; isValid?: boolean; isValidating?: boolean; errorMessage?: string | null } = {}) {
  mockUseValidation.mockReturnValue({
    state: 'idle',
    isValid: false,
    isValidating: false,
    errorMessage: null,
    ...overrides,
  } as ReturnType<typeof useStellarAddressValidation>);
}

/** Grabs the latest store mock object handed to the component. */
function lastStoreMock() {
  const calls = mockUseWalletStore.mock.results;
  return calls[calls.length - 1].value as {
    status: string;
    publicKey: string | null;
    isWatchOnly: boolean;
    disconnect: ReturnType<typeof vi.fn>;
    setWatchOnly: ReturnType<typeof vi.fn>;
    connect: ReturnType<typeof vi.fn>;
  };
}

describe('Connect Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWalletState('idle', null);
  });

  describe('rendering', () => {
    it('renders the Connect Wallet heading', () => {
      render(<Connect />);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Connect Wallet');
    });

    it('renders the subtitle about Freighter wallet', () => {
      render(<Connect />);
      expect(
        screen.getByText(/Connect your Freighter wallet to get started/i),
      ).toBeInTheDocument();
    });

    it('renders the WalletConnect component', () => {
      render(<Connect />);
      expect(screen.getByTestId('wallet-connect')).toBeInTheDocument();
    });

    it('renders the watch-only toggle button', () => {
      render(<Connect />);
      expect(
        screen.getByRole('button', { name: /Watch-only: view an address without signing/i }),
      ).toBeInTheDocument();
    });
  });

  describe('wallet connected state', () => {
    it('shows Continue to Dashboard button when wallet is connected', () => {
      mockWalletState('connected', 'GTEST1234567890');
      render(<Connect />);

      expect(
        screen.getByRole('button', { name: /Continue to Dashboard/i }),
      ).toBeInTheDocument();
    });

    it('navigates to /dashboard when Continue button is clicked', () => {
      mockWalletState('connected', 'GTEST1234567890');
      render(<Connect />);

      fireEvent.click(screen.getByRole('button', { name: /Continue to Dashboard/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('does not show Continue button when wallet is not connected', () => {
      mockWalletState('idle', null);
      render(<Connect />);

      expect(screen.queryByRole('button', { name: /Continue to Dashboard/i })).toBeNull();
    });

    it('does not show Continue button when wallet is connecting', () => {
      mockWalletState('connecting', null);
      render(<Connect />);

      expect(screen.queryByRole('button', { name: /Continue to Dashboard/i })).toBeNull();
    });
  });

  describe('watch-only address panel', () => {
    it('reveals network selection and address input when watch-only toggle is clicked', () => {
      render(<Connect />);

      const toggle = screen.getByRole('button', {
        name: /Watch-only: view an address without signing/i,
      });
      fireEvent.click(toggle);

      // Network buttons should appear
      expect(screen.getByRole('button', { name: 'Mainnet' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Testnet' })).toBeInTheDocument();

      // Address input should appear
      expect(screen.getByLabelText('Stellar Address')).toBeInTheDocument();

      // View button should appear
      expect(screen.getByRole('button', { name: /View in Watch-Only Mode/i })).toBeInTheDocument();
    });

    it('hides watch-only panel content when toggle is clicked twice', () => {
      render(<Connect />);

      const toggle = screen.getByRole('button', {
        name: /Watch-only: view an address without signing/i,
      });

      // Open
      fireEvent.click(toggle);
      expect(screen.getByLabelText('Stellar Address')).toBeInTheDocument();

      // Close
      fireEvent.click(toggle);
      expect(screen.queryByLabelText('Stellar Address')).toBeNull();
    });

    it('disables View button when address is invalid', () => {
      render(<Connect />);

      fireEvent.click(
        screen.getByRole('button', { name: /Watch-only: view an address without signing/i }),
      );

      const viewBtn = screen.getByRole('button', { name: /View in Watch-Only Mode/i });
      expect(viewBtn).toBeDisabled();
    });
  });

  describe('watch-only connected state', () => {
    it('renders Watch-Only Mode heading and does not render the Freighter WalletConnect', () => {
      mockWalletState('connected', 'GTEST1234567890', true);
      render(<Connect />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Watch-Only Mode');
      expect(screen.queryByTestId('wallet-connect')).toBeNull();
    });

    it('shows Watch-only address active and Disconnect/Continue actions', () => {
      mockWalletState('connected', 'GTEST1234567890', true);
      render(<Connect />);

      expect(screen.getByText(/Watch-only address active/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Disconnect/i })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Continue to Dashboard/i }),
      ).toBeInTheDocument();
    });

    it('does not show Freighter WalletConnect for a watch-only address', () => {
      mockWalletState('connected', 'GTEST1234567890', true);
      render(<Connect />);

      // Assert the WalletConnect mock (Freighter flow) is never rendered
      expect(screen.queryByTestId('wallet-connect')).toBeNull();
    });
  });

  describe('no network calls', () => {
    it('does not make real fetch calls', () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      render(<Connect />);
      // The only fetch that could happen is from mocked hooks/components
      // Verify no unmocked fetch was triggered
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });
  });

  describe('manual watch-only address path (issue #579 regression)', () => {
    beforeEach(() => {
      mockValidation();
    });

    it('submits the manual address through watch-only activation, never the Freighter connect flow', () => {
      mockWalletState('idle', null);
      mockValidation({ state: 'valid', isValid: true });
      render(<Connect />);

      fireEvent.click(
        screen.getByRole('button', { name: /Watch-only: view an address without signing/i }),
      );
      const viewBtn = screen.getByRole('button', { name: /View in Watch-Only Mode/i });
      expect(viewBtn).toBeEnabled();
      fireEvent.click(viewBtn);

      const store = lastStoreMock();
      expect(store.setWatchOnly).toHaveBeenCalledTimes(1);
      expect(store.connect).not.toHaveBeenCalled();
      // No false "Connected" toast is fired from the page itself
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('keeps the manual submit blocked until validation passes', () => {
      mockWalletState('idle', null);
      render(<Connect />);

      fireEvent.click(
        screen.getByRole('button', { name: /Watch-only: view an address without signing/i }),
      );

      const viewBtn = screen.getByRole('button', { name: /View in Watch-Only Mode/i });
      expect(viewBtn).toBeDisabled();
      expect(lastStoreMock().setWatchOnly).not.toHaveBeenCalled();
    });

    it('shows the watch-only confirmation panel with accurate copy after activation', () => {
      mockWalletState('connected', 'GBH4QFZVFSLJL4VXK2XEFJGR4D3IUBEN2LO2W3KL6XRB5YVLXUBVQXLH', true);
      render(<Connect />);

      // Accurate watch-only status messaging — not a "Connected" wallet toast
      expect(screen.getByText(/Watch-only address active/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Viewing an address without signing capability/i),
      ).toBeInTheDocument();
      expect(screen.queryByTestId('wallet-connect')).toBeNull();
    });

    it('never renders the Freighter flow or a connected state on the manual path while idle', () => {
      mockWalletState('idle', null);
      render(<Connect />);

      fireEvent.click(
        screen.getByRole('button', { name: /Watch-only: view an address without signing/i }),
      );

      // WalletConnect (Freighter) stays mounted but no connected UI is shown
      expect(screen.queryByText(/Watch-only address active/i)).toBeNull();
      expect(screen.queryByRole('button', { name: /Continue to Dashboard/i })).toBeNull();
      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
    });
  });
});
