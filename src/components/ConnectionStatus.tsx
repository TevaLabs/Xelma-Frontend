import { useConnectionStatus } from '../hooks/useConnectionStatus';

interface ConnectionStatusProps {
  className?: string;
  showWhenConnected?: boolean;
}

export function ConnectionStatus({ 
  className = '', 
  showWhenConnected = false 
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

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'bg-emerald-500/10 text-emerald-200 border border-emerald-400/30';
      case 'connecting': return 'bg-sky-500/10 text-sky-200 border border-sky-400/30';
      case 'reconnecting': return 'bg-amber-500/10 text-amber-200 border border-amber-400/30';
      case 'disconnected': return 'bg-red-500/10 text-red-200 border border-red-400/30';
      default: return 'bg-slate-500/10 text-slate-200 border border-slate-400/30';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected': 
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'connecting':
      case 'reconnecting':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      case 'disconnected':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      
      {isDisconnected && (
        <button
          onClick={reconnect}
          className="ml-2 rounded border border-current/40 bg-slate-900/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-100 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
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
      case 'connected': return 'bg-emerald-400';
      case 'connecting': return 'bg-sky-400 animate-pulse';
      case 'reconnecting': return 'bg-amber-400 animate-pulse';
      case 'disconnected': return 'bg-red-400';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className={`w-2 h-2 rounded-full ${getIndicatorColor()}`}
        title={`Connection status: ${status}`}
      />
      {isDisconnected && (
        <button
          onClick={reconnect}
          className="text-xs font-medium text-slate-300 underline decoration-slate-400 underline-offset-2 transition-colors hover:text-white"
          title="Reconnect to live updates"
        >
          Reconnect
        </button>
      )}
    </div>
  );
}