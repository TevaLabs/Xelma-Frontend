import { useEffect, useState } from 'react';
import { useSettingsStore, type MotionPreference } from '../store/useSettingsStore';

/**
 * Resolve whether the user wants reduced motion at this instant.
 *
 * Order of precedence:
 * 1. Explicit `motionPreference` override (`reduce` or `no-preference`).
 * 2. Otherwise, the live `prefers-reduced-motion: reduce` media-query result.
 *
 * Returns a tri-state flag:
 * - `reduced = true` → caller should minimize/eliminate motion (the matchMedia
 *   listener fires whenever the OS setting changes).
 * - `reduced = false` → motion is welcome.
 * - `systemPreference` exposes the raw `reduce` query so consumers can show a hint.
 */
export function useReducedMotion(): {
  reduced: boolean;
  systemPreference: boolean;
  override: MotionPreference;
} {
  const override = useSettingsStore((s) => s.motionPreference);

  const [systemPreference, setSystemPreference] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPreference(event.matches);
    };

    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handleChange);
      return () => mql.removeEventListener('change', handleChange);
    }

    // Safari < 14 fallback
    mql.addListener(handleChange);
    return () => mql.removeListener(handleChange);
  }, []);

  let reduced: boolean;
  if (override === 'reduce') {
    reduced = true;
  } else if (override === 'no-preference') {
    reduced = false;
  } else {
    reduced = systemPreference;
  }

  return { reduced, systemPreference, override };
}
