import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Navbar from './Navbar';
import { useWalletStore, selectIsWalletConnected } from '../store/useWalletStore';
import '../i18n';
import i18n from '../i18n';

// Mock the wallet store
vi.mock('../store/useWalletStore', () => ({
  useWalletStore: vi.fn(),
  selectIsWalletConnected: vi.fn((s: { status: string; publicKey: string | null }) =>
    s.status === 'connected' && Boolean(s.publicKey),
  ),
}));

// Mock SVG logo import
vi.mock('../assets/logo.svg', () => ({ default: 'logo.svg' }));

// Lucide icon stubs — keep them lightweight
vi.mock('lucide-react', () => ({
  Menu: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-menu" {...props} />,
  X: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-x" {...props} />,
  Search: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-search" {...props} />,
}));

const connectMock = vi.fn();
const checkConnectionMock = vi.fn().mockResolvedValue(undefined);

/** Build a wallet store selector mock for a given state slice. */
function makeStoreMock(overrides: {
  status?: string;
  publicKey?: string | null;
  isConnecting?: boolean;
  balance?: string | null;
}) {
  const state = {
    status: overrides.status ?? 'idle',
    publicKey: overrides.publicKey ?? null,
    balance: overrides.balance ?? null,
    connect: connectMock,
    checkConnection: checkConnectionMock,
  };

  return (selector: ((s: typeof state) => unknown) | undefined) => {
    if (typeof selector === 'function') return selector(state);
    return state;
  };
}

function renderNavbar(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Navbar />
    </MemoryRouter>,
  );
}

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  describe('disconnected state', () => {
    beforeEach(() => {
      vi.mocked(useWalletStore).mockImplementation(makeStoreMock({ status: 'idle' }) as Parameters<typeof vi.mocked>[0]);
    });

    it('renders the Xelma brand link', () => {
      renderNavbar();
      expect(screen.getByRole('link', { name: /xelma/i })).toBeInTheDocument();
    });

    it('renders all nav links in the desktop nav', () => {
      renderNavbar();
      const links = screen.getAllByRole('link');
      const hrefs = links.map((l) => l.getAttribute('href'));
      expect(hrefs).toContain('/dashboard');
      expect(hrefs).toContain('/leaderboard');
      expect(hrefs).toContain('/learn');
      expect(hrefs).toContain('/profile');
    });

    it('shows "Connect Wallet" button when disconnected', () => {
      renderNavbar();
      // Multiple buttons (desktop + hidden mobile) may exist; at least one should say Connect Wallet
      const buttons = screen.getAllByRole('button', { name: /connect wallet/i });
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('does not show wallet address or balance when disconnected', () => {
      renderNavbar();
      expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument();
      expect(screen.queryByText(/vXLM/)).not.toBeInTheDocument();
    });

    it('allows switching languages via the language selector', async () => {
      renderNavbar();
      const languageSelect = screen.getByRole('combobox', { name: /language/i });
      expect(languageSelect).toBeInTheDocument();

      fireEvent.change(languageSelect, { target: { value: 'es' } });

      expect(await screen.findByRole('button', { name: /conectar cartera/i })).toBeInTheDocument();
    });
  });

  describe('connected state', () => {
    const publicKey = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQRST';
    const balance = '1,000 vXLM';

    beforeEach(() => {
      vi.mocked(useWalletStore).mockImplementation(
        makeStoreMock({ status: 'connected', publicKey, balance }) as Parameters<typeof vi.mocked>[0],
      );
    });

    it('shows truncated wallet address when connected', () => {
      renderNavbar();
      // truncateAddress: first 4 + ... + last 4
      const truncated = `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
      expect(screen.getAllByText(truncated).length).toBeGreaterThan(0);
    });

    it('shows balance badge when connected', () => {
      renderNavbar();
      expect(screen.getAllByText(/1,000 vXLM/).length).toBeGreaterThan(0);
    });

    it('shows "Connected" label on the button when connected', () => {
      renderNavbar();
      const buttons = screen.getAllByRole('button', { name: /connected/i });
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('connecting state', () => {
    beforeEach(() => {
      vi.mocked(useWalletStore).mockImplementation(
        makeStoreMock({ status: 'connecting' }) as Parameters<typeof vi.mocked>[0],
      );
    });

    it('shows "Connecting…" label while connecting', () => {
      renderNavbar();
      expect(screen.getAllByText(/connecting…/i).length).toBeGreaterThan(0);
    });

    it('disables the connect button while connecting', () => {
      renderNavbar();
      const buttons = screen.getAllByRole('button', { name: /connecting/i });
      buttons.forEach((btn) => {
        expect(btn).toBeDisabled();
      });
    });
  });

  describe('nav link active state', () => {
    beforeEach(() => {
      vi.mocked(useWalletStore).mockImplementation(makeStoreMock({ status: 'idle' }) as Parameters<typeof vi.mocked>[0]);
    });

    it('applies active style to the current route link', () => {
      renderNavbar('/dashboard');
      // The active link should have the active class applied
      const dashboardLink = screen.getByRole('link', { name: /terminal/i });
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
      expect(dashboardLink.className).toContain('text-[#BEC7FE]');
    });

    it('does not apply active style to non-current route links', () => {
      renderNavbar('/dashboard');
      const leaderboardLink = screen.getByRole('link', { name: /leaderboard/i });
      expect(leaderboardLink.className).not.toContain('text-[#BEC7FE]');
    });
  });

  describe('mobile menu', () => {
    beforeEach(() => {
      vi.mocked(useWalletStore).mockImplementation(makeStoreMock({ status: 'idle' }) as Parameters<typeof vi.mocked>[0]);
    });

    it('opens mobile menu when hamburger button is clicked', () => {
      renderNavbar();
      const menuButton = screen.getByRole('button', { name: /open mobile menu/i });
      fireEvent.click(menuButton);
      expect(screen.getByRole('dialog', { name: /mobile navigation menu/i })).toBeInTheDocument();
    });

    it('closes mobile menu when close button is clicked', () => {
      renderNavbar();
      const menuButton = screen.getByRole('button', { name: /open mobile menu/i });
      fireEvent.click(menuButton);
      const closeButton = screen.getByRole('button', { name: /close menu/i });
      fireEvent.click(closeButton);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes the drawer when Escape is pressed', () => {
      renderNavbar();
      fireEvent.click(screen.getByRole('button', { name: /open mobile menu/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('returns focus to the hamburger trigger after the drawer closes', () => {
      renderNavbar();
      const menuButton = screen.getByRole('button', { name: /open mobile menu/i });
      fireEvent.click(menuButton);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(menuButton).toHaveFocus();
    });
  });
});
