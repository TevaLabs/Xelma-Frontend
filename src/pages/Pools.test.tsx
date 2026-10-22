import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  describe('asset tabs', () => {
    it('renders a tab for BTC, ETH, and XLM', async () => {
      render(<Pools />);

      await loaded();

      expect(screen.getByRole('tablist', { name: /pool assets/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /BTC/ })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /ETH/ })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /XLM/ })).toBeInTheDocument();
    });

    it('selects the first pool and labels its panel with the active tab', async () => {
      render(<Pools />);

      await loaded();

      expect(screen.getByRole('tab', { name: /BTC/ })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: /ETH/ })).toHaveAttribute('aria-selected', 'false');

      const panel = screen.getByRole('tabpanel');
      expect(panel).toHaveAttribute('aria-labelledby', 'pool-tab-BTC');
    });

    it('switches the visible pool when another asset tab is clicked', async () => {
      render(<Pools />);

      await loaded();

      fireEvent.click(screen.getByRole('tab', { name: /ETH/ }));

      expect(screen.getByRole('heading', { name: 'ETH Pool' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'BTC Pool' })).not.toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /ETH/ })).toHaveAttribute('aria-selected', 'true');
    });

    it('moves between tabs with arrow keys and wraps at the ends', async () => {
      render(<Pools />);

      await loaded();

      const btcTab = screen.getByRole('tab', { name: /BTC/ });
      btcTab.focus();

      fireEvent.keyDown(btcTab, { key: 'ArrowRight' });
      expect(screen.getByRole('tab', { name: /ETH/ })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('heading', { name: 'ETH Pool' })).toBeInTheDocument();

      const ethTab = screen.getByRole('tab', { name: /ETH/ });
      fireEvent.keyDown(ethTab, { key: 'ArrowLeft' });
      expect(screen.getByRole('tab', { name: /BTC/ })).toHaveAttribute('aria-selected', 'true');

      fireEvent.keyDown(screen.getByRole('tab', { name: /BTC/ }), { key: 'ArrowLeft' });
      expect(screen.getByRole('tab', { name: /XLM/ })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('heading', { name: 'XLM Pool' })).toBeInTheDocument();
    });
  });

  describe('pool detail', () => {
    it('displays total volume for the selected pool', async () => {
      render(<Pools />);

      await loaded();

      expect(screen.getByText('Total volume')).toBeInTheDocument();
      expect(screen.getAllByText('1.25M').length).toBeGreaterThan(0);
    });

    it('renders UP/DOWN versus precision allocation bars', async () => {
      render(<Pools />);

      await loaded();

      expect(screen.getByText('UP/DOWN vs Precision')).toBeInTheDocument();
      expect(
        screen.getByRole('img', { name: /Allocation: 68% UP\/DOWN pool, 32% precision pool/i }),
      ).toBeInTheDocument();
    });

    it('renders UP/DOWN and Precision pool sections', async () => {
      render(<Pools />);

      await loaded();

      expect(screen.getByRole('heading', { name: 'UP/DOWN Pool' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Precision Pool' })).toBeInTheDocument();
      expect(screen.getByRole('img', { name: /UP\/DOWN split: 53% UP, 47% DOWN/i })).toBeInTheDocument();
    });

    it('renders the historical yield callout', async () => {
      render(<Pools />);

      await loaded();

      expect(screen.getByRole('heading', { name: 'Historical Yield' })).toBeInTheDocument();
      expect(screen.getByText('+4.2%')).toBeInTheDocument();
      expect(screen.queryByText(/highest this cycle/i)).not.toBeInTheDocument();
    });

    it('shows the highest yield badge only on the top-yielding pool', async () => {
      render(<Pools />);

      await loaded();

      fireEvent.click(screen.getByRole('tab', { name: /XLM/ }));

      expect(screen.getByText('+5.1%')).toBeInTheDocument();
      expect(screen.getByText(/highest this cycle/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('tab', { name: /ETH/ }));

      expect(screen.queryByText(/highest this cycle/i)).not.toBeInTheDocument();
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
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));

      await waitFor(() =>
        expect(screen.getByRole('heading', { name: 'BTC Pool' })).toBeInTheDocument(),
      );
    });
  });
});
