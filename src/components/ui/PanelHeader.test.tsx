import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DefaultPanelHeader, { PanelHeader } from './PanelHeader';

describe('PanelHeader (canonical)', () => {
  it('exposes the same component as named and default export', () => {
    expect(DefaultPanelHeader).toBe(PanelHeader);
  });

  it('renders title as an h3 by default with optional subtitle', () => {
    render(<PanelHeader title="Your Record" subtitle="All time" />);

    expect(screen.getByRole('heading', { level: 3, name: 'Your Record' })).toBeInTheDocument();
    expect(screen.getByText('All time')).toBeInTheDocument();
  });

  it('respects headingLevel', () => {
    render(<PanelHeader title="Soroban Inspector" headingLevel={2} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Soroban Inspector' })).toBeInTheDocument();
  });

  it('renders icon, action slot and className', () => {
    const { container } = render(
      <PanelHeader
        className="mb-4"
        title="XLM/USD"
        icon={<span data-testid="icon">XLM</span>}
        action={<button type="button">Export</button>}
      />,
    );

    expect(container.firstChild).toHaveClass('mb-4');
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });

  it('accepts the legacy `actions` prop as an alias of `action`', () => {
    render(<PanelHeader title="Legacy" actions={<button type="button">Legacy action</button>} />);

    expect(screen.getByRole('button', { name: 'Legacy action' })).toBeInTheDocument();
  });

  it('prefers `action` over `actions` when both are given', () => {
    render(
      <PanelHeader
        title="Both"
        action={<button type="button">Primary</button>}
        actions={<button type="button">Legacy</button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Legacy' })).not.toBeInTheDocument();
  });

  it('renders a status pill with variant styling and a decorative dot', () => {
    render(<PanelHeader title="Inspector" status={{ label: 'Live', variant: 'success' }} />);

    const pill = screen.getByTestId('panel-header-status');
    expect(pill).toHaveTextContent('Live');
    expect(pill.className).toContain('emerald');
    expect(pill.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('falls back to the default status variant', () => {
    render(<PanelHeader title="Inspector" status={{ label: 'Idle' }} />);

    expect(screen.getByTestId('panel-header-status').className).toContain('gray');
  });

  it('renders the hero variant as a centered h1 with action', () => {
    render(
      <PanelHeader
        variant="hero"
        title="Leaderboard"
        subtitle="Top traders"
        action={<div role="tablist" aria-label="Time range filter" />}
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Leaderboard' })).toBeInTheDocument();
    expect(screen.getByText('Top traders')).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Time range filter' })).toBeInTheDocument();
  });

  it('does not render a status pill in the hero variant', () => {
    render(<PanelHeader variant="hero" title="Hero" status={{ label: 'Live' }} />);

    expect(screen.queryByTestId('panel-header-status')).not.toBeInTheDocument();
  });
});

describe('PanelHeader consolidation guard', () => {
  it('keeps a single implementation (no root-level src/components/PanelHeader.tsx)', () => {
    const duplicate = resolve(process.cwd(), 'src/components/PanelHeader.tsx');
    expect(existsSync(duplicate)).toBe(false);
  });
});
