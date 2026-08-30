import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FreighterMissingCard, { FREIGHTER_INSTALL_URL, FREIGHTER_DOCS_URL } from './FreighterMissingCard';
import { useWalletStore } from '../store/useWalletStore';

vi.mock('../store/useWalletStore', () => ({
  useWalletStore: vi.fn(),
}));

describe('FreighterMissingCard Component', () => {
  const mockClearError = vi.fn();
  const mockConnect = vi.fn();
  const mockCheckConnection = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders nothing when there is no missing freighter error state', () => {
    vi.mocked(useWalletStore).mockImplementation((selector: any) => {
      const state = {
        status: 'idle',
        errorCode: null,
        errorMessage: null,
        connect: mockConnect,
        checkConnection: mockCheckConnection,
        clearError: mockClearError,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    const { container } = render(<FreighterMissingCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders empty state card when FREIGHTER_UNAVAILABLE error occurs', () => {
    vi.mocked(useWalletStore).mockImplementation((selector: any) => {
      const state = {
        status: 'error',
        errorCode: 'FREIGHTER_UNAVAILABLE',
        errorMessage: 'Freighter is not installed or not unlocked.',
        connect: mockConnect,
        checkConnection: mockCheckConnection,
        clearError: mockClearError,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<FreighterMissingCard />);

    expect(screen.getByTestId('freighter-missing-card')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /freighter extension required/i })).toBeInTheDocument();
    expect(screen.getByText(/freighter browser extension was not detected/i)).toBeInTheDocument();

    const installLink = screen.getByRole('link', { name: /install freighter extension/i });
    expect(installLink).toHaveAttribute('href', FREIGHTER_INSTALL_URL);
    expect(installLink).toHaveAttribute('target', '_blank');

    const docsLink = screen.getByRole('link', { name: /view freighter setup & documentation/i });
    expect(docsLink).toHaveAttribute('href', FREIGHTER_DOCS_URL);
  });

  it('triggers re-check / retry callback when button is clicked', () => {
    vi.mocked(useWalletStore).mockImplementation((selector: any) => {
      const state = {
        status: 'error',
        errorCode: 'FREIGHTER_UNAVAILABLE',
        errorMessage: 'Freighter is not installed.',
        connect: mockConnect,
        checkConnection: mockCheckConnection,
        clearError: mockClearError,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<FreighterMissingCard />);

    const retryButton = screen.getByRole('button', { name: /re-check connection/i });
    fireEvent.click(retryButton);

    expect(mockClearError).toHaveBeenCalledTimes(1);
    expect(mockCheckConnection).toHaveBeenCalledTimes(1);
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it('does not false-positive on ACCESS_DENIED error', () => {
    vi.mocked(useWalletStore).mockImplementation((selector: any) => {
      const state = {
        status: 'error',
        errorCode: 'ACCESS_DENIED',
        errorMessage: 'User denied access.',
        connect: mockConnect,
        checkConnection: mockCheckConnection,
        clearError: mockClearError,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    const { container } = render(<FreighterMissingCard />);
    expect(container).toBeEmptyDOMElement();
  });
});
