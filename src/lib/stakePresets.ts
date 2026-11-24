const SCALE = 10_000_000n; // 7 decimals; ADAPT if the staking token differs

export type StakePreset =
  | { id: string; label: string; kind: "fixed"; amount: string }
  | { id: string; label: string; kind: "max" };

// ADAPT: change values to whatever the issue/design specifies.
export const STAKE_PRESETS: StakePreset[] = [
  { id: "p10", label: "10", kind: "fixed", amount: "10" },
  { id: "p50", label: "50", kind: "fixed", amount: "50" },
  { id: "p100", label: "100", kind: "fixed", amount: "100" },
  { id: "max", label: "MAX", kind: "max" },
];

/** "12.5" or 12.5 -> 125000000n. Invalid or negative input -> 0n. */
export function toStroops(value: string | number | null | undefined): bigint {
  if (value === null || value === undefined) return 0n;
  const s = (typeof value === "number" ? value.toFixed(7) : value).trim();
  if (!/^\d+(\.\d+)?$/.test(s)) return 0n;
  const [whole, frac = ""] = s.split(".");
  return BigInt(whole) * SCALE + BigInt(frac.slice(0, 7).padEnd(7, "0"));
}

/** 125000000n -> "12.5" */
export function fromStroops(v: bigint): string {
  const whole = v / SCALE;
  const frac = (v % SCALE).toString().padStart(7, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : `${whole}`;
}

/** Spendable amount = balance minus an optional reserve, never below zero. */
export function spendable(balance: string | number | null, reserve: string | number = 0): bigint {
  const b = toStroops(balance);
  const r = toStroops(reserve);
  return b > r ? b - r : 0n;
}

/**
 * Amount a preset should fill in. Fixed presets are clamped to what the user can spend;
 * MAX is everything spendable.
 */
export function presetAmount(
  preset: StakePreset,
  balance: string | number | null,
  reserve: string | number = 0,
): string {
  const avail = spendable(balance, reserve);
  if (preset.kind === "max") return fromStroops(avail);
  const want = toStroops(preset.amount);
  return fromStroops(want < avail ? want : avail);
}

export function isClamped(
  preset: StakePreset,
  balance: string | number | null,
  reserve: string | number = 0,
): boolean {
  return preset.kind === "fixed" && toStroops(preset.amount) > spendable(balance, reserve);
}
