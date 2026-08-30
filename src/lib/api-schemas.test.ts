import { describe, it, expect, vi } from 'vitest';
import {
    RoundSchema,
    UserPredictionSchema,
    LeaderboardEntrySchema,
    validateApiResponse,
    ApiValidationError,
} from './api-schemas';

describe('API Schemas Validation', () => {
    describe('RoundSchema', () => {
        it('should validate a valid round object', () => {
            const validRound = {
                id: 'round-123',
                status: 'live',
                startsAt: '2024-01-01T00:00:00Z',
                endsAt: '2024-01-01T01:00:00Z',
                resolvedAt: '2024-01-01T02:00:00Z',
            };

            const result = RoundSchema.safeParse(validRound);
            expect(result.success).toBe(true);
        });

        it('should validate a round with numeric id', () => {
            const validRound = {
                id: 123,
                status: 'upcoming',
            };

            const result = RoundSchema.safeParse(validRound);
            expect(result.success).toBe(true);
        });

        it('should reject a round without required id field', () => {
            const invalidRound = {
                status: 'live',
                startsAt: '2024-01-01T00:00:00Z',
            };

            const result = RoundSchema.safeParse(invalidRound);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues).toHaveLength(1);
                expect(result.error.issues[0].path).toContain('id');
            }
        });

        it('should reject a round with invalid id type', () => {
            const invalidRound = {
                id: { invalid: 'object' },
                status: 'live',
            };

            const result = RoundSchema.safeParse(invalidRound);
            expect(result.success).toBe(false);
        });

        it('should allow additional properties via passthrough', () => {
            const roundWithExtras = {
                id: 'round-123',
                status: 'live',
                customField: 'some value',
                anotherField: 42,
            };

            const result = RoundSchema.safeParse(roundWithExtras);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.customField).toBe('some value');
                expect(result.data.anotherField).toBe(42);
            }
        });
    });

    describe('UserPredictionSchema', () => {
        it('should validate a valid prediction object', () => {
            const validPrediction = {
                id: 'pred-123',
                direction: 'UP',
                stake: '100',
                exactPrice: '1.23',
                roundId: 'round-456',
                status: 'pending',
                createdAt: '2024-01-01T00:00:00Z',
            };

            const result = UserPredictionSchema.safeParse(validPrediction);
            expect(result.success).toBe(true);
        });

        it('should validate a prediction with numeric stake', () => {
            const validPrediction = {
                id: 123,
                direction: 'DOWN',
                stake: 100,
            };

            const result = UserPredictionSchema.safeParse(validPrediction);
            expect(result.success).toBe(true);
        });

        it('should reject a prediction without required id field', () => {
            const invalidPrediction = {
                direction: 'UP',
                stake: '100',
            };

            const result = UserPredictionSchema.safeParse(invalidPrediction);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues).toHaveLength(1);
                expect(result.error.issues[0].path).toContain('id');
            }
        });

        it('should reject a prediction with invalid direction type', () => {
            const invalidPrediction = {
                id: 'pred-123',
                direction: { invalid: 'object' },
            };

            const result = UserPredictionSchema.safeParse(invalidPrediction);
            expect(result.success).toBe(false);
        });
    });

    describe('LeaderboardEntrySchema', () => {
        it('should validate a valid leaderboard entry', () => {
            const validEntry = {
                id: 'user-123',
                userId: 'user-abc',
                username: 'testuser',
                name: 'Test User',
                avatar: 'https://example.com/avatar.png',
                xlm: 1000,
                score: 500,
            };

            const result = LeaderboardEntrySchema.safeParse(validEntry);
            expect(result.success).toBe(true);
        });

        it('should validate a leaderboard entry with minimal fields', () => {
            const minimalEntry = {
                username: 'testuser',
                score: 100,
            };

            const result = LeaderboardEntrySchema.safeParse(minimalEntry);
            expect(result.success).toBe(true);
        });

        it('should validate a leaderboard entry with null avatar', () => {
            const entryWithNullAvatar = {
                id: 'user-123',
                username: 'testuser',
                avatar: null,
            };

            const result = LeaderboardEntrySchema.safeParse(entryWithNullAvatar);
            expect(result.success).toBe(true);
        });

        it('should reject a leaderboard entry with invalid xlm type', () => {
            const invalidEntry = {
                id: 'user-123',
                xlm: 'not a number',
            };

            const result = LeaderboardEntrySchema.safeParse(invalidEntry);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues).toHaveLength(1);
                expect(result.error.issues[0].path).toContain('xlm');
            }
        });
    });

    describe('validateApiResponse', () => {
        it('should return validated data for valid input', () => {
            const validData = {
                id: 'round-123',
                status: 'live',
            };

            const result = validateApiResponse('/test', RoundSchema, validData);
            expect(result).toEqual(validData);
        });

        it('should throw ApiValidationError for invalid input', () => {
            const invalidData = {
                status: 'live',
                // Missing required 'id' field
            };

            expect(() => {
                validateApiResponse('/test', RoundSchema, invalidData);
            }).toThrow(ApiValidationError);
        });

        it('should include endpoint in ApiValidationError message', () => {
            const invalidData = {
                status: 'live',
            };

            try {
                validateApiResponse('/api/rounds/active', RoundSchema, invalidData);
                expect.fail('Should have thrown ApiValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ApiValidationError);
                if (error instanceof ApiValidationError) {
                    expect(error.endpoint).toBe('/api/rounds/active');
                    expect(error.message).toContain('/api/rounds/active');
                }
            }
        });

        it('should include schema errors in ApiValidationError', () => {
            const invalidData = {
                status: 'live',
            };

            try {
                validateApiResponse('/test', RoundSchema, invalidData);
                expect.fail('Should have thrown ApiValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ApiValidationError);
                if (error instanceof ApiValidationError) {
                    expect(error.schemaErrors).toBeDefined();
                    expect(error.schemaErrors.issues.length).toBeGreaterThan(0);
                }
            }
        });
    });

    describe('ApiValidationError', () => {
        it('should create error with default message', () => {
            const mockZodError = {
                issues: [{ path: ['id'], message: 'Required' }],
            } as any;

            const error = new ApiValidationError('/test', mockZodError);
            expect(error.name).toBe('ApiValidationError');
            expect(error.endpoint).toBe('/test');
            expect(error.message).toContain('/test');
            expect(error.message).toContain('Required');
        });

        it('should create error with custom message', () => {
            const mockZodError = {
                issues: [{ path: ['id'], message: 'Required' }],
            } as any;

            const customMessage = 'Custom error message';
            const error = new ApiValidationError('/test', mockZodError, customMessage);
            expect(error.message).toBe(customMessage);
        });
    });
});
