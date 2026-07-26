import ContributorTaskPlaceholder from '../ContributorTaskPlaceholder';
import { useRoundStore } from '../../store/useRoundStore';
import { useWalletStore, selectIsWalletConnected } from '../../store/useWalletStore';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';

interface HudStatusRowProps {
  playerCount?: number;
  className?: string;
}

/**
 * STUBBED for Stellar Wave hackathon — rebuild HUD status chips row.
 * Data wiring is still here: round / wallet / stream / player count.
 * Rebuild StatusChip visuals or a custom chip row with brand tokens.
 */
export const HudStatusRow = ({ playerCount, className = '' }: HudStatusRowProps) => {
  const isRoundActive = useRoundStore((s) => s.isRoundActive);
  const isRoundLoading = useRoundStore((s) => s.isLoading);
  const walletStatus = useWalletStore((s) => s.status);
  const isWalletConnected = useWalletStore(selectIsWalletConnected);
  const { status: socketStatus } = useConnectionStatus();

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${className}`}
      aria-label="Platform status"
      role="status"
      data-round-active={String(isRoundActive)}
      data-round-loading={String(isRoundLoading)}
      data-wallet-status={walletStatus}
      data-wallet-connected={String(isWalletConnected)}
      data-stream-status={socketStatus}
      data-player-count={playerCount ?? ''}
    >
      <ContributorTaskPlaceholder
        className="w-full"
        title="Rebuild HUD Status Row"
        issueHint="Render chips for Round, Wallet, Stream, and Playing count using StatusChip (or a new chip). Map store state above to status colors."
      />
    </div>
  );
};

export default HudStatusRow;
