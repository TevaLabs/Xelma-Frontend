/**
 * Accessible alt text for a user-uploaded avatar image.
 * Falls back to a generic label when no display name is available.
 */
export function avatarAltText(displayName?: string | null) {
  const name = displayName?.trim();
  return name ? `${name}'s avatar` : 'Player avatar';
}
