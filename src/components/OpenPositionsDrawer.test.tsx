import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OpenPositionsDrawer, { type OpenPosition } from './OpenPositionsDrawer';

const activeRound = { id: 'round-42', status: 'active' };

const positions: OpenPosition[] = [
  {
    id: 'prediction-1',
    asset: 'BTC',
    direction: 'UP',
    stake: 25,
    potentialPayout: 47.5,
    roundId: 'round-42',
  },
  {
    id: 'prediction-2',
    asset: 'XLM',
    direction: 'DOWN',
    stake: '10',
    exactPrice: '0.42',
  },
];

function renderDrawer(
  props: Partial<React.ComponentProps<typeof OpenPositionsDrawer>> = {},
) {
  return render(
    <MemoryRouter>
      <OpenPositionsDrawer
        isOpen
        onClose={vi.fn()}
        positions={[]}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('OpenPositionsDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders an empty state when there are no open positions', () => {
    renderDrawer({ activeRound });

    expect(screen.getByRole('dialog', { name: /open positions/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No open positions' })).toBeInTheDocument();
    expect(screen.getByText(/active predictions will appear here/i)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: /open prediction positions/i })).not.toBeInTheDocument();
  });

  it('lists position details and uses the active round for a missing position round id', () => {
    renderDrawer({ positions, activeRound });

    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('XLM')).toBeInTheDocument();
    expect(screen.getByText('25 vXLM')).toBeInTheDocument();
    expect(screen.getByText('47.5 vXLM')).toBeInTheDocument();
    expect(screen.getByText('0.42')).toBeInTheDocument();
    expect(screen.getAllByText('Open')).toHaveLength(2);

    const roundLinks = screen.getAllByRole('link', { name: /view round/i });
    expect(roundLinks[0]).toHaveAttribute('href', '/dashboard?round=round-42');
    expect(roundLinks[1]).toHaveAttribute('href', '/dashboard?round=round-42');
  });

  it('has an accessible dialog and description', () => {
    renderDrawer({ positions: [positions[0]] });

    const dialog = screen.getByRole('dialog', { name: /open positions/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-describedby');
    expect(screen.getByText(/track predictions that are still open/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close open positions' })).toBeInTheDocument();
  });

  it('closes from the close button and Escape', async () => {
    const onClose = vi.fn();
    renderDrawer({ onClose });

    fireEvent.click(screen.getByRole('button', { name: 'Close open positions' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(2));
  });

  it('links to the active round from the drawer footer when available', () => {
    renderDrawer({ activeRound });

    expect(screen.getByRole('link', { name: 'View active round' })).toHaveAttribute(
      'href',
      '/dashboard?round=round-42',
    );
  });
});
