import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import NetworkMismatchCard, {
  NETWORK_SETTINGS_ROUTE,
  LEARN_GUIDE_ROUTE,
} from './NetworkMismatchCard';
import { useWalletStore } from '../store/useWalletStore';
import {
  EXPECTED_NETWORK_LABEL,
  FREIGHTER_NETWORK_DOCS,
  STELLAR_NETWORKS_DOCS,
} from '../lib/stellarNetwork';

// Issue #618 — NetworkMismatchCard must state the Freighter/network mismatch
// clearly and offer deep links that help the user fix it. These tests cover
// the visible mismatch state, the aligned (hidden) happy path, and the CTAs.

const mockWalletStore = {
  status: 'connected' as const,
  publicKey: 'GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  network: 'PUBLIC',
  networkMismatch: true,
  checkConnection: vi.fn(),
};

function mockStore(overrides: Partial<typeof mockWalletStore> = {}) {
  vi.mocked(useWalletStore).mockImplementation((selector: any) => {
    const store = { ...mockWalletStore, ...overrides };
    if (typeof selector === 'function') {
      const value = selector(store);
      if (value !== undefined) {
        return value;
      }
      return store;
    }
    return store;
  });
  vi.clearAllMocks();
}

vi.mock('../store/useWalletStore', async () => {
  const actual = await vi.importActual<typeof import('../store/useWalletStore')>('../store/useWalletStore');
  return {
    ...actual,
    useWalletStore: vi.fn((selector: unknown) => {
      if (typeof selector === 'function') {
        return (selector as (s: typeof mockWalletStore) => unknown)(mockWalletStore);
      }
      return mockWalletStore;
    }),
  };
});

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
    // Visible state is a fresh store config; the first visible-state test sets
    // the base connected/wrong-network values before calling renderCard().
  });

  describe('visible mismatch state', () => {
    it('renders with role=alert when a connected wallet reports the wrong network', () => {
      mockStore();
      renderCard();

      const card = screen.getByTestId('network-mismatch-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('role', 'alert');
    });

    it('announces the expected and wallet-reported network', () => {
      mockStore({ network: 'PUBLIC' });
      renderCard();

      const card = screen.getByTestId('network-mismatch-card');
      expect(card).toHaveAttribute('data-expected-network', EXPECTED_NETWORK_LABEL);
      expect(card).toHaveAttribute('data-wallet-network', 'PUBLIC');
      expect(card).toHaveTextContent(new RegExp(`settles on.*${EXPECTED_NETWORK_LABEL}`, 'i'));
      expect(card).toHaveTextContent(/wallet reports/i);
    });

    it('hides when the wallet network is unknown and no mismatch flag is set', () => {
      vi.mocked(useWalletStore).mockImplementation((selector: any) => {
        const store = { ...mockWalletStore, network: null, networkMismatch: false };
        if (typeof selector === 'function') {
          return selector(store);
        }
        return store;
      });
      renderCard();

      expect(screen.queryByTestId('network-mismatch-card')).not.toBeInTheDocument();
    });

    it('renders the Unknown network label as the wallet network', () => {
      mockStore({ network: 'FUTURENET', networkMismatch: true, status: 'connected' });
      renderCard();

      const card = screen.getByTestId('network-mismatch-card');
      expect(card).toHaveAttribute('data-wallet-network', 'FUTURENET');
      expect(card).toHaveTextContent('Futurenet');
    });

    it('explains the consequence of the mismatch', () => {
      mockStore();
      renderCard();

      expect(
        screen.getByTestId('network-mismatch-card').textContent,
      ).toMatch(/Funding and prediction signing will fail/i);
    });

    it('lists ordered fix-it steps referencing the expected network', () => {
      mockStore();
      renderCard();

      const card = screen.getByTestId('network-mismatch-card');
      expect(card.querySelectorAll('li')).toHaveLength(4);
      expect(card.textContent).toMatch(new RegExp(`Select ${EXPECTED_NETWORK_LABEL}`, 'i'));
      expect(card.textContent).toMatch(/come back and press/i);
    });

    it('links the expected network label to the aria-labelledby heading', () => {
      mockStore();
      renderCard();

      const heading = screen.getByRole('heading', { name: /freighter is on the wrong network/i });
      expect(heading).toHaveAttribute('id', 'network-mismatch-heading');
      const section = screen.getByTestId('network-mismatch-card');
      expect(section).toHaveAttribute('aria-labelledby', 'network-mismatch-heading');
    });
  });

  describe('hidden when networks align', () => {
    it('renders nothing when there is no mismatch', () => {
      mockStore({ networkMismatch: false, network: 'TESTNET' });
      renderCard();

      expect(screen.queryByTestId('network-mismatch-card')).not.toBeInTheDocument();
    });

    it('renders nothing when the wallet is not connected', () => {
      mockStore({ status: 'idle', publicKey: null });
      renderCard();

      expect(screen.queryByTestId('network-mismatch-card')).not.toBeInTheDocument();
    });

    it('renders nothing when connection is still being established', () => {
      mockStore({ status: 'connecting', publicKey: null });
      renderCard();

      expect(screen.queryByTestId('network-mismatch-card')).not.toBeInTheDocument();
    });
  });

  describe('calls to action', () => {
    it('deep-links to the Settings network section', () => {
      mockStore({ status: 'connected', publicKey: 'GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', networkMismatch: true });
      renderCard();

      const settingsLink = screen.getByTestId('network-mismatch-settings-link');
      expect(settingsLink).toHaveAttribute('href', NETWORK_SETTINGS_ROUTE);
      expect(NETWORK_SETTINGS_ROUTE).toBe('/settings#network');
    });

    it('links to the Learn network guide', () => {
      mockStore({ status: 'connected', publicKey: 'GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', networkMismatch: true });
      renderCard();

      const learnLink = screen.getByTestId('network-mismatch-learn-link');
      expect(learnLink).toHaveAttribute('href', LEARN_GUIDE_ROUTE);
      expect(LEARN_GUIDE_ROUTE).toBe('/learn');
    });

    it('re-checks the connection when the re-check button is pressed', () => {
      mockStore({ status: 'connected', publicKey: 'GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', networkMismatch: true });
      renderCard();

      fireEvent.click(screen.getByTestId('network-mismatch-recheck'));
      expect(mockWalletStore.checkConnection).toHaveBeenCalledTimes(1);
    });

    it('offers external Freighter and Stellar network docs in a new tab', () => {
      mockStore();
      renderCard();

      const freighterDocs = screen.getByTestId('network-mismatch-card').querySelector('a[href="' + FREIGHTER_NETWORK_DOCS + '"]');
      expect(freighterDocs).toBeInTheDocument();
      expect(freighterDocs).toHaveAttribute('target', '_blank');
      expect(freighterDocs).toHaveAttribute('rel', 'noopener noreferrer');

      const stellarDocs = screen.getByTestId('network-mismatch-card').querySelector('a[href="' + STELLAR_NETWORKS_DOCS + '"]');
      expect(stellarDocs).toBeInTheDocument();
      expect(stellarDocs).toHaveAttribute('target', '_blank');
      expect(stellarDocs).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders nothing when the connected wallet already matches the expected network', () => {
      mockStore({ network: EXPECTED_NETWORK_LABEL });
      renderCard();

      expect(screen.queryByTestId('network-mismatch-card')).not.toBeInTheDocument();
    });

    it('keeps the CTA deep links pointing at the new Settings and Learn routes', () => {
      mockStore();
      renderCard();

      const card = screen.getByTestId('network-mismatch-card');
      expect(card.querySelector('[data-testid="network-mismatch-settings-link"]')).toHaveAttribute('href', '/settings#network');
      expect(card.querySelector('[data-testid="network-mismatch-learn-link"]')).toHaveAttribute('href', '/learn');
    });

    it('still exposes the deep-link routes as exported constants', () => {
      expect(NETWORK_SETTINGS_ROUTE).toBe('/settings#network');
      expect(LEARN_GUIDE_ROUTE).toBe('/learn');
    });
  });
});
