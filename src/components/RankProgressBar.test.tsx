import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import RankProgressBar from './RankProgressBar';

describe('<RankProgressBar />', () => {
  afterEach(() => cleanup());

  describe('rank tiers', () => {
    it('shows the current rank badge, XP total, and next-tier copy', () => {
      render(<RankProgressBar xp={410} />);

      expect(screen.getByText('Rank')).toBeInTheDocument();
      expect(screen.getByText('Rookie')).toBeInTheDocument();
      expect(screen.getByText('410 XP')).toBeInTheDocument();
      // Copy is split across nested spans, so match on the paragraph's full text
      expect(
        screen.getByText((_, element) => element?.textContent === '410 / 500 XP to Trader'),
      ).toBeInTheDocument();
    });

    it('reflects xp correctly across tiers', () => {
      const { rerender } = render(<RankProgressBar xp={410} />);
      // 410 of 500 XP into Rookie -> 82%
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '82');

      rerender(<RankProgressBar xp={1500} />);
      // 500 of 1000 XP into Analyst -> 50%
      expect(screen.getByText('Analyst')).toBeInTheDocument();
      expect(screen.getByText('Strategist')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    });

    it('starts a newly reached tier at 0% progress', () => {
      render(<RankProgressBar xp={500} />);

      expect(screen.getByText('Trader')).toBeInTheDocument();
      expect(screen.getByText('Analyst')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    });
  });

  describe('max rank', () => {
    it('handles max rank with a complete progress bar and max-rank copy', () => {
      render(<RankProgressBar xp={8500} />);

      expect(screen.getByText('Legend')).toBeInTheDocument();
      expect(screen.getByText(/maximum rank reached/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    });

    it('does not expose a degenerate 0/0 range exactly at the max threshold', () => {
      render(<RankProgressBar xp={8000} />);

      const bar = screen.getByRole('progressbar');
      expect(bar).toHaveAttribute('aria-valuenow', '100');
      expect(bar).toHaveAttribute('aria-valuemax', '100');
    });
  });

  describe('accessibility', () => {
    it('exposes accessible progressbar semantics with a 0-100 range', () => {
      render(<RankProgressBar xp={410} />);

      const bar = screen.getByRole('progressbar');
      expect(bar).toHaveAttribute('aria-valuemin', '0');
      expect(bar).toHaveAttribute('aria-valuemax', '100');
      expect(bar).toHaveAttribute('aria-valuenow', '82');
      expect(bar).toHaveAccessibleName(/XP progress toward Trader: 82%/i);
    });

    it('labels the max-rank progressbar as complete', () => {
      render(<RankProgressBar xp={8500} />);

      expect(screen.getByRole('progressbar')).toHaveAccessibleName(/maximum rank reached/i);
    });
  });
});