import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TipCard } from './TipCard';
import type { Tip } from '../../types/education';

const baseTip: Tip = {
  id: 'tip-42',
  title: 'Read the funding rate',
  content: 'Funding rates often flip before spot price does. Watch the divergence.',
  category: 'Strategy',
  createdAt: '2026-03-05T12:00:00.000Z',
};

describe('TipCard', () => {
  it('renders the tip title, content, category and created date', () => {
    render(<TipCard tip={baseTip} />);

    const heading = screen.getByRole('heading', { level: 3, name: /read the funding rate/i });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveAttribute('id', 'tip-title-tip-42');

    expect(screen.getByText(/funding rates often flip/i)).toBeInTheDocument();
    expect(screen.getByText('Strategy')).toBeInTheDocument();
    expect(screen.getByText('Mar 5, 2026')).toBeInTheDocument();
    expect(screen.getByText('Mar 5, 2026').closest('time')).toHaveAttribute(
      'datetime',
      baseTip.createdAt,
    );
  });

  it('labels the article with the tip heading', () => {
    const { container } = render(<TipCard tip={baseTip} />);

    const article = container.querySelector('article');
    expect(article).toHaveAttribute('aria-labelledby', 'tip-title-tip-42');
  });

  it('uses the glass-card surface with the teal accent', () => {
    const { container } = render(<TipCard tip={baseTip} />);

    const article = container.querySelector('article');
    expect(article).toHaveClass('glass-card');
    expect(article).toHaveClass('accent-border-teal');
  });

  it('falls back to a default heading when the tip has no title', () => {
    render(<TipCard tip={{ ...baseTip, title: undefined }} />);

    expect(
      screen.getByRole('heading', { level: 3, name: /daily alpha tip/i }),
    ).toBeInTheDocument();
  });

  it('omits optional category and date elements when absent', () => {
    const { container } = render(
      <TipCard
        tip={{ id: 'tip-bare', content: 'Stay patient.', createdAt: '' }}
      />,
    );

    expect(screen.queryByText('Strategy')).not.toBeInTheDocument();
    expect(container.querySelector('time')).not.toBeInTheDocument();
    expect(screen.getByText('Stay patient.')).toBeInTheDocument();
  });

  it('ignores an invalid created date instead of rendering Invalid Date', () => {
    const { container } = render(
      <TipCard tip={{ ...baseTip, createdAt: 'not-a-date' }} />,
    );

    expect(container.querySelector('time')).not.toBeInTheDocument();
    expect(screen.queryByText(/invalid date/i)).not.toBeInTheDocument();
  });

  it('renders an accessible loading skeleton and hides tip content', () => {
    render(<TipCard tip={baseTip} isLoading />);

    const status = screen.getByRole('status', { name: /loading daily tip/i });
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText(/loading daily tip/i, { selector: '.sr-only' })).toBeInTheDocument();
    expect(screen.queryByText(baseTip.content)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
  });

  it('renders the empty state when no tip is available', () => {
    render(<TipCard tip={null} />);

    expect(screen.getByRole('heading', { level: 3, name: /no tip today/i })).toBeInTheDocument();
    expect(screen.getByText(/check back soon/i)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders the empty state when the tip prop is omitted', () => {
    render(<TipCard />);

    expect(screen.getByRole('heading', { name: /no tip today/i })).toBeInTheDocument();
  });

  it('applies caller-supplied className to every state', () => {
    const { container, rerender } = render(<TipCard tip={baseTip} className="extra-class" />);

    expect(container.querySelector('article')).toHaveClass('extra-class');

    rerender(<TipCard tip={null} className="extra-class" />);
    expect(container.querySelector('article')).toHaveClass('extra-class');

    rerender(<TipCard isLoading className="extra-class" />);
    expect(container.querySelector('article')).toHaveClass('extra-class');
  });
});
