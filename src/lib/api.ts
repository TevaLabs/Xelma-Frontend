import { toast } from 'sonner';
import { useAuthStore } from '../store/useAuthStore';
import { useWalletStore } from '../store/useWalletStore';
import { notifyRateLimited } from './rate-limit-toast';
import { getApiBaseUrl } from './apiConfig';

const API_BASE = getApiBaseUrl();
const DEFAULT_TIMEOUT_MS = 15000;

export interface ApiErrorShape {
  message: string;
  status: number;
  code?: string;
  details?: unknown;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  endpoint?: string;
  /** Parsed `Retry-After` value (seconds) for 429 responses, when provided. */
  retryAfterSeconds?: number | null;

  constructor(message: string, status: number, code?: string, details?: unknown, endpoint?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.endpoint = endpoint;
    this.name = 'ApiError';
  }
}

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

interface ErrorPayload {
  message?: unknown;
  error?: unknown;
  code?: unknown;
  details?: unknown;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

async function parseErrorPayload(response: Response): Promise<ErrorPayload | null> {
  try {
    const clone = response.clone();
    const json = await clone.json();
    return (json && typeof json === 'object') ? (json as ErrorPayload) : null;
  } catch {
    return null;
  }
}

function defaultMessageForStatus(status: number, endpoint: string): string {
  if (status === 400) return 'Invalid request. Please check your input and try again.';
  if (status === 401) return 'Your session has expired. Please reconnect and try again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'Requested resource was not found.';
  if (status === 429) return 'Too many requests. Please slow down and try again shortly.';
  if (status >= 500) return 'Server error. Please try again shortly.';
  return `Request failed: ${endpoint}`;
}

/**
 * Parse an HTTP `Retry-After` header into seconds.
 *
 * Supports both the delta-seconds form (`"120"`) and the HTTP-date form
 * (`"Wed, 21 Oct 2015 07:28:00 GMT"`). Returns `null` when absent or unparseable.
 */
function parseRetryAfter(response: Response, now: number = Date.now()): number | null {
  const header = response.headers.get('Retry-After');
  if (!header) return null;

  const seconds = Number(header);
  if (Number.isFinite(seconds)) {
    return Math.max(0, Math.round(seconds));
  }

  const dateMs = Date.parse(header);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, Math.round((dateMs - now) / 1000));
  }

  return null;
}

function createApiError(endpoint: string, status: number, payload: ErrorPayload | null): ApiError {
  const message =
    asString(payload?.message) ??
    asString(payload?.error) ??
    defaultMessageForStatus(status, endpoint);
  const code = asString(payload?.code) ?? undefined;
  const details = payload?.details;
  return new ApiError(message, status, code, details, endpoint);
}

export function normalizeApiError(error: unknown, fallbackMessage = 'Something went wrong. Please try again.'): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (error instanceof Error) {
    return new ApiError(error.message || fallbackMessage, 0, 'UNKNOWN', undefined);
  }
  return new ApiError(fallbackMessage, 0, 'UNKNOWN', undefined);
}

/** Stable toast id so concurrent 401/403 responses update a single toast. */
const SESSION_EXPIRED_TOAST_ID = 'session-expired';

function notifySessionExpired(): void {
  toast.error('Session expired', {
    id: SESSION_EXPIRED_TOAST_ID,
    description: 'Your session has expired. Please reconnect your wallet.',
    action: {
      label: 'Reconnect',
      onClick: () => {
        window.location.href = '/';
      },
    },
    duration: Infinity,
  });
}

export async function apiFetch<T>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const { jwt, clearAuth } = useAuthStore.getState();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (jwt) {
    headers['Authorization'] = `Bearer ${jwt}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const requestOptions: RequestInit = { ...options };
  delete (requestOptions as Record<string, unknown>).timeoutMs;

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...requestOptions,
      headers,
      signal: requestOptions.signal ?? controller.signal,
    });

    if (response.status === 401 || response.status === 403) {
      clearAuth();
      useWalletStore.getState().reset();
      notifySessionExpired();
    }

    if (!response.ok) {
      const payload = await parseErrorPayload(response);
      const apiError = createApiError(endpoint, response.status, payload);
      if (response.status === 429) {
        apiError.retryAfterSeconds = parseRetryAfter(response);
        notifyRateLimited(apiError.retryAfterSeconds);
      }
      if (import.meta.env.DEV) {
        console.debug('[apiFetch:error]', {
          endpoint,
          status: apiError.status,
          code: apiError.code,
          message: apiError.message,
        });
      }
      throw apiError;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 0, 'TIMEOUT', undefined, endpoint);
    }
    throw normalizeApiError(error, 'Network error. Please check your connection and try again.');
  } finally {
    clearTimeout(timeout);
  }
}
