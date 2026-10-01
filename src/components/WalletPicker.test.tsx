import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WalletPicker from './WalletPicker';
import { WALLET_ADAPTERS } from '../lib/wallets';

const isAvailableMock = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
  },
}));

vi.mock('../lib/wallets', async () => {
  const actual = await vi.importActual<typeof import('../lib/wallets')>('../lib/wallets');
  return {
    ...actual,
    WALLET_ADAPTERS: [
      {
        id: 'freighter',
        name: 'Freighter',
        description: 'Browser extension by the Stellar Development Foundation',
        isImplemented: true,
        isAvailable: () => isAvailableMock(),
        connect: vi.fn(),
        signMessage: vi.fn(),
        signTransaction: vi.fn(),
      },
      {
        id: 'albedo',
        name: 'Albedo',
        description: 'Web-based signer — no extension required',
        isImplemented: false,
        comingSoonHint: 'Albedo support is planned but not wired up yet — use Freighter for now.',
        isAvailable: async () => ({ isAvailable: false, reason: 'NOT_IMPLEMENTED' }),
        connect: vi.fn(),
        signMessage: vi.fn(),
        signTransaction: vi.fn(),
      },
      {
        id: 'lobstr',
        name: 'LOBSTR',
        description: 'Mobile and browser wallet with WalletConnect',
        isImplemented: false,
        comingSoonHint: 'LOBSTR support is planned but not wired up yet — use Freighter for now.',
        isAvailable: async () => ({ isAvailable: false, reason: 'NOT_IMPLEMENTED' }),
        connect: vi.fn(),
        signMessage: vi.fn(),
        signTransaction: vi.fn(),
      },
    ],
  };
});

describe('WalletPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isAvailableMock.mockResolvedValue({ isAvailable: true });
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <WalletPicker isOpen={false} onClose={vi.fn()} onSelect={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a row per registered adapter as a modal dialog', async () => {
    render(<WalletPicker isOpen onClose={vi.fn()} onSelect={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: /connect a wallet/i })).toBeInTheDocument();
    expect(screen.getByText('Freighter')).toBeInTheDocument();
    expect(screen.getByText('Albedo')).toBeInTheDocument();
    await waitFor(() => expect(isAvailableMock).toHaveBeenCalled());
  });

  it('marks unimplemented adapters as coming soon with an accessible description', () => {
    render(<WalletPicker isOpen onClose={vi.fn()} onSelect={vi.fn()} />);

    const comingSoonBadges = screen.getAllByText(/coming soon/i);
    expect(comingSoonBadges).toHaveLength(2);

    const albedo = screen.getByRole('button', { name: /albedo/i });
    // Stub rows stay selectable (not natively `disabled`) so a click can
    // surface a toast — they're marked disabled for assistive tech via
    // aria-disabled instead, and get a description explaining why.
    expect(albedo).not.toBeDisabled();
    expect(albedo).toHaveAttribute('aria-disabled', 'true');
    expect(albedo).toHaveAccessibleDescription(/coming soon/i);
    expect(albedo).toHaveAccessibleDescription(/planned but not wired up yet/i);
  });

  it('shows a helper tooltip on stub wallet rows', () => {
    render(<WalletPicker isOpen onClose={vi.fn()} onSelect={vi.fn()} />);

    const albedo = screen.getByRole('button', { name: /albedo/i });
    expect(albedo).toHaveAttribute('title', expect.stringMatching(/planned but not wired up yet/i));
  });

  it('surfaces an info toast instead of throwing when a stub wallet is selected', async () => {
    const { toast } = await import('sonner');
    const onSelect = vi.fn();
    render(<WalletPicker isOpen onClose={vi.fn()} onSelect={onSelect} />);

    const albedo = screen.getByRole('button', { name: /albedo/i });
    expect(() => fireEvent.click(albedo)).not.toThrow();

    expect(toast.info).toHaveBeenCalledWith(
      'Albedo is coming soon',
      expect.objectContaining({ description: expect.stringMatching(/planned but not wired up yet/i) }),
    );
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('surfaces an info toast for the LOBSTR stub too', async () => {
    const { toast } = await import('sonner');
    const onSelect = vi.fn();
    render(<WalletPicker isOpen onClose={vi.fn()} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /lobstr/i }));

    expect(toast.info).toHaveBeenCalledWith('LOBSTR is coming soon', expect.anything());
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('calls onSelect with the wallet id when an available adapter is chosen', async () => {
    const onSelect = vi.fn();
    render(<WalletPicker isOpen onClose={vi.fn()} onSelect={onSelect} />);

    const freighter = screen.getByRole('button', { name: /freighter/i });
    await waitFor(() => expect(freighter).not.toBeDisabled());
    fireEvent.click(freighter);

    expect(onSelect).toHaveBeenCalledWith('freighter');
  });

  it('disables an implemented adapter that is not installed', async () => {
    isAvailableMock.mockResolvedValue({ isAvailable: false, reason: 'NOT_INSTALLED' });

    render(<WalletPicker isOpen onClose={vi.fn()} onSelect={vi.fn()} />);

    expect(await screen.findByText(/not installed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /freighter/i })).toBeDisabled();
  });

  it('closes when the close button is pressed', () => {
    const onClose = vi.fn();
    render(<WalletPicker isOpen onClose={onClose} onSelect={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /close wallet picker/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<WalletPicker isOpen onClose={onClose} onSelect={vi.fn()} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });
});

describe('WalletPicker — stub wallet helper text', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isAvailableMock.mockResolvedValue({ isAvailable: true });
  });

  it('shows the helper text for each stub wallet on screen, not only in a tooltip', () => {
    render(<WalletPicker isOpen onClose={vi.fn()} onSelect={vi.fn()} />);

    for (const [name, pattern] of [
      ['albedo', /albedo support is planned but not wired up yet/i],
      ['lobstr', /lobstr support is planned but not wired up yet/i],
    ] as const) {
      const button = screen.getByRole('button', { name: new RegExp(name, 'i') });
      const helper = screen.getByText(pattern);

      // Not screen-reader-only, and not hidden inside the button.
      expect(helper).not.toHaveClass('sr-only');
      expect(button).not.toContainElement(helper);
    }
  });

  it('ties the visible helper text to its row through aria-describedby', () => {
    render(<WalletPicker isOpen onClose={vi.fn()} onSelect={vi.fn()} />);

    const albedo = screen.getByRole('button', { name: /albedo/i });
    const helper = screen.getByText(/albedo support is planned but not wired up yet/i);

    expect(albedo.getAttribute('aria-describedby')?.split(' ')).toContain(helper.id);
    expect(albedo).toHaveAccessibleDescription(/planned but not wired up yet/i);
  });

  it('keeps the helper text out of the accessible name (so Freighter lookups stay unique)', () => {
    render(<WalletPicker isOpen onClose={vi.fn()} onSelect={vi.fn()} />);

    // Both stub hints say "use Freighter for now"; only the real row may match.
    expect(screen.getAllByRole('button', { name: /freighter/i })).toHaveLength(1);
    expect(screen.getByRole('button', { name: /albedo/i })).toHaveAccessibleName(/^albedo/i);
  });

  it('keeps stub rows keyboard-focusable so the explanation is reachable', () => {
    render(<WalletPicker isOpen onClose={vi.fn()} onSelect={vi.fn()} />);

    const albedo = screen.getByRole('button', { name: /albedo/i });
    albedo.focus();

    expect(albedo).toHaveFocus();
  });

  it('gives a stub without its own hint a default helper text, tooltip and toast', async () => {
    const { toast } = await import('sonner');
    const hintless = {
      id: 'lobstr',
      name: 'Hintless',
      description: 'A stub with no comingSoonHint',
      isImplemented: false,
      isAvailable: async () => ({ isAvailable: false, reason: 'NOT_IMPLEMENTED' }),
      connect: vi.fn(),
      signMessage: vi.fn(),
      signTransaction: vi.fn(),
    };
    const extra = { ...hintless, id: 'albedo' };
    const original = [...WALLET_ADAPTERS];
    WALLET_ADAPTERS.splice(0, WALLET_ADAPTERS.length, ...original.slice(0, 1), extra as never);

    try {
      render(<WalletPicker isOpen onClose={vi.fn()} onSelect={vi.fn()} />);
      const fallback = /hintless support isn't wired up yet — try freighter for now/i;
      const button = screen.getByRole('button', { name: /hintless/i });

      expect(screen.getByText(fallback)).toBeInTheDocument();
      expect(button).toHaveAttribute('title', expect.stringMatching(fallback));
      expect(button).toHaveAccessibleDescription(fallback);

      fireEvent.click(button);
      expect(toast.info).toHaveBeenCalledWith(
        'Hintless is coming soon',
        expect.objectContaining({ description: expect.stringMatching(fallback) }),
      );
    } finally {
      WALLET_ADAPTERS.splice(0, WALLET_ADAPTERS.length, ...original);
    }
  });

  it('leaves the Freighter row untouched: no badge, no helper text, no toast', async () => {
    const { toast } = await import('sonner');
    const onSelect = vi.fn();
    render(<WalletPicker isOpen onClose={vi.fn()} onSelect={onSelect} />);

    const freighter = screen.getByRole('button', { name: /freighter/i });
    await waitFor(() => expect(freighter).not.toBeDisabled());

    expect(freighter).not.toHaveAttribute('title');
    expect(freighter).not.toHaveAttribute('aria-disabled', 'true');
    expect(freighter.getAttribute('aria-describedby') ?? '').not.toMatch(/wallet-hint/);
    expect(document.getElementById('wallet-hint-freighter')).toBeNull();

    fireEvent.click(freighter);

    expect(onSelect).toHaveBeenCalledWith('freighter');
    expect(toast.info).not.toHaveBeenCalled();
  });
});

