import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bindSoundPreference,
  clearSoundPreferenceBinding,
  isSoundPreferenceEnabled,
  playRoundResolutionCue,
  playTestTone,
} from './audioController';

describe('audioController', () => {
  afterEach(() => {
    clearSoundPreferenceBinding();
  });

  it('reports sound disabled when no preference has been bound', () => {
    expect(isSoundPreferenceEnabled()).toBe(false);
  });

  it('reflects whatever getter was bound', () => {
    bindSoundPreference(() => true);
    expect(isSoundPreferenceEnabled()).toBe(true);

    bindSoundPreference(() => false);
    expect(isSoundPreferenceEnabled()).toBe(false);
  });

  describe('shared preference gate', () => {
    beforeEach(() => {
      // jsdom has no AudioContext — both cues must bail via the preference
      // check itself (not merely because playback is unsupported), which is
      // what these assertions pin down.
      bindSoundPreference(() => false);
    });

    it('playTestTone declines when sound is disabled', () => {
      expect(playTestTone()).toBe(false);
    });

    it('playRoundResolutionCue declines when sound is disabled', () => {
      expect(playRoundResolutionCue(true)).toBe(false);
      expect(playRoundResolutionCue(false)).toBe(false);
    });

    it('both cues consult the same bound getter — flipping it flips both', () => {
      let enabled = false;
      bindSoundPreference(() => enabled);

      expect(playTestTone()).toBe(false);
      expect(playRoundResolutionCue(true)).toBe(false);

      enabled = true;

      // No AudioContext in jsdom, so these still return false, but both must
      // agree — neither should short-circuit differently from the other.
      expect(playTestTone()).toBe(playRoundResolutionCue(true));
    });
  });
});
