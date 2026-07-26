import type { PricePoint } from "../lib/api-client";

export function mergePricePoints(existing: PricePoint[], incoming: PricePoint[]): PricePoint[] {
  if (incoming.length === 0) return existing;

  const merged = new Map<number, PricePoint>();
  for (const point of existing) merged.set(point.time, point);

  let changed = false;
  for (const point of incoming) {
    const current = merged.get(point.time);
    if (!current || current.value !== point.value) {
      merged.set(point.time, point);
      changed = true;
    }
  }

  if (!changed) return existing;

  return Array.from(merged.values())
    .sort((a, b) => a.time - b.time)
    .slice(-500);
}
