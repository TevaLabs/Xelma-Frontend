import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import Pools from './Pools';
import { server, setupMswServer } from '../test/msw/server';
import { errorHandlers } from '../test/msw/handlers';
import { mockPools } from '../test/msw/fixtures/pools';

// The Pools page now fetches `/api/pools` — opt this file into MSW so the
// requests are answered with the pools fixtures instead of a real backend.
setupMswServer();

describe('Pools Page', () => {
  describe('rendering', () => {
    it('renders the Pools heading', async () => {
      render(<Pools />);

      expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Liquidity Pools');
    });

    it('renders the description subtitle', async () => {
      render(<Pools />);

      expect(
        await screen.findByText(/Transparency and historical stats for all active round pools/i),
      ).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows a loading spinner initially', () => {
      render(<Pools />);

      const spinner = screen.getByLabelText('Loading pools');
      expect(spinner).toBeInTheDocument();
    });

    it('hides the loading spinner after the mocked API responds', async () => {
      render(<Pools />);

      await screen.findByRole('heading', { name: 'BTC Pool' });

      expect(screen.queryByLabelText('Loading pools')).toBeNull();
    });
  });

  describe('pool cards (MSW fixtures)', () => {
    it('renders pool cards for BTC, ETH, and XLM from the fixtures', async () => {
      render(<Pools />);

      expect(await screen.findByRole('heading', { name: 'BTC Pool' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'ETH Pool' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'XLM Pool' })).toBeInTheDocument();
    });

    it('displays total volume for each pool', async () => {
      render(<Pools />);

      expect(await screen.findByText('1.25M')).toBeInTheDocument();
      expect(screen.getAllByText(/total volume/i).length).toBe(mockPools.length);
    });

    it('renders UP/DOWN pool sections with the fixture split', async () => {
      render(<Pools />);

      await screen.findByRole('heading', { name: 'BTC Pool' });

      // BTC pool: 450k UP / 850k total → ~53% UP
      expect(screen.getByRole('img', { name: 'Split: 53% UP, 47% DOWN' })).toBeInTheDocument();
    });

    it('renders Precision Pool sections', async () => {
      render(<Pools />);

      await screen.findByRole('heading', { name: 'BTC Pool' });

      expect(screen.getAllByText(/precision pool/i).length).toBe(mockPools.length);
    });

    it('renders Historical Yield sections', async () => {
      render(<Pools />);

      await screen.findByRole('heading', { name: 'BTC Pool' });

      expect(screen.getAllByText(/historical yield/i).length).toBe(mockPools.length);
    });
  });

  describe('error state', () => {
    it('shows the error state when the pools endpoint fails', async () => {
      server.use(...errorHandlers);

      render(<Pools />);

      expect(await screen.findByText("Couldn't load pools")).toBeInTheDocument();
      expect(screen.getByText(/Pools service unavailable/i)).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'BTC Pool' })).not.toBeInTheDocument();
    });

    it('recovers after clicking Retry once the endpoint works again', async () => {
      server.use(...errorHandlers);

      render(<Pools />);
      expect(await screen.findByText("Couldn't load pools")).toBeInTheDocument();

      // Restore the happy-path handler, then retry.
      server.resetHandlers();
      screen.getByRole('button', { name: /retry/i }).click();

      expect(await screen.findByRole('heading', { name: 'BTC Pool' })).toBeInTheDocument();
    });
  });
});
