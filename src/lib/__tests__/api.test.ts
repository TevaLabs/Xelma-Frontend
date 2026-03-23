import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../store/useAuthStore', () => ({
    useAuthStore: {
        getState: vi.fn(),
    },
}));

import { ApiError, getErrorMessage, apiFetch } from '../api';
import { useAuthStore } from '../../store/useAuthStore';

/* ---- helpers ---- */

const mockClearAuth = vi.fn();

function setAuth(jwt: string | null = null) {
    vi.mocked(useAuthStore.getState).mockReturnValue({ jwt, clearAuth: mockClearAuth } as any);
}

function jsonRes(status: number, body: unknown): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: vi.fn().mockResolvedValue(body),
        text: vi.fn().mockResolvedValue(JSON.stringify(body)),
    } as unknown as Response;
}

function textRes(status: number, text: string): Response {
    return {
        ok: false,
        status,
        json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
        text: vi.fn().mockResolvedValue(text),
    } as unknown as Response;
}

/* ---- ApiError constructor ---- */

describe('ApiError', () => {
    it('stores all fields from constructor', () => {
        const err = new ApiError('bad', 400, 'VALIDATION', { field: 'email' });
        expect(err).toBeInstanceOf(Error);
        expect(err.name).toBe('ApiError');
        expect(err.message).toBe('bad');
        expect(err.status).toBe(400);
        expect(err.code).toBe('VALIDATION');
        expect(err.details).toEqual({ field: 'email' });
    });

    it('leaves optional fields undefined when omitted', () => {
        const err = new ApiError('fail', 500);
        expect(err.code).toBeUndefined();
        expect(err.details).toBeUndefined();
    });
});

/* ---- toUserMessage ---- */

describe('ApiError.toUserMessage', () => {
    it.each([
        [401, undefined, 'Session expired. Please sign in again.'],
        [403, undefined, 'You do not have permission to perform this action.'],
        [404, undefined, 'The requested resource was not found.'],
        [500, undefined, 'A server error occurred. Please try again later.'],
        [502, undefined, 'A server error occurred. Please try again later.'],
        [0, 'NETWORK_ERROR', 'Network error. Please check your connection.'],
        [0, 'TIMEOUT', 'Request timed out. Please try again.'],
    ] as const)('status=%i code=%s → "%s"', (status, code, expected) => {
        expect(new ApiError('x', status, code ?? undefined).toUserMessage()).toBe(expected);
    });

    it('returns raw message for other 4xx errors', () => {
        expect(new ApiError('Email invalid', 422).toUserMessage()).toBe('Email invalid');
    });

    it('returns generic fallback for status 0 without error code', () => {
        expect(new ApiError('x', 0).toUserMessage()).toBe('An unexpected error occurred.');
    });
});

/* ---- getErrorMessage ---- */

describe('getErrorMessage', () => {
    it('uses toUserMessage for ApiError', () => {
        expect(getErrorMessage(new ApiError('x', 404))).toBe('The requested resource was not found.');
    });

    it('uses message for plain Error', () => {
        expect(getErrorMessage(new Error('boom'))).toBe('boom');
    });

    it.each([null, undefined, 42, 'str'])('returns generic string for %p', (v) => {
        expect(getErrorMessage(v)).toBe('An unexpected error occurred.');
    });
});

/* ---- apiFetch ---- */

describe('apiFetch', () => {
    beforeEach(() => {
        mockClearAuth.mockReset();
        setAuth(null);
        vi.stubGlobal('fetch', vi.fn());
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('returns parsed JSON on 200', async () => {
        const body = { id: 1 };
        vi.mocked(fetch).mockResolvedValue(jsonRes(200, body));
        expect(await apiFetch('/api/x')).toEqual(body);
    });

    it('throws ApiError with structured fields on 400 JSON body', async () => {
        vi.mocked(fetch).mockResolvedValue(
            jsonRes(400, { message: 'bad email', code: 'VALIDATE', details: { f: 'email' } }),
        );
        const err = await apiFetch('/api/x').catch((e) => e) as ApiError;
        expect(err).toBeInstanceOf(ApiError);
        expect(err.status).toBe(400);
        expect(err.message).toBe('bad email');
        expect(err.code).toBe('VALIDATE');
        expect(err.details).toEqual({ f: 'email' });
    });

    it('falls back to generic message when JSON body lacks message field', async () => {
        vi.mocked(fetch).mockResolvedValue(jsonRes(400, { error: 'something' }));
        const err = await apiFetch('/api/x').catch((e) => e) as ApiError;
        expect(err.message).toBe('Request failed (400)');
    });

    it('uses short non-JSON text as message', async () => {
        vi.mocked(fetch).mockResolvedValue(textRes(400, 'Bad input'));
        const err = await apiFetch('/api/x').catch((e) => e) as ApiError;
        expect(err.message).toBe('Bad input');
    });

    it('truncates long non-JSON text to prevent UI leakage', async () => {
        vi.mocked(fetch).mockResolvedValue(textRes(400, 'x'.repeat(101)));
        const err = await apiFetch('/api/x').catch((e) => e) as ApiError;
        expect(err.message).toBe('Request failed (400)');
    });

    it('throws ApiError(401) and clears auth', async () => {
        vi.mocked(fetch).mockResolvedValue(jsonRes(401, {}));
        const err = await apiFetch('/api/x').catch((e) => e) as ApiError;
        expect(err.status).toBe(401);
        expect(err.code).toBe('UNAUTHORIZED');
        expect(mockClearAuth).toHaveBeenCalledOnce();
    });

    it('throws ApiError on 500', async () => {
        vi.mocked(fetch).mockResolvedValue(jsonRes(500, { message: 'boom' }));
        const err = await apiFetch('/api/x').catch((e) => e) as ApiError;
        expect(err.status).toBe(500);
        expect(err.message).toBe('boom');
    });

    it('normalizes network errors to NETWORK_ERROR', async () => {
        vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));
        const err = await apiFetch('/api/x').catch((e) => e) as ApiError;
        expect(err).toBeInstanceOf(ApiError);
        expect(err.status).toBe(0);
        expect(err.code).toBe('NETWORK_ERROR');
    });

    it('normalizes AbortError to TIMEOUT', async () => {
        vi.mocked(fetch).mockRejectedValue(new DOMException('aborted', 'AbortError'));
        const err = await apiFetch('/api/x').catch((e) => e) as ApiError;
        expect(err).toBeInstanceOf(ApiError);
        expect(err.status).toBe(0);
        expect(err.code).toBe('TIMEOUT');
    });

    it('attaches Bearer token when jwt exists', async () => {
        setAuth('my-jwt');
        vi.mocked(fetch).mockResolvedValue(jsonRes(200, {}));
        await apiFetch('/api/x');
        const headers = vi.mocked(fetch).mock.calls[0][1]?.headers as Record<string, string>;
        expect(headers['Authorization']).toBe('Bearer my-jwt');
    });

    it('omits Authorization when jwt is null', async () => {
        setAuth(null);
        vi.mocked(fetch).mockResolvedValue(jsonRes(200, {}));
        await apiFetch('/api/x');
        const headers = vi.mocked(fetch).mock.calls[0][1]?.headers as Record<string, string>;
        expect(headers['Authorization']).toBeUndefined();
    });
});
