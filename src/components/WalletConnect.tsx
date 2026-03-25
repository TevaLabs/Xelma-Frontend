import { useEffect } from 'react';
import { useWalletStore } from '../store/useWalletStore';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, AlertCircle, LogOut, Wallet, ShieldCheck, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900';

const WalletConnect = () => {
  const {
    publicKey,
    balance,
    status,
    errorMessage,
    networkMismatch,
    connect,
    disconnect,
    checkConnection,
    clearError,
  } = useWalletStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    void checkConnection();
  }, [checkConnection]);

  const shortAddress = publicKey
    ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
    : '';

  if (publicKey && status === 'connected') {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        {networkMismatch && (
          <div
            className="hidden md:flex items-center text-red-600 dark:text-red-400 text-sm font-medium bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded"
            role="status"
          >
            <AlertCircle className="w-4 h-4 mr-1 shrink-0" aria-hidden />
            Switch to Testnet in Freighter
          </div>
        )}

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-[#BEC7FE] dark:border-gray-700 rounded-lg shadow-sm">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {balance ? (
              <>
                <span className="sr-only">Balance: </span>
                {balance}
              </>
            ) : (
              <>
                <span className="sr-only">Balance unavailable</span>
                <span aria-hidden>—</span>
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pr-2 sm:pr-3">
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs shrink-0"
            aria-hidden
          >
            <Wallet className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 tabular-nums max-w-[7rem] sm:max-w-none truncate">
            {shortAddress}
          </span>
          {isAuthenticated && (
            <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" aria-label="Signed in to server" />
          )}
          <button
            type="button"
            onClick={disconnect}
            className={clsx(
              'shrink-0 p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
              focusRing
            )}
            aria-label="Disconnect wallet"
          >
            <LogOut className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error' && errorMessage) {
    return (
      <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
        <p
          className="text-xs sm:text-sm text-red-700 dark:text-red-300 max-w-[220px] sm:max-w-xs text-right sm:text-left"
          role="alert"
        >
          {errorMessage}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              clearError();
              void connect();
            }}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-[#2C4BFD] text-white hover:bg-[#1a3bf0]',
              focusRing
            )}
          >
            <RefreshCw className="w-4 h-4" aria-hidden />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void connect()}
      disabled={status === 'connecting' || status === 'checking'}
      className={clsx(
        'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200',
        'bg-[#2C4BFD] hover:bg-[#1a3bf0] text-white shadow-lg shadow-blue-500/20',
        'disabled:opacity-70 disabled:cursor-not-allowed',
        focusRing
      )}
      aria-busy={status === 'connecting' || status === 'checking'}
    >
      {status === 'connecting' ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          <span>Connecting…</span>
        </>
      ) : status === 'checking' ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          <span>Checking wallet…</span>
        </>
      ) : (
        <>
          <Wallet className="w-4 h-4" aria-hidden />
          <span>Connect Wallet</span>
        </>
      )}
    </button>
  );
};

export default WalletConnect;
