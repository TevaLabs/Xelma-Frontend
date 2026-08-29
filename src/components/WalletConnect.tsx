import { useEffect, useState } from 'react';
import { useWalletStore } from '../store/useWalletStore';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';
import { toDataURL } from 'qrcode';
import { Loader2, AlertCircle, LogOut, Wallet, ShieldCheck, RefreshCw, Copy, QrCode } from 'lucide-react';
import clsx from 'clsx';

import WalletPicker from './WalletPicker';
import type { WalletId } from '../lib/wallets';
import MaskedBalance from './MaskedBalance';
import NetworkMismatchCard from './NetworkMismatchCard';
import { EXPECTED_NETWORK_LABEL } from '../lib/stellarNetwork';
import { accountUrl, EXPLORER_NETWORK } from '../lib/explorer';
import FreighterMissingCard from './FreighterMissingCard';

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error('Copy command failed');
  }
}


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
  const [showReceivePanel, setShowReceivePanel] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    void checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    let cancelled = false;

    if (!publicKey || !showReceivePanel) return;

    void toDataURL(publicKey, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 6,
      color: {
        dark: '#0A0F1A',
        light: '#FFFFFF',
      },
    })
      .then((dataUrl) => {
        if (!cancelled) {
          setQrDataUrl(dataUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrDataUrl(null);
          toast.error('Could not generate receive QR code');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [publicKey, showReceivePanel]);

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
  const handleCopyPublicKey = async () => {
    if (!publicKey) return;

    try {
      await copyText(publicKey);
      toast.success('Public key copied');
    } catch {
      toast.error('Could not copy public key');
    }
  };

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
              onClick={handleCopyPublicKey}
              className={clsx(
                'shrink-0 p-2 rounded-lg text-[#2C4BFD] dark:text-[#BEC7FE] hover:bg-[#2C4BFD]/10',
                focusRing
              )}
              aria-label="Copy public key"
            >
              <Copy className="w-4 h-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setShowReceivePanel((isOpen) => {
                if (isOpen) setQrDataUrl(null);
                return !isOpen;
              })}
              className={clsx(
                'shrink-0 p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
                focusRing
              )}
              aria-expanded={showReceivePanel}
              aria-controls="wallet-receive-panel"
              aria-label={showReceivePanel ? 'Hide receive QR code' : 'Show receive QR code'}
            >
              <QrCode className="w-4 h-4" aria-hidden />
            </button>
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

        {showReceivePanel && (
          <div
            id="wallet-receive-panel"
            className="rounded-2xl border border-[#BEC7FE]/20 bg-white dark:bg-gray-900 p-4 shadow-sm"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-xl bg-white p-2">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR code for connected Stellar public key"
                    className="h-full w-full"
                  />
                ) : (
                  <Loader2 className="h-6 w-6 animate-spin text-[#2C4BFD]" aria-label="Generating receive QR code" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Receive XLM</h2>
                <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                  Scan this QR code or copy your Stellar public key to receive funds.
                </p>
                <p className="mt-3 break-all rounded-lg bg-gray-100 p-3 font-mono text-xs text-gray-800 dark:bg-gray-950 dark:text-gray-200">
                  {publicKey}
                </p>
                <button
                  type="button"
                  onClick={handleCopyPublicKey}
                  className={clsx(
                    'mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#2C4BFD] px-4 py-2 text-sm font-bold text-white hover:bg-[#1a3bf0]',
                    focusRing
                  )}
                >
                  <Copy className="h-4 w-4" aria-hidden />
                  Copy address
                </button>
              </div>
            </div>
          </div>
        )}

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
    if (errorCode === 'FREIGHTER_UNAVAILABLE' || errorMessage.toLowerCase().includes('freighter is not installed')) {
      return <FreighterMissingCard />;
    }

    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-white">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-red-200">
              {errorCode === 'ACCESS_DENIED' ? 'Wallet Access Denied' : 'Connection Error'}
            </h4>
            <p className="text-xs text-red-100/80 mt-1" role="alert">
              {errorMessage}
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
