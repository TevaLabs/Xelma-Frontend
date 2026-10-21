import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardSkeleton from './DashboardSkeleton';

describe('DashboardSkeleton', () => {
  it('renders with status role for accessibility', () => {
    render(<DashboardSkeleton />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
  });

  it('has aria-label "Loading dashboard"', () => {
    render(<DashboardSkeleton />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading dashboard');
  });

  it('renders with full-screen min-height class', () => {
    const { container } = render(<DashboardSkeleton />);
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
  });

  it('renders glass-card sections', () => {
    const { container } = render(<DashboardSkeleton />);
    const glassCards = container.querySelectorAll('.glass-card');
    expect(glassCards.length).toBeGreaterThanOrEqual(2);
  });

  it('renders with grid layout', () => {
    const { container } = render(<DashboardSkeleton />);
    expect(container.querySelector('.grid')).toBeInTheDocument();
  });

  it('includes decorative aria-hidden elements', () => {
    const { container } = render(<DashboardSkeleton />);
    const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenElements.length).toBeGreaterThan(0);
  });
});
