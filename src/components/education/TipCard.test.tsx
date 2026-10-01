import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TipCard } from './TipCard';
import type { Tip } from '../../types/education';

function makeTip(overrides: Partial<Tip> = {}): Tip {
  return {
    id: 'tip-1',
    title: 'Watch the pool split',
    content: 'A lopsided UP/DOWN pool often signals where the crowd expects price to move next.',
    category: 'strategy',
    createdAt: '2026-09-29T12:00:00.000Z',
    ...overrides,
  };
}

describe('TipCard', () => {
  it('renders the tip title and content', () => {
    render(<TipCard tip={makeTip()} />);

    expect(screen.getByText('Watch the pool split')).toBeInTheDocument();
    expect(
      screen.getByText(/A lopsided UP\/DOWN pool often signals/i),
    ).toBeInTheDocument();
  });

  it('falls back to a default title when the tip has none', () => {
    render(<TipCard tip={makeTip({ title: undefined })} />);

    expect(screen.getByText('Daily Alpha Tip')).toBeInTheDocument();
  });

  it('dismiss button hides the card', () => {
    render(<TipCard tip={makeTip()} />);

    expect(screen.getByText('Watch the pool split')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /dismiss daily tip/i }));

    expect(screen.queryByText('Watch the pool split')).not.toBeInTheDocument();
  });

  it('calls an optional onDismiss callback when dismissed', () => {
    const onDismiss = vi.fn();
    render(<TipCard tip={makeTip()} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole('button', { name: /dismiss daily tip/i }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('truncates long content behind a "Read more" toggle and expands on click', () => {
    const longContent = 'X'.repeat(250);
    render(<TipCard tip={makeTip({ content: longContent })} />);

    const readMore = screen.getByRole('button', { name: /read more/i });
    expect(readMore).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(/X+…/)).toBeInTheDocument();

    fireEvent.click(readMore);

    expect(screen.getByRole('button', { name: /show less/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(longContent)).toBeInTheDocument();
  });

  it('does not show a "Read more" toggle for short content', () => {
    render(<TipCard tip={makeTip({ content: 'Short tip.' })} />);

    expect(screen.queryByRole('button', { name: /read more/i })).not.toBeInTheDocument();
  });

  it('renders no placeholder/stub markup', () => {
    render(<TipCard tip={makeTip()} />);

    expect(screen.queryByText(/contributor task/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/rebuild tip card/i)).not.toBeInTheDocument();
  });

  it('applies an accessible labelled-by relationship between the article and its title', () => {
    render(<TipCard tip={makeTip()} />);

    const heading = screen.getByText('Watch the pool split');
    const article = heading.closest('article');
    expect(article).toHaveAttribute('aria-labelledby', heading.id);
  });
});
