/**
 * Tiny Web Audio helper used by the Settings page to demo the "Sound" preference.
 *
 * The AudioContext is created lazily on first use and persisted for the page
 * lifetime. All `play*()` calls bail silently if:
 *   - AudioContext isn't supported (e.g. test envs running under jsdom);
 *   - sound preferences are disabled; or
 *   - the user gesture policy refuses to start the context.
 *
 * No-ops are deliberate — they ensure the rest of the UI stays usable even when
 * no audio is available, and they keep our test suite deterministic.
 */

import { useSettingsStore } from '../store/useSettingsStore';

let cachedContext: AudioContext | null = null;
let cachedPreferenceGetter: (() => boolean) | null = null;
let activeOscillator: OscillatorNode | null = null;
let activeGain: GainNode | null = null;

function isSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const Ctor: unknown = (window as unknown as { AudioContext?: unknown }).AudioContext ??
    (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext;
  return typeof Ctor === 'function';
}

function getContext(): AudioContext | null {
  if (cachedContext) return cachedContext;
  if (!isSupported()) return null;

  try {
    const w = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return null;
    cachedContext = new Ctor();
    return cachedContext;
  } catch {
    return null;
  }
}

/**
 * Reset cached AudioContext and active nodes for test isolation.
 */
export function resetAudioContextForTesting(): void {
  stopAudio();
  cachedContext = null;
}

/**
 * Stop any currently active audio tone.
 */
export function stopAudio(): void {
  if (activeOscillator) {
    try {
      activeOscillator.stop();
      activeOscillator.disconnect();
    } catch {
      // ignore if already stopped or disconnected
    }
    activeOscillator = null;
  }
  if (activeGain) {
    try {
      activeGain.disconnect();
    } catch {
      // ignore if already disconnected
    }
    activeGain = null;
  }
}

/**
 * Wire up the settings-store-aware preference gate. The Settings page calls this
 * once so subsequent `playTestTone()` calls can decide whether to actually emit
 * sound without re-reading the store on each invocation.
 */
export function bindSoundPreference(getter: () => boolean): void {
  cachedPreferenceGetter = getter;
}

export function clearSoundPreferenceBinding(): void {
  cachedPreferenceGetter = null;
}

export function isSoundPreferenceEnabled(): boolean {
  if (cachedPreferenceGetter) {
    return cachedPreferenceGetter();
  }
  try {
    return useSettingsStore.getState().soundEnabled;
  } catch {
    return false;
  }
}

/**
 * Determine if reduced motion is preferred at call time, checking the in-app
 * `motionPreference` setting first and falling back to the OS `prefers-reduced-motion` media query.
 */
export function isReducedMotionPreferred(): boolean {
  try {
    const override = useSettingsStore.getState().motionPreference;
    if (override === 'reduce') return true;
    if (override === 'no-preference') return false;
  } catch {
    // fallback if store is not available
  }

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Single master guard for all sound playback in the application.
 * Returns true only if sound is enabled in settings AND reduced motion is not preferred.
 */
export function shouldPlayAudio(): boolean {
  if (!isSoundPreferenceEnabled()) return false;
  if (isReducedMotionPreferred()) return false;
  return true;
}

// Stop active audio if user enables reduced motion or disables sound during session
if (typeof window !== 'undefined') {
  try {
    useSettingsStore.subscribe((state) => {
      if (!state.soundEnabled || state.motionPreference === 'reduce') {
        stopAudio();
      }
    });
  } catch {
    // store subscription unavailable in certain isolated test runs
  }

  if (typeof window.matchMedia === 'function') {
    try {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      const handleMediaChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          stopAudio();
        }
      };
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', handleMediaChange);
      } else if (typeof mql.addListener === 'function') {
        mql.addListener(handleMediaChange);
      }
    } catch {
      // media query listener failed
    }
  }
}

/**
 * Schedule a short monophonic tone on the shared AudioContext. Shared by
 * `playTestTone()` and `playRoundResolutionCue()` so both cues are gated by
 * the exact same `shouldPlayAudio()` check — one preference, one
 * code path, no risk of the two cues drifting out of sync.
 */
function playTone(frequency: number): boolean {
  if (!shouldPlayAudio()) {
    stopAudio();
    return false;
  }
  const ctx = getContext();
  if (!ctx) return false;

  try {
    if (ctx.state === 'suspended') {
      // Browsers require a user gesture to start audio. Either this was called
      // from a click handler (best case) or we silently bail.
      void ctx.resume();
      return true;
    }

    stopAudio();

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    activeOscillator = oscillator;
    activeGain = gain;

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    // Linear ramp avoids audible clicks on start / end.
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.2);

    oscillator.onended = () => {
      try {
        oscillator.disconnect();
        gain.disconnect();
      } catch {
        // nodes already detached
      }
    };

    return true;
  } catch {
    return false;
  }
}

/**
 * Play a short monophonic test tone (used by the Settings "Test sound" button).
 * The tone lasts ~180ms so it never gets obnoxious but is clearly audible.
 *
 * Returns `true` if the tone was scheduled, `false` if anything prevented it
 * (unsupported environment, sound disabled, suspended context).
 */
export function playTestTone(): boolean {
  if (!shouldPlayAudio()) {
    stopAudio();
    return false;
  }
  return playTone(660); // gentle, mid-range confirmation tone
}

/**
 * Play the round-resolution cue on the dashboard — a slightly higher tone for
 * a win, lower for a loss. Gated by the same `shouldPlayAudio()`
 * check as `playTestTone()`, so it always reflects both the Settings
 * "Sound" toggle and the reduced motion preference.
 *
 * Returns `true` if the tone was scheduled, `false` if anything prevented it.
 */
export function playRoundResolutionCue(isWin: boolean): boolean {
  if (!shouldPlayAudio()) {
    stopAudio();
    return false;
  }
  return playTone(isWin ? 880 : 440);
}

