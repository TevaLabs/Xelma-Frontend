import { useEffect, useState, useCallback } from 'react';
import { useWalletStore } from '../store/useWalletStore';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, AlertCircle, LogOut, Wallet, ShieldCheck, RefreshCw, Copy, Check, QrCode } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import QRCode from 'qrcode';

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

  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const copyAddress = useCallback(async () => {
    if (!publicKey) return;
    try {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy address');
    }
  }, [publicKey]);

  const toggleQR = useCallback(async () => {
    if (!publicKey) return;
    if (showQR) {
      setShowQR(false);
      setQrDataUrl(null);
      return;
    }
    if (!qrDataUrl) {
      try {
        const url = await QRCode.toDataURL(publicKey, {
          width: 200,
          margin: 2,
          color: { dark: '#ffffff', light: '#0a0f1a' },
        });
        setQrDataUrl(url);
      } catch {
        toast.error('Failed to generate QR code');
        return;
      }
    }
    setShowQR(true);
  }, [publicKey, showQR, qrDataUrl]);

  useEffect(() => {
    void checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    setCopied(false);
    setShowQR(false);
    setQrDataUrl(null);
  }, [publicKey]);

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
            Switch to Testnet in Freighter
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch gap-3">
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
            <button
              type="button"
              onClick={copyAddress}
              className={clsx(
                'shrink-0 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700',
                focusRing
              )}
              aria-label="Copy address"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden />
              ) : (
                <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden />
              )}
            </button>
            <button
              type="button"
              onClick={toggleQR}
              className={clsx(
                'shrink-0 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700',
                focusRing
              )}
              aria-label={showQR ? 'Hide QR code' : 'Show QR code'}
            >
              <QrCode className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden />
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

          {showQR && qrDataUrl && (
            <div className="flex justify-center p-4 bg-[#0A0F1A] rounded-lg border border-white/10">
              <img src={qrDataUrl} alt="QR code for wallet address" className="h-48 w-48" />
            </div>
          )}
        </div>

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
