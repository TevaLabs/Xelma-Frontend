import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NetworkMismatchCard from './NetworkMismatchCard';
import { useWalletStore } from '../store/useWalletStore';
import {
  EXPECTED_NETWORK_LABEL,
  FREIGHTER_NETWORK_DOCS,
  STELLAR_NETWORKS_DOCS,
} from '../lib/stellarNetwork';

vi.mock('../store/useWalletStore', () => ({
  useWalletStore: vi.fn(),
}));

const checkConnection = vi.fn();

/** Small selector-mock helper: keeps global store state isolated per test. */
function mockWalletState(overrides: {
  status?: string;
  publicKey?: string | null;
  network?: string | null;
  networkMismatch?: boolean;
} = {}) {
  const state = {
    status: overrides.status ?? 'connected',
    publicKey: overrides.publicKey ?? 'GTESTNETWORKMISMATCHCARD00000000000000000000000',
    network: overrides.network ?? 'PUBLIC',
    networkMismatch: overrides.networkMismatch ?? true,
    checkConnection,
  };

  vi.mocked(useWalletStore).mockImplementation(((selector: (s: typeof state) => unknown) =>
    selector(state)) as Parameters<typeof vi.mocked>[0]);
}

function renderCard() {
  return render(
    <MemoryRouter>
      <NetworkMismatchCard />
    </MemoryRouter>,
  );
}

describe('NetworkMismatchCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when the wallet is not connected', () => {
    mockWalletState({ status: 'idle', publicKey: null });
    const { container } = renderCard();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the wallet is connected on the expected network', () => {
    mockWalletState({ networkMismatch: false });
    const { container } = renderCard();
    expect(container).toBeEmptyDOMElement();
  });

  it('explains the mismatch and lists the fix steps when on the wrong network', () => {
    mockWalletState({ network: 'PUBLIC' });
    renderCard();

    const card = screen.getByTestId('network-mismatch-card');
    expect(card).toHaveAttribute('role', 'alert');
    expect(screen.getByRole('heading', { name: /wrong network/i })).toBeInTheDocument();
    expect(card).toHaveTextContent(EXPECTED_NETWORK_LABEL);
    expect(card).toHaveTextContent('Mainnet');
    expect(screen.getByText(/Open the Freighter extension/i)).toBeInTheDocument();
    expect(card).toHaveAttribute('data-wallet-network', 'PUBLIC');
    expect(card).toHaveAttribute('data-expected-network', EXPECTED_NETWORK_LABEL);
  });

  it('calls checkConnection when the re-check button is pressed', () => {
    mockWalletState();
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: /re-check network/i }));
    expect(checkConnection).toHaveBeenCalledTimes(1);
  });

  it('offers in-app deep links to Settings and Learn alongside the external guides', () => {
    mockWalletState();
    renderCard();

    expect(screen.getByRole('link', { name: /network settings/i })).toHaveAttribute('href', '/settings');
    expect(screen.getByRole('link', { name: /learn about networks/i })).toHaveAttribute('href', '/learn');
    expect(screen.getByRole('link', { name: /freighter network guide/i })).toHaveAttribute(
      'href',
      FREIGHTER_NETWORK_DOCS,
    );
    expect(screen.getByRole('link', { name: /about stellar networks/i })).toHaveAttribute(
      'href',
      STELLAR_NETWORKS_DOCS,
    );
  });
});
