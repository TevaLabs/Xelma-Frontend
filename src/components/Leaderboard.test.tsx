import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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
});
