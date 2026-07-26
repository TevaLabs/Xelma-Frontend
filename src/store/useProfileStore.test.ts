import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProfileStore } from './useProfileStore';
import type { ProfileSettingsValues } from '../lib/profileApi';

// Mock the auth store
const mockAuthStore = {
  jwt: null,
};

vi.mock('./useAuthStore', () => ({
  useAuthStore: {
    getState: () => mockAuthStore,
    subscribe: vi.fn(() => () => {}),
  },
}));

// Mock the profile API
vi.mock('../lib/profileApi', () => ({
  fetchProfile: vi.fn(),
  updateProfile: vi.fn(),
}));

import { fetchProfile, updateProfile } from '../lib/profileApi';

const mockProfile: ProfileSettingsValues = {
  username: 'testuser',
  email: 'test@example.com',
  notifications: {
    roundStart: true,
    roundEnd: false,
    predictions: true,
  },
  privacy: {
    showInLeaderboard: true,
    shareStats: false,
  },
};

describe('useProfileStore', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    mockAuthStore.jwt = null;
    useProfileStore.setState({
      profile: null,
      isLoading: false,
      error: null,
    });
  });

  describe('initial state', () => {
    it('starts with empty profile state', () => {
      const state = useProfileStore.getState();
      expect(state.profile).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('loadProfile', () => {
    describe('when not authenticated', () => {
      beforeEach(() => {
        mockAuthStore.jwt = null;
      });

      it('loads profile from local cache when available', async () => {
        localStorage.setItem('profile_settings_cache_v1', JSON.stringify(mockProfile));

        await useProfileStore.getState().loadProfile();

        const state = useProfileStore.getState();
        expect(state.profile).toEqual(mockProfile);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBeNull();
        expect(fetchProfile).not.toHaveBeenCalled();
      });

      it('sets null profile when no cache available', async () => {
        await useProfileStore.getState().loadProfile();

        const state = useProfileStore.getState();
        expect(state.profile).toBeNull();
        expect(state.isLoading).toBe(false);
        expect(state.error).toBeNull();
      });

      it('handles corrupted cache gracefully', async () => {
        localStorage.setItem('profile_settings_cache_v1', 'invalid-json');

        await useProfileStore.getState().loadProfile();

        const state = useProfileStore.getState();
        expect(state.profile).toBeNull();
        expect(state.error).toBeNull();
      });
    });

    describe('when authenticated', () => {
      beforeEach(() => {
        mockAuthStore.jwt = 'valid-jwt-token';
      });

      it('successfully loads profile from API', async () => {
        vi.mocked(fetchProfile).mockResolvedValue(mockProfile);

        await useProfileStore.getState().loadProfile();

        const state = useProfileStore.getState();
        expect(state.profile).toEqual(mockProfile);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBeNull();
        expect(fetchProfile).toHaveBeenCalledWith('valid-jwt-token');
      });

      it('caches profile data locally after successful fetch', async () => {
        vi.mocked(fetchProfile).mockResolvedValue(mockProfile);

        await useProfileStore.getState().loadProfile();

        const cached = localStorage.getItem('profile_settings_cache_v1');
        expect(cached).toBe(JSON.stringify(mockProfile));
      });

      it('sets loading state during fetch', async () => {
        let resolvePromise: (value: ProfileSettingsValues) => void;
        const promise = new Promise<ProfileSettingsValues>((resolve) => {
          resolvePromise = resolve;
        });
        vi.mocked(fetchProfile).mockReturnValue(promise);

        const loadPromise = useProfileStore.getState().loadProfile();

        // Check loading state
        expect(useProfileStore.getState().isLoading).toBe(true);
        expect(useProfileStore.getState().error).toBeNull();

        resolvePromise!(mockProfile);
        await loadPromise;

        expect(useProfileStore.getState().isLoading).toBe(false);
      });

      it('handles API error and falls back to cache', async () => {
        localStorage.setItem('profile_settings_cache_v1', JSON.stringify(mockProfile));
        const error = new Error('API error');
        vi.mocked(fetchProfile).mockRejectedValue(error);

        await useProfileStore.getState().loadProfile();

        const state = useProfileStore.getState();
        expect(state.profile).toEqual(mockProfile); // Falls back to cache
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe('API error');
      });

      it('handles API error with no cache available', async () => {
        const error = new Error('Network error');
        vi.mocked(fetchProfile).mockRejectedValue(error);

        await useProfileStore.getState().loadProfile();

        const state = useProfileStore.getState();
        expect(state.profile).toBeNull();
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe('Network error');
      });

      it('clears previous error on successful load', async () => {
        useProfileStore.setState({ error: 'Previous error' });
        vi.mocked(fetchProfile).mockResolvedValue(mockProfile);

        await useProfileStore.getState().loadProfile();

        expect(useProfileStore.getState().error).toBeNull();
      });
    });
  });

  describe('saveProfile', () => {
    const updatedProfile: ProfileSettingsValues = {
      ...mockProfile,
      username: 'updateduser',
    };

    describe('when not authenticated', () => {
      beforeEach(() => {
        mockAuthStore.jwt = null;
      });

      it('saves profile to local cache only', async () => {
        const result = await useProfileStore.getState().saveProfile(updatedProfile);

        expect(result).toBe(true);
        expect(useProfileStore.getState().profile).toEqual(updatedProfile);
        expect(updateProfile).not.toHaveBeenCalled();

        const cached = localStorage.getItem('profile_settings_cache_v1');
        expect(cached).toBe(JSON.stringify(updatedProfile));
      });
    });

    describe('when authenticated', () => {
      beforeEach(() => {
        mockAuthStore.jwt = 'valid-jwt-token';
      });

      it('successfully saves profile via API', async () => {
        vi.mocked(updateProfile).mockResolvedValue(updatedProfile);

        const result = await useProfileStore.getState().saveProfile(updatedProfile);

        expect(result).toBe(true);
        expect(useProfileStore.getState().profile).toEqual(updatedProfile);
        expect(useProfileStore.getState().error).toBeNull();
        expect(updateProfile).toHaveBeenCalledWith('valid-jwt-token', updatedProfile);

        const cached = localStorage.getItem('profile_settings_cache_v1');
        expect(cached).toBe(JSON.stringify(updatedProfile));
      });

      it('handles API error but still caches locally', async () => {
        const error = new Error('Save failed');
        vi.mocked(updateProfile).mockRejectedValue(error);

        const result = await useProfileStore.getState().saveProfile(updatedProfile);

        expect(result).toBe(false);
        expect(useProfileStore.getState().profile).toEqual(updatedProfile);
        expect(useProfileStore.getState().error).toBe('Save failed');

        // Should still cache locally
        const cached = localStorage.getItem('profile_settings_cache_v1');
        expect(cached).toBe(JSON.stringify(updatedProfile));
      });

      it('handles API returning different data than sent', async () => {
        const serverResponse = { ...updatedProfile, username: 'server-modified' };
        vi.mocked(updateProfile).mockResolvedValue(serverResponse);

        const result = await useProfileStore.getState().saveProfile(updatedProfile);

        expect(result).toBe(true);
        expect(useProfileStore.getState().profile).toEqual(serverResponse);

        const cached = localStorage.getItem('profile_settings_cache_v1');
        expect(cached).toBe(JSON.stringify(serverResponse));
      });

      it('clears previous error on successful save', async () => {
        useProfileStore.setState({ error: 'Previous error' });
        vi.mocked(updateProfile).mockResolvedValue(updatedProfile);

        await useProfileStore.getState().saveProfile(updatedProfile);

        expect(useProfileStore.getState().error).toBeNull();
      });
    });
  });

  describe('local cache management', () => {
    it('handles localStorage write errors gracefully', async () => {
      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage full');
      });

      mockAuthStore.jwt = null;
      const result = await useProfileStore.getState().saveProfile(mockProfile);

      expect(result).toBe(true);
      expect(useProfileStore.getState().profile).toEqual(mockProfile);

      // Restore original
      localStorage.setItem = originalSetItem;
    });

    it('handles localStorage read errors gracefully', async () => {
      // Mock localStorage.getItem to throw
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage error');
      });

      mockAuthStore.jwt = null;
      await useProfileStore.getState().loadProfile();

      expect(useProfileStore.getState().profile).toBeNull();
      expect(useProfileStore.getState().error).toBeNull();

      // Restore original
      localStorage.getItem = originalGetItem;
    });

    it('ignores non-object cached data', async () => {
      localStorage.setItem('profile_settings_cache_v1', JSON.stringify('string-value'));

      mockAuthStore.jwt = null;
      await useProfileStore.getState().loadProfile();

      expect(useProfileStore.getState().profile).toBeNull();
    });

    it('ignores null cached data', async () => {
      localStorage.setItem('profile_settings_cache_v1', JSON.stringify(null));

      mockAuthStore.jwt = null;
      await useProfileStore.getState().loadProfile();

      expect(useProfileStore.getState().profile).toBeNull();
    });
  });

  describe('concurrent operations', () => {
    beforeEach(() => {
      mockAuthStore.jwt = 'valid-jwt-token';
    });

    const updatedProfile: ProfileSettingsValues = {
      ...mockProfile,
      username: 'updateduser',
    };

    it('handles concurrent load operations', async () => {
      vi.mocked(fetchProfile).mockResolvedValue(mockProfile);

      const promises = [
        useProfileStore.getState().loadProfile(),
        useProfileStore.getState().loadProfile(),
        useProfileStore.getState().loadProfile(),
      ];

      await Promise.all(promises);

      expect(vi.mocked(fetchProfile)).toHaveBeenCalledTimes(3);
      expect(useProfileStore.getState().profile).toEqual(mockProfile);
    });

    it('handles concurrent save operations', async () => {
      vi.mocked(updateProfile).mockResolvedValue(mockProfile);

      const promises = [
        useProfileStore.getState().saveProfile(mockProfile),
        useProfileStore.getState().saveProfile(updatedProfile),
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual([true, true]);
      expect(vi.mocked(updateProfile)).toHaveBeenCalledTimes(2);
    });

    it('handles save during load operation', async () => {
      let resolveLoad: (value: ProfileSettingsValues) => void;
      const loadPromise = new Promise<ProfileSettingsValues>((resolve) => {
        resolveLoad = resolve;
      });
      vi.mocked(fetchProfile).mockReturnValue(loadPromise);
      vi.mocked(updateProfile).mockResolvedValue(updatedProfile);

      const loadOperation = useProfileStore.getState().loadProfile();
      const saveResult = await useProfileStore.getState().saveProfile(updatedProfile);

      expect(saveResult).toBe(true);

      resolveLoad!(mockProfile);
      await loadOperation;

      // Load should have taken precedence since it completed after save
      expect(useProfileStore.getState().profile).toEqual(mockProfile);
    });
  });

  describe('edge cases', () => {
    it('handles empty profile data', async () => {
      const emptyProfile = {} as ProfileSettingsValues;
      mockAuthStore.jwt = null;

      const result = await useProfileStore.getState().saveProfile(emptyProfile);

      expect(result).toBe(true);
      expect(useProfileStore.getState().profile).toEqual(emptyProfile);
    });

    it('handles profile with undefined values', async () => {
      const profileWithUndefined = {
        username: 'test',
        email: undefined,
        notifications: undefined,
      } as unknown as ProfileSettingsValues;

      mockAuthStore.jwt = null;
      const result = await useProfileStore.getState().saveProfile(profileWithUndefined);

      expect(result).toBe(true);
      expect(useProfileStore.getState().profile).toEqual(profileWithUndefined);
    });
  });
});