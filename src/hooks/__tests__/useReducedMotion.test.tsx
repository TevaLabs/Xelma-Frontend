import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSettingsStore, DEFAULT_SETTINGS } from '../../store/useSettingsStore';
import { useReducedMotion } from '../useReducedMotion';

/**
 * The Settings store re-reads `window.matchMedia` so the jsdom mock in
 * `src/test/setup.ts` controls what the hook sees. We swap its `matches`
 * behaviour per test.
 */
type MatchMediaListener = (event: MediaQueryListEvent) => void;

interface MockQueryList {
  matches: boolean;
  media: string;
  listeners: Set<MatchMediaListener>;
  addEventListener: (type: string, listener: MatchMediaListener) => void;
  removeEventListener: (type: string, listener: MatchMediaListener) => void;
  addListener: (listener: MatchMediaListener) => void;
  removeListener: (listener: MatchMediaListener) => void;
  dispatchEvent: (event: MediaQueryListEvent) => void;
  fireChange: (matches: boolean) => void;
}

function installMatchMedia(initialMatches: boolean) {
  const queries = new Map<string, MockQueryList>();
  const matchMedia = vi.fn((query: string) => {
    const existing = queries.get(query);
    if (existing) return existing as unknown as MediaQueryList;
    const q: MockQueryList = {
      matches: initialMatches,
      media: query,
      listeners: new Set(),
      addEventListener(_type, listener) {
        q.listeners.add(listener);
      },
      removeEventListener(_type, listener) {
        q.listeners.delete(listener);
      },
      addListener(listener) {
        q.listeners.add(listener);
      },
      removeListener(listener) {
        q.listeners.delete(listener);
      },
      dispatchEvent(event) {
        q.matches = event.matches;
        q.listeners.forEach((l) => l(event));
      },
      fireChange(next) {
        q.matches = next;
        q.listeners.forEach((l) => l({ matches: next, media: q.media } as MediaQueryListEvent));
      },
    };
    queries.set(query, q);
    return q as unknown as MediaQueryList;
  });
  Object.defineProperty(window, 'matchMedia', { writable: true, value: matchMedia });
  return queries;
}

describe('useReducedMotion', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      ...DEFAULT_SETTINGS,
      motionPreference: 'system',
      setShowNetworkBadge: useSettingsStore.getState().setShowNetworkBadge,
      setSoundEnabled: useSettingsStore.getState().setSoundEnabled,
      setStreamerMode: useSettingsStore.getState().setStreamerMode,
      setMotionPreference: useSettingsStore.getState().setMotionPreference,
      resetToDefaults: useSettingsStore.getState().resetToDefaults,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('honors the OS media query when override is "system"', () => {
    installMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current.reduced).toBe(true);
    expect(result.current.systemPreference).toBe(true);
    expect(result.current.override).toBe('system');
  });

  it('treats OS "no-preference" as not reduced when override is "system"', () => {
    installMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current.reduced).toBe(false);
  });

  it('forces reduction when override is "reduce", even if the OS asks for motion', () => {
    installMatchMedia(false);
    useSettingsStore.getState().setMotionPreference('reduce');
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current.reduced).toBe(true);
    expect(result.current.systemPreference).toBe(false);
  });

  it('forces motion when override is "no-preference", even if the OS asks to reduce', () => {
    installMatchMedia(true);
    useSettingsStore.getState().setMotionPreference('no-preference');
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current.reduced).toBe(false);
    expect(result.current.systemPreference).toBe(true);
  });

  it('reacts to live media-query changes', () => {
    const queries = installMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current.reduced).toBe(false);

    const reduceQuery = queries.get('(prefers-reduced-motion: reduce)');
    expect(reduceQuery).toBeDefined();

    act(() => {
      reduceQuery!.fireChange(true);
    });

    expect(result.current.reduced).toBe(true);
    expect(result.current.systemPreference).toBe(true);
  });
});
