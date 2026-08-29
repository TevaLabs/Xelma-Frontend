import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecentActivity from './RecentActivity';
import type { RecentActivityItem } from '../types';

const mockItems: RecentActivityItem[] = [
  { id: '1', asset: 'BTC', result: 'Won', amount: 10, mode: 'updown' },
  { id: '2', asset: 'ETH', result: 'Lost', amount: 5, mode: 'precision' },
  { id: '3', asset: 'XLM', result: 'Won', amount: 20, mode: 'updown' },
];

describe('RecentActivity', () => {
  describe('list render', () => {
    it('renders the section heading', () => {
      render(<RecentActivity items={mockItems} />);
      expect(screen.getByRole('region', { name: /recent predictions/i })).toBeInTheDocument();
    });

    it('renders all items when items are provided', () => {
      render(<RecentActivity items={mockItems} />);
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });

    it('displays asset name for each item', () => {
      render(<RecentActivity items={mockItems} />);
      expect(screen.getByText('BTC')).toBeInTheDocument();
      expect(screen.getByText('ETH')).toBeInTheDocument();
      expect(screen.getByText('XLM')).toBeInTheDocument();
    });

    it('displays "Correct" for Won results', () => {
      render(<RecentActivity items={mockItems} />);
      const correctLabels = screen.getAllByText('Correct');
      expect(correctLabels).toHaveLength(2);
    });

    it('displays "Incorrect" for Lost results', () => {
      render(<RecentActivity items={mockItems} />);
      expect(screen.getByText('Incorrect')).toBeInTheDocument();
    });

    it('displays vXLM amounts for each item', () => {
      render(<RecentActivity items={mockItems} />);
      expect(screen.getByText('10 vXLM')).toBeInTheDocument();
      expect(screen.getByText('5 vXLM')).toBeInTheDocument();
      expect(screen.getByText('20 vXLM')).toBeInTheDocument();
    });

    it('displays the mode in uppercase for each item', () => {
      render(<RecentActivity items={mockItems} />);
      // Two items have mode 'updown', one has 'precision'
      const updownLabels = screen.getAllByText('updown');
      expect(updownLabels).toHaveLength(2);
      expect(screen.getByText('precision')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders empty state when items array is empty', () => {
      render(<RecentActivity items={[]} />);
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('shows "No predictions yet" message when empty', () => {
      render(<RecentActivity items={[]} />);
      expect(screen.getByText(/no predictions yet/i)).toBeInTheDocument();
    });

    it('shows helper text prompting first prediction', () => {
      render(<RecentActivity items={[]} />);
      expect(
        screen.getByText(/make your first prediction to see your activity here/i),
      ).toBeInTheDocument();
    });

    it('has an accessible status region for the empty state', () => {
      render(<RecentActivity items={[]} />);
      expect(
        screen.getByRole('status', { name: /no recent predictions/i }),
      ).toBeInTheDocument();
    });

    it('still renders the section heading when empty', () => {
      render(<RecentActivity items={[]} />);
      expect(screen.getByText('Recent Predictions')).toBeInTheDocument();
    });
  });

  describe('filter chips', () => {
    it('renders all three filter options', () => {
      render(<RecentActivity items={mockItems} />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
      expect(tabs[0]).toHaveTextContent('all');
      expect(tabs[1]).toHaveTextContent('correct');
      expect(tabs[2]).toHaveTextContent('incorrect');
    });

    it('defaults to "all" filter showing all items', () => {
      render(<RecentActivity items={mockItems} />);
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });

    it('filters to show only correct (Won) items when "correct" is selected', () => {
      render(<RecentActivity items={mockItems} />);
      fireEvent.click(screen.getByRole('tab', { name: /^correct/i }));
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
      expect(screen.getByText('BTC')).toBeInTheDocument();
      expect(screen.getByText('XLM')).toBeInTheDocument();
      expect(screen.queryByText('ETH')).not.toBeInTheDocument();
    });

    it('filters to show only incorrect (Lost) items when "incorrect" is selected', () => {
      render(<RecentActivity items={mockItems} />);
      fireEvent.click(screen.getByRole('tab', { name: /^incorrect/i }));
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
      expect(screen.getByText('ETH')).toBeInTheDocument();
      expect(screen.queryByText('BTC')).not.toBeInTheDocument();
      expect(screen.queryByText('XLM')).not.toBeInTheDocument();
    });

    it('shows filter-specific empty message when no items match', () => {
      const allWon: RecentActivityItem[] = [
        { id: '1', asset: 'BTC', result: 'Won', amount: 10, mode: 'updown' },
      ];
      render(<RecentActivity items={allWon} />);
      fireEvent.click(screen.getByRole('tab', { name: /^incorrect/i }));
      expect(screen.getByText(/no incorrect predictions yet/i)).toBeInTheDocument();
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('shows default empty message when items array is empty regardless of filter', () => {
      render(<RecentActivity items={[]} />);
      fireEvent.click(screen.getByRole('tab', { name: /^correct/i }));
      expect(screen.getByText(/no predictions yet/i)).toBeInTheDocument();
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });
  });

  describe('filter count badges', () => {
    it('shows counts reflecting all/correct/incorrect totals', () => {
      render(<RecentActivity items={mockItems} />);
      const tabs = screen.getAllByRole('tab');
      // mockItems: 2 Won, 1 Lost, 3 total
      expect(tabs[0]).toHaveAccessibleName('All (3)');
      expect(tabs[1]).toHaveAccessibleName('Correct (2)');
      expect(tabs[2]).toHaveAccessibleName('Incorrect (1)');
    });

    it('shows zero counts on every chip when items array is empty', () => {
      render(<RecentActivity items={[]} />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveAccessibleName('All (0)');
      expect(tabs[1]).toHaveAccessibleName('Correct (0)');
      expect(tabs[2]).toHaveAccessibleName('Incorrect (0)');
    });

    it('does not exclude Pending or Failed items from the "all" count', () => {
      const mixed: RecentActivityItem[] = [
        ...mockItems,
        { id: '4', asset: 'XLM', result: 'Pending', amount: 8, mode: 'updown' },
        { id: '5', asset: 'BTC', result: 'Failed', amount: 3, mode: 'precision' },
      ];
      render(<RecentActivity items={mixed} />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveAccessibleName('All (5)');
      // Correct/incorrect totals stay based on Won/Lost only
      expect(tabs[1]).toHaveAccessibleName('Correct (2)');
      expect(tabs[2]).toHaveAccessibleName('Incorrect (1)');
    });

    it('keeps counts stable across filter switches (counts reflect totals, not the active filter)', () => {
      render(<RecentActivity items={mockItems} />);
      fireEvent.click(screen.getByRole('tab', { name: /^incorrect/i }));
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveAccessibleName('All (3)');
      expect(tabs[1]).toHaveAccessibleName('Correct (2)');
      expect(tabs[2]).toHaveAccessibleName('Incorrect (1)');
    });
  });

  describe('loading and error states', () => {
    it('renders a loading state with skeletons', () => {
      render(<RecentActivity items={[]} isLoading={true} />);
      expect(screen.getByRole('region', { name: /recent predictions/i })).toHaveAttribute('aria-busy', 'true');
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('renders the error message and retry button when onRetry is provided', () => {
      const onRetry = vi.fn();
      render(<RecentActivity items={[]} error="Failed to load predictions" onRetry={onRetry} />);
      expect(screen.getByText('Failed to load predictions')).toBeInTheDocument();
      const retryBtn = screen.getByRole('button', { name: /retry/i });
      retryBtn.click();
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('omits retry button when no onRetry callback is provided', () => {
      render(<RecentActivity items={[]} error="Failed to load predictions" />);
      expect(screen.getByText('Failed to load predictions')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });
  });
});
