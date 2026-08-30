import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * User-selected override for `prefers-reduced-motion`.
 *
 * - `system`: respect the OS / browser media-query (default).
 * - `reduce`: force-reduce motion regardless of OS pref.
 * - `no-preference`: force-disable the reduce-motion path (override OS pref).
 */
export type MotionPreference = 'system' | 'reduce' | 'no-preference';

export interface SettingsState {
  /** Whether to render the "Testnet / Mainnet" badge in the global navbar. */
  showNetworkBadge: boolean;
  /**
   * Master UI sound toggle — single source of truth for every UI sound cue
   * (the Settings "Test sound" tone and the dashboard round-resolution cue).
   * Read via `audioController`'s `bindSoundPreference` binding so both cues
   * stay in sync without each caller re-reading the store directly.
   */
  soundEnabled: boolean;
  /**
   * Local UI mirror of `streamerMode` so the navbar / settings reflect it
   * instantly, without waiting on a profile save. `MaskedBalance` treats this
   * as an OR with the persisted `useProfileStore` flag — either one being
   * true hides balances; see the precedence note on `MaskedBalance`.
   */
  streamerMode: boolean;
  /** Override for `prefers-reduced-motion`. See {@link MotionPreference}. */
  motionPreference: MotionPreference;
  setShowNetworkBadge: (value: boolean) => void;
  setSoundEnabled: (value: boolean) => void;
  setStreamerMode: (value: boolean) => void;
  setMotionPreference: (value: MotionPreference) => void;
  resetToDefaults: () => void;
}

export const SETTINGS_STORAGE_KEY = 'xelma-settings-v1';

export const DEFAULT_SETTINGS: Omit<
  SettingsState,
  | 'setShowNetworkBadge'
  | 'setSoundEnabled'
  | 'setStreamerMode'
  | 'setMotionPreference'
  | 'resetToDefaults'
> = {
  showNetworkBadge: true,
  soundEnabled: false,
  streamerMode: false,
  motionPreference: 'system',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setShowNetworkBadge: (value) => set({ showNetworkBadge: value }),
      setSoundEnabled: (value) => set({ soundEnabled: value }),
      setStreamerMode: (value) => set({ streamerMode: value }),
      setMotionPreference: (value) => set({ motionPreference: value }),
      resetToDefaults: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // Keep the API surface (setters) out of localStorage.
      partialize: (state) => ({
        showNetworkBadge: state.showNetworkBadge,
        soundEnabled: state.soundEnabled,
        streamerMode: state.streamerMode,
        motionPreference: state.motionPreference,
      }),
    },
  ),
);

/**
 * Selector helpers — keeps components from creating unstable selector closures.
 */
export const selectShowNetworkBadge = (s: SettingsState) => s.showNetworkBadge;
export const selectSoundEnabled = (s: SettingsState) => s.soundEnabled;
export const selectStreamerMode = (s: SettingsState) => s.streamerMode;
export const selectMotionPreference = (s: SettingsState) => s.motionPreference;
