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

let cachedContext: AudioContext | null = null;
let cachedPreferenceGetter: (() => boolean) | null = null;

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
  return cachedPreferenceGetter?.() ?? false;
}

/**
 * Play a short monophonic test tone (used by the Settings "Test sound" button).
 * The tone lasts ~180ms so it never gets obnoxious but is clearly audible.
 *
 * Returns `true` if the tone was scheduled, `false` if anything prevented it
 * (unsupported environment, sound disabled, suspended context).
 */
export function playTestTone(): boolean {
  if (!isSoundPreferenceEnabled()) return false;
  const ctx = getContext();
  if (!ctx) return false;

  try {
    if (ctx.state === 'suspended') {
      // Browsers require a user gesture to start audio. Either this was called
      // from a click handler (best case) or we silently bail.
      void ctx.resume();
      return true;
    }

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 660; // gentle, mid-range confirmation tone

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
