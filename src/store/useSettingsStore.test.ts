import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  useSettingsStore,
} from './useSettingsStore';

/** Restore defaults without dropping the action methods on the slice. */
function resetStore() {
  const actions = {
    setShowNetworkBadge: useSettingsStore.getState().setShowNetworkBadge,
    setSoundEnabled: useSettingsStore.getState().setSoundEnabled,
    setStreamerMode: useSettingsStore.getState().setStreamerMode,
    setMotionPreference: useSettingsStore.getState().setMotionPreference,
    resetToDefaults: useSettingsStore.getState().resetToDefaults,
  };
  useSettingsStore.setState({ ...DEFAULT_SETTINGS, ...actions });
}

describe('useSettingsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    // Clear the persist hydration by remounting the slice
    useSettingsStore.persist.clearStorage();
    resetStore();
  });

  describe('defaults', () => {
    it('uses sane defaults that match the brand and accessibility expectations', () => {
      const state = useSettingsStore.getState();
      expect(state.showNetworkBadge).toBe(DEFAULT_SETTINGS.showNetworkBadge);
      expect(state.soundEnabled).toBe(DEFAULT_SETTINGS.soundEnabled);
      expect(state.streamerMode).toBe(DEFAULT_SETTINGS.streamerMode);
      expect(state.motionPreference).toBe(DEFAULT_SETTINGS.motionPreference);
      expect(DEFAULT_SETTINGS.motionPreference).toBe('system');
      expect(DEFAULT_SETTINGS.soundEnabled).toBe(false);
      expect(DEFAULT_SETTINGS.showNetworkBadge).toBe(true);
    });

    it('exposes type-safe setters for every preference', () => {
      const state = useSettingsStore.getState();
      expect(typeof state.setShowNetworkBadge).toBe('function');
      expect(typeof state.setSoundEnabled).toBe('function');
      expect(typeof state.setStreamerMode).toBe('function');
      expect(typeof state.setMotionPreference).toBe('function');
      expect(typeof state.resetToDefaults).toBe('function');
    });
  });

  describe('setters', () => {
    it('flips the network badge preference', () => {
      useSettingsStore.getState().setShowNetworkBadge(false);
      expect(useSettingsStore.getState().showNetworkBadge).toBe(false);
      useSettingsStore.getState().setShowNetworkBadge(true);
      expect(useSettingsStore.getState().showNetworkBadge).toBe(true);
    });

    it('flips the sound preference', () => {
      useSettingsStore.getState().setSoundEnabled(true);
      expect(useSettingsStore.getState().soundEnabled).toBe(true);
    });

    it('flips the streamer-mode preference', () => {
      useSettingsStore.getState().setStreamerMode(true);
      expect(useSettingsStore.getState().streamerMode).toBe(true);
    });

    it('only accepts the three documented motion-preference values', () => {
      const set = useSettingsStore.getState().setMotionPreference;
      for (const value of ['system', 'reduce', 'no-preference'] as const) {
        set(value);
        expect(useSettingsStore.getState().motionPreference).toBe(value);
      }
    });
  });

  describe('resetToDefaults', () => {
    it('returns every preference to its default', () => {
      const { setShowNetworkBadge, setSoundEnabled, setStreamerMode, setMotionPreference } =
        useSettingsStore.getState();
      setShowNetworkBadge(false);
      setSoundEnabled(true);
      setStreamerMode(true);
      setMotionPreference('no-preference');

      useSettingsStore.getState().resetToDefaults();

      const state = useSettingsStore.getState();
      expect(state.showNetworkBadge).toBe(DEFAULT_SETTINGS.showNetworkBadge);
      expect(state.soundEnabled).toBe(DEFAULT_SETTINGS.soundEnabled);
      expect(state.streamerMode).toBe(DEFAULT_SETTINGS.streamerMode);
      expect(state.motionPreference).toBe(DEFAULT_SETTINGS.motionPreference);
    });
  });

  describe('persistence', () => {
    it('writes the partial state (preferences only) under the storage key', () => {
      useSettingsStore.getState().setSoundEnabled(true);
      useSettingsStore.getState().setStreamerMode(true);

      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw as string) as {
        state: Record<string, unknown>;
        version: number;
      };

      expect(parsed.version).toBe(1);
      expect(parsed.state.showNetworkBadge).toBe(DEFAULT_SETTINGS.showNetworkBadge);
      expect(parsed.state.soundEnabled).toBe(true);
      expect(parsed.state.streamerMode).toBe(true);
      expect(parsed.state.motionPreference).toBe(DEFAULT_SETTINGS.motionPreference);
      // Action / setter functions must NOT leak into localStorage.
      expect(parsed.state).not.toHaveProperty('setShowNetworkBadge');
      expect(parsed.state).not.toHaveProperty('setSoundEnabled');
      expect(parsed.state).not.toHaveProperty('setStreamerMode');
      expect(parsed.state).not.toHaveProperty('setMotionPreference');
      expect(parsed.state).not.toHaveProperty('resetToDefaults');
    });

    it('uses the documented storage key', () => {
      expect(SETTINGS_STORAGE_KEY).toBe('xelma-settings-v1');
      expect(useSettingsStore.persist.getOptions().name).toBe(SETTINGS_STORAGE_KEY);
    });

    it('falls back to defaults when localStorage holds malformed JSON', () => {
      localStorage.setItem(SETTINGS_STORAGE_KEY, 'not-json');

      // The store still has sane runtime defaults even if the persisted blob is bad.
      const state = useSettingsStore.getState();
      expect(state.showNetworkBadge).toBe(DEFAULT_SETTINGS.showNetworkBadge);
      expect(state.soundEnabled).toBe(DEFAULT_SETTINGS.soundEnabled);
    });
  });
});
