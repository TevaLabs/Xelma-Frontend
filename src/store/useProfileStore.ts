import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { normalizeApiError } from '../lib/api';
import {
  fetchProfile,
  updateProfile,
  type ProfileSettingsValues,
} from '../lib/profileApi';

const LOCAL_CACHE_KEY = 'profile_settings_cache_v1';

function readLocalCache(): ProfileSettingsValues | null {
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as ProfileSettingsValues;
  } catch {
    return null;
  }
}

function writeLocalCache(data: ProfileSettingsValues) {
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

interface ProfileState {
  profile: ProfileSettingsValues | null;
  isLoading: boolean;
  error: string | null;
  loadProfile: () => Promise<void>;
  saveProfile: (data: ProfileSettingsValues) => Promise<boolean>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,

  loadProfile: async () => {
    set({ isLoading: true, error: null });

    const jwt = useAuthStore.getState().jwt;

    if (!jwt) {
      const cached = readLocalCache();
      set({ profile: cached, isLoading: false, error: null });
      return;
    }

    try {
      const data = await fetchProfile(jwt);
      writeLocalCache(data);
      set({ profile: data, isLoading: false, error: null });
    } catch (err) {
      const normalized = normalizeApiError(err, 'Failed to load profile');
      const cached = readLocalCache();
      set({
        profile: cached,
        isLoading: false,
        error: normalized.message,
      });
    }
  },

  saveProfile: async (data: ProfileSettingsValues): Promise<boolean> => {
    const jwt = useAuthStore.getState().jwt;

    if (!jwt) {
      writeLocalCache(data);
      set({ profile: data });
      return true;
    }

    try {
      const saved = await updateProfile(jwt, data);
      writeLocalCache(saved);
      set({ profile: saved, error: null });
      return true;
    } catch (err) {
      const normalized = normalizeApiError(err, 'Failed to save profile');
      writeLocalCache(data);
      set({
        profile: data,
        error: normalized.message,
      });
      return false;
    }
  },
}));

useAuthStore.subscribe(
  (state) => {
    const jwt = state.jwt;
    if (jwt) {
      useProfileStore.getState().loadProfile();
    }
  },
);
