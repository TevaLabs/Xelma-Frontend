import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';
import '../i18n';

// ═══════════════════════════════════════════════════════════
// Profile page mocks
// ═══════════════════════════════════════════════════════════

const mockProfileStore = {
  profile: null,
  isLoading: false,
  error: null,
  loadProfile: vi.fn(),
};

vi.mock('../store/useProfileStore', () => ({
  useProfileStore: Object.assign(
    vi.fn((selector: unknown) => {
      if (typeof selector === 'function') {
        return (selector as (s: typeof mockProfileStore) => unknown)(mockProfileStore);
      }
      return mockProfileStore;
    }),
    { getState: () => mockProfileStore },
  ),
}));

const mockWalletStore = {
  status: 'connected' as const,
  publicKey: 'GTEST123',
  balance: null,
};

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
}));

vi.mock('../components/ProfileSettingsModal', () => ({
  default: () => null,
}));

vi.mock('../components/IdenticonAvatar', () => ({
  default: () => <div data-testid="identicon-avatar">Identicon</div>,
}));

vi.mock('../components/BalancesPanel', () => ({
  default: () => <div data-testid="balances-panel">Balances Panel</div>,
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

vi.mock('../components/ui/Spinner', () => ({
  Spinner: ({ label }: { label: string }) => (
    <div role="status" aria-label={label}>
      Loading...
    </div>
  ),
}));

import Profile from '../pages/Profile';

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

  if (results.violations.length === 0) {
    console.log(`[axe:pass] ${label}: No accessibility violations detected.`);
  }

  expect(seriousViolations).toHaveLength(0);
}

// ═══════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════

const ORIGINAL_TITLE = document.title;

describe('Profile Accessibility', () => {
  beforeAll(() => {
    document.title = 'Xelma — Collective Market Intelligence on Stellar';
  });

  afterAll(() => {
    document.title = ORIGINAL_TITLE;
  });

  describe('Profile Page', () => {
    it('has no serious axe-core violations', async () => {
      const { container } = render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>,
      );

      await assertNoSeriousViolations(container, 'Profile page', 'serious');
    });

    it('has no critical axe-core violations', async () => {
      const { container } = render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>,
      );

      await assertNoSeriousViolations(container, 'Profile page', 'critical');
    });
  });
});
