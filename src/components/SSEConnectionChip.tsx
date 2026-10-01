import { useRoundStore } from '../store/useRoundStore';

export function SSEConnectionChip({ className = '' }: { className?: string }) {
  const sseConnection = useRoundStore((state) => state.sseConnection);
  const reconnectSSE = useRoundStore((state) => state.reconnectSSE);

  if (!sseConnection || sseConnection.status === 'connected') {
    return null;
  }

  const getStatusColor = () => {
    switch (sseConnection.status) {
      case 'connecting': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'reconnecting': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'disconnected': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusText = () => {
    switch (sseConnection.status) {
      case 'connecting': return 'Round feed connecting...';
      case 'reconnecting': return `Round feed reconnecting (${sseConnection.reconnectAttempts})`;
      case 'disconnected': return 'Round feed disconnected';
      default: return 'Round feed status unknown';
    }
  };

  return (
    <div
      role="status"
      title={sseConnection.error || getStatusText()}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor()} ${className}`}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      <span>{getStatusText()}</span>
      {sseConnection.status === 'disconnected' && (
        <button
          type="button"
          onClick={reconnectSSE}
          className="ml-1 text-inherit hover:underline focus:outline-none"
          title="Retry round feed connection"
        >
          Retry
        </button>
      )}
    </div>
  );
}
