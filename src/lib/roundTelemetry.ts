/**
 * Readers for the loose round payloads the round store carries. The API is
 * inconsistent about the field naming for the live player count, so the HUD
 * collapses the known aliases into one number instead of guessing per surface.
 */
const PLAYER_COUNT_KEYS = [
  'playersOnline',
  'activePlayers',
  'onlinePlayers',
  'playerCount',
] as const;

function toCount(value: unknown): number | undefined {
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) return undefined;
  return Math.max(0, Math.floor(parsed));
}

export function getRoundPlayerCount(round: unknown): number | undefined {
  if (!round || typeof round !== 'object') return undefined;

  const source = round as Record<string, unknown>;
  for (const key of PLAYER_COUNT_KEYS) {
    const count = toCount(source[key]);
    if (count !== undefined) return count;
  }
  return undefined;
}

/** Millisecond timestamp for a round's end, or null when it cannot be known. */
export function getRoundEndTimestamp(roundEndsAt: string | number | undefined): number | null {
  const parsed =
    typeof roundEndsAt === 'number'
      ? roundEndsAt
      : roundEndsAt === undefined
        ? NaN
        : Date.parse(roundEndsAt);

  return Number.isFinite(parsed) ? parsed : null;
}
