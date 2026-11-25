import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RouteFallback from './RouteFallback';

describe('RouteFallback', () => {
  it('renders a status region with a non-empty accessible name', () => {
    render(<RouteFallback />);

    const status = screen.getByRole('status', { name: 'Loading page' });
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('role', 'status');
    expect(status).toHaveAttribute('aria-label', 'Loading page');
    expect(status).toHaveAttribute('aria-busy', 'true');
  });

  it('renders the loading text', () => {
    render(<RouteFallback />);

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('preserves the reduced-motion-friendly spinner class', () => {
    render(<RouteFallback />);

    const spinner = screen.getByRole('status');
    expect(spinner.className).toContain('motion-safe:animate-spin');
  });
});