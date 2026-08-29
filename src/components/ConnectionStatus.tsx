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
      case 'connected': return 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/30';
      case 'connecting': return 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/30';
      case 'reconnecting': return 'text-yellow-800 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/30';
      case 'disconnected': return 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30';
      default: return 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800/30';
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
          className="ml-2 px-2 py-1 text-xs bg-white border border-current rounded hover:bg-opacity-80 transition-colors"
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
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className={`w-2 h-2 rounded-full ${getIndicatorColor()}`}
        title={`Connection status: ${status}`}
      />
      {isDisconnected && (
        <button
          onClick={reconnect}
          className="text-xs text-gray-600 hover:text-gray-800 underline"
          title="Reconnect to live updates"
        >
          Reconnect
        </button>
      )}
    </div>
  );
}