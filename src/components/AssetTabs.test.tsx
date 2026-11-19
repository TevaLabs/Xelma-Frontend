import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, useLocation, useSearchParams } from 'react-router-dom';
import AssetTabs from './AssetTabs';
import { ASSETS } from '../constants/assets';
import type { Asset } from '../types/asset';

/** Helper probe to inspect live location and search params inside MemoryRouter */
function LocationProbe() {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  return (
    <div data-testid="location-probe">
      <span data-testid="probe-search">{location.search}</span>
      <span data-testid="probe-asset">{searchParams.get('asset') ?? 'none'}</span>
    </div>
  );
}

function renderAssetTabs(
  initialUrl = '/dashboard',
  props: { onAssetChange?: (asset: Asset) => void; className?: string } = {},
) {
  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <LocationProbe />
      <AssetTabs {...props} />
    </MemoryRouter>,
  );
}

describe('AssetTabs', () => {
  describe('Rendering and ARIA structure', () => {
    it('renders the tablist container and all 3 asset tabs with proper ARIA attributes', () => {
      renderAssetTabs();

      const region = screen.getByRole('region', { name: /select trading asset/i });
      expect(region).toBeInTheDocument();

      const tablist = screen.getByRole('tablist', { name: /available assets/i });
      expect(tablist).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(ASSETS.length);

      // Verify each asset tab has matching id and aria-controls
      ASSETS.forEach((asset) => {
        const tab = screen.getByRole('tab', { name: new RegExp(asset, 'i') });
        expect(tab).toHaveAttribute('id', `asset-tab-${asset}`);
        expect(tab).toHaveAttribute('aria-controls', `asset-panel-${asset}`);
      });
    });

    it('applies custom className to the outer container', () => {
      renderAssetTabs('/dashboard', { className: 'custom-tabs-class' });

      const region = screen.getByRole('region', { name: /select trading asset/i });
      expect(region).toHaveClass('custom-tabs-class');
    });

    it('renders asset labels, symbols, and checkmark indicator for the active tab', () => {
      renderAssetTabs('/dashboard?asset=BTC');

      const btcTab = screen.getByRole('tab', { name: /bitcoin/i });
      expect(btcTab).toHaveAttribute('aria-selected', 'true');
      expect(btcTab).toHaveTextContent('₿');
      expect(btcTab).toHaveTextContent('Bitcoin');
      expect(btcTab).toHaveTextContent('✓');

      const ethTab = screen.getByRole('tab', { name: /ethereum/i });
      expect(ethTab).toHaveAttribute('aria-selected', 'false');
      expect(ethTab).not.toHaveTextContent('✓');
    });
  });

  describe('Initial selection and default asset', () => {
    it('defaults to XLM when no ?asset= query param is provided', () => {
      renderAssetTabs('/dashboard');

      const xlmTab = screen.getByRole('tab', { name: /stellar/i });
      expect(xlmTab).toHaveAttribute('aria-selected', 'true');
      expect(xlmTab).toHaveAttribute('tabindex', '0');

      const btcTab = screen.getByRole('tab', { name: /bitcoin/i });
      expect(btcTab).toHaveAttribute('aria-selected', 'false');
      expect(btcTab).toHaveAttribute('tabindex', '-1');

      // The URL is not polluted if ?asset was omitted
      expect(screen.getByTestId('probe-asset')).toHaveTextContent('none');
      expect(screen.getByTestId('probe-search')).toHaveTextContent('');
    });

    it('activates BTC when ?asset=BTC is in the URL', () => {
      renderAssetTabs('/dashboard?asset=BTC');

      const btcTab = screen.getByRole('tab', { name: /bitcoin/i });
      expect(btcTab).toHaveAttribute('aria-selected', 'true');
      expect(btcTab).toHaveAttribute('tabindex', '0');

      const xlmTab = screen.getByRole('tab', { name: /stellar/i });
      expect(xlmTab).toHaveAttribute('aria-selected', 'false');
      expect(xlmTab).toHaveAttribute('tabindex', '-1');
    });

    it('activates ETH when ?asset=ETH is in the URL', () => {
      renderAssetTabs('/dashboard?asset=ETH');

      const ethTab = screen.getByRole('tab', { name: /ethereum/i });
      expect(ethTab).toHaveAttribute('aria-selected', 'true');
      expect(ethTab).toHaveAttribute('tabindex', '0');
    });

    it('activates XLM when ?asset=XLM is in the URL', () => {
      renderAssetTabs('/dashboard?asset=XLM');

      const xlmTab = screen.getByRole('tab', { name: /stellar/i });
      expect(xlmTab).toHaveAttribute('aria-selected', 'true');
      expect(xlmTab).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Normalizing bad ?asset= query param', () => {
    it('normalizes invalid asset (e.g. ?asset=DOGE) to XLM in URL', async () => {
      renderAssetTabs('/dashboard?asset=DOGE');

      await waitFor(() => {
        expect(screen.getByTestId('probe-asset')).toHaveTextContent('XLM');
      });

      const xlmTab = screen.getByRole('tab', { name: /stellar/i });
      expect(xlmTab).toHaveAttribute('aria-selected', 'true');
    });

    it('normalizes empty asset (e.g. ?asset=) to XLM in URL', async () => {
      renderAssetTabs('/dashboard?asset=');

      await waitFor(() => {
        expect(screen.getByTestId('probe-asset')).toHaveTextContent('XLM');
      });

      const xlmTab = screen.getByRole('tab', { name: /stellar/i });
      expect(xlmTab).toHaveAttribute('aria-selected', 'true');
    });

    it('normalizes lowercase ?asset=btc to ?asset=BTC', async () => {
      renderAssetTabs('/dashboard?asset=btc');

      await waitFor(() => {
        expect(screen.getByTestId('probe-asset')).toHaveTextContent('BTC');
      });

      const btcTab = screen.getByRole('tab', { name: /bitcoin/i });
      expect(btcTab).toHaveAttribute('aria-selected', 'true');
    });

    it('normalizes lowercase ?asset=eth to ?asset=ETH', async () => {
      renderAssetTabs('/dashboard?asset=eth');

      await waitFor(() => {
        expect(screen.getByTestId('probe-asset')).toHaveTextContent('ETH');
      });

      const ethTab = screen.getByRole('tab', { name: /ethereum/i });
      expect(ethTab).toHaveAttribute('aria-selected', 'true');
    });

    it('normalizes lowercase ?asset=xlm to ?asset=XLM', async () => {
      renderAssetTabs('/dashboard?asset=xlm');

      await waitFor(() => {
        expect(screen.getByTestId('probe-asset')).toHaveTextContent('XLM');
      });

      const xlmTab = screen.getByRole('tab', { name: /stellar/i });
      expect(xlmTab).toHaveAttribute('aria-selected', 'true');
    });

    it('preserves other query parameters while normalizing bad ?asset=', async () => {
      renderAssetTabs('/dashboard?round=42&asset=unknown&mode=live');

      await waitFor(() => {
        expect(screen.getByTestId('probe-asset')).toHaveTextContent('XLM');
      });

      const search = screen.getByTestId('probe-search').textContent ?? '';
      expect(search).toContain('round=42');
      expect(search).toContain('mode=live');
      expect(search).toContain('asset=XLM');
      expect(search).not.toContain('asset=unknown');
    });
  });

  describe('Mouse click interactions', () => {
    it('switches the active asset and updates URL when an inactive tab is clicked', () => {
      const onAssetChange = vi.fn();
      renderAssetTabs('/dashboard?asset=XLM', { onAssetChange });

      const btcTab = screen.getByRole('tab', { name: /bitcoin/i });
      fireEvent.click(btcTab);

      expect(btcTab).toHaveAttribute('aria-selected', 'true');
      expect(btcTab).toHaveAttribute('tabindex', '0');
      expect(screen.getByTestId('probe-asset')).toHaveTextContent('BTC');
      expect(onAssetChange).toHaveBeenCalledTimes(1);
      expect(onAssetChange).toHaveBeenCalledWith('BTC');
    });

    it('clicking another tab switches to it and calls onAssetChange', () => {
      const onAssetChange = vi.fn();
      renderAssetTabs('/dashboard?asset=BTC', { onAssetChange });

      const ethTab = screen.getByRole('tab', { name: /ethereum/i });
      fireEvent.click(ethTab);

      expect(ethTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('probe-asset')).toHaveTextContent('ETH');
      expect(onAssetChange).toHaveBeenCalledWith('ETH');
    });

    it('clicking the currently active tab keeps it active without error', () => {
      const onAssetChange = vi.fn();
      renderAssetTabs('/dashboard?asset=BTC', { onAssetChange });

      const btcTab = screen.getByRole('tab', { name: /bitcoin/i });
      fireEvent.click(btcTab);

      expect(btcTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('probe-asset')).toHaveTextContent('BTC');
      expect(onAssetChange).toHaveBeenCalledWith('BTC');
    });
  });

  describe('Keyboard navigation (Arrow/Home/End)', () => {
    it('navigates with ArrowRight and wraps from the last tab to the first tab', () => {
      const onAssetChange = vi.fn();
      renderAssetTabs('/dashboard?asset=BTC', { onAssetChange });

      const tabs = screen.getAllByRole('tab');
      const btcTab = tabs[0];
      const ethTab = tabs[1];
      const xlmTab = tabs[2];

      btcTab.focus();
      expect(document.activeElement).toBe(btcTab);

      // ArrowRight: BTC (0) -> ETH (1)
      fireEvent.keyDown(btcTab, { key: 'ArrowRight' });
      expect(ethTab).toHaveAttribute('aria-selected', 'true');
      expect(document.activeElement).toBe(ethTab);
      expect(screen.getByTestId('probe-asset')).toHaveTextContent('ETH');
      expect(onAssetChange).toHaveBeenLastCalledWith('ETH');

      // ArrowRight: ETH (1) -> XLM (2)
      fireEvent.keyDown(ethTab, { key: 'ArrowRight' });
      expect(xlmTab).toHaveAttribute('aria-selected', 'true');
      expect(document.activeElement).toBe(xlmTab);
      expect(screen.getByTestId('probe-asset')).toHaveTextContent('XLM');
      expect(onAssetChange).toHaveBeenLastCalledWith('XLM');

      // ArrowRight: XLM (2) -> wraps to BTC (0)
      fireEvent.keyDown(xlmTab, { key: 'ArrowRight' });
      expect(btcTab).toHaveAttribute('aria-selected', 'true');
      expect(document.activeElement).toBe(btcTab);
      expect(screen.getByTestId('probe-asset')).toHaveTextContent('BTC');
      expect(onAssetChange).toHaveBeenLastCalledWith('BTC');
    });

    it('navigates with ArrowLeft and wraps from the first tab to the last tab', () => {
      const onAssetChange = vi.fn();
      renderAssetTabs('/dashboard?asset=BTC', { onAssetChange });

      const tabs = screen.getAllByRole('tab');
      const btcTab = tabs[0];
      const ethTab = tabs[1];
      const xlmTab = tabs[2];

      btcTab.focus();

      // ArrowLeft: BTC (0) -> wraps to XLM (2)
      fireEvent.keyDown(btcTab, { key: 'ArrowLeft' });
      expect(xlmTab).toHaveAttribute('aria-selected', 'true');
      expect(document.activeElement).toBe(xlmTab);
      expect(screen.getByTestId('probe-asset')).toHaveTextContent('XLM');
      expect(onAssetChange).toHaveBeenLastCalledWith('XLM');

      // ArrowLeft: XLM (2) -> ETH (1)
      fireEvent.keyDown(xlmTab, { key: 'ArrowLeft' });
      expect(ethTab).toHaveAttribute('aria-selected', 'true');
      expect(document.activeElement).toBe(ethTab);
      expect(screen.getByTestId('probe-asset')).toHaveTextContent('ETH');
      expect(onAssetChange).toHaveBeenLastCalledWith('ETH');

      // ArrowLeft: ETH (1) -> BTC (0)
      fireEvent.keyDown(ethTab, { key: 'ArrowLeft' });
      expect(btcTab).toHaveAttribute('aria-selected', 'true');
      expect(document.activeElement).toBe(btcTab);
      expect(screen.getByTestId('probe-asset')).toHaveTextContent('BTC');
      expect(onAssetChange).toHaveBeenLastCalledWith('BTC');
    });

    it('supports ArrowDown and ArrowUp as alternatives for ArrowRight and ArrowLeft', () => {
      renderAssetTabs('/dashboard?asset=BTC');

      const tabs = screen.getAllByRole('tab');
      const btcTab = tabs[0];
      const ethTab = tabs[1];

      btcTab.focus();

      // ArrowDown acts like ArrowRight: BTC -> ETH
      fireEvent.keyDown(btcTab, { key: 'ArrowDown' });
      expect(ethTab).toHaveAttribute('aria-selected', 'true');
      expect(document.activeElement).toBe(ethTab);

      // ArrowUp acts like ArrowLeft: ETH -> BTC
      fireEvent.keyDown(ethTab, { key: 'ArrowUp' });
      expect(btcTab).toHaveAttribute('aria-selected', 'true');
      expect(document.activeElement).toBe(btcTab);
    });

    it('Home key jumps to the first tab (BTC)', () => {
      const onAssetChange = vi.fn();
      renderAssetTabs('/dashboard?asset=XLM', { onAssetChange });

      const tabs = screen.getAllByRole('tab');
      const btcTab = tabs[0];
      const xlmTab = tabs[2];

      xlmTab.focus();
      fireEvent.keyDown(xlmTab, { key: 'Home' });

      expect(btcTab).toHaveAttribute('aria-selected', 'true');
      expect(document.activeElement).toBe(btcTab);
      expect(screen.getByTestId('probe-asset')).toHaveTextContent('BTC');
      expect(onAssetChange).toHaveBeenCalledWith('BTC');
    });

    it('End key jumps to the last tab (XLM)', () => {
      const onAssetChange = vi.fn();
      renderAssetTabs('/dashboard?asset=BTC', { onAssetChange });

      const tabs = screen.getAllByRole('tab');
      const btcTab = tabs[0];
      const xlmTab = tabs[2];

      btcTab.focus();
      fireEvent.keyDown(btcTab, { key: 'End' });

      expect(xlmTab).toHaveAttribute('aria-selected', 'true');
      expect(document.activeElement).toBe(xlmTab);
      expect(screen.getByTestId('probe-asset')).toHaveTextContent('XLM');
      expect(onAssetChange).toHaveBeenCalledWith('XLM');
    });

    it('ignores unhandled keys without preventing default or switching tabs', () => {
      const onAssetChange = vi.fn();
      renderAssetTabs('/dashboard?asset=BTC', { onAssetChange });

      const btcTab = screen.getByRole('tab', { name: /bitcoin/i });
      btcTab.focus();

      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      btcTab.dispatchEvent(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(btcTab).toHaveAttribute('aria-selected', 'true');
      expect(onAssetChange).not.toHaveBeenCalled();
    });
  });
});
