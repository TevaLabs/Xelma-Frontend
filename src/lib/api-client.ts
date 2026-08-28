import type { Guide, Tip } from '../types/education';
import type { NotificationItem } from '../types/notification';
import { apiFetch } from './api';
import {
    validateApiResponse,
    RoundSchema,
    UserPredictionSchema,
    LeaderboardEntrySchema,
    ApiValidationError,
} from './api-schemas';

export { ApiError } from './api';

export const educationApi = {
    getGuides: () => apiFetch<Guide[]>('/api/education/guides'),
    getTip: () => apiFetch<Tip | null>('/api/education/tip'),
};

export interface Round {
    id: string | number;
    status?: string;
    startsAt?: string;
    endsAt?: string;
    resolvedAt?: string;
    [key: string]: unknown;
}

export const roundsApi = {
    getActive: async () => {
        try {
            const response = await apiFetch<Round | null>('/api/rounds/active');
            if (response === null) return null;
            validateApiResponse('/api/rounds/active', RoundSchema, response);
            return response;
        } catch (error) {
            if (error instanceof ApiValidationError) {
                console.error('Round data validation failed:', error.message);
                throw new Error('Received invalid round data from server. Please try again later.');
            }
            throw error;
        }
    },
};

export interface UserPrediction {
    id: string | number;
    direction?: string;
    stake?: string | number;
    exactPrice?: string | number;
    roundId?: string | number;
    status?: string;
    createdAt?: string;
    [key: string]: unknown;
}

export interface SubmitPredictionRequest {
    direction: 'UP' | 'DOWN';
    stake: string;
    exactPrice?: string;
    isLegend: boolean;
}

type UserPredictionsResponse =
    | UserPrediction[]
    | {
        predictions?: UserPrediction[];
        data?: UserPrediction[];
    };

function normalizeArrayResponse<T>(
    response: T[] | Record<string, unknown>,
    keys: string[]
): T[] {
    if (Array.isArray(response)) {
        return response;
    }

    for (const key of keys) {
        const value = response[key];
        if (Array.isArray(value)) {
            return value as T[];
        }
    }

    return [];
}

function normalizeUserPredictions(response: UserPredictionsResponse): UserPrediction[] {
    return normalizeArrayResponse<UserPrediction>(
        response as UserPrediction[] | Record<string, unknown>,
        ['predictions', 'data']
    );
}

export const predictionsApi = {
    getUserHistory: async (userId: string) => {
        try {
            const response = await apiFetch<UserPredictionsResponse>(`/api/predictions/user/${encodeURIComponent(userId)}`);
            const normalized = normalizeUserPredictions(response);
            // Validate each prediction item
            normalized.forEach(prediction => {
                validateApiResponse('/api/predictions/user', UserPredictionSchema, prediction);
            });
            return normalized;
        } catch (error) {
            if (error instanceof ApiValidationError) {
                console.error('Prediction history validation failed:', error.message);
                throw new Error('Received invalid prediction data from server. Please try again later.');
            }
            throw error;
        }
    },
    submit: async (prediction: SubmitPredictionRequest) => {
        return apiFetch<UserPrediction>('/api/predictions/submit', {
            method: 'POST',
            body: JSON.stringify(prediction),
        });
    },
};

export const notificationsApi = {
    getUnreadCount: () => apiFetch<{ unread: number }>('/api/notifications/unread-count'),
    getNotifications: () => apiFetch<NotificationItem[]>('/api/notifications'),
    markAsRead: (id: string) => apiFetch<void>(`/api/notifications/${id}/read`, { method: 'POST' }),
    markAllAsRead: () => apiFetch<void>('/api/notifications/read-all', { method: 'POST' }),
};


export interface PricePoint {
    time: number;
    value: number;
}

type PriceResponse =
    | PricePoint[]
    | {
        prices?: PricePoint[];
        data?: PricePoint[];
        history?: PricePoint[];
        price?: number | string;
        value?: number | string;
        timestamp?: number | string;
        time?: number | string;
    };

function toPricePoint(value: unknown): PricePoint | null {
    if (!value || typeof value !== 'object') return null;
    const record = value as Record<string, unknown>;
    const rawTime = record.time ?? record.timestamp;
    const rawPrice = record.value ?? record.price;

    const time = typeof rawTime === 'string' ? Number(rawTime) : rawTime;
    const price = typeof rawPrice === 'string' ? Number(rawPrice) : rawPrice;

    if (!Number.isFinite(time) || !Number.isFinite(price)) return null;
    const normalizedTime = (time as number) > 9999999999 ? Math.floor((time as number) / 1000) : Math.floor(time as number);
    return { time: normalizedTime, value: price as number };
}

function normalizePriceResponse(response: PriceResponse): PricePoint[] {
    if (Array.isArray(response)) {
        return response.map(toPricePoint).filter((point): point is PricePoint => point !== null);
    }

    const history = response.prices ?? response.data ?? response.history;
    if (Array.isArray(history)) {
        return history.map(toPricePoint).filter((point): point is PricePoint => point !== null);
    }

    const singlePoint = toPricePoint(response);
    return singlePoint ? [singlePoint] : [];
}

export const priceApi = {
    getPriceSeries: async () => {
        const response = await apiFetch<PriceResponse>('/api/price');
        const normalized = normalizePriceResponse(response);
        return normalized.sort((a, b) => a.time - b.time);
    },
};

/** Leaderboard entry from GET /api/leaderboard?mode=UP_DOWN */
export interface LeaderboardEntry {
    id?: string | number;
    userId?: string;
    username?: string;
    name?: string;
    avatar?: string | null;
    xlm?: number;
    score?: number;
    [key: string]: unknown;
}

type LeaderboardResponse = LeaderboardEntry[] | { data?: LeaderboardEntry[]; leaderboard?: LeaderboardEntry[] };

function normalizeLeaderboard(response: LeaderboardResponse): LeaderboardEntry[] {
    return normalizeArrayResponse<LeaderboardEntry>(
        response as LeaderboardEntry[] | Record<string, unknown>,
        ['data', 'leaderboard']
    );
}

export const leaderboardApi = {
    getLeaderboard: async (mode: string = 'UP_DOWN') => {
        try {
            const response = await apiFetch<LeaderboardResponse>(`/api/leaderboard?mode=${encodeURIComponent(mode)}`);
            const normalized = normalizeLeaderboard(response);
            // Validate each leaderboard entry
            normalized.forEach(entry => {
                validateApiResponse('/api/leaderboard', LeaderboardEntrySchema, entry);
            });
            return normalized;
        } catch (error) {
            if (error instanceof ApiValidationError) {
                console.error('Leaderboard validation failed:', error.message);
                throw new Error('Received invalid leaderboard data from server. Please try again later.');
            }
            throw error;
        }
    },
};

/** Aggregate network metrics shown on the landing page. */
export interface NetworkStats {
    /** Total rounds resolved across the platform. */
    totalRounds: number;
    /** Total practice volume distributed, in vXLM. */
    vXlmDistributed: number;
    /** Count of active predictors. */
    activePlayers: number;
}

type NetworkStatsResponse = Record<string, unknown> | { data?: Record<string, unknown> };

function firstFiniteNumber(record: Record<string, unknown>, keys: string[]): number | null {
    for (const key of keys) {
        const raw = record[key];
        const value = typeof raw === 'string' ? Number(raw) : raw;
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }
    }
    return null;
}

/**
 * Normalize a backend stats payload into {@link NetworkStats}, tolerating the
 * various key names a backend might use. Returns `null` when no usable numeric
 * field is present so the caller can fall back to mock data.
 */
export function normalizeNetworkStats(response: NetworkStatsResponse): NetworkStats | null {
    const source =
        response && typeof response === 'object' && 'data' in response && response.data
            ? (response.data as Record<string, unknown>)
            : (response as Record<string, unknown>);

    if (!source || typeof source !== 'object') {
        return null;
    }

    const totalRounds = firstFiniteNumber(source, ['totalRounds', 'roundsResolved', 'rounds']);
    const vXlmDistributed = firstFiniteNumber(source, [
        'vXlmDistributed',
        'practiceVolume',
        'volume',
    ]);
    const activePlayers = firstFiniteNumber(source, [
        'activePlayers',
        'activePredictors',
        'players',
    ]);

    if (totalRounds === null && vXlmDistributed === null && activePlayers === null) {
        return null;
    }

    return {
        totalRounds: totalRounds ?? 0,
        vXlmDistributed: vXlmDistributed ?? 0,
        activePlayers: activePlayers ?? 0,
    };
}

export interface UserStats {
    balance: number;
    pendingWinnings: number;
    totalWins: number;
    totalLosses: number;
    currentStreak: number;
    xp: number;
    rank: string;
}

type UserStatsResponse = Record<string, unknown> | { data?: Record<string, unknown> };

export function normalizeUserStats(response: UserStatsResponse): UserStats | null {
    const source =
        response && typeof response === 'object' && 'data' in response && response.data
            ? (response.data as Record<string, unknown>)
            : (response as Record<string, unknown>);

    if (!source || typeof source !== 'object') {
        return null;
    }

    const balance = firstFiniteNumber(source, ['balance', 'practiceBalance', 'walletBalance']);
    const pendingWinnings = firstFiniteNumber(source, ['pendingWinnings', 'winnings', 'unclaimedWinnings']);
    const totalWins = firstFiniteNumber(source, ['totalWins', 'wins', 'correctPredictions']);
    const totalLosses = firstFiniteNumber(source, ['totalLosses', 'losses', 'incorrectPredictions']);
    const currentStreak = firstFiniteNumber(source, ['currentStreak', 'streak', 'accuracyStreak']);
    const xp = firstFiniteNumber(source, ['xp', 'experience', 'experiencePoints']);
    const rank = typeof source.rank === 'string' ? source.rank : 'Rookie';

    if (balance === null && totalWins === null && totalLosses === null && xp === null) {
        return null;
    }

    return {
        balance: balance ?? 0,
        pendingWinnings: pendingWinnings ?? 0,
        totalWins: totalWins ?? 0,
        totalLosses: totalLosses ?? 0,
        currentStreak: currentStreak ?? 0,
        xp: xp ?? 0,
        rank,
    };
}

export const statsApi = {
    getNetworkStats: async (): Promise<NetworkStats | null> => {
        const response = await apiFetch<NetworkStatsResponse>('/api/stats/network');
        return normalizeNetworkStats(response);
    },
    getUserStats: async (): Promise<UserStats | null> => {
        const response = await apiFetch<UserStatsResponse>('/api/stats');
        return normalizeUserStats(response);
    },
};

/** Pool asset identifier for the liquidity pools page. */
export type PoolAsset = 'BTC' | 'ETH' | 'XLM';

/** Liquidity pool stats for a single asset. */
export interface PoolStats {
    asset: PoolAsset;
    totalVolume: number;
    upDownPool: {
        total: number;
        up: number;
        down: number;
    };
    precisionPool: {
        total: number;
        predictions: number;
    };
    historicalYield: number;
}

type PoolsResponse = PoolStats[] | { data?: PoolStats[]; pools?: PoolStats[] };

/**
 * Liquidity pool stats used by the Pools page. Accepts a plain array or a
 * `{ data }` / `{ pools }` wrapper, mirroring the other api-client endpoints.
 */
export const poolsApi = {
    getPools: async (options: { signal?: AbortSignal } = {}) => {
        const response = await apiFetch<PoolsResponse>('/api/pools', {
            signal: options.signal,
        });
        return normalizeArrayResponse<PoolStats>(
            response as PoolStats[] | Record<string, unknown>,
            ['data', 'pools']
        );
    },
};
