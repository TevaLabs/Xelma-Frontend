import { render, screen } from '@testing-library/react';
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
