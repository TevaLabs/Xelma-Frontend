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
      <div className="flex flex-col gap-3 sm:gap-4">
        {networkMismatch && (
          <div
            className="hidden md:flex items-center text-red-600 dark:text-red-400 text-sm font-medium bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded"
            role="status"
          >
            <AlertCircle className="w-4 h-4 mr-1 shrink-0" aria-hidden />
            Switch to {EXPECTED_NETWORK_LABEL} in Freighter
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-[#BEC7FE] dark:border-gray-700 rounded-lg shadow-sm">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {balance ? <span className="sr-only">Balance:</span> : <span className="sr-only">Balance unavailable</span>}
              <MaskedBalance
                value={balance || '—'}
                className=""
                maskedText="••••"
              />
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pr-2 sm:pr-3">
            <div
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs shrink-0"
              aria-hidden
            >
              <Wallet className="w-4 h-4" />
            </div>
            <a
              href={accountUrl(publicKey)}
              target="_blank"
              rel="noopener noreferrer"
              title={publicKey}
              aria-label={`${shortAddress} — view on StellarExpert (${EXPLORER_NETWORK})`}
              className={clsx(
                'text-sm font-medium text-gray-800 dark:text-gray-200 tabular-nums max-w-[7rem] sm:max-w-none truncate',
                'underline-offset-2 hover:underline hover:text-[#2C4BFD] dark:hover:text-[#BEC7FE] rounded',
                focusRing
              )}
            >
              {shortAddress}
            </a>
            {isAuthenticated ? (
              <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" aria-label="Signed in to server" />
            ) : (
              <span className="sr-only">Not signed in to backend</span>
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

        <NetworkMismatchCard />

        {isPendingAuth && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/50 px-4 py-3 text-sm text-blue-900 dark:text-blue-100">
            Wallet connected. Finalizing backend authentication. Please wait a moment before making predictions.
          </div>
        )}

        {isAuthFailure && (
          <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/50 px-4 py-3 text-sm text-red-900 dark:text-red-100" role="alert">
            <p className="font-semibold">Backend authentication failed.</p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              Your wallet is connected, but the server sign-in did not complete. Retry or disconnect and reconnect.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  clearError();
                  void connect();
                }}
                className={clsx(
                  'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-[#2C4BFD] text-white hover:bg-[#1a3bf0]',
                  focusRing
                )}
              >
                <RefreshCw className="w-4 h-4" aria-hidden />
                Retry sign-in
              </button>
              <button
                type="button"
                onClick={disconnect}
                className={clsx(
                  'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30',
                  focusRing
                )}
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
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
    <>
      <button
        type="button"
        onClick={() => setIsPickerOpen(true)}
        disabled={status === 'connecting' || status === 'checking'}
        data-testid="wallet-connect-button"
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
