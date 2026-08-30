import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WalletPicker from './WalletPicker';

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
