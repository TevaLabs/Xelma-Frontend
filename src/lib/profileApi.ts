export type ProfileSettingsValues = {
  avatarUrl: string | null;
  name: string;
  bio: string;
  twitterLink: string;
  streamerMode: boolean;
};

import { apiFetch } from './api';

export async function fetchProfile(): Promise<ProfileSettingsValues> {
  return apiFetch<ProfileSettingsValues>('/api/user/profile', {
    method: 'GET',
  });
}

export async function updateProfile(
  data: ProfileSettingsValues,
): Promise<ProfileSettingsValues> {
  return apiFetch<ProfileSettingsValues>('/api/user/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
