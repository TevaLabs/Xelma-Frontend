/**
 * Landing count-up stats honour reduced motion (issue #583).
 *
 * Covers:
 *  - `prefers-reduced-motion: reduce` (mocked matchMedia) shows the final
 *    values on first paint and never starts an animation
 *  - the Settings motion override wins over the OS preference in both directions
 *  - without reduced motion the count-up still animates from 0 (unchanged)
 *  - live stats replacing the mock ones show up immediately under reduced motion
 */
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, StaticRouter } from 'react-router-dom';
import Landing from './Landing';
import '../i18n';
import { useSettingsStore } from '../store/useSettingsStore';
import type { NetworkStats } from '../lib/api-client';

const mockUseNetworkStats = vi.hoisted(() => vi.fn());

vi.mock('../hooks/useNetworkStats', () => ({
  useNetworkStats: mockUseNetworkStats,
}));

vi.mock('../components/HowItWorks', () => ({ default: () => <div /> }));
vi.mock('../components/ModeCards', () => ({ default: () => <div /> }));

const FINAL: NetworkStats = { totalRounds: 1234, vXlmDistributed: 2_500_000, activePlayers: 567 };
const LIVE: NetworkStats = { totalRounds: 4321, vXlmDistributed: 3_100_000, activePlayers: 890 };

const FINAL_ROUNDS = (1234).toLocaleString();
const FINAL_PLAYERS = (567).toLocaleString();
const FINAL_VOLUME = '2.5M vXLM';

const originalMatchMedia = window.matchMedia;

/** Mock matchMedia so only the prefers-reduced-motion query reports `reduce`. */
function mockMatchMedia(reduce: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn((query: string) => ({
      matches: reduce && query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

/** Take manual control of requestAnimationFrame and performance.now. */
function controlFrames() {
  let now = 0;
  let nextId = 0;
  const pending = new Map<number, FrameRequestCallback>();

  vi.spyOn(performance, 'now').mockImplementation(() => now);
  const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    pending.set(++nextId, cb);
    return nextId;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
    pending.delete(id);
  });

  return {
    raf,
    advance(ms: number) {
      now += ms;
      act(() => {
        const callbacks = [...pending.values()];
        pending.clear();
        callbacks.forEach((cb) => cb(now));
      });
    },
  };
}

function renderLanding() {
  return render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
  );
}

function statValue(label: RegExp): string {
  return screen.getByText(label).previousElementSibling?.textContent ?? '';
}

function expectFinalStats() {
  expect(statValue(/rounds resolved/i)).toBe(FINAL_ROUNDS);
  expect(statValue(/practice volume/i)).toBe(FINAL_VOLUME);
  expect(statValue(/active predictors/i)).toBe(FINAL_PLAYERS);
}

beforeEach(() => {
  mockUseNetworkStats.mockReturnValue({ stats: FINAL, loading: false, isStale: false });
  useSettingsStore.setState({ motionPreference: 'system' });
});

afterEach(() => {
  Object.defineProperty(window, 'matchMedia', { writable: true, value: originalMatchMedia });
  useSettingsStore.setState({ motionPreference: 'system' });
  vi.restoreAllMocks();
});

describe('Landing count-up stats — reduced motion (#583)', () => {
  describe('first paint', () => {
    it('server-renders the final values when prefers-reduced-motion is reduce', () => {
      mockMatchMedia(true);

      // renderToString runs no effects, so this is exactly what the first paint contains.
      const html = renderToString(
        <StaticRouter location="/">
          <Landing />
        </StaticRouter>,
      );

      expect(html).toContain(FINAL_ROUNDS);
      expect(html).toContain('2.5M');
      expect(html).toContain(FINAL_PLAYERS);
    });

    it('control: without reduced motion the first paint starts from zero', () => {
      mockMatchMedia(false);

      const html = renderToString(
        <StaticRouter location="/">
          <Landing />
        </StaticRouter>,
      );

      expect(html).not.toContain(FINAL_ROUNDS);
      expect(html).not.toContain(FINAL_PLAYERS);
    });
  });

  describe('no animation when motion is reduced', () => {
    it('shows final values and requests no animation frames (prefers-reduced-motion: reduce)', () => {
      mockMatchMedia(true);
      const frames = controlFrames();

      renderLanding();

      expectFinalStats();
      expect(frames.raf).not.toHaveBeenCalled();

      frames.advance(5000);
      expectFinalStats();
    });

    it('does the same when the Settings override is "reduce" but the OS has no preference', () => {
      mockMatchMedia(false);
      useSettingsStore.setState({ motionPreference: 'reduce' });
      const frames = controlFrames();

      renderLanding();

      expectFinalStats();
      expect(frames.raf).not.toHaveBeenCalled();
    });

    it('shows live stats immediately when they replace the mock ones', () => {
      mockMatchMedia(true);
      const frames = controlFrames();
      const { rerender } = renderLanding();
      expectFinalStats();

      mockUseNetworkStats.mockReturnValue({ stats: LIVE, loading: false, isStale: false });
      rerender(
        <MemoryRouter>
          <Landing />
        </MemoryRouter>,
      );

      expect(statValue(/rounds resolved/i)).toBe((4321).toLocaleString());
      expect(statValue(/practice volume/i)).toBe('3.1M vXLM');
      expect(statValue(/active predictors/i)).toBe((890).toLocaleString());
      expect(frames.raf).not.toHaveBeenCalled();
    });
  });

  describe('motion allowed (unchanged behaviour)', () => {
    it('counts up from zero to the final values', () => {
      mockMatchMedia(false);
      const frames = controlFrames();

      renderLanding();

      expect(statValue(/rounds resolved/i)).toBe('0');
      expect(statValue(/active predictors/i)).toBe('0');
      expect(frames.raf).toHaveBeenCalled();

      frames.advance(900);
      const midway = Number(statValue(/rounds resolved/i).replace(/\D/g, ''));
      expect(midway).toBeGreaterThan(0);
      expect(midway).toBeLessThan(1234);

      frames.advance(1000);
      expectFinalStats();
    });

    it('the "no-preference" override animates even when the OS asks for reduced motion', () => {
      mockMatchMedia(true);
      useSettingsStore.setState({ motionPreference: 'no-preference' });
      const frames = controlFrames();

      renderLanding();

      expect(statValue(/rounds resolved/i)).toBe('0');
      expect(frames.raf).toHaveBeenCalled();

      frames.advance(2000);
      expectFinalStats();
    });
  });
});
