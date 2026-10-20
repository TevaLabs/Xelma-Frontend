import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TipCard } from './TipCard';
import type { Tip } from '../../types/education';

const baseTip: Tip = {
  id: 'tip-1',
  title: 'Pro tip',
  content: 'Watch the pool split before you predict: a lopsided pool pays out more when you are right.',
  category: 'Strategy',
  createdAt: '2026-01-20T09:00:00.000Z',
};

describe('TipCard', () => {
  it('renders the glass tip chrome with title, content and category chip', () => {
    render(<TipCard tip={baseTip} />);

    expect(screen.getByTestId('tip-card')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pro tip' })).toBeInTheDocument();
    expect(screen.getByText(baseTip.content)).toBeInTheDocument();
    expect(screen.getByText('Strategy')).toBeInTheDocument();
    expect(screen.getByText('Daily Alpha')).toBeInTheDocument();
  });

  it('labels the article with its title via aria-labelledby', () => {
    render(<TipCard tip={baseTip} />);

    const card = screen.getByTestId('tip-card');
    const heading = screen.getByRole('heading', { name: 'Pro tip' });
    expect(card).toHaveAttribute('aria-labelledby', heading.id);
    expect(card).toHaveAttribute('aria-labelledby', `tip-title-${baseTip.id}`);
  });

  it('falls back to the Daily Alpha Tip heading when the API omits a title', () => {
    render(<TipCard tip={{ ...baseTip, title: undefined }} />);

    expect(screen.getByRole('heading', { name: 'Daily Alpha Tip' })).toBeInTheDocument();
    expect(screen.getByText(baseTip.content)).toBeInTheDocument();
  });

  it('renders the publication date when createdAt parses', () => {
    const { container } = render(<TipCard tip={baseTip} />);

    const time = container.querySelector('time');
    expect(time).not.toBeNull();
    expect(time).toHaveAttribute('datetime', baseTip.createdAt);
  });

  it('drops the date footer for an unusable createdAt', () => {
    const { container } = render(<TipCard tip={{ ...baseTip, createdAt: 'not-a-date' }} />);

    expect(container.querySelector('time')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Pro tip' })).toBeInTheDocument();
  });

  it('renders no contributor placeholder chrome', () => {
    render(<TipCard tip={baseTip} />);

    expect(screen.queryByText(/Rebuild Tip Card/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/issueHint/i)).not.toBeInTheDocument();
  });
});
