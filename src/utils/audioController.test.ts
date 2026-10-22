import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bindSoundPreference,
  clearSoundPreferenceBinding,
  isReducedMotionPreferred,
  isSoundPreferenceEnabled,
  playRoundResolutionCue,
  playTestTone,
  resetAudioContextForTesting,
  shouldPlayAudio,
  stopAudio,
} from './audioController';
import { useSettingsStore, DEFAULT_SETTINGS } from '../store/useSettingsStore';

function setupMockAudioContext() {
  const mockOscillator = {
    type: 'sine',
    frequency: { value: 0 },
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null as (() => void) | null,
  };
  const mockGain = {
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };

  class MockAudioContext {
    state = 'running';
    currentTime = 10;
    destination = {};
    createOscillator = vi.fn(() => mockOscillator);
    createGain = vi.fn(() => mockGain);
    resume = vi.fn().mockResolvedValue(undefined);
  }

  Object.defineProperty(window, 'AudioContext', {
    writable: true,
    configurable: true,
    value: MockAudioContext,
  });

  return { MockAudioContext, mockOscillator, mockGain };
}

function mockMatchMedia(reducedMotion: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('audioController', () => {
  beforeEach(() => {
    delete (window as unknown as { AudioContext?: unknown }).AudioContext;
    resetAudioContextForTesting();
    clearSoundPreferenceBinding();
    useSettingsStore.setState({
      ...DEFAULT_SETTINGS,
      soundEnabled: false,
      motionPreference: 'system',
    });
    mockMatchMedia(false);
  });

  afterEach(() => {
    delete (window as unknown as { AudioContext?: unknown }).AudioContext;
    clearSoundPreferenceBinding();
    resetAudioContextForTesting();
    useSettingsStore.setState({
      ...DEFAULT_SETTINGS,
      soundEnabled: false,
      motionPreference: 'system',
    });
    mockMatchMedia(false);
  });

  describe('sound preference checks', () => {
    it('reports sound disabled when no preference has been bound and default store sound is disabled', () => {
      expect(isSoundPreferenceEnabled()).toBe(false);
    });

    it('reflects whatever getter was bound', () => {
      bindSoundPreference(() => true);
      expect(isSoundPreferenceEnabled()).toBe(true);

      bindSoundPreference(() => false);
      expect(isSoundPreferenceEnabled()).toBe(false);
    });

    it('falls back to useSettingsStore soundEnabled when no getter is bound', () => {
      useSettingsStore.setState({ soundEnabled: true });
      expect(isSoundPreferenceEnabled()).toBe(true);

      useSettingsStore.setState({ soundEnabled: false });
      expect(isSoundPreferenceEnabled()).toBe(false);
    });
  });

  describe('reduced motion preference checks', () => {
    it('detects OS reduced motion preference when override is "system"', () => {
      mockMatchMedia(true);
      expect(isReducedMotionPreferred()).toBe(true);

      mockMatchMedia(false);
      expect(isReducedMotionPreferred()).toBe(false);
    });

    it('forces reduced motion when in-app preference is "reduce", even if OS says false', () => {
      mockMatchMedia(false);
      useSettingsStore.setState({ motionPreference: 'reduce' });
      expect(isReducedMotionPreferred()).toBe(true);
    });

    it('disables reduced motion when in-app preference is "no-preference", even if OS says true', () => {
      mockMatchMedia(true);
      useSettingsStore.setState({ motionPreference: 'no-preference' });
      expect(isReducedMotionPreferred()).toBe(false);
    });
  });

  describe('shouldPlayAudio guard', () => {
    it('returns false when sound is disabled', () => {
      bindSoundPreference(() => false);
      mockMatchMedia(false);
      expect(shouldPlayAudio()).toBe(false);
    });

    it('returns false when reduced motion is preferred via OS', () => {
      bindSoundPreference(() => true);
      mockMatchMedia(true);
      expect(shouldPlayAudio()).toBe(false);
    });

    it('returns false when reduced motion is preferred via in-app setting', () => {
      bindSoundPreference(() => true);
      useSettingsStore.setState({ motionPreference: 'reduce' });
      mockMatchMedia(false);
      expect(shouldPlayAudio()).toBe(false);
    });

    it('returns true when sound is enabled and reduced motion is not preferred', () => {
      bindSoundPreference(() => true);
      mockMatchMedia(false);
      expect(shouldPlayAudio()).toBe(true);
    });

    it('returns true when sound is enabled and in-app override is "no-preference" despite OS reduced motion', () => {
      bindSoundPreference(() => true);
      mockMatchMedia(true);
      useSettingsStore.setState({ motionPreference: 'no-preference' });
      expect(shouldPlayAudio()).toBe(true);
    });
  });

  describe('playback suppression and execution', () => {
    it('no audio plays when reduced motion is preferred', () => {
      const { mockOscillator } = setupMockAudioContext();
      bindSoundPreference(() => true);
      mockMatchMedia(true);

      expect(playTestTone()).toBe(false);
      expect(playRoundResolutionCue(true)).toBe(false);
      expect(playRoundResolutionCue(false)).toBe(false);
      expect(mockOscillator.start).not.toHaveBeenCalled();
    });

    it('no audio plays when the sound setting is disabled', () => {
      const { mockOscillator } = setupMockAudioContext();
      bindSoundPreference(() => false);
      mockMatchMedia(false);

      expect(playTestTone()).toBe(false);
      expect(playRoundResolutionCue(true)).toBe(false);
      expect(playRoundResolutionCue(false)).toBe(false);
      expect(mockOscillator.start).not.toHaveBeenCalled();
    });

    it('audio plays when sound is enabled and reduced motion is not preferred', () => {
      const { mockOscillator, mockGain } = setupMockAudioContext();
      bindSoundPreference(() => true);
      mockMatchMedia(false);

      // playTestTone schedules a 660 Hz tone
      expect(playTestTone()).toBe(true);
      expect(mockOscillator.frequency.value).toBe(660);
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockGain);
      expect(mockGain.connect).toHaveBeenCalled();
      expect(mockOscillator.start).toHaveBeenCalledWith(10);
      expect(mockOscillator.stop).toHaveBeenCalledWith(10.2);

      // playRoundResolutionCue(true) schedules an 880 Hz win tone
      expect(playRoundResolutionCue(true)).toBe(true);
      expect(mockOscillator.frequency.value).toBe(880);

      // playRoundResolutionCue(false) schedules a 440 Hz loss tone
      expect(playRoundResolutionCue(false)).toBe(true);
      expect(mockOscillator.frequency.value).toBe(440);
    });

    it('stops active audio if stopAudio is explicitly called', () => {
      const { mockOscillator, mockGain } = setupMockAudioContext();
      bindSoundPreference(() => true);
      mockMatchMedia(false);

      playTestTone();
      expect(mockOscillator.start).toHaveBeenCalled();

      stopAudio();
      expect(mockOscillator.stop).toHaveBeenCalled();
      expect(mockOscillator.disconnect).toHaveBeenCalled();
      expect(mockGain.disconnect).toHaveBeenCalled();
    });

    it('stops active audio tone before starting a new tone', () => {
      const { mockOscillator } = setupMockAudioContext();
      bindSoundPreference(() => true);
      mockMatchMedia(false);

      playTestTone();
      expect(mockOscillator.start).toHaveBeenCalledTimes(1);

      // Playing a subsequent tone stops the previous one
      playRoundResolutionCue(true);
      expect(mockOscillator.stop).toHaveBeenCalled();
    });
  });

  describe('legacy test suite compatibility', () => {
    beforeEach(() => {
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
      // In default jsdom without mocked AudioContext, both return false (agreeing with each other)
      expect(playTestTone()).toBe(playRoundResolutionCue(true));
    });
  });
});
