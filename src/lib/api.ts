import { useAuthStore } from '../store/useAuthStore';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const DEFAULT_TIMEOUT = 30_000;

export interface ApiErrorShape {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, unknown>;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: Record<string, unknown>;

  constructor(message: string, status: number, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
  }

  toUserMessage(): string {
    if (this.status === 401) return 'Session expired. Please sign in again.';
    if (this.status === 403) return 'You do not have permission to perform this action.';
    if (this.status === 404) return 'The requested resource was not found.';
    if (this.status >= 500) return 'A server error occurred. Please try again later.';
    if (this.code === 'NETWORK_ERROR') return 'Network error. Please check your connection.';
    if (this.code === 'TIMEOUT') return 'Request timed out. Please try again.';
    if (this.status >= 400) return this.message;
    return 'An unexpected error occurred.';
  }
}

/**
 * Extract a user-friendly error message from any thrown value.
 * Prefers ApiError.toUserMessage(), falls back to Error.message, then a generic string.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.toUserMessage();
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred.';
}

interface ApiFetchOptions extends RequestInit {
  timeout?: number;
}

export async function apiFetch<T>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const { jwt, clearAuth } = useAuthStore.getState();
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;
  const start = Date.now();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (jwt) {
    headers['Authorization'] = `Bearer ${jwt}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Respect caller-supplied signal by forwarding abort
  if (fetchOptions.signal) {
    fetchOptions.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const duration = Date.now() - start;
    if (import.meta.env.DEV) {
      console.warn(`[API] ${fetchOptions.method ?? 'GET'} ${endpoint} → FAILED (${duration}ms)`);
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Request timed out', 0, 'TIMEOUT');
    }
    throw new ApiError('Network error', 0, 'NETWORK_ERROR');
  } finally {
    clearTimeout(timeoutId);
  }

  const duration = Date.now() - start;

  if (response.status === 401) {
    if (import.meta.env.DEV) {
      console.warn(`[API] ${fetchOptions.method ?? 'GET'} ${endpoint} → 401 (${duration}ms)`);
    }
    clearAuth();
    throw new ApiError('Unauthorized: session expired', 401, 'UNAUTHORIZED');
  }

  if (!response.ok) {
    if (import.meta.env.DEV) {
      console.warn(`[API] ${fetchOptions.method ?? 'GET'} ${endpoint} → ${response.status} (${duration}ms)`);
    }

    // Attempt structured JSON error first
    let message: string | undefined;
    let code: string | undefined;
    let details: Record<string, unknown> | undefined;

    try {
      const body: unknown = await response.json();
      if (body && typeof body === 'object') {
        const obj = body as Record<string, unknown>;
        if (typeof obj.message === 'string') message = obj.message;
        if (typeof obj.code === 'string') code = obj.code;
        if (obj.details && typeof obj.details === 'object') {
          details = obj.details as Record<string, unknown>;
        }
      }
    } catch {
      // JSON parse failed — fall back to text
      try {
        const text = await response.text();
        // Truncate long/HTML responses to prevent UI leakage
        message = text.length > 100 ? undefined : text;
      } catch {
        // ignore
      }
    }

    throw new ApiError(
      message || `Request failed (${response.status})`,
      response.status,
      code,
      details,
    );
  }

  return response.json() as Promise<T>;
}
