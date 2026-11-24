import { fireEvent, render as rtlRender, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import Pools from './Pools';
import { server } from '../test/msw/server';
import { errorHandlers } from '../test/msw/handlers';

// Opt into MSW so the page loads pools from fixtures instead of a real backend.
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const loaded = () => screen.findByRole('heading', { name: 'BTC Pool' });
const renderPools = (initialEntry = '/pools') =>
  rtlRender(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Pools />
    </MemoryRouter>,
  );

describe('Pools Page', () => {

  describe('rendering', () => {
    it('renders the Pools heading', async () => {
      renderPools();

      await screen.findByRole('heading', { name: 'XLM Pool' });

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Liquidity Pools');
    });

    it('renders the description subtitle', async () => {
      renderPools();

      await screen.findByRole('heading', { name: 'XLM Pool' });

      expect(
        screen.getByText(/Transparency and historical stats for all active round pools/i),
      ).toBeInTheDocument();
    });

    it('filters pool cards when an asset tab is selected', async () => {
      renderPools();

      await screen.findByRole('heading', { name: 'XLM Pool' });
      fireEvent.click(screen.getByRole('tab', { name: /Bitcoin/i }));

      expect(await screen.findByRole('heading', { name: 'BTC Pool' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'XLM Pool' })).not.toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Bitcoin/i })).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('loading state', () => {
    it('shows a loading spinner initially', () => {
      renderPools();

      const spinner = screen.getByLabelText('Loading pools');
      expect(spinner).toBeInTheDocument();
    });

    it('hides the loading spinner after data loads', async () => {
      renderPools();

      await screen.findByRole('heading', { name: 'XLM Pool' });

      const spinner = screen.queryByLabelText('Loading pools');
      expect(spinner).toBeNull();
    });
  });

  describe('pool cards', () => {
    it('renders the selected asset pool card', async () => {
      renderPools();

      await screen.findByRole('heading', { name: 'XLM Pool' });

      expect(screen.getByRole('heading', { name: 'XLM Pool' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'BTC Pool' })).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'ETH Pool' })).not.toBeInTheDocument();
    });

    it('displays total volume for each pool', async () => {
      renderPools();

      await screen.findByRole('heading', { name: 'XLM Pool' });

      expect(screen.getAllByText(/total volume/i).length).toBeGreaterThan(0);
    });

    it('renders UP/DOWN pool sections', async () => {
      renderPools();

      await screen.findByRole('heading', { name: 'XLM Pool' });

      expect(screen.getAllByText(/UP\/DOWN Pool/i).length).toBeGreaterThan(0);
    });

    it('renders the UP/DOWN pool balance bar with accessible percentages', async () => {
      renderPools('/pools?asset=BTC');

      await loaded();

      expect(screen.getByRole('img', { name: 'Split: 53% UP, 47% DOWN' })).toBeInTheDocument();
    });

    it('renders Precision Pool sections', async () => {
      renderPools();

      await screen.findByRole('heading', { name: 'XLM Pool' });

      expect(screen.getAllByText(/precision pool/i).length).toBeGreaterThan(0);
    });

    it('renders Historical Yield sections', async () => {
      renderPools();

      await screen.findByRole('heading', { name: 'XLM Pool' });

      expect(screen.getAllByText(/historical yield/i).length).toBeGreaterThan(0);
    });
  });

  describe('loaded state', () => {
    it('renders pool data after loading completes', async () => {
      renderPools();

      await screen.findByRole('heading', { name: 'XLM Pool' });

      expect(screen.getByRole('heading', { name: 'XLM Pool' })).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows an error with a retry button when the request fails', async () => {
      server.use(...errorHandlers.pools);
      renderPools();

      expect(await screen.findByText("Couldn't load pools")).toBeInTheDocument();
      expect(screen.getByText('Failed to load pools')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('recovers when retry succeeds', async () => {
      server.use(...errorHandlers.pools);
      renderPools();
      await screen.findByText("Couldn't load pools");

      server.resetHandlers();
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));

      await waitFor(() =>
        expect(screen.getByRole('heading', { name: 'XLM Pool' })).toBeInTheDocument(),
      );
    });
  });
});
