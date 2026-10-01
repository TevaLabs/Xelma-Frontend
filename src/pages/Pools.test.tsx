import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';

import Pools from './Pools';
import { server } from '../test/msw/server';
import { errorHandlers } from '../test/msw/handlers';

// Opt into MSW so the page loads pools from fixtures instead of a real backend.
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const loaded = () => screen.findByRole('heading', { name: 'BTC Pool' });

describe('Pools Page', () => {

  describe('rendering', () => {
    it('renders the Pools heading', async () => {
      render(<Pools />);

      await loaded();

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Liquidity Pools');
    });

    it('renders the description subtitle', async () => {
      render(<Pools />);

      await loaded();

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

      await loaded();

      const spinner = screen.queryByLabelText('Loading pools');
      expect(spinner).toBeNull();
    });
  });

  describe('pool cards', () => {
    it('renders pool cards for BTC, ETH, and XLM', async () => {
      render(<Pools />);

      await loaded();

      expect(screen.getByRole('heading', { name: 'BTC Pool' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'ETH Pool' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'XLM Pool' })).toBeInTheDocument();
    });

    it('displays total volume for each pool', async () => {
      render(<Pools />);

      await loaded();

      expect(screen.getAllByText(/total volume/i).length).toBeGreaterThan(0);
    });

    it('renders UP/DOWN pool sections', async () => {
      render(<Pools />);

      await loaded();

      expect(screen.getAllByText(/UP\/DOWN Pool/i).length).toBeGreaterThan(0);
    });

    it('renders Precision Pool sections', async () => {
      render(<Pools />);

      await loaded();

      expect(screen.getAllByText(/precision pool/i).length).toBeGreaterThan(0);
    });

    it('renders Historical Yield sections', async () => {
      render(<Pools />);

      await loaded();

      expect(screen.getAllByText(/historical yield/i).length).toBeGreaterThan(0);
    });
  });

  describe('loaded state', () => {
    it('renders pool data after loading completes', async () => {
      render(<Pools />);

      await loaded();

      expect(screen.getByRole('heading', { name: 'BTC Pool' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'ETH Pool' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'XLM Pool' })).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows an error with a retry button when the request fails', async () => {
      server.use(...errorHandlers.pools);
      render(<Pools />);

      expect(await screen.findByText("Couldn't load pools")).toBeInTheDocument();
      expect(screen.getByText('Failed to load pools')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('recovers when retry succeeds', async () => {
      server.use(...errorHandlers.pools);
      render(<Pools />);
      await screen.findByText("Couldn't load pools");

      server.resetHandlers();
      screen.getByRole('button', { name: /retry/i }).click();

      await waitFor(() =>
        expect(screen.getByRole('heading', { name: 'BTC Pool' })).toBeInTheDocument(),
      );
    });
  });
});
