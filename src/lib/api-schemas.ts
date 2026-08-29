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
}).passthrough();

export type ValidatedLeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

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
