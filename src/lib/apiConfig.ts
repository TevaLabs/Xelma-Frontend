import { API_BASE_URL, SOCKET_URL } from './config';

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export function getSocketUrl(): string {
  return SOCKET_URL;
}

export function getSseUrl(): string {
  return API_BASE_URL;
}
