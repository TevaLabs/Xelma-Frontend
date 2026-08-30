import { StatusChip, type ChipStatus } from './StatusChip';
import { useRoundStore } from '../../store/useRoundStore';
import { useWalletStore, selectIsWalletConnected } from '../../store/useWalletStore';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import { Users, Activity, Wallet, Zap } from 'lucide-react';

interface HudStatusRowProps {
  playerCount?: number;
  className?: string;
}

/**
 * HUD Status Row - displays live status chips for Round, Wallet, Stream, and Playing count.
 * Maps store/hook state to visual status indicators with appropriate colors.
 */
export const HudStatusRow = ({ playerCount, className = '' }: HudStatusRowProps) => {
  const isRoundActive = useRoundStore((s) => s.isRoundActive);
  const isRoundLoading = useRoundStore((s) => s.isLoading);
  const roundError = useRoundStore((s) => s.error);
  const walletStatus = useWalletStore((s) => s.status);
  const isWalletConnected = useWalletStore(selectIsWalletConnected);
  const { status: socketStatus } = useConnectionStatus();

  // Map round state to chip status
  const getRoundStatus = (): ChipStatus => {
    if (roundError) return 'error';
    if (isRoundLoading) return 'loading';
    if (isRoundActive) return 'active';
    return 'inactive';
  };

  // Map wallet state to chip status
  const getWalletStatus = (): ChipStatus => {
    if (walletStatus === 'error') return 'error';
    if (walletStatus === 'connecting' || walletStatus === 'checking') return 'loading';
    if (isWalletConnected) return 'active';
    return 'inactive';
  };

  // Map stream/socket state to chip status
  const getStreamStatus = (): ChipStatus => {
    if (socketStatus === 'connected') return 'active';
    if (socketStatus === 'connecting' || socketStatus === 'reconnecting') return 'loading';
    return 'inactive';
  };

  // Map player count to chip status
  const getPlayingStatus = (): ChipStatus => {
    if (playerCount && playerCount > 0) return 'active';
    return 'inactive';
  };

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
      <StatusChip
        label="Round"
        status={getRoundStatus()}
        icon={<Activity className="w-3.5 h-3.5" />}
      />
      <StatusChip
        label="Wallet"
        status={getWalletStatus()}
        icon={<Wallet className="w-3.5 h-3.5" />}
      />
      <StatusChip
        label="Stream"
        status={getStreamStatus()}
        icon={<Zap className="w-3.5 h-3.5" />}
      />
      <StatusChip
        label="Playing"
        value={playerCount ? String(playerCount) : undefined}
        status={getPlayingStatus()}
        icon={<Users className="w-3.5 h-3.5" />}
      />
    </div>
  );
};

export default HudStatusRow;
