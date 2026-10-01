import { useEffect, useState } from 'react';
import { useWalletStore } from '../store/useWalletStore';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, AlertCircle, LogOut, Wallet, ShieldCheck, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

import WalletPicker from './WalletPicker';
import type { WalletId } from '../lib/wallets';
import MaskedBalance from './MaskedBalance';
import NetworkMismatchCard from './NetworkMismatchCard';
import { EXPECTED_NETWORK_LABEL } from '../lib/stellarNetwork';
import { accountUrl, EXPLORER_NETWORK } from '../lib/explorer';
import FreighterMissingCard from './FreighterMissingCard';


const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900';

const WalletConnect = () => {
  const {
    publicKey,
    balance,
    status,
    errorMessage,
    errorCode,
    networkMismatch,
    connect,
    disconnect,
    checkConnection,
    clearError,
  } = useWalletStore();
  const { isAuthenticated } = useAuthStore();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickedWallet, setPickedWallet] = useState<WalletId | null>(null);

  useEffect(() => {
    void checkConnection();
  }, [checkConnection]);

  // Only Freighter is wired today; the picker disables every other adapter, so a
  // selection always resolves to the store's Freighter connect flow.
  const handleSelectWallet = async (id: WalletId) => {
    setPickedWallet(id);
    try {
      await connect();
      setIsPickerOpen(false);
    } finally {
      setPickedWallet(null);
    }
  };

  const shortAddress = publicKey
    ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
    : '';

  const isAuthFailure = status === 'connected' && errorCode === 'AUTH_FAILED';
  const isPendingAuth = status === 'connected' && !isAuthenticated && !errorMessage;

  if (publicKey && status === 'connected') {
    return (
      <div className="flex flex-col gap-2">
        {networkMismatch && (
          <div
            className="hidden md:flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md border border-red-200 dark:border-red-800"
            role="status"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden />
            Switch to {EXPECTED_NETWORK_LABEL}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-800 border border-[#BEC7FE] dark:border-gray-700 rounded-md text-xs font-semibold text-gray-800 dark:text-gray-200">
            {balance ? <span className="sr-only">Balance:</span> : <span className="sr-only">Balance unavailable</span>}
            <MaskedBalance
              value={balance || '—'}
              className=""
              maskedText="••••"
            />
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
            <div
              className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white shrink-0"
              aria-hidden
            >
              <Wallet className="w-3 h-3" />
            </div>
            <a
              href={accountUrl(publicKey)}
              target="_blank"
              rel="noopener noreferrer"
              title={publicKey}
              aria-label={`${shortAddress} — view on StellarExpert (${EXPLORER_NETWORK})`}
              className={clsx(
                'text-xs font-medium text-gray-800 dark:text-gray-200 tabular-nums max-w-[5rem] sm:max-w-[6rem] truncate',
                'underline-offset-2 hover:underline hover:text-[#2C4BFD] dark:hover:text-[#BEC7FE]',
                focusRing
              )}
            >
              {shortAddress}
            </a>
            {isAuthenticated ? (
              <ShieldCheck className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0" aria-label="Signed in to server" />
            ) : (
              <span className="sr-only">Not signed in to backend</span>
            )}
            <button
              type="button"
              onClick={disconnect}
              className={clsx(
                'shrink-0 p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
                focusRing
              )}
              aria-label="Disconnect wallet"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden />
            </button>
          </div>
        </div>

        <NetworkMismatchCard />

        {isPendingAuth && (
          <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-800">
            Finalizing authentication…
          </div>
        )}

        {isAuthFailure && (
          <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md border border-red-200 dark:border-red-800" role="alert">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden />
            <span>Auth failed</span>
            <button
              type="button"
              onClick={() => {
                clearError();
                void connect();
              }}
              className={clsx(
                'shrink-0 text-xs font-medium text-[#2C4BFD] hover:underline',
                focusRing
              )}
            >
              Retry
            </button>
            <button
              type="button"
              onClick={disconnect}
              className={clsx(
                'shrink-0 text-xs font-medium text-red-600 dark:text-red-400 hover:underline',
                focusRing
              )}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  if (status === 'error' && errorMessage) {
    if (errorCode === 'FREIGHTER_UNAVAILABLE' || errorMessage.toLowerCase().includes('freighter is not installed')) {
      return <FreighterMissingCard />;
    }

    return (
      <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md border border-red-200 dark:border-red-800">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden />
        <span className="truncate max-w-[12rem]" role="alert">
          {errorCode === 'ACCESS_DENIED' ? 'Access denied' : 'Connection error'}
        </span>
        <button
          type="button"
          onClick={() => {
            clearError();
            void connect();
          }}
          className={clsx(
            'shrink-0 text-xs font-medium text-[#2C4BFD] hover:underline',
            focusRing
          )}
          aria-label="Retry connection"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsPickerOpen(true)}
        disabled={status === 'connecting' || status === 'checking'}
        className={clsx(
          'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200',
          'bg-[#2C4BFD] hover:bg-[#1a3bf0] text-white',
          'disabled:opacity-70 disabled:cursor-not-allowed',
          focusRing
        )}
        aria-busy={status === 'connecting' || status === 'checking'}
      >
        {status === 'connecting' ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" aria-hidden />
            <span>Connecting…</span>
          </>
        ) : status === 'checking' ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" aria-hidden />
            <span>Checking…</span>
          </>
        ) : (
          <>
            <Wallet className="w-3 h-3" aria-hidden />
            <span>Connect</span>
          </>
        )}
      </button>

      <WalletPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleSelectWallet}
        isConnecting={status === 'connecting'}
        connectingId={pickedWallet}
      />
    </>
  );
};

export default WalletConnect;
