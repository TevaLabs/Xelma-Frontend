import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Leaderboard from './Leaderboard';
import { leaderboardApi } from '../lib/api-client';
import { useWalletStore } from '../store/useWalletStore';

vi.mock('../lib/api-client', () => ({
  leaderboardApi: {
    getLeaderboard: vi.fn(),
  },
}));

vi.mock('../store/useWalletStore', async (importActual) => {
  const actual = await importActual<typeof import('../store/useWalletStore')>();
  return { ...actual, useWalletStore: vi.fn() };
});

function setWalletState() {
  const state = { publicKey: null, status: 'idle' as const };
  vi.mocked(useWalletStore).mockImplementation((selector: any) =>
    typeof selector === 'function' ? selector(state) : state,
  );
}

function renderLeaderboard() {
  return render(
    <MemoryRouter initialEntries={['/leaderboard']}>
      <Leaderboard />
    </MemoryRouter>,
  );
}

/** Renders the Leaderboard and exposes the live query string, which is where
 *  the filter selection actually lands. */
function renderLeaderboardWithLocationSpy() {
  let currentSearch = '';
  function LocationSpy() {
    currentSearch = useLocation().search;
    return null;
  }
  const result = render(
    <MemoryRouter initialEntries={['/leaderboard']}>
      <Leaderboard />
      <LocationSpy />
    </MemoryRouter>,
  );
  return { ...result, search: () => currentSearch };
}

describe('Leaderboard filter tabs — keyboard roving', () => {
  beforeEach(() => {
    setWalletState();
    vi.mocked(leaderboardApi.getLeaderboard).mockResolvedValue([
      { id: '1', username: 'Alice', xlm: 300 },
      { id: '2', username: 'Bob', xlm: 200 },
    ] as never);
  });

  async function renderAndWait() {
    renderLeaderboard();
    await waitFor(() => expect(screen.getByRole('tablist')).toBeInTheDocument());
    return screen.getAllByRole('tab');
  }

  it('exposes a tablist with one tab per filter, matching the ARIA tabs pattern', async () => {
    const tabs = await renderAndWait();
    expect(tabs).toHaveLength(4);
    expect(tabs.map((t) => t.textContent)).toEqual(['all', 'daily', 'weekly', 'monthly']);
  });

  it('only the active tab is tabbable; the rest are removed from the tab order', async () => {
    const tabs = await renderAndWait();

    expect(tabs[0]).toHaveAttribute('tabindex', '0');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    for (const tab of tabs.slice(1)) {
      expect(tab).toHaveAttribute('tabindex', '-1');
      expect(tab).toHaveAttribute('aria-selected', 'false');
    }
  });

  it('ArrowRight moves the roving tabindex, selects the next tab, and moves focus to it', async () => {
    const tabs = await renderAndWait();
    tabs[0].focus();

    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });

    expect(tabs[1]).toHaveFocus();
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('tabindex', '0');
    expect(tabs[0]).toHaveAttribute('tabindex', '-1');
  });

  it('ArrowLeft wraps from the first tab to the last', async () => {
    const tabs = await renderAndWait();
    tabs[0].focus();

    fireEvent.keyDown(tabs[0], { key: 'ArrowLeft' });

    expect(tabs[3]).toHaveFocus();
    expect(tabs[3]).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowRight wraps from the last tab back to the first', async () => {
    const tabs = await renderAndWait();
    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: 'ArrowLeft' }); // now on last tab (monthly)

    fireEvent.keyDown(tabs[3], { key: 'ArrowRight' });

    expect(tabs[0]).toHaveFocus();
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('Home moves to the first tab and End moves to the last', async () => {
    const tabs = await renderAndWait();
    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' }); // now on daily

    fireEvent.keyDown(tabs[1], { key: 'End' });
    expect(tabs[3]).toHaveFocus();
    expect(tabs[3]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(tabs[3], { key: 'Home' });
    expect(tabs[0]).toHaveFocus();
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('ignores unrelated keys and leaves selection unchanged', async () => {
    const tabs = await renderAndWait();
    tabs[0].focus();

    fireEvent.keyDown(tabs[0], { key: 'a' });

    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveFocus();
  });

  it('mouse click still selects a tab directly, unaffected by the keyboard roving logic', async () => {
    const tabs = await renderAndWait();

    fireEvent.click(tabs[2]);

    expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[2]).toHaveAttribute('tabindex', '0');
    expect(tabs[0]).toHaveAttribute('tabindex', '-1');
  });

  it('ArrowDown and ArrowUp rove forward and backward', async () => {
    // Leaderboard also accepts Up/Down (AssetTabs is Left/Right only) so the
    // chips stay operable for users who navigate vertically.
    const tabs = await renderAndWait();
    tabs[0].focus();

    fireEvent.keyDown(tabs[0], { key: 'ArrowDown' });
    expect(tabs[1]).toHaveFocus();
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(tabs[1], { key: 'ArrowUp' });
    expect(tabs[0]).toHaveFocus();
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps exactly one tab tabbable after a full keyboard cycle', async () => {
    const tabs = await renderAndWait();
    tabs[0].focus();

    // Walk forwards through every tab, including the wrap past the end.
    for (let i = 0; i < 4; i += 1) {
      const current = tabs.findIndex((t) => t === document.activeElement);
      fireEvent.keyDown(tabs[current], { key: 'ArrowRight' });

      const tabbable = tabs.filter((t) => t.getAttribute('tabindex') === '0');
      expect(tabbable).toHaveLength(1);
      expect(tabbable[0]).toHaveAttribute('aria-selected', 'true');
      expect(document.activeElement).toBe(tabbable[0]);
    }

    expect(tabs[0]).toHaveFocus();
  });

  it('activates the focused filter with Enter', async () => {
    // Enter/Space activation is native <button> behaviour, not a key handler
    // in the component — so this must go through user-event, which emulates
    // the browser's synthesised click. fireEvent.keyDown never fires one, so a
    // test written that way would assert nothing at all.
    const user = userEvent.setup();
    const tabs = await renderAndWait();

    // Focus a tab *without* selecting it (select a different one via click),
    // so a passing test proves Enter activated the focused chip rather than
    // merely re-confirming the already-selected one.
    tabs[1].focus();
    fireEvent.click(tabs[0]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Enter}');

    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('tabindex', '0');
    expect(tabs[0]).toHaveAttribute('tabindex', '-1');
  });

  it('activates the focused filter with Space', async () => {
    const user = userEvent.setup();
    const tabs = await renderAndWait();

    tabs[3].focus();
    fireEvent.click(tabs[0]);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

    await user.keyboard(' ');

    expect(tabs[3]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[3]).toHaveAttribute('tabindex', '0');
    expect(tabs[0]).toHaveAttribute('tabindex', '-1');
  });

  it('exposes an accessible name and correct tablist wiring for each chip', async () => {
    const tabs = await renderAndWait();

    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveAttribute('aria-label', 'Time range filter');
    // Horizontal orientation, so Left/Right are the expected primary keys.
    expect(tablist).not.toHaveAttribute('aria-orientation', 'vertical');

    for (const tab of tabs) {
      expect(tab.tagName).toBe('BUTTON');
      expect(tab).toHaveAttribute('type', 'button');
    }
  });

  it('applies the filter selection itself, not just focus movement', async () => {
    // Selection is driven by the ?filter= query param, so assert the actual
    // effect rather than only the chip's aria-selected. This is the test that
    // would catch "focus moved but the filter never changed".
    const user = userEvent.setup();
    const { search } = renderLeaderboardWithLocationSpy();
    await waitFor(() => expect(screen.getByRole('tablist')).toBeInTheDocument());

    const tabs = screen.getAllByRole('tab');
    tabs[2].focus();
    await user.keyboard('{Enter}');

    expect(search()).toContain('filter=weekly');
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
  });

  it('starts the roving tabindex on the filter supplied by the URL', async () => {
    // The tab stop must follow the active filter, not always default to the
    // first chip — otherwise a deep-linked ?filter=monthly link is wrong for
    // keyboard users on first Tab.
    render(
      <MemoryRouter initialEntries={['/leaderboard?filter=monthly']}>
        <Leaderboard />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByRole('tablist')).toBeInTheDocument());

    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.getAttribute('tabindex'))).toEqual(['-1', '-1', '-1', '0']);
    expect(tabs[3]).toHaveAttribute('aria-selected', 'true');
  });
});
