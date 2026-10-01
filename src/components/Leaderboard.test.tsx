import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Leaderboard from './Leaderboard';
import { leaderboardApi, type LeaderboardEntry } from '../lib/api-client';
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

// jsdom provides no layout metrics, so the real useVirtualizer can render zero
// rows. Stub only the two functions the component calls, driven by the count
// it passes — keeping the suite deterministic without mocking the component.
const { useVirtualizerMock } = vi.hoisted(() => ({
  useVirtualizerMock: vi.fn(() => ({
    getVirtualItems: () => [],
    getTotalSize: () => 0,
  })),
}));

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: useVirtualizerMock,
}));

function setWalletState(overrides: { publicKey?: string | null; status?: string } = {}) {
  const state = { publicKey: null, status: 'idle' as const, ...overrides };
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

const LEADERBOARD_FIXTURE: LeaderboardEntry[] = [
  { id: 'user-1', username: 'Alice', xlm: 12000 },
  { id: 'user-2', username: 'Bob', xlm: 8500 },
  { id: 'user-3', username: 'Carol', xlm: 5000 },
  { id: 'user-4', username: 'Dave', xlm: 2400 },
  { id: 'user-5', username: 'Eve', xlm: 900 },
  { id: 'user-6', username: 'Frank', xlm: 300 },
];

/** Renders every virtualised row so list content is assertable in jsdom. */
function mockVirtualizerWithAllRows() {
  useVirtualizerMock.mockImplementation((opts: { count: number }) => {
    const { count } = opts;
    return {
      getVirtualItems: () =>
        Array.from({ length: count }, (_, index) => ({
          index,
          start: index * 80,
          size: 80,
          key: `virtual-${index}`,
        })),
      getTotalSize: () => count * 80,
    };
  });
}

/** Probe that exposes the live `filter` search param for URL-sync assertions. */
function FilterProbe() {
  const [params] = useSearchParams();
  return <span data-testid="filter-probe">{params.get('filter') ?? 'none'}</span>;
}

let resolveLeaderboard: ((value: LeaderboardEntry[]) => void) | undefined;
let rejectLeaderboard: ((reason?: unknown) => void) | undefined;

/** Keeps the leaderboard request pending until the test resolves it. */
function mockPendingLeaderboard() {
  vi.mocked(leaderboardApi.getLeaderboard).mockImplementation(
    () =>
      new Promise<LeaderboardEntry[]>((resolve, reject) => {
        resolveLeaderboard = resolve;
        rejectLeaderboard = reject;
      }),
  );
}

describe('Leaderboard filter tabs — keyboard roving', () => {
  beforeEach(() => {
    setWalletState();
    vi.mocked(leaderboardApi.getLeaderboard).mockResolvedValue([
      { id: '1', username: 'Alice', xlm: 300 },
      { id: '2', username: 'Bob', xlm: 200 },
    ] as never);
    useVirtualizerMock.mockReset();
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

describe('Leaderboard data states', () => {
  beforeEach(() => {
    setWalletState();
    useVirtualizerMock.mockReset();
  });

  it('shows the loading state while the leaderboard request is pending', async () => {
    mockPendingLeaderboard();
    renderLeaderboard();

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading leaderboard...')).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(leaderboardApi.getLeaderboard).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveLeaderboard?.([]);
    });
  });

  it('renders the podium and ranked list once the API resolves', async () => {
    mockVirtualizerWithAllRows();
    vi.mocked(leaderboardApi.getLeaderboard).mockResolvedValue(LEADERBOARD_FIXTURE);

    renderLeaderboard();

    // Podium: top 3 by xlm, in rank order.
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Carol')).toBeInTheDocument();
    expect(screen.getByLabelText('Top three leaderboard podium')).toBeInTheDocument();

    // Ranked list: every remaining user is rendered by the virtualized list.
    const list = screen.getByLabelText('Leaderboard ranked list');
    expect(within(list).getByText('Dave')).toBeInTheDocument();
    expect(within(list).getByText('Eve')).toBeInTheDocument();
    expect(within(list).getByText('Frank')).toBeInTheDocument();

    // Values are formatted with the app's vXLM formatter.
    expect(screen.getByText('12.00K vXLM')).toBeInTheDocument();
    expect(within(list).getByText('2.40K vXLM')).toBeInTheDocument();

    // Loading UI is gone once data arrives.
    expect(screen.queryByText('Loading leaderboard...')).not.toBeInTheDocument();
  });

  it('shows the error state and recovers via retry', async () => {
    mockVirtualizerWithAllRows();
    vi.mocked(leaderboardApi.getLeaderboard)
      .mockRejectedValueOnce(new Error('Network failure'))
      .mockResolvedValueOnce(LEADERBOARD_FIXTURE);

    renderLeaderboard();

    expect(await screen.findByText('Network failure')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(leaderboardApi.getLeaderboard).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('renders the empty state when the API returns no entries', async () => {
    vi.mocked(leaderboardApi.getLeaderboard).mockResolvedValue([]);

    renderLeaderboard();

    expect(await screen.findByText('No leaderboard data yet')).toBeInTheDocument();
  });
});

describe('Leaderboard URL filter synchronization', () => {
  beforeEach(() => {
    setWalletState();
    useVirtualizerMock.mockReset();
    vi.mocked(leaderboardApi.getLeaderboard).mockResolvedValue([]);
  });

  it('recognizes a valid filter from the URL and marks the matching tab active', async () => {
    render(
      <MemoryRouter initialEntries={['/leaderboard?filter=daily']}>
        <Leaderboard />
      </MemoryRouter>,
    );

    const tabs = await screen.findAllByRole('tab');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('tabindex', '0');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('falls back to "all" for an unknown filter value', async () => {
    render(
      <MemoryRouter initialEntries={['/leaderboard?filter=hourly']}>
        <Leaderboard />
      </MemoryRouter>,
    );

    const tabs = await screen.findAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('tabindex', '0');
  });

  it('updates the URL search params when a filter tab is selected', async () => {
    render(
      <MemoryRouter initialEntries={['/leaderboard']}>
        <FilterProbe />
        <Leaderboard />
      </MemoryRouter>,
    );

    const tabs = await screen.findAllByRole('tab');
    expect(screen.getByTestId('filter-probe')).toHaveTextContent('none');

    fireEvent.click(tabs[2]); // weekly

    expect(screen.getByTestId('filter-probe')).toHaveTextContent('weekly');
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
  });
});

describe('Leaderboard wallet sticky row', () => {
  beforeEach(() => {
    useVirtualizerMock.mockReset();
    vi.mocked(leaderboardApi.getLeaderboard).mockResolvedValue(LEADERBOARD_FIXTURE);
  });

  it('shows the wallet summary when connected and the wallet appears on the board', async () => {
    setWalletState({ publicKey: 'user-4', status: 'connected' });
    mockVirtualizerWithAllRows();
    renderLeaderboard();

    expect(await screen.findByText('Current wallet summary')).toBeInTheDocument();
    const summary = screen.getByText('Current wallet summary').closest('.lg\\:sticky')!;
    expect(within(summary).getByText('Dave')).toBeInTheDocument();
    expect(within(summary).getByText('Rank #4')).toBeInTheDocument();
    expect(within(summary).getByText('2.40K vXLM')).toBeInTheDocument();
  });

  it('shows an unranked summary when connected but the wallet is not on the board', async () => {
    setWalletState({ publicKey: 'GUNRANKED7WALLET7ONLY7FOR7TESTS7AAAAAAAAAAAAAAAAAAAAA', status: 'connected' });
    renderLeaderboard();

    expect(await screen.findByText('Current wallet summary')).toBeInTheDocument();
    expect(screen.getByText('Unranked')).toBeInTheDocument();
  });

  it('hides the wallet summary when disconnected', async () => {
    setWalletState({ publicKey: null, status: 'idle' });
    renderLeaderboard();

    await waitFor(() => expect(screen.getByRole('tablist')).toBeInTheDocument());
    expect(screen.queryByText('Current wallet summary')).not.toBeInTheDocument();
  });
});
