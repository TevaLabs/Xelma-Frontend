import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageSkeleton from './PageSkeleton';

describe('PageSkeleton', () => {
  it('renders a loading spinner', () => {
    render(<PageSkeleton type="dashboard" />);

    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('has status role for accessibility', () => {
    render(<PageSkeleton type="dashboard" />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading page');
  });

  it('displays loading text with the page type', () => {
    render(<PageSkeleton type="dashboard" />);

    expect(screen.getByText('Loading dashboard…')).toBeInTheDocument();
  });

  it('renders different loading text for different page types', () => {
    const { unmount } = render(<PageSkeleton type="leaderboard" />);
    expect(screen.getByText('Loading leaderboard…')).toBeInTheDocument();

    unmount();

    render(<PageSkeleton type="learn" />);
    expect(screen.getByText('Loading learn…')).toBeInTheDocument();
  });

  it('supports dashboard type', () => {
    render(<PageSkeleton type="dashboard" />);
    expect(screen.getByText('Loading dashboard…')).toBeInTheDocument();
  });

  it('supports legacy type', () => {
    render(<PageSkeleton type="legacy" />);
    expect(screen.getByText('Loading legacy…')).toBeInTheDocument();
  });

  it('supports leaderboard type', () => {
    render(<PageSkeleton type="leaderboard" />);
    expect(screen.getByText('Loading leaderboard…')).toBeInTheDocument();
  });

  it('supports learn type', () => {
    render(<PageSkeleton type="learn" />);
    expect(screen.getByText('Loading learn…')).toBeInTheDocument();
  });

  it('supports settings type', () => {
    render(<PageSkeleton type="settings" />);
    expect(screen.getByText('Loading settings…')).toBeInTheDocument();
  });

  it('supports tournament type', () => {
    render(<PageSkeleton type="tournament" />);
    expect(screen.getByText('Loading tournament…')).toBeInTheDocument();
  });

  it('renders full-screen layout', () => {
    const { container } = render(<PageSkeleton type="dashboard" />);

    const fullscreen = container.querySelector('.min-h-screen');
    expect(fullscreen).toBeInTheDocument();
  });

  it('centers content both horizontally and vertically', () => {
    const { container } = render(<PageSkeleton type="dashboard" />);

    const centerContainer = container.querySelector('.flex.items-center.justify-center');
    expect(centerContainer).toBeInTheDocument();
  });

  it('uses glass-card styling', () => {
    const { container } = render(<PageSkeleton type="dashboard" />);

    const glassCard = container.querySelector('.glass-card');
    expect(glassCard).toBeInTheDocument();
  });

  it('has animated spinner', () => {
    const { container } = render(<PageSkeleton type="dashboard" />);

    const spinner = screen.getByRole('status');
    const spinnerElement = spinner as HTMLElement;
    expect(spinnerElement.className).toContain('animate-spin');
  });
});
