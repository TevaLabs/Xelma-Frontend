import { z } from 'zod';

/**
 * Zod schemas for validating API responses
 * These schemas ensure that API payloads match expected structures before
 * updating the application state, providing runtime type safety.
 */

// Round schema
export const RoundSchema = z.object({
    id: z.union([z.string(), z.number()]),
    status: z.string().optional(),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    resolvedAt: z.string().optional(),
}).passthrough();

export type ValidatedRound = z.infer<typeof RoundSchema>;

// UserPrediction schema
export const UserPredictionSchema = z.object({
    id: z.union([z.string(), z.number()]),
    direction: z.string().optional(),
    stake: z.union([z.string(), z.number()]).optional(),
    exactPrice: z.union([z.string(), z.number()]).optional(),
    roundId: z.union([z.string(), z.number()]).optional(),
    status: z.string().optional(),
    createdAt: z.string().optional(),
}).passthrough();

export type ValidatedUserPrediction = z.infer<typeof UserPredictionSchema>;

// LeaderboardEntry schema
export const LeaderboardEntrySchema = z.object({
    id: z.union([z.string(), z.number()]).optional(),
    userId: z.string().optional(),
    username: z.string().optional(),
    name: z.string().optional(),
    avatar: z.string().nullable().optional(),
    xlm: z.number().optional(),
    score: z.number().optional(),
    // Issue #660 — identity fields the API may return instead of (or alongside)
    // `id`, which is not guaranteed to be the wallet G-address.
    publicKey: z.string().optional(),
    walletAddress: z.string().optional(),
    address: z.string().optional(),
}).passthrough();

export type ValidatedLeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

/**
 * Structural view of a raw leaderboard entry (issue #660).
 *
 * Backends return the player's wallet in any of `publicKey` / `walletAddress`
 * / `address`, while `id` may be an opaque database id — never assume `id` is
 * the G-address. The index signature keeps passthrough extras compatible.
 */
export interface LeaderboardEntryLike {
    id?: string | number;
    userId?: string;
    username?: string;
    name?: string;
    avatar?: string | null;
    xlm?: number;
    score?: number;
    publicKey?: string;
    walletAddress?: string;
    address?: string;
    [key: string]: unknown;
}

/**
 * Leaderboard row after normalization (issue #660).
 *
 * `walletAddress` carries the wallet G-address extracted from whichever
 * identity field the API provided, or `null` when the entry exposes none.
 * `id` stays the raw backend id and must not be compared against a wallet.
 */
export interface MappedLeaderboardUser {
    id: string;
    walletAddress: string | null;
    name: string;
    avatar: string;
    xlm: number;
}

const WALLET_ADDRESS_KEYS = ['publicKey', 'walletAddress', 'address'] as const;

/** First non-empty wallet-address field on the entry, if any. */
function extractWalletAddress(entry: LeaderboardEntryLike): string | null {
    for (const key of WALLET_ADDRESS_KEYS) {
        const value = entry[key];
        if (typeof value === 'string' && value.length > 0) {
            return value;
        }
    }
    return null;
}

/**
 * Normalizes a raw leaderboard entry into a display row (issue #660).
 *
 * Keeps the opaque backend `id` for React keys and separates the wallet
 * address so components can match the connected user without assuming
 * `id === publicKey`.
 */
export function mapEntryToUser(
    entry: LeaderboardEntryLike,
    index: number,
    fallbackAvatar: string,
): MappedLeaderboardUser {
    const id = String(entry.id ?? entry.userId ?? index);
    const name = entry.username ?? entry.name ?? 'Anonymous';
    const xlm = Number(entry.xlm ?? entry.score ?? 0);
    const avatar = entry.avatar && typeof entry.avatar === 'string' ? entry.avatar : fallbackAvatar;
    return { id, walletAddress: extractWalletAddress(entry), name, avatar, xlm };
}

// Array response schemas
export const RoundsArraySchema = z.array(RoundSchema.nullable());
export const PredictionsArraySchema = z.array(UserPredictionSchema.nullable());
export const LeaderboardArraySchema = z.array(LeaderboardEntrySchema.nullable());

// Response wrapper schemas (for APIs that return { data: [...] })
export const RoundsResponseSchema = z.union([
    RoundsArraySchema,
    z.object({
        predictions: RoundsArraySchema.optional(),
        data: RoundsArraySchema.optional(),
    }),
]);

export const PredictionsResponseSchema = z.union([
    PredictionsArraySchema,
    z.object({
        predictions: PredictionsArraySchema.optional(),
        data: PredictionsArraySchema.optional(),
    }),
]);

export const LeaderboardResponseSchema = z.union([
    LeaderboardArraySchema,
    z.object({
        data: LeaderboardArraySchema.optional(),
        leaderboard: LeaderboardArraySchema.optional(),
    }),
]);

/**
 * Validation error class for API schema mismatches
 */
export class ApiValidationError extends Error {
    endpoint: string;
    schemaErrors: z.ZodError;

    constructor(
        endpoint: string,
        schemaErrors: z.ZodError,
        message?: string
    ) {
        super(
            message ||
            `API response validation failed for ${endpoint}. ` +
            `Schema mismatch: ${schemaErrors.issues.map(i => i.path.join('.') + ' - ' + i.message).join(', ')}`
        );
        this.endpoint = endpoint;
        this.schemaErrors = schemaErrors;
        this.name = 'ApiValidationError';
    }
}

/**
 * Validates API response against a Zod schema
 * Throws ApiValidationError if validation fails
 */
export function validateApiResponse<T>(
    endpoint: string,
    schema: z.ZodSchema<T>,
    data: unknown
): T {
    const result = schema.safeParse(data);
    
    if (!result.success) {
        throw new ApiValidationError(endpoint, result.error);
    }
    
    return result.data;
}
