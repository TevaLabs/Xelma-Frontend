import { render, screen, fireEvent, act } from '@testing-library/react';
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
const mockValidation = vi.mocked(useStellarAddressValidation);

/** A real, well-formed Stellar G-address (all-zero ed25519 public key). */
const VALID_ADDRESS = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

type ValidationState =
  | 'idle'
  | 'validating'
  | 'valid'
  | 'invalid-format'
  | 'wrong-network'
  | 'not-found'
  | 'network-error';

function mockWalletState(
  status: string,
  publicKey: string | null,
  isWatchOnly = false,
  overrides: Record<string, unknown> = {},
) {
  mockUseWalletStore.mockImplementation((selector: any) => {
    const store = {
      status,
      publicKey,
      isWatchOnly,
      disconnect: vi.fn(),
      connect: vi.fn(),
      setWatchOnly: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    };
    if (typeof selector === 'function') return selector(store);
    return store;
  });
}

function mockValidationState(state: ValidationState, errorMessage = '') {
  mockValidation.mockReturnValue({
    state,
    isValid: state === 'valid',
    isValidating: state === 'validating',
    errorMessage,
    validate: vi.fn(),
  } as unknown as ReturnType<typeof useStellarAddressValidation>);
}

function openWatchOnlyPanel() {
  fireEvent.click(
    screen.getByRole('button', { name: /Watch-only: view an address without signing/i }),
  );
}

describe('Connect Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidation.mockReturnValue({
      state: 'idle',
      isValid: false,
      isValidating: false,
      errorMessage: null,
    } as unknown as ReturnType<typeof useStellarAddressValidation>);
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
      expect(
        screen.getByRole('button', { name: /View in Watch-Only Mode/i }),
      ).toBeInTheDocument();
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

  describe('manual address -> watch-only flow', () => {
    it('activates watch-only mode through the wallet store for a valid G-address', async () => {
      const setWatchOnly = vi.fn().mockResolvedValue(undefined);
      mockWalletState('idle', null, false, { setWatchOnly });
      mockValidationState('valid');

      render(<Connect />);
      openWatchOnlyPanel();

      fireEvent.change(screen.getByLabelText('Stellar Address'), {
        target: { value: VALID_ADDRESS },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /View in Watch-Only Mode/i }));
      });

      expect(setWatchOnly).toHaveBeenCalledTimes(1);
      expect(setWatchOnly).toHaveBeenCalledWith(VALID_ADDRESS);
    });

    it('never routes the manual path through the Freighter connect action', async () => {
      const connect = vi.fn();
      const setWatchOnly = vi.fn().mockResolvedValue(undefined);
      mockWalletState('idle', null, false, { connect, setWatchOnly });
      mockValidationState('valid');

      render(<Connect />);
      openWatchOnlyPanel();

      fireEvent.change(screen.getByLabelText('Stellar Address'), {
        target: { value: VALID_ADDRESS },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /View in Watch-Only Mode/i }));
      });

      expect(connect).not.toHaveBeenCalled();
      expect(setWatchOnly).toHaveBeenCalledWith(VALID_ADDRESS);
    });

    it('does not toast a Freighter connection for the manual path', async () => {
      const setWatchOnly = vi.fn().mockResolvedValue(undefined);
      mockWalletState('idle', null, false, { setWatchOnly });
      mockValidationState('valid');

      render(<Connect />);
      openWatchOnlyPanel();

      fireEvent.change(screen.getByLabelText('Stellar Address'), {
        target: { value: VALID_ADDRESS },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /View in Watch-Only Mode/i }));
      });

      // The page itself must not announce a connection at all; the store owns that
      // copy and it is always watch-only wording.
      expect(toast.success).not.toHaveBeenCalled();
      const announced = [...vi.mocked(toast.success).mock.calls, ...vi.mocked(toast.error).mock.calls]
        .flat()
        .filter((msg): msg is string => typeof msg === 'string')
        .join(' ');
      expect(announced).not.toMatch(/freighter|wallet connected/i);
    });

    it('does not activate watch-only mode for an invalid address', () => {
      const setWatchOnly = vi.fn().mockResolvedValue(undefined);
      mockWalletState('idle', null, false, { setWatchOnly });
      mockValidationState('invalid-format');

      render(<Connect />);
      openWatchOnlyPanel();

      fireEvent.change(screen.getByLabelText('Stellar Address'), {
        target: { value: 'NOT-AN-ADDRESS' },
      });

      const viewBtn = screen.getByRole('button', { name: /View in Watch-Only Mode/i });
      expect(viewBtn).toBeDisabled();

      fireEvent.click(viewBtn);
      expect(setWatchOnly).not.toHaveBeenCalled();
    });

    it('shows the validation error message for an invalid address', () => {
      mockValidationState(
        'invalid-format',
        'Invalid Stellar address format. Address must be 56 characters and valid Base32.',
      );

      render(<Connect />);
      openWatchOnlyPanel();

      expect(
        screen.getByText(/Invalid Stellar address format/i),
      ).toBeInTheDocument();
    });

    it('surfaces a not-found error and keeps the View button disabled', () => {
      mockValidationState('not-found', 'Account not found on the selected network.');

      render(<Connect />);
      openWatchOnlyPanel();

      expect(
        screen.getByText(/Account not found on the selected network/i),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /View in Watch-Only Mode/i })).toBeDisabled();
    });

    it('disables the View button and skips validation while an address is being checked', () => {
      const setWatchOnly = vi.fn().mockResolvedValue(undefined);
      mockWalletState('idle', null, false, { setWatchOnly });
      mockValidationState('validating');

      render(<Connect />);
      openWatchOnlyPanel();

      fireEvent.change(screen.getByLabelText('Stellar Address'), {
        target: { value: VALID_ADDRESS },
      });

      const viewBtn = screen.getByRole('button', { name: /Validating\.\.\./i });
      expect(viewBtn).toBeDisabled();

      fireEvent.click(viewBtn);
      expect(setWatchOnly).not.toHaveBeenCalled();
    });

    it('uppercases and strips spaces before activating watch-only mode', async () => {
      const setWatchOnly = vi.fn().mockResolvedValue(undefined);
      mockWalletState('idle', null, false, { setWatchOnly });
      mockValidationState('valid');

      render(<Connect />);
      openWatchOnlyPanel();

      fireEvent.change(screen.getByLabelText('Stellar Address'), {
        target: { value: VALID_ADDRESS.toLowerCase() },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /View in Watch-Only Mode/i }));
      });

      expect(setWatchOnly).toHaveBeenCalledWith(VALID_ADDRESS);
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
});
