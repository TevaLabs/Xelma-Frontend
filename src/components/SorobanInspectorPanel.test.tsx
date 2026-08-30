import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SorobanInspectorPanel from './SorobanInspectorPanel';
import type { SorobanInspectorSnapshot } from '../lib/xelma-contract';

function snapshot(overrides: Partial<SorobanInspectorSnapshot> = {}): SorobanInspectorSnapshot {
  return {
    source: 'rpc',
    status: 'ok',
    position: { side: 'UP', stake: '500' },
    round: { round_id: 42, pool_up: 1000, pool_down: 400 },
    fields: {
      positionSide: 'UP',
      stake: '500',
      roundId: '42',
      poolSplit: '1000 / 400',
    },
    inspectedAt: '2026-08-25T12:00:00.000Z',
    ...overrides,
  };
}

describe('SorobanInspectorPanel', () => {
  it('renders structured rows instead of a raw JSON dump by default', () => {
    render(<SorobanInspectorPanel inspector={snapshot()} isLoading={false} onRefresh={vi.fn()} />);

    expect(screen.getByText('Position side')).toBeInTheDocument();
    expect(screen.getByText('UP')).toBeInTheDocument();
    expect(screen.getByText('Stake')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('Round ID')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Pool split')).toBeInTheDocument();
    expect(screen.getByText('1000 / 400')).toBeInTheDocument();
    expect(screen.getByText('Last inspected')).toBeInTheDocument();

    // No raw JSON dump visible until the disclosure is opened.
    expect(screen.queryByText(/"source": "rpc"/)).not.toBeInTheDocument();
  });

  it('reveals the raw JSON dump when "View raw JSON" is clicked, and hides it again on toggle', () => {
    render(<SorobanInspectorPanel inspector={snapshot()} isLoading={false} onRefresh={vi.fn()} />);

    const toggle = screen.getByRole('button', { name: /view raw json/i });
    fireEvent.click(toggle);

    expect(screen.getByText(/"source": "rpc"/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hide raw json/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /hide raw json/i }));
    expect(screen.queryByText(/"source": "rpc"/)).not.toBeInTheDocument();
  });

  it('shows the RPC fallback banner and preserves the error message when inspector.error is set', () => {
    render(
      <SorobanInspectorPanel
        inspector={snapshot({ source: 'mock', status: 'error', error: 'RPC unavailable', fields: undefined })}
        isLoading={false}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('RPC fallback: RPC unavailable');
  });

  it('omits the RPC fallback banner when there is no error', () => {
    render(<SorobanInspectorPanel inspector={snapshot()} isLoading={false} onRefresh={vi.fn()} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows a loading skeleton when isLoading is true and there is no data yet', () => {
    render(<SorobanInspectorPanel inspector={null} isLoading onRefresh={vi.fn()} />);

    const busyRegion = screen.getByRole('button', { name: /refresh soroban inspector/i })
      .closest('section')!
      .querySelector('[aria-busy="true"]');
    expect(busyRegion).toBeInTheDocument();
  });

  it('shows an empty state when there is no data and not loading', () => {
    render(
      <SorobanInspectorPanel
        inspector={snapshot({ fields: {}, inspectedAt: undefined })}
        isLoading={false}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByText(/no position data yet/i)).toBeInTheDocument();
  });

  it('calls onRefresh when the refresh button is clicked', () => {
    const onRefresh = vi.fn();
    render(<SorobanInspectorPanel inspector={snapshot()} isLoading={false} onRefresh={onRefresh} />);

    fireEvent.click(screen.getByRole('button', { name: /refresh soroban inspector/i }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('disables the refresh button while loading', () => {
    render(<SorobanInspectorPanel inspector={snapshot()} isLoading onRefresh={vi.fn()} />);

    expect(screen.getByRole('button', { name: /refresh soroban inspector/i })).toBeDisabled();
  });

  it('renders an aria-live region for accessible status updates', () => {
    const { container } = render(
      <SorobanInspectorPanel inspector={snapshot()} isLoading={false} onRefresh={vi.fn()} />,
    );

    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
  });

  it('shows an empty state when inspector is null', () => {
    render(<SorobanInspectorPanel inspector={null} isLoading={false} onRefresh={vi.fn()} />);

    expect(screen.getByText(/no position data yet/i)).toBeInTheDocument();
  });
});
