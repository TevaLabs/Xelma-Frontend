export type ProfileSettingsValues = {
  avatarUrl: string | null;
  name: string;
  bio: string;
  twitterLink: string;
  streamerMode: boolean;
};

import { apiFetch } from './api';

export async function fetchProfile(jwt: string): Promise<ProfileSettingsValues> {
  return apiFetch<ProfileSettingsValues>('/api/user/profile', {
    method: 'GET',
    headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined,
  });
}

export async function updateProfile(
  jwt: string,
  data: ProfileSettingsValues,
): Promise<ProfileSettingsValues> {
  return apiFetch<ProfileSettingsValues>('/api/user/profile', {
    method: 'PATCH',
    headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined,
    body: JSON.stringify(data),
  });
}
