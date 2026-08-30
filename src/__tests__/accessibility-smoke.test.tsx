import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';
import '../i18n';

// ═══════════════════════════════════════════════════════════
// Landing page mocks (mirrors src/pages/Landing.test.tsx)
// ═══════════════════════════════════════════════════════════

vi.mock('../components/HowItWorks', () => ({
  default: () => <div data-testid="how-it-works-mock">How It Works Mock</div>,
}));

vi.mock('../components/ModeCards', () => ({
  default: () => <div data-testid="mode-cards-mock">Mode Cards Mock</div>,
}));

// Mock api-client for statsApi.getNetworkStats used by useNetworkStats
vi.mock('../lib/api-client', () => ({
  statsApi: {
    getNetworkStats: vi.fn().mockResolvedValue({
      totalRounds: 1247,
      vXlmDistributed: 4_200_000,
      activePlayers: 893,
    }),
    getUserStats: vi.fn().mockResolvedValue(null),
  },
  educationApi: {
    getTip: vi.fn().mockResolvedValue(null),
    getGuides: vi.fn().mockResolvedValue([]),
  },
  predictionsApi: {
    submit: vi.fn(),
    getUserHistory: vi.fn().mockResolvedValue([]),
  },
  roundsApi: {
    getActive: vi.fn().mockResolvedValue(null),
  },
  ApiError: class ApiError extends Error {
    constructor(message: string, status: number) {
      super(message);
      this.name = 'ApiError';
      Object.assign(this, { status });
    }
  },
}));

import Landing from '../pages/Landing';

// ═══════════════════════════════════════════════════════════
// Dashboard page mocks (mirrors src/pages/Dashboard.test.tsx)
// ═══════════════════════════════════════════════════════════

// These are hoisted by vi.mock, so they run before the Dashboard import below.
// The api-client mock is shared above; the roundstore & walletstore are below.

const mockRoundStore = {
  isRoundActive: true,
  isLoading: false,
  resolvedRound: null,
  sseConnection: { status: 'connected' as const, error: null, reconnectAttempts: 0, lastConnected: null },
  fetchActiveRound: vi.fn(),
  subscribeToRoundEvents: vi.fn(() => vi.fn()),
  dismissResolvedRound: vi.fn(),
};

const mockWalletStore = {
  status: 'connected' as const,
  publicKey: 'GTEST123',
  balance: null,
};

vi.mock('../store/useRoundStore', () => ({
  useRoundStore: Object.assign(
    vi.fn((selector: unknown) => {
      if (typeof selector === 'function') {
        return (selector as (s: typeof mockRoundStore) => unknown)(mockRoundStore);
      }
      return mockRoundStore;
    }),
    { getState: () => mockRoundStore },
  ),
}));

vi.mock('../store/useWalletStore', () => ({
  useWalletStore: Object.assign(
    vi.fn((selector: unknown) => {
      if (typeof selector === 'function') {
        return (selector as (s: typeof mockWalletStore) => unknown)(mockWalletStore);
      }
      return mockWalletStore;
    }),
    { getState: () => mockWalletStore },
  ),
  selectIsWalletConnected: vi.fn(
    (state: { status: string; publicKey: string | null }) =>
      state.status === 'connected' && Boolean(state.publicKey),
  ),
  selectNeedsFunding: vi.fn(() => false),
}));

vi.mock('../hooks/useConnectionStatus', () => ({
  useConnectionStatus: () => ({
    status: 'connected',
    error: null,
    lastConnected: new Date('2026-01-01T00:00:00.000Z'),
    reconnectAttempts: 0,
    isConnected: true,
    isConnecting: false,
    isReconnecting: false,
    isDisconnected: false,
    reconnect: vi.fn(),
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Link: ({ children, to, ...props }: Record<string, unknown>) => (
      <a href={String(to)} {...props}>
        {children}
      </a>
    ),
  };
});

vi.mock('../components/PriceChart', () => ({
  default: ({ height }: { height: number }) => (
    <div data-testid="price-chart" data-height={height}>
      Price Chart
    </div>
  ),
}));

vi.mock('../components/PredictionCard', () => ({
  default: () => <div data-testid="prediction-card">Prediction Card</div>,
}));

vi.mock('../components/PredictionHistory', () => ({
  default: () => <div data-testid="prediction-history">Prediction History</div>,
}));

vi.mock('../components/EndRoundModal', () => ({
  default: () => null,
}));

vi.mock('../components/BetModal', () => ({
  default: () => null,
}));

vi.mock('../components/StatsCard', () => ({
  default: () => <div data-testid="stats-card">Stats Card</div>,
}));

vi.mock('../components/RecentActivity', () => ({
  default: () => <div data-testid="recent-activity">Recent Activity</div>,
}));

vi.mock('../components/RoundTimeline', () => ({
  default: () => <div data-testid="round-timeline">Round Timeline</div>,
}));

vi.mock('../components/ChatSidebar', () => ({
  ChatSidebar: () => null,
}));

vi.mock('../components/ConnectionStatus', () => ({
  ConnectionStatus: () => null,
}));

vi.mock('../components/education/TipCard', () => ({
  TipCard: () => null,
}));

import Dashboard from '../pages/Dashboard';

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

/**
 * Run axe-core on a container element and fail the test if there are
 * violations at or above the given impact threshold.
 */
async function assertNoSeriousViolations(
  container: HTMLElement,
  label: string,
  impactThreshold: axe.ImpactValue = 'serious',
): Promise<void> {
  const results = await axe.run(container, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    },
    // Disable rules that cannot be reliably tested in jsdom (no rendering engine).
    // - color-contrast: jsdom cannot compute actual foreground/background colors.
    // - link-in-text-block: jsdom cannot reliably evaluate inline vs. block context.
    rules: {
      'color-contrast': { enabled: false },
      'link-in-text-block': { enabled: false },
    },
  });

  const seriousViolations = results.violations.filter((v) => {
    const impactRank = ['minor', 'moderate', 'serious', 'critical'];
    return (
      v.impact &&
      impactRank.indexOf(v.impact) >= impactRank.indexOf(impactThreshold)
    );
  });

  if (seriousViolations.length > 0) {
    const details = seriousViolations
      .map(
        (v) =>
          `  - [${v.impact}] ${v.id}: ${v.help}\n    ${v.nodes
            .map((n) => `"${n.html?.slice(0, 80)}..."`).join('\n    ')}`,
      )
      .join('\n');

    throw new Error(
      `${label}: ${seriousViolations.length} accessibility violation(s) found at ${impactThreshold} level or above:\n${details}`,
    );
  }

  // Log violations that are less than the threshold (informational only, won't fail)
  if (results.violations.length > 0) {
    const below = results.violations.filter((v) => {
      const impactRank = ['minor', 'moderate', 'serious', 'critical'];
      return (
        v.impact &&
        impactRank.indexOf(v.impact) < impactRank.indexOf(impactThreshold)
      );
    });
    if (below.length > 0) {
      console.log(
        `[axe:info] ${label}: ${below.length} minor/moderate violation(s) found (below threshold, not failing):`,
      );
      below.forEach((v) =>
        console.log(`  - [${v.impact}] ${v.id}: ${v.help}`),
      );
    }
  }

  if (results.violations.length === 0) {
    console.log(`[axe:pass] ${label}: No accessibility violations detected.`);
  }

  // Assert passes as well for confidence
  expect(results.violations.filter((v) => {
    const impactRank = ['minor', 'moderate', 'serious', 'critical'];
    return (
      v.impact &&
      impactRank.indexOf(v.impact) >= impactRank.indexOf(impactThreshold)
    );
  })).toHaveLength(0);
}

// ═══════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════

const ORIGINAL_TITLE = document.title;

describe('Accessibility Smoke Tests', () => {
  beforeAll(() => {
    // Set a document title so axe's document-title rule passes
    document.title = 'Xelma — Collective Market Intelligence on Stellar';
  });

  afterAll(() => {
    // Restore original document title to avoid leaking state
    document.title = ORIGINAL_TITLE;
  });

  describe('Landing Page', () => {
    it('has no serious axe-core violations', async () => {
      const { container } = render(
        <MemoryRouter>
          <Landing />
        </MemoryRouter>,
      );

      await assertNoSeriousViolations(container, 'Landing page', 'serious');
    });

    it('has no critical axe-core violations', async () => {
      const { container } = render(
        <MemoryRouter>
          <Landing />
        </MemoryRouter>,
      );

      await assertNoSeriousViolations(container, 'Landing page', 'critical');
    });
  });

  describe('Dashboard Page', () => {
    it('has no serious axe-core violations', async () => {
      const { container } = render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>,
      );

      await assertNoSeriousViolations(container, 'Dashboard page', 'serious');
    });

    it('has no critical axe-core violations', async () => {
      const { container } = render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>,
      );

      await assertNoSeriousViolations(container, 'Dashboard page', 'critical');
    });
  });
});
