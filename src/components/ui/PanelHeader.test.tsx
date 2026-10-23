import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import * as PanelHeaderModule from './PanelHeader';
import { PanelHeader } from './PanelHeader';

describe('PanelHeader export surface', () => {
  it('exposes exactly one export — the named PanelHeader, with no default export', () => {
    expect(Object.keys(PanelHeaderModule)).toEqual(['PanelHeader']);
    expect(PanelHeaderModule.PanelHeader).toBe(PanelHeader);
    expect(typeof PanelHeaderModule.PanelHeader).toBe('function');
  });
});

describe('PanelHeader (default variant)', () => {
  it('renders the title as a level-3 heading', () => {
    render(<PanelHeader title="Market Overview" />);

    expect(
      screen.getByRole('heading', { level: 3, name: 'Market Overview' }),
    ).toBeInTheDocument();
  });

  it('renders the subtitle beneath the title', () => {
    render(
      <PanelHeader title="Active Rounds" subtitle="Live prediction markets" />,
    );

    expect(screen.getByText('Live prediction markets')).toBeInTheDocument();
  });

  it('renders the icon and action slots', () => {
    render(
      <PanelHeader
        title="Leaderboard"
        icon={<span data-testid="header-icon">★</span>}
        action={<button>View All</button>}
      />,
    );

    expect(screen.getByTestId('header-icon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View All' })).toBeInTheDocument();
  });

  it('renders the status badge with its label and variant styling', () => {
    render(
      <PanelHeader
        title="Active Rounds"
        status={{ label: 'Live', variant: 'success' }}
      />,
    );

    const badge = screen.getByText('Live');
    expect(badge.className).toContain('bg-emerald-500/15');
    expect(badge.className).toContain('ring-1');
    expect(badge.querySelector('span')?.className).toContain('bg-emerald-500');
  });

  it('omits the status badge when no status is provided', () => {
    render(<PanelHeader title="Active Rounds" />);

    expect(document.querySelector('.rounded-full')).toBeNull();
  });

  it('applies a custom className to the root container', () => {
    const { container } = render(
      <PanelHeader title="Market Overview" className="mb-4" />,
    );

    expect(container.firstElementChild).toHaveClass('mb-4');
  });
});

describe('PanelHeader (hero variant)', () => {
  it('renders the hero headline with subtitle and action', () => {
    render(
      <PanelHeader
        variant="hero"
        title="Welcome to Xelma"
        subtitle="Predict the future of Stellar"
        action={<button>Get started</button>}
      />,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome to Xelma' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Predict the future of Stellar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Get started' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
  });
});
