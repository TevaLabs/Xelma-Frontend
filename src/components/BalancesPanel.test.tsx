import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BalancesPanel from './BalancesPanel';
import { useWalletStore } from '../store/useWalletStore';

const ADDRESS = 'GCEXAMPLE7ADDRESS7FOR7TESTS7ONLY7AAAAAAAAAAAAAAAAAAAAAAAA';

function setConnected(publicKey: string | null) {
  useWalletStore.setState({
    status: publicKey ? 'connected' : 'idle',
    publicKey,
  });
}

function mockHorizon(value: unknown) {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(value);
}

describe('BalancesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWalletStore.getState().reset();
  });

  it('renders nothing when the wallet is not connected', () => {
    setConnected(null);
    const { container } = render(<BalancesPanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a loading state while balances are in flight', () => {
    setConnected(ADDRESS);
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

    render(<BalancesPanel />);

    expect(screen.getByLabelText('Loading balances')).toBeInTheDocument();
  });

  it('renders the native balance and each trustline once loaded', async () => {
    setConnected(ADDRESS);
    mockHorizon({
      ok: true,
      status: 200,
      json: async () => ({
        balances: [
          { asset_type: 'native', balance: '250.0000000' },
          { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: 'GISSUER', balance: '40.5000000' },
        ],
      }),
    });

    render(<BalancesPanel />);

    expect(await screen.findByText('250.00')).toBeInTheDocument();
    expect(screen.getByText('USDC')).toBeInTheDocument();
    expect(screen.getByText('40.50')).toBeInTheDocument();
  });

  it('shows an empty trustlines message when the account holds only XLM', async () => {
    setConnected(ADDRESS);
    mockHorizon({
      ok: true,
      status: 200,
      json: async () => ({ balances: [{ asset_type: 'native', balance: '10.0000000' }] }),
    });

    render(<BalancesPanel />);

    expect(await screen.findByText(/no trustlines yet/i)).toBeInTheDocument();
  });

  it('shows an unfunded empty state when Horizon returns 404', async () => {
    setConnected(ADDRESS);
    mockHorizon({ ok: false, status: 404, json: async () => ({}) });

    render(<BalancesPanel />);

    expect(await screen.findByText(/account not funded/i)).toBeInTheDocument();
  });

  it('shows an error state with a retry button when the fetch fails', async () => {
    setConnected(ADDRESS);
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('offline'));

    render(<BalancesPanel />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/could not load balances/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
