import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FriendbotFundCard from './FriendbotFundCard';
import { useWalletStore } from '../store/useWalletStore';

const PUBLIC_KEY = 'GCEXAMPLE7ADDRESS7FOR7TESTS7ONLY7AAAAAAAAAAAAAAAAAAAAAAAA';

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

const fundWithFriendbot = vi.fn();
vi.mock('../lib/friendbot', async () => {
  const actual = await vi.importActual<typeof import('../lib/friendbot')>('../lib/friendbot');
  return {
    ...actual,
    fundWithFriendbot: (...args: Parameters<typeof actual.fundWithFriendbot>) =>
      fundWithFriendbot(...args),
  };
});

function setLowBalanceConnected() {
  useWalletStore.setState({
    status: 'connected',
    publicKey: PUBLIC_KEY,
    balance: '0.50 XLM',
    refreshBalance: useWalletStore.getState().refreshBalance,
  });
}

describe('FriendbotFundCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWalletStore.getState().reset();
  });

  it('renders nothing when the wallet is not connected', () => {
    const { container } = render(<FriendbotFundCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the connected balance is already above the funding threshold', () => {
    useWalletStore.setState({ status: 'connected', publicKey: PUBLIC_KEY, balance: '50.00 XLM' });
    const { container } = render(<FriendbotFundCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the fund CTA with the current low balance when connected and underfunded', () => {
    setLowBalanceConnected();
    render(<FriendbotFundCard />);

    expect(screen.getByTestId('friendbot-fund-card')).toBeInTheDocument();
    expect(screen.getByText(/0\.50 XLM/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fund with friendbot/i })).toBeEnabled();
  });

  it('disables the button and shows a busy state while funding is in flight (issue #619: double-submit prevention)', async () => {
    setLowBalanceConnected();
    let resolveFund: () => void = () => {};
    fundWithFriendbot.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveFund = resolve;
      }),
    );
    render(<FriendbotFundCard />);

    const button = screen.getByRole('button', { name: /fund with friendbot/i });
    await act(async () => {
      fireEvent.click(button);
    });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(fundWithFriendbot).toHaveBeenCalledTimes(1);

    // A second click while disabled must not start a second funding request.
    fireEvent.click(button);
    expect(fundWithFriendbot).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFund();
    });
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it('shows a success toast and refreshes the balance after funding succeeds', async () => {
    setLowBalanceConnected();
    const refreshBalance = vi.fn().mockResolvedValue(undefined);
    useWalletStore.setState({ refreshBalance });
    fundWithFriendbot.mockResolvedValue(undefined);
    render(<FriendbotFundCard />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /fund with friendbot/i }));
    });

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledTimes(1));
    expect(toastSuccess.mock.calls[0][0]).toMatch(/funded/i);
    expect(refreshBalance).toHaveBeenCalledTimes(1);
    expect(toastError).not.toHaveBeenCalled();
  });

  it('shows the friendly rate-limit error message and does not refresh the balance on failure', async () => {
    setLowBalanceConnected();
    const refreshBalance = vi.fn().mockResolvedValue(undefined);
    useWalletStore.setState({ refreshBalance });
    fundWithFriendbot.mockRejectedValue(new Error('Friendbot is rate limiting requests. Try again in a minute.'));
    render(<FriendbotFundCard />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /fund with friendbot/i }));
    });

    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    expect(toastError.mock.calls[0][0]).toMatch(/rate limiting/i);
    expect(refreshBalance).not.toHaveBeenCalled();
  });

  it('re-enables the button after a failed funding attempt so the user can retry', async () => {
    setLowBalanceConnected();
    fundWithFriendbot.mockRejectedValue(new Error('Could not reach Friendbot. Check your connection and try again.'));
    render(<FriendbotFundCard />);

    const button = screen.getByRole('button', { name: /fund with friendbot/i });
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => expect(button).not.toBeDisabled());
    expect(button).toHaveAttribute('aria-busy', 'false');
  });

  it('links to the Friendbot faucet directly for the connected address', () => {
    setLowBalanceConnected();
    render(<FriendbotFundCard />);

    const link = screen.getByRole('link', { name: /open friendbot/i });
    expect(link).toHaveAttribute('href', expect.stringContaining(encodeURIComponent(PUBLIC_KEY)));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});
