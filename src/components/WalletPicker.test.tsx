import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WalletPicker from './WalletPicker';

const isAvailableMock = vi.fn();

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

  it('marks unimplemented adapters as coming soon and disables them', () => {
    render(<WalletPicker isOpen onClose={vi.fn()} onSelect={vi.fn()} />);

    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /albedo/i })).toBeDisabled();
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
