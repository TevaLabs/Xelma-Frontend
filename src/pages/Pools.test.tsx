import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import Pools from './Pools';

describe('Pools Page', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders the Pools heading', async () => {
      render(<Pools />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Liquidity Pools');
    });

    it('renders the description subtitle', async () => {
      render(<Pools />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      expect(
        screen.getByText(/Transparency and historical stats for all active round pools/i),
      ).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows a loading spinner initially', () => {
      render(<Pools />);

      const spinner = screen.getByLabelText('Loading pools');
      expect(spinner).toBeInTheDocument();
    });

    it('hides the loading spinner after data loads', async () => {
      render(<Pools />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      const spinner = screen.queryByLabelText('Loading pools');
      expect(spinner).toBeNull();
    });
  });

  describe('pool cards', () => {
    it('renders pool cards for BTC, ETH, and XLM', async () => {
      render(<Pools />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      expect(screen.getByRole('heading', { name: 'BTC Pool' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'ETH Pool' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'XLM Pool' })).toBeInTheDocument();
    });

    it('displays total volume for each pool', async () => {
      render(<Pools />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      expect(screen.getAllByText(/total volume/i).length).toBeGreaterThan(0);
    });

    it('renders UP/DOWN pool sections', async () => {
      render(<Pools />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      expect(screen.getAllByText(/UP\/DOWN Pool/i).length).toBeGreaterThan(0);
    });

    it('renders Precision Pool sections', async () => {
      render(<Pools />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      expect(screen.getAllByText(/precision pool/i).length).toBeGreaterThan(0);
    });

    it('renders Historical Yield sections', async () => {
      render(<Pools />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      expect(screen.getAllByText(/historical yield/i).length).toBeGreaterThan(0);
    });
  });

  describe('loaded state', () => {
    it('renders pool data after loading completes', async () => {
      render(<Pools />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      expect(screen.getByRole('heading', { name: 'BTC Pool' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'ETH Pool' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'XLM Pool' })).toBeInTheDocument();
    });
  });

  describe('no network calls', () => {
    it('does not make real fetch calls', () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      render(<Pools />);

      // Pools uses mock data with setTimeout, no fetch
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });
  });
});
