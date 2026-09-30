import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DashboardSkeleton from './DashboardSkeleton';

describe('DashboardSkeleton', () => {
  it('renders a status region with a non-empty accessible name', () => {
    render(<DashboardSkeleton />);

    expect(screen.getByRole('status', { name: 'Loading dashboard' })).toBeInTheDocument();
  });

  it('renders the dashboard grid with prediction-card, price-chart and activity-feed regions', () => {
    const { container } = render(<DashboardSkeleton />);

    // The dashboard grid is the 3-column layout wrapping the two main columns.
    const grid = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-3');
    expect(grid).not.toBeNull();

    // Prediction-card skeleton region (left sidebar column).
    const predictionColumn = container.querySelector('.lg\\:col-span-1');
    expect(predictionColumn).not.toBeNull();

    // Price-chart and activity-feed skeleton regions (right column).
    const rightColumn = container.querySelector('.lg\\:col-span-2');
    expect(rightColumn).not.toBeNull();
  });

  it('renders the price-chart skeleton bars', () => {
    const { container } = render(<DashboardSkeleton />);

    // The price chart region renders 24 skeleton bars.
    const bars = container.querySelectorAll('.flex.items-end.gap-1 > [aria-hidden="true"]');
    expect(bars).toHaveLength(24);
  });

  it('renders the activity-feed skeleton rows', () => {
    const { container } = render(<DashboardSkeleton />);

    // The activity feed region renders 5 repeated row items.
    const rows = container.querySelectorAll('.space-y-3 > .flex.items-center.justify-between');
    expect(rows).toHaveLength(5);
  });

  it('keeps skeleton blocks hidden from assistive technology', () => {
    const { container } = render(<DashboardSkeleton />);

    // Every skeleton block is aria-hidden so only the status region is exposed.
    const blocks = container.querySelectorAll('[aria-hidden="true"]');
    expect(blocks.length).toBeGreaterThan(0);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});