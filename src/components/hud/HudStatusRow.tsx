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
 * HUD Status Row — live Round / Stream / Wallet / Playing chips for the
 * dashboard terminal. State comes from the round store, the wallet store and
 * the socket hook; each chip also carries a spoken status so colour is never
 * the only signal.
 */
export const HudStatusRow = ({ playerCount, className = '' }: HudStatusRowProps) => {
  const isRoundActive = useRoundStore((s) => s.isRoundActive);
  const isRoundLoading = useRoundStore((s) => s.isLoading);
  const roundError = useRoundStore((s) => s.error);
  const walletStatus = useWalletStore((s) => s.status);
  const isWalletConnected = useWalletStore(selectIsWalletConnected);
  const { status: socketStatus } = useConnectionStatus();

  const roundChip: { status: ChipStatus; text: string } = roundError
    ? { status: 'error', text: 'Round lookup failed' }
    : isRoundLoading
      ? { status: 'loading', text: 'Syncing round' }
      : isRoundActive
        ? { status: 'active', text: 'Live' }
        : { status: 'inactive', text: 'No active round' };

  const walletChip: { status: ChipStatus; text: string } =
    walletStatus === 'error'
      ? { status: 'error', text: 'Wallet error' }
      : walletStatus === 'connecting' || walletStatus === 'checking'
        ? { status: 'loading', text: 'Connecting' }
        : isWalletConnected
          ? { status: 'active', text: 'Connected' }
          : { status: 'inactive', text: 'Not connected' };

  const streamChip: { status: ChipStatus; text: string } =
    socketStatus === 'connected'
      ? { status: 'active', text: 'Live feed' }
      : socketStatus === 'connecting' || socketStatus === 'reconnecting'
        ? { status: 'loading', text: 'Reconnecting' }
        : { status: 'inactive', text: 'Offline' };

  const hasPlayerCount = playerCount !== undefined && playerCount > 0;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${className}`}
      role="group"
      aria-label="Platform status"
      data-round-active={String(isRoundActive)}
      data-round-loading={String(isRoundLoading)}
      data-wallet-status={walletStatus}
      data-wallet-connected={String(isWalletConnected)}
      data-stream-status={socketStatus}
      data-player-count={playerCount ?? ''}
    >
      <StatusChip
        label="Round"
        status={roundChip.status}
        statusText={roundChip.text}
        icon={<Activity className="h-3.5 w-3.5" />}
      />
      <StatusChip
        label="Stream"
        status={streamChip.status}
        statusText={streamChip.text}
        icon={<Zap className="h-3.5 w-3.5" />}
      />
      <StatusChip
        label="Wallet"
        status={walletChip.status}
        statusText={walletChip.text}
        icon={<Wallet className="h-3.5 w-3.5" />}
      />
      <StatusChip
        label="Playing"
        status={hasPlayerCount ? 'active' : 'inactive'}
        statusText={hasPlayerCount ? `${playerCount} playing now` : 'Awaiting live count'}
        value={hasPlayerCount ? String(playerCount) : undefined}
        icon={<Users className="h-3.5 w-3.5" />}
      />
    </div>
  );
};

export default HudStatusRow;
