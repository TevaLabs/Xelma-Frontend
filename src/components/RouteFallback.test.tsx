import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RouteFallback from './RouteFallback';

describe('RouteFallback', () => {
  it('renders a loading spinner', () => {
    render(<RouteFallback />);

    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading page');
  });

  it('displays loading text', () => {
    render(<RouteFallback />);

    expect(screen.getByText(/Loading…/)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<RouteFallback />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading page');
  });

  it('renders with full-screen layout', () => {
    const { container } = render(<RouteFallback />);

    const mainContainer = container.querySelector('.min-h-screen');
    expect(mainContainer).toBeInTheDocument();
  });

  it('centers content both horizontally and vertically', () => {
    const { container } = render(<RouteFallback />);

    const centerContainer = container.querySelector('.flex.items-center.justify-center');
    expect(centerContainer).toBeInTheDocument();
  });
});
