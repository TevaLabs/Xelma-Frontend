import { apiFetch } from './api';

export type ProfileSettingsValues = {
  avatarUrl: string | null;
  name: string;
  bio: string;
  twitterLink: string;
  streamerMode: boolean;
};

export async function fetchProfile(): Promise<ProfileSettingsValues> {
  return apiFetch<ProfileSettingsValues>('/api/user/profile');
}

export async function updateProfile(
  data: ProfileSettingsValues,
): Promise<ProfileSettingsValues> {
  return apiFetch<ProfileSettingsValues>('/api/user/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
