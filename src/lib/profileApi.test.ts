import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock apiFetch using a factory function
vi.mock('./api', () => {
  return {
    apiFetch: vi.fn(),
  };
});

import { fetchProfile, updateProfile, type ProfileSettingsValues } from './profileApi';
import * as api from './api';

const mockApiFetch = vi.mocked(api.apiFetch);

const mockProfileData: ProfileSettingsValues = {
  avatarUrl: 'https://example.com/avatar.jpg',
  name: 'Test User',
  bio: 'Test bio',
  twitterLink: 'https://twitter.com/testuser',
  streamerMode: false,
};

describe('profileApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchProfile', () => {
    it('uses apiFetch to fetch profile', async () => {
      mockApiFetch.mockResolvedValue(mockProfileData);

      const result = await fetchProfile();

      expect(mockApiFetch).toHaveBeenCalledWith('/api/user/profile', expect.any(Object));
      expect(result).toEqual(mockProfileData);
    });

    it('throws on 401 response (session expired)', async () => {
      const error = new Error('Unauthorized');
      (error as any).status = 401;
      mockApiFetch.mockRejectedValue(error);

      await expect(fetchProfile()).rejects.toThrow('Unauthorized');
      expect(mockApiFetch).toHaveBeenCalledWith('/api/user/profile', expect.any(Object));
    });

    it('includes correct HTTP method', async () => {
      mockApiFetch.mockResolvedValue(mockProfileData);

      await fetchProfile();

      const callArgs = mockApiFetch.mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        method: 'GET',
      });
    });
  });

  describe('updateProfile', () => {
    it('uses apiFetch to update profile', async () => {
      mockApiFetch.mockResolvedValue(mockProfileData);

      const result = await updateProfile(mockProfileData);

      expect(mockApiFetch).toHaveBeenCalledWith('/api/user/profile', expect.any(Object));
      expect(result).toEqual(mockProfileData);
    });

    it('sends profile data in request body', async () => {
      mockApiFetch.mockResolvedValue(mockProfileData);

      await updateProfile(mockProfileData);

      const callArgs = mockApiFetch.mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        method: 'PATCH',
        body: JSON.stringify(mockProfileData),
      });
    });

    it('throws on 401 response (session expired)', async () => {
      const error = new Error('Unauthorized');
      (error as any).status = 401;
      mockApiFetch.mockRejectedValue(error);

      await expect(updateProfile(mockProfileData)).rejects.toThrow(
        'Unauthorized'
      );
      expect(mockApiFetch).toHaveBeenCalledWith('/api/user/profile', expect.any(Object));
    });

    it('throws on 429 response (rate limited)', async () => {
      const error = new Error('Too many requests');
      (error as any).status = 429;
      mockApiFetch.mockRejectedValue(error);

      await expect(updateProfile(mockProfileData)).rejects.toThrow(
        'Too many requests'
      );
    });
  });
});
