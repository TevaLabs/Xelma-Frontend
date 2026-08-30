/**
 * Builds a human-readable trend summary from a point series, e.g.
 * "BTC total volume trend: up 12.3% over the period". Used as the
 * accessible text alternative for the visual sparkline.
 */
export function getTrendLabel(seriesLabel: string, points: number[]): string {
  if (points.length < 2) {
    return `${seriesLabel} trend: not enough data`;
  }

  const first = points[0];
  const last = points[points.length - 1];
  const delta = first === 0 ? 0 : ((last - first) / Math.abs(first)) * 100;

  if (Math.abs(delta) < 0.05) {
    return `${seriesLabel} trend: flat over the period`;
  }

  const direction = delta > 0 ? 'up' : 'down';
  return `${seriesLabel} trend: ${direction} ${Math.abs(delta).toFixed(1)}% over the period`;
}
