import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import AssetTabs from './AssetTabs';
import { ASSETS } from '../constants/assets';
import type { Asset } from '../types/asset';

/**
 * Renders AssetTabs inside a MemoryRouter seeded with the given search string
 * and captures every router location change so tests can assert on the
 * rewritten ?asset= query parameter (issue #677).
 */
function renderAssetTabs({
  initialEntry = '/',
  onAssetChange,
}: {
  initialEntry?: string;
  onAssetChange?: (asset: Asset) => void;
} = {}) {
  const locations: Array<ReturnType<typeof useLocation>> = [];

  function LocationProbe() {
    const location = useLocation();
    locations.push(location);
    return null;
  }

  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <LocationProbe />
      <Routes>
        <Route path="*" element={<AssetTabs onAssetChange={onAssetChange} />} />
      </Routes>
    </MemoryRouter>,
  );

  return { locations };
}

/** Returns the ?asset= value of the latest recorded router location. */
function latestAssetParam(locations: Array<ReturnType<typeof useLocation>>): string | null {
  const last = locations[locations.length - 1];
  return new URLSearchParams(last.search).get('asset');
}

function getTab(asset: Asset) {
  return screen.getByRole('tab', { name: new RegExp(`^.*${asset}`, 'i') });
}

describe('AssetTabs', () => {
  describe('URL normalization', () => {
    it('rewrites an invalid ?asset= value to XLM and updates the URL', () => {
      const { locations } = renderAssetTabs({ initialEntry: '/?asset=INVALID' });

      // XLM tab is selected immediately.
      expect(getTab('XLM')).toHaveAttribute('aria-selected', 'true');

      // The normalization effect rewrites the URL with replace semantics.
      expect(latestAssetParam(locations)).toBe('XLM');
    });

    it('leaves a valid ?asset= value untouched (BTC)', () => {
      const { locations } = renderAssetTabs({ initialEntry: '/?asset=BTC' });

      expect(getTab('BTC')).toHaveAttribute('aria-selected', 'true');
      expect(latestAssetParam(locations)).toBe('BTC');
    });

    it('leaves a valid ?asset= value untouched (ETH)', () => {
      const { locations } = renderAssetTabs({ initialEntry: '/?asset=ETH' });

      expect(getTab('ETH')).toHaveAttribute('aria-selected', 'true');
      expect(latestAssetParam(locations)).toBe('ETH');
    });

    it('preserves unrelated search params when normalizing', () => {
      const { locations } = renderAssetTabs({ initialEntry: '/?asset=NOPE&tab=chart' });

      const last = locations[locations.length - 1];
      const params = new URLSearchParams(last.search);
      expect(params.get('asset')).toBe('XLM');
      expect(params.get('tab')).toBe('chart');
    });

    it('defaults to XLM when the asset param is missing entirely', () => {
      const { locations } = renderAssetTabs({ initialEntry: '/' });

      expect(getTab('XLM')).toHaveAttribute('aria-selected', 'true');
      // Missing param does not trigger a URL rewrite.
      expect(latestAssetParam(locations)).toBeNull();
    });
  });

  describe('keyboard navigation', () => {
    it('moves to the next tab with ArrowRight and fires onAssetChange', () => {
      const onAssetChange = vi.fn();
      renderAssetTabs({ initialEntry: '/?asset=XLM', onAssetChange });

      const xlmTab = getTab('XLM');
      xlmTab.focus();
      expect(xlmTab).toHaveFocus();

      fireEvent.keyDown(xlmTab, { key: 'ArrowRight' });

      expect(getTab('BTC')).toHaveAttribute('aria-selected', 'true');
      expect(getTab('BTC')).toHaveFocus();
      expect(onAssetChange).toHaveBeenCalledWith('BTC');
    });

    it('moves to the previous tab with ArrowLeft, wrapping at the first tab', () => {
      const onAssetChange = vi.fn();
      renderAssetTabs({ initialEntry: '/?asset=BTC', onAssetChange });

      const btcTab = getTab('BTC');
      btcTab.focus();

      fireEvent.keyDown(btcTab, { key: 'ArrowLeft' });

      // BTC is index 0, so ArrowLeft wraps to the last asset (XLM).
      expect(getTab('XLM')).toHaveAttribute('aria-selected', 'true');
      expect(getTab('XLM')).toHaveFocus();
      expect(onAssetChange).toHaveBeenCalledWith('XLM');
    });

    it('wraps from the last tab to the first with ArrowRight', () => {
      const onAssetChange = vi.fn();
      renderAssetTabs({ initialEntry: '/?asset=XLM', onAssetChange });

      const xlmTab = getTab('XLM');
      xlmTab.focus();

      fireEvent.keyDown(xlmTab, { key: 'ArrowRight' });

      // XLM is the last asset, so ArrowRight wraps to BTC.
      expect(getTab('BTC')).toHaveAttribute('aria-selected', 'true');
      expect(onAssetChange).toHaveBeenCalledWith('BTC');
    });

    it('jumps to the first tab with Home', () => {
      const onAssetChange = vi.fn();
      renderAssetTabs({ initialEntry: '/?asset=ETH', onAssetChange });

      const ethTab = getTab('ETH');
      ethTab.focus();

      fireEvent.keyDown(ethTab, { key: 'Home' });

      expect(getTab('BTC')).toHaveAttribute('aria-selected', 'true');
      expect(getTab('BTC')).toHaveFocus();
      expect(onAssetChange).toHaveBeenCalledWith('BTC');
    });

    it('jumps to the last tab with End', () => {
      const onAssetChange = vi.fn();
      renderAssetTabs({ initialEntry: '/?asset=ETH', onAssetChange });

      const ethTab = getTab('ETH');
      ethTab.focus();

      fireEvent.keyDown(ethTab, { key: 'End' });

      expect(getTab('XLM')).toHaveAttribute('aria-selected', 'true');
      expect(getTab('XLM')).toHaveFocus();
      expect(onAssetChange).toHaveBeenCalledWith('XLM');
    });

    it('ignores unrelated keys and does not change the selection', () => {
      const onAssetChange = vi.fn();
      renderAssetTabs({ initialEntry: '/?asset=XLM', onAssetChange });

      const xlmTab = getTab('XLM');
      xlmTab.focus();

      fireEvent.keyDown(xlmTab, { key: 'Tab' });

      expect(getTab('XLM')).toHaveAttribute('aria-selected', 'true');
      expect(onAssetChange).not.toHaveBeenCalled();
    });
  });

  describe('click selection and roving tabindex', () => {
    it('selects a tab on click, updates the URL, and fires onAssetChange', () => {
      const onAssetChange = vi.fn();
      const { locations } = renderAssetTabs({ initialEntry: '/?asset=XLM', onAssetChange });

      fireEvent.click(getTab('ETH'));

      expect(getTab('ETH')).toHaveAttribute('aria-selected', 'true');
      expect(latestAssetParam(locations)).toBe('ETH');
      expect(onAssetChange).toHaveBeenCalledWith('ETH');
    });

    it('keeps other params when a tab is clicked', () => {
      const { locations } = renderAssetTabs({ initialEntry: '/?asset=XLM&tab=chart' });

      fireEvent.click(getTab('BTC'));

      const params = new URLSearchParams(locations[locations.length - 1].search);
      expect(params.get('asset')).toBe('BTC');
      expect(params.get('tab')).toBe('chart');
    });

    it('uses roving tabindex: only the active tab is in the tab order', () => {
      renderAssetTabs({ initialEntry: '/?asset=ETH' });

      expect(getTab('ETH')).toHaveAttribute('tabindex', '0');
      expect(getTab('BTC')).toHaveAttribute('tabindex', '-1');
      expect(getTab('XLM')).toHaveAttribute('tabindex', '-1');
    });

    it('exposes each asset through the tablist/tab/tabpanel wiring', () => {
      renderAssetTabs();

      expect(screen.getByRole('tablist', { name: /available assets/i })).toBeInTheDocument();
      for (const asset of ASSETS) {
        expect(getTab(asset)).toHaveAttribute('id', `asset-tab-${asset}`);
        expect(getTab(asset)).toHaveAttribute('aria-controls', `asset-panel-${asset}`);
      }
    });
  });
});
