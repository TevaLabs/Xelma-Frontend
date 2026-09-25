import { useEffect, useState } from 'react';
import { useWalletStore } from '../store/useWalletStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  Loader2,
  AlertCircle,
  LogOut,
  Wallet,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  QrCode,
  X,
} from 'lucide-react';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import clsx from 'clsx';

import WalletPicker from './WalletPicker';
import type { WalletId } from '../lib/wallets';
import MaskedBalance from './MaskedBalance';
import NetworkMismatchCard from './NetworkMismatchCard';
import { EXPECTED_NETWORK_LABEL } from '../lib/stellarNetwork';
import { accountUrl, EXPLORER_NETWORK } from '../lib/explorer';
import FreighterMissingCard from './FreighterMissingCard';
import { copyToClipboard } from '../lib/utils';
import { FRIENDBOT_ENABLED, friendbotUrl } from '../lib/friendbot';


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
  const [copied, setCopied] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrSvg, setQrSvg] = useState<string | null>(null);

  useEffect(() => {
    void checkConnection();
  }, [checkConnection]);

  // Render the receive QR only while the panel is open, and only for the
  // currently connected key (regenerate when either changes).
  useEffect(() => {
    if (!isQrOpen || !publicKey) {
      setQrSvg(null);
      return;
    }
    let cancelled = false;
    void QRCode.toString(publicKey, { type: 'svg', margin: 1 })
      .then((svg) => {
        if (!cancelled) setQrSvg(svg);
      })
      .catch(() => {
        if (!cancelled) setQrSvg(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isQrOpen, publicKey]);

  const handleCopyAddress = async () => {
    if (!publicKey) return;
    const ok = await copyToClipboard(publicKey);
    if (ok) {
      setCopied(true);
      toast.success('Address copied');
      window.setTimeout(() => setCopied(false), 1500);
    } else {
      toast.error('Copy failed', {
        description: 'Your browser may be blocking clipboard access.',
      });
    }
  };

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
            <button
              type="button"
              onClick={handleCopyAddress}
              className={clsx(
                'shrink-0 p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-[#2C4BFD] dark:hover:text-[#BEC7FE] hover:bg-gray-50 dark:hover:bg-gray-700/50',
                copied && 'text-green-600 dark:text-green-400',
                focusRing
              )}
              aria-label={copied ? 'Address copied' : 'Copy wallet address'}
              title="Copy address"
            >
              {copied ? (
                <Check className="w-4 h-4" aria-hidden />
              ) : (
                <Copy className="w-4 h-4" aria-hidden />
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsQrOpen((open) => !open)}
              className={clsx(
                'shrink-0 p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-[#2C4BFD] dark:hover:text-[#BEC7FE] hover:bg-gray-50 dark:hover:bg-gray-700/50',
                isQrOpen && 'text-[#2C4BFD] dark:text-[#BEC7FE] bg-gray-50 dark:bg-gray-700/50',
                focusRing
              )}
              aria-label={isQrOpen ? 'Hide receive QR code' : 'Show receive QR code'}
              aria-expanded={isQrOpen}
              title="Receive"
            >
              <QrCode className="w-4 h-4" aria-hidden />
            </button>
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

        {isQrOpen && (
          <div
            role="dialog"
            aria-label="Receive — show your wallet address as a QR code"
            data-testid="qr-receive-panel"
            className="rounded-xl border border-[#BEC7FE] dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex flex-col items-center gap-3 shadow-sm"
          >
            <div className="flex items-center justify-between w-full">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Receive
              </h4>
              <button
                type="button"
                onClick={() => setIsQrOpen(false)}
                className={clsx(
                  'p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50',
                  focusRing
                )}
                aria-label="Close receive QR panel"
              >
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>

            <div
              className="bg-white rounded-lg p-2 [&>svg]:w-40 [&>svg]:h-40"
              aria-hidden
            >
              {qrSvg ? (
                <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center text-xs text-gray-400" data-testid="qr-loading">
                  Generating QR code…
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center break-all font-mono max-w-full">
              {publicKey}
            </p>

            <button
              type="button"
              onClick={handleCopyAddress}
              className={clsx(
                'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50',
                copied && 'text-green-600 dark:text-green-400 border-green-300 dark:border-green-700',
                focusRing
              )}
              aria-label={copied ? 'Address copied' : 'Copy wallet address'}
            >
              {copied ? (
                <Check className="w-4 h-4" aria-hidden />
              ) : (
                <Copy className="w-4 h-4" aria-hidden />
              )}
              {copied ? 'Copied' : 'Copy address'}
            </button>

            {FRIENDBOT_ENABLED && (
              <a
                href={friendbotUrl(publicKey)}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                  'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-[#2C4BFD] hover:underline',
                  focusRing
                )}
                aria-label="Get testnet XLM from Friendbot faucet"
              >
                Get testnet XLM (Friendbot)
              </a>
            )}
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
