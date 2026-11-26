import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NewsRibbon, type NewsItem } from './NewsRibbon';

const customNews: NewsItem[] = [
  { id: 'a', text: 'First custom headline' },
  { id: 'b', text: 'Second custom headline' },
];

describe('NewsRibbon', () => {
  it('renders a labelled region with a polite live announcement', () => {
    render(<NewsRibbon newsItems={customNews} />);

    expect(screen.getByRole('region', { name: /news updates/i })).toBeInTheDocument();

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveTextContent('First custom headline. Second custom headline');
  });

  it('defaults to the built-in headlines', () => {
    render(<NewsRibbon />);

    const firstHeadline = 'Stellar (XLM) surges 12% following major protocol upgrade';
    expect(screen.getAllByText(firstHeadline)).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent(firstHeadline);
  });

  it('duplicates headlines for a seamless marquee but hides the copy from assistive tech', () => {
    const { container } = render(<NewsRibbon newsItems={customNews} />);

    expect(screen.getAllByText('First custom headline')).toHaveLength(2);

    const track = container.querySelector('.news-ribbon__track');
    expect(track).toHaveAttribute('aria-hidden', 'true');

    const duplicateGroup = container.querySelector('.news-ribbon__group--duplicate');
    expect(duplicateGroup).toBeInTheDocument();
    expect(track?.contains(duplicateGroup)).toBe(true);
  });

  it('announces each headline exactly once in the live region', () => {
    render(<NewsRibbon newsItems={customNews} />);

    const liveRegion = screen.getByRole('status');
    expect(liveRegion.querySelectorAll('*')).toHaveLength(0);
    expect(liveRegion.textContent?.match(/First custom headline/g)).toHaveLength(1);
  });

  it('dismisses the ribbon and notifies the onClose callback', () => {
    const onClose = vi.fn();
    render(<NewsRibbon newsItems={customNews} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /close news updates/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('region', { name: /news updates/i })).not.toBeInTheDocument();
  });

  it('dismisses without requiring an onClose callback', () => {
    render(<NewsRibbon newsItems={customNews} />);

    expect(() =>
      fireEvent.click(screen.getByRole('button', { name: /close news updates/i })),
    ).not.toThrow();

    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('renders nothing when there are no news items', () => {
    const onClose = vi.fn();
    const { container } = render(<NewsRibbon newsItems={[]} onClose={onClose} />);

    expect(container).toBeEmptyDOMElement();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('keeps the close control keyboard-focusable and labelled', () => {
    render(<NewsRibbon newsItems={customNews} />);

    const button = screen.getByRole('button', { name: /close news updates/i });
    expect(button).toHaveAttribute('type', 'button');

    button.focus();
    expect(button).toHaveFocus();
  });
});
