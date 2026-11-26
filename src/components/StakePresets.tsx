import {
  STAKE_PRESETS,
  fromStroops,
  isClamped,
  presetAmount,
  spendable,
} from "../lib/stakePresets";

interface StakePresetsProps {
  /** Wallet balance of the staking token (string or number); null while unknown. */
  balance: string | number | null;
  connected: boolean;
  onSelect: (amount: string) => void;
  /** Amount to keep back (for example Stellar's minimum balance + fees when staking XLM). */
  reserve?: string | number;
  className?: string;
}

export function StakePresets({
  balance,
  connected,
  onSelect,
  reserve = 0,
  className = "",
}: StakePresetsProps) {
  const avail = spendable(balance, reserve);
  const unavailable = !connected || balance === null || avail === 0n;

  return (
    <div role="group" aria-label="Quick stake amounts" className={`flex flex-wrap gap-2 ${className}`}>
      {STAKE_PRESETS.map((preset) => {
        const amount = presetAmount(preset, balance, reserve);
        const clamped = isClamped(preset, balance, reserve);
        const title = !connected
          ? "Connect your wallet to use quick stake"
          : clamped
            ? `Limited to your available balance (${fromStroops(avail)})`
            : undefined;

        return (
          <button
            key={preset.id}
            type="button"
            disabled={unavailable}
            title={title}
            aria-label={
              preset.kind === "max" ? "Stake maximum amount" : `Stake ${preset.label}${clamped ? " (limited to balance)" : ""}`
            }
            onClick={() => onSelect(amount)}
            className="rounded-md border border-line px-3 py-1 text-sm hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
