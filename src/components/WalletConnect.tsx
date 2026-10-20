import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWalletStore, type WalletErrorCode } from '../store/useWalletStore';
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

const ERROR_MESSAGE_TO_CODE: Record<string, WalletErrorCode> = {
  'Freighter is not installed or not unlocked. Install Freighter and try again.': 'FREIGHTER_UNAVAILABLE',
  'Wallet access was denied. Click Connect and approve in Freighter.': 'ACCESS_DENIED',
  'Connection timed out. Check Freighter and try again.': 'TIMEOUT',
  'Connection timed out. Unlock Freighter and try again.': 'TIMEOUT',
  'Wallet is connected, but sign-in to the server failed. Try Disconnect and Connect again.': 'AUTH_FAILED',
  'Could not connect wallet. Try again or reinstall Freighter.': 'UNKNOWN',
};

const WalletConnect = () => {
  const { t, i18n } = useTranslation();
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

  const getErrorMessage = () => {
    if (!errorMessage) return '';
    const isEn = (i18n.resolvedLanguage ?? i18n.language)?.startsWith('en');
    if (!isEn) {
      if (errorCode) {
        const codeKey = `wallet.errors.${errorCode}`;
        const translated = t(codeKey, { defaultValue: '' });
        if (translated) return translated;
      }
      const code = ERROR_MESSAGE_TO_CODE[errorMessage];
      if (code) {
        const codeKey = `wallet.errors.${code}`;
        const translated = t(codeKey, { defaultValue: '' });
        if (translated) return translated;
      }
      const translatedMsg = t(errorMessage, { defaultValue: '' });
      if (translatedMsg) return translatedMsg;
    }
    return t(errorMessage, { defaultValue: errorMessage });
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
            {t('wallet.networkMismatch', {
              network: EXPECTED_NETWORK_LABEL,
              defaultValue: `Switch to ${EXPECTED_NETWORK_LABEL} in Freighter`,
            })}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-[#BEC7FE] dark:border-gray-700 rounded-lg shadow-sm">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {balance ? (
                <span className="sr-only">{t('wallet.balance', { defaultValue: 'Balance:' })}</span>
              ) : (
                <span className="sr-only">{t('wallet.balanceUnavailable', { defaultValue: 'Balance unavailable' })}</span>
              )}
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
              <ShieldCheck
                className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0"
                aria-label={t('wallet.signedIn', { defaultValue: 'Signed in to server' })}
              />
            ) : (
              <span className="sr-only">{t('wallet.notSignedIn', { defaultValue: 'Not signed in to backend' })}</span>
            )}
            <button
              type="button"
              onClick={disconnect}
              className={clsx(
                'shrink-0 p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
                focusRing
              )}
              aria-label={t('wallet.disconnectWallet', { defaultValue: 'Disconnect wallet' })}
            >
              <LogOut className="w-4 h-4" aria-hidden />
            </button>
          </div>
        </div>

        <NetworkMismatchCard />

        {isPendingAuth && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/50 px-4 py-3 text-sm text-blue-900 dark:text-blue-100">
            {t('wallet.pendingAuth', {
              defaultValue:
                'Wallet connected. Finalizing backend authentication. Please wait a moment before making predictions.',
            })}
          </div>
        )}

        {isAuthFailure && (
          <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/50 px-4 py-3 text-sm text-red-900 dark:text-red-100" role="alert">
            <p className="font-semibold">{t('wallet.authFailedTitle', { defaultValue: 'Backend authentication failed.' })}</p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {t('wallet.authFailedDescription', {
                defaultValue:
                  'Your wallet is connected, but the server sign-in did not complete. Retry or disconnect and reconnect.',
              })}
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
                {t('wallet.retrySignIn', { defaultValue: 'Retry sign-in' })}
              </button>
              <button
                type="button"
                onClick={disconnect}
                className={clsx(
                  'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30',
                  focusRing
                )}
              >
                {t('wallet.disconnect', { defaultValue: 'Disconnect' })}
              </button>
            </div>
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
      <div className="flex flex-col gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-white">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-red-200">
              {errorCode === 'ACCESS_DENIED'
                ? t('wallet.accessDeniedTitle', { defaultValue: 'Wallet Access Denied' })
                : t('wallet.connectionErrorTitle', { defaultValue: 'Connection Error' })}
            </h4>
            <p className="text-xs text-red-100/80 mt-1" role="alert">
              {getErrorMessage()}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              clearError();
              void connect();
            }}
            className={clsx(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2C4BFD] text-white hover:bg-[#1a3bf0]',
              focusRing
            )}
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden />
            {t('wallet.retry', { defaultValue: 'Retry' })}
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
            <span>{t('wallet.connecting', { defaultValue: 'Connecting…' })}</span>
          </>
        ) : status === 'checking' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            <span>{t('wallet.checking', { defaultValue: 'Checking wallet…' })}</span>
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" aria-hidden />
            <span>{t('wallet.connect', { defaultValue: 'Connect Wallet' })}</span>
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
