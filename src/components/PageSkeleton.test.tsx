import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PageSkeleton from './PageSkeleton';

describe('PageSkeleton', () => {
  it('renders a status region with a non-empty accessible name', () => {
    render(<PageSkeleton type="dashboard" />);

    expect(screen.getByRole('status', { name: 'Loading page' })).toBeInTheDocument();
  });

  it('renders the loading text for the supplied page type', () => {
    render(<PageSkeleton type="leaderboard" />);

    expect(screen.getByText('Loading leaderboard…')).toBeInTheDocument();
  });

  it('reflects the supplied skeleton type in the card height', () => {
    const { container } = render(<PageSkeleton type="dashboard" />);

    // The dashboard type maps to the tallest card (h-96).
    const card = container.querySelector('.glass-card');
    expect(card).not.toBeNull();
    expect(card!.className).toContain('h-96');
  });

  it('preserves the reduced-motion-friendly spinner class', () => {
    const { container } = render(<PageSkeleton type="learn" />);

    const spinner = screen.getByRole('status');
    expect(spinner.className).toContain('motion-safe:animate-spin');
    expect(container.querySelector('.glass-card')).not.toBeNull();
  });
});