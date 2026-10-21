import { useConnectionStatus } from '../hooks/useConnectionStatus';

interface ConnectionStatusProps {
  className?: string;
  showWhenConnected?: boolean;
  compact?: boolean;
}

export function ConnectionStatus({ 
  className = '', 
  showWhenConnected = false,
  compact = false
}: ConnectionStatusProps) {
  const { 
    status, 
    error, 
    reconnectAttempts, 
    reconnect,
    isConnected,
    isDisconnected
  } = useConnectionStatus();

  // Don't show anything when connected unless explicitly requested
  if (isConnected && !showWhenConnected) {
    return null;
  }

  // Dark terminal glass tokens for each status
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30';
      case 'connecting':
        return 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30';
      case 'reconnecting':
        return 'text-amber-300 bg-amber-500/10 border-amber-500/30';
      case 'disconnected':
        return 'text-rose-300 bg-rose-500/10 border-rose-500/30';
      default:
        return 'text-gray-300 bg-white/5 border-white/10';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected': 
        return (
          <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'connecting':
      case 'reconnecting':
        return (
          <svg className="w-4 h-4 shrink-0 animate-spin text-current" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      case 'disconnected':
        return (
          <svg className="w-4 h-4 shrink-0 text-rose-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': 
        return 'Live updates active';
      case 'connecting': 
        return 'Connecting to live updates...';
      case 'reconnecting': 
        return `Reconnecting... (attempt ${reconnectAttempts})`;
      case 'disconnected': 
        return error || 'Live updates disconnected';
      default: 
        return 'Unknown connection status';
    }
  };

  const paddingClasses = compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-2 text-sm';

  return (
    <div 
      role="status"
      className={`glass-card inline-flex items-center gap-2 rounded-lg border font-medium backdrop-blur-md transition-colors ${paddingClasses} ${getStatusColor()} ${className}`}
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      
      {isDisconnected && (
        <button
          type="button"
          onClick={reconnect}
          className="ml-2 inline-flex items-center rounded border border-rose-400/40 bg-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-200 transition-colors hover:border-rose-400/70 hover:bg-rose-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Compact connection indicator for headers/toolbars
 */
export function ConnectionIndicator({ className = '' }: { className?: string }) {
  const { status, reconnect, isDisconnected } = useConnectionStatus();

  const getIndicatorColor = () => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-blue-500 animate-pulse';
      case 'reconnecting': return 'bg-yellow-500 animate-pulse';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div 
        className={`w-2 h-2 rounded-full ${getIndicatorColor()}`}
        title={`Connection status: ${status}`}
      />
      {isDisconnected && (
        <button
          type="button"
          onClick={reconnect}
          className="text-xs text-rose-300 hover:text-rose-200 underline transition-colors"
          title="Reconnect to live updates"
        >
          Reconnect
        </button>
      )}
    </div>
  );
}
