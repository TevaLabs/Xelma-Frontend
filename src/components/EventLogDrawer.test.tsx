import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EventLogDrawer from './EventLogDrawer';
import { fetchPredictionEvents, type PredictionEvent } from '../lib/prediction-events';

vi.mock('../lib/prediction-events', async () => {
  const actual = await vi.importActual<typeof import('../lib/prediction-events')>(
    '../lib/prediction-events',
  );
  return { ...actual, fetchPredictionEvents: vi.fn() };
});

const fetchMock = vi.mocked(fetchPredictionEvents);

function event(overrides: Partial<PredictionEvent> = {}): PredictionEvent {
  return {
    id: 'evt-1',
    name: 'settle',
    kind: 'settlement',
    roundId: '7',
    ledger: 1234,
    timestamp: '2026-07-30T10:00:00Z',
    txHash: 'txhash1',
    payload: { winner: 'UP' },
    ...overrides,
  };
}

describe('EventLogDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed and does not fetch', () => {
    const { container } = render(<EventLogDrawer isOpen={false} onClose={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows a loading state while events are in flight', () => {
    fetchMock.mockReturnValue(new Promise(() => {}));

    render(<EventLogDrawer isOpen onClose={vi.fn()} />);

    expect(screen.getByLabelText('Loading on-chain events')).toBeInTheDocument();
  });

  it('lists loaded events with round and ledger detail', async () => {
    fetchMock.mockResolvedValue([event()]);

    render(<EventLogDrawer isOpen onClose={vi.fn()} />);

    expect(await screen.findByText('settle')).toBeInTheDocument();
    expect(screen.getByText(/round 7/i)).toBeInTheDocument();
    expect(screen.getByText(/1,234/)).toBeInTheDocument();
  });

  it('links out to the explorer when a tx hash is present', async () => {
    fetchMock.mockResolvedValue([event()]);

    render(<EventLogDrawer isOpen onClose={vi.fn()} />);

    const link = await screen.findByRole('link', { name: /view transaction/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('txhash1'));
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('omits the explorer link when an event has no tx hash', async () => {
    fetchMock.mockResolvedValue([event({ txHash: null })]);

    render(<EventLogDrawer isOpen onClose={vi.fn()} />);

    await screen.findByText('settle');
    expect(screen.queryByRole('link', { name: /view transaction/i })).not.toBeInTheDocument();
  });

  it('shows an empty state when the contract has no events', async () => {
    fetchMock.mockResolvedValue([]);

    render(<EventLogDrawer isOpen onClose={vi.fn()} />);

    expect(await screen.findByText(/no events yet/i)).toBeInTheDocument();
  });

  it('filters the list by round id', async () => {
    fetchMock.mockResolvedValue([
      event({ id: 'a', roundId: '7' }),
      event({ id: 'b', roundId: '8', name: 'settle_other' }),
    ]);

    render(<EventLogDrawer isOpen onClose={vi.fn()} />);

    await screen.findByText('settle');
    fireEvent.change(screen.getByLabelText(/filter by round id/i), { target: { value: '8' } });

    expect(screen.getByText('settle_other')).toBeInTheDocument();
    expect(screen.queryByText('settle')).not.toBeInTheDocument();
  });

  it('shows a distinct empty state when the round filter matches nothing', async () => {
    fetchMock.mockResolvedValue([event()]);

    render(<EventLogDrawer isOpen onClose={vi.fn()} />);

    await screen.findByText('settle');
    fireEvent.change(screen.getByLabelText(/filter by round id/i), { target: { value: '999' } });

    expect(screen.getByText(/no events for that round/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear filter/i })).toBeInTheDocument();
  });

  it('shows an error state with a retry button when the fetch fails', async () => {
    fetchMock.mockRejectedValue(new Error('rpc down'));

    render(<EventLogDrawer isOpen onClose={vi.fn()} />);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByText(/could not load events/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('closes on Escape and via the close button', async () => {
    fetchMock.mockResolvedValue([]);
    const onClose = vi.fn();

    render(<EventLogDrawer isOpen onClose={onClose} />);
    await screen.findByText(/no events yet/i);

    fireEvent.click(screen.getByRole('button', { name: /close event log/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('filters events to the selected asset and keeps unscoped events', async () => {
    fetchMock.mockResolvedValue([
      event({ id: 'a', name: 'settle', payload: { asset: 'BTC' }, roundId: '1' }),
      event({ id: 'b', name: 'settle', payload: { asset: 'ETH' }, roundId: '2' }),
      event({ id: 'c', name: 'settle', payload: { winner: 'UP' }, roundId: '3' }),
    ]);

    render(<EventLogDrawer isOpen onClose={vi.fn()} selectedAsset="BTC" />);

    expect(await screen.findByText(/round 1/i)).toBeInTheDocument();
    expect(screen.getByText(/round 3/i)).toBeInTheDocument();
    expect(screen.queryByText(/round 2/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'BTC' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('lets the user switch chips and shows all assets', async () => {
    fetchMock.mockResolvedValue([
      event({ id: 'a', payload: { asset: 'BTC' }, roundId: '1' }),
      event({ id: 'b', payload: { asset: 'ETH' }, roundId: '2' }),
    ]);

    render(<EventLogDrawer isOpen onClose={vi.fn()} selectedAsset="BTC" />);
    await screen.findByText(/round 1/i);

    fireEvent.click(screen.getByRole('button', { name: 'ETH' }));
    expect(screen.getByText(/round 2/i)).toBeInTheDocument();
    expect(screen.queryByText(/round 1/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'All assets' }));
    expect(screen.getByText(/round 1/i)).toBeInTheDocument();
    expect(screen.getByText(/round 2/i)).toBeInTheDocument();
  });

  it('follows the asset tab when selectedAsset changes', async () => {
    fetchMock.mockResolvedValue([
      event({ id: 'a', payload: { asset: 'BTC' }, roundId: '1' }),
      event({ id: 'b', payload: { asset: 'ETH' }, roundId: '2' }),
    ]);

    const { rerender } = render(<EventLogDrawer isOpen onClose={vi.fn()} selectedAsset="BTC" />);
    await screen.findByText(/round 1/i);

    rerender(<EventLogDrawer isOpen onClose={vi.fn()} selectedAsset="ETH" />);
    expect(screen.getByText(/round 2/i)).toBeInTheDocument();
    expect(screen.queryByText(/round 1/i)).not.toBeInTheDocument();
  });
});
