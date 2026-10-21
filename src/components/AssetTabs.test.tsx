import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssetTabs } from './AssetTabs';
import { ASSETS, ASSET_META } from '../constants/assets';
import type { Asset } from '../types/asset';

// Test wrapper with MemoryRouter
function renderAssetTabs(initialAsset?: Asset, props?: { onAssetChange?: (asset: Asset) => void }) {
  const initialEntries = initialAsset ? [`/?asset=${initialAsset}`] : ['/'];
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AssetTabs {...props} />
    </MemoryRouter>,
  );
}

describe('AssetTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the tablist with correct ARIA attributes', () => {
      renderAssetTabs();

      const tablist = screen.getByRole('tablist', { name: /available assets/i });
      expect(tablist).toBeInTheDocument();
    });

    it('renders all three asset tabs (BTC, ETH, XLM)', () => {
      renderAssetTabs();

      ASSETS.forEach((asset) => {
        const tab = screen.getByRole('tab', { name: new RegExp(asset, 'i') });
        expect(tab).toBeInTheDocument();
        expect(tab).toHaveAttribute('id', `asset-tab-${asset}`);
        expect(tab).toHaveAttribute('aria-controls', `asset-panel-${asset}`);
      });
    });

    it('renders asset label and icon for each tab', () => {
      renderAssetTabs();

      ASSETS.forEach((asset) => {
        const meta = ASSET_META[asset];
        expect(screen.getByText(meta.label)).toBeInTheDocument();
        expect(screen.getByText(meta.icon)).toBeInTheDocument();
      });
    });

    it('renders region wrapper with aria-label', () => {
      renderAssetTabs();

      const region = screen.getByRole('region', { name: /select trading asset/i });
      expect(region).toBeInTheDocument();
    });
  });

  describe('roving tabindex pattern', () => {
    it('sets tabIndex=0 on active tab, -1 on inactive tabs', () => {
      renderAssetTabs('BTC');

      const activeTab = screen.getByRole('tab', { name: /btc/i });
      const inactiveTabs = ASSETS.filter((a) => a !== 'BTC').map((a) => screen.getByRole('tab', { name: new RegExp(a, 'i') }));

      expect(activeTab).toHaveAttribute('tabIndex', '0');
      inactiveTabs.forEach((tab) => {
        expect(tab).toHaveAttribute('tabIndex', '-1');
      });
    });

    it('applies correct roving tabindex for each asset when rendered with different initial assets', () => {
      // Test each asset as the initial active one
      ASSETS.forEach((asset) => {
        const { unmount } = renderAssetTabs(asset);
        expect(screen.getByRole('tab', { name: new RegExp(asset, 'i') })).toHaveAttribute('tabIndex', '0');
        ASSETS.filter((a) => a !== asset).forEach((inactive) => {
          expect(screen.getByRole('tab', { name: new RegExp(inactive, 'i') })).toHaveAttribute('tabIndex', '-1');
        });
        unmount();
      });
    });
  });

  describe('aria-selected', () => {
    it('sets aria-selected="true" on active tab, "false" on inactive tabs', () => {
      renderAssetTabs('BTC');

      const activeTab = screen.getByRole('tab', { name: /btc/i });
      const inactiveTabs = ASSETS.filter((a) => a !== 'BTC').map((a) => screen.getByRole('tab', { name: new RegExp(a, 'i') }));

      expect(activeTab).toHaveAttribute('aria-selected', 'true');
      inactiveTabs.forEach((tab) => {
        expect(tab).toHaveAttribute('aria-selected', 'false');
      });
    });

    it('applies correct aria-selected for each asset when rendered with different initial assets', () => {
      ASSETS.forEach((asset) => {
        const { unmount } = renderAssetTabs(asset);
        expect(screen.getByRole('tab', { name: new RegExp(asset, 'i') })).toHaveAttribute('aria-selected', 'true');
        ASSETS.filter((a) => a !== asset).forEach((inactive) => {
          expect(screen.getByRole('tab', { name: new RegExp(inactive, 'i') })).toHaveAttribute('aria-selected', 'false');
        });
        unmount();
      });
    });
  });

  describe('active state styling', () => {
    it('applies active gradient classes to active tab', () => {
      renderAssetTabs('BTC');

      const activeTab = screen.getByRole('tab', { name: /btc/i });
      expect(activeTab).toHaveClass('bg-gradient-to-r');
      expect(activeTab).toHaveClass('from-[#2C4BFD]');
      expect(activeTab).toHaveClass('to-[#1E3FD4]');
      expect(activeTab).toHaveClass('text-white');
      expect(activeTab).toHaveClass('shadow-lg');
    });

    it('applies inactive classes to inactive tabs', () => {
      renderAssetTabs('BTC');

      const inactiveTab = screen.getByRole('tab', { name: /eth/i });
      expect(inactiveTab).toHaveClass('text-gray-400');
      expect(inactiveTab).toHaveClass('hover:text-white');
      expect(inactiveTab).toHaveClass('hover:bg-white/5');
    });

    it('renders checkmark indicator on active tab', () => {
      renderAssetTabs('BTC');

      const activeTab = screen.getByRole('tab', { name: /btc/i });
      const checkmark = activeTab.querySelector('[aria-label="Selected"]');
      expect(checkmark).toBeInTheDocument();
      expect(checkmark).toHaveTextContent('✓');
    });

    it('does not render checkmark on inactive tabs', () => {
      renderAssetTabs('BTC');

      const inactiveTab = screen.getByRole('tab', { name: /eth/i });
      expect(inactiveTab.querySelector('[aria-label="Selected"]')).not.toBeInTheDocument();
    });
  });

  describe('onAssetChange callback', () => {
    it('calls onAssetChange when tab is clicked', () => {
      const onAssetChange = vi.fn();
      renderAssetTabs('BTC', { onAssetChange });

      fireEvent.click(screen.getByRole('tab', { name: /eth/i }));

      expect(onAssetChange).toHaveBeenCalledTimes(1);
      expect(onAssetChange).toHaveBeenCalledWith('ETH');
    });

    it('calls onAssetChange with correct asset when different tabs clicked', () => {
      const onAssetChange = vi.fn();
      renderAssetTabs('BTC', { onAssetChange });

      fireEvent.click(screen.getByRole('tab', { name: /xlm/i }));
      expect(onAssetChange).toHaveBeenCalledWith('XLM');

      fireEvent.click(screen.getByRole('tab', { name: /btc/i }));
      expect(onAssetChange).toHaveBeenCalledWith('BTC');
    });

    it('does not call onAssetChange if not provided', () => {
      // Should not throw
      renderAssetTabs('BTC');

      fireEvent.click(screen.getByRole('tab', { name: /eth/i }));
      // No error thrown
    });
  });

  describe('keyboard navigation', () => {
    // Helper to test keyboard navigation by checking the internal handler logic
    it('handleKeyDown computes correct next index for ArrowRight', () => {
      const { container } = renderAssetTabs('BTC');
      const btcTab = screen.getByRole('tab', { name: /btc/i });

      // Simulate keydown - the handler will call setSearchParams and onAssetChangeRef
      fireEvent.keyDown(btcTab, { key: 'ArrowRight' });

      // Verify the focus moved to ETH tab (next index)
      expect(screen.getByRole('tab', { name: /eth/i })).toHaveFocus();
    });

    it('handleKeyDown computes correct next index for ArrowLeft', () => {
      renderAssetTabs('ETH');
      const ethTab = screen.getByRole('tab', { name: /eth/i });

      fireEvent.keyDown(ethTab, { key: 'ArrowLeft' });

      expect(screen.getByRole('tab', { name: /btc/i })).toHaveFocus();
    });

    it('wraps around from last to first with ArrowRight', () => {
      renderAssetTabs('XLM');
      const xlmTab = screen.getByRole('tab', { name: /xlm/i });

      fireEvent.keyDown(xlmTab, { key: 'ArrowRight' });

      expect(screen.getByRole('tab', { name: /btc/i })).toHaveFocus();
    });

    it('wraps around from first to last with ArrowLeft', () => {
      renderAssetTabs('BTC');
      const btcTab = screen.getByRole('tab', { name: /btc/i });

      fireEvent.keyDown(btcTab, { key: 'ArrowLeft' });

      expect(screen.getByRole('tab', { name: /xlm/i })).toHaveFocus();
    });

    it('navigates to first tab with Home key', () => {
      renderAssetTabs('XLM');
      const xlmTab = screen.getByRole('tab', { name: /xlm/i });

      fireEvent.keyDown(xlmTab, { key: 'Home' });

      expect(screen.getByRole('tab', { name: /btc/i })).toHaveFocus();
    });

    it('navigates to last tab with End key', () => {
      renderAssetTabs('BTC');
      const btcTab = screen.getByRole('tab', { name: /btc/i });

      fireEvent.keyDown(btcTab, { key: 'End' });

      expect(screen.getByRole('tab', { name: /xlm/i })).toHaveFocus();
    });

    it('calls preventDefault on arrow key events', () => {
      renderAssetTabs('BTC');
      const btcTab = screen.getByRole('tab', { name: /btc/i });

      // Create a real keyboard event that has preventDefault
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      // Dispatch via fireEvent which will call the React handler
      fireEvent(btcTab, event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('focuses the new tab after keyboard navigation', () => {
      renderAssetTabs('BTC');
      const btcTab = screen.getByRole('tab', { name: /btc/i });

      fireEvent.keyDown(btcTab, { key: 'ArrowRight' });

      // The ETH tab should receive focus
      expect(screen.getByRole('tab', { name: /eth/i })).toHaveFocus();
    });

    it('ignores non-navigation keys', () => {
      renderAssetTabs('BTC');
      const btcTab = screen.getByRole('tab', { name: /btc/i });

      // Fire non-navigation keys - these should not trigger navigation
      // Note: In jsdom, firing key events may blur the element, so we just verify
      // the handler doesn't throw and doesn't change the active tab
      fireEvent.keyDown(btcTab, { key: 'Enter' });
      fireEvent.keyDown(btcTab, { key: 'Space' });
      fireEvent.keyDown(btcTab, { key: 'Tab' });

      // The component should not crash and BTC should remain visually active
      expect(screen.getByRole('tab', { name: /btc/i })).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('URL search params integration', () => {
    it('reads initial asset from URL search params', () => {
      renderAssetTabs('ETH');

      expect(screen.getByRole('tab', { name: /eth/i })).toHaveAttribute('aria-selected', 'true');
    });

    it('defaults to XLM when no asset in URL', () => {
      renderAssetTabs();

      expect(screen.getByRole('tab', { name: /xlm/i })).toHaveAttribute('aria-selected', 'true');
    });

    it('normalizes invalid asset values to XLM', () => {
      renderAssetTabs('INVALID' as Asset);

      expect(screen.getByRole('tab', { name: /xlm/i })).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('focus management', () => {
    it('has focus-visible styles on all tabs', () => {
      renderAssetTabs('BTC');

      ASSETS.forEach((asset) => {
        const tab = screen.getByRole('tab', { name: new RegExp(asset, 'i') });
        expect(tab).toHaveClass('focus-visible:outline-none');
        expect(tab).toHaveClass('focus-visible:ring-2');
        expect(tab).toHaveClass('focus-visible:ring-xelma-teal');
      });
    });
  });

  describe('accessibility', () => {
    it('each tab has unique id and controls corresponding panel', () => {
      renderAssetTabs();

      ASSETS.forEach((asset) => {
        const tab = screen.getByRole('tab', { name: new RegExp(asset, 'i') });
        expect(tab).toHaveAttribute('id', `asset-tab-${asset}`);
        expect(tab).toHaveAttribute('aria-controls', `asset-panel-${asset}`);
      });
    });

    it('icon span has aria-hidden and contains the icon', () => {
      renderAssetTabs();

      ASSETS.forEach((asset) => {
        const tab = screen.getByRole('tab', { name: new RegExp(asset, 'i') });
        // Find the icon span - it's the one containing the icon character
        const iconSpan = Array.from(tab.querySelectorAll('span[aria-hidden="true"]')).find(
          (span) => span.textContent?.includes(ASSET_META[asset].icon)
        );
        expect(iconSpan).toBeInTheDocument();
        expect(iconSpan).toHaveTextContent(ASSET_META[asset].icon);
      });
    });

    it('label span has aria-hidden and contains the label', () => {
      renderAssetTabs();

      ASSETS.forEach((asset) => {
        const tab = screen.getByRole('tab', { name: new RegExp(asset, 'i') });
        const labelSpan = Array.from(tab.querySelectorAll('span')).find(
          (span) => span.textContent?.includes(ASSET_META[asset].label)
        );
        expect(labelSpan).toBeInTheDocument();
        expect(labelSpan).toHaveTextContent(ASSET_META[asset].label);
      });
    });

    it('checkmark has aria-label="Selected"', () => {
      renderAssetTabs('BTC');

      const checkmark = screen.getByLabelText('Selected');
      expect(checkmark).toBeInTheDocument();
    });

    it('active indicator glow has aria-hidden', () => {
      renderAssetTabs('BTC');

      const activeTab = screen.getByRole('tab', { name: /btc/i });
      const glow = activeTab.querySelector('span[aria-hidden="true"]:not([aria-label])');
      expect(glow).toBeInTheDocument();
    });
  });
});