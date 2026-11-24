import { useEffect, useRef, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { MODAL_CONTENT, MODAL_OVERLAY } from '../utils/motion';
import clsx from 'clsx';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900';

interface ReceivePanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** Full Stellar public key the QR code encodes and the copy button copies. */
  publicKey: string;
}

/**
 * Copy text to the clipboard, falling back to a hidden textarea + execCommand
 * when the async Clipboard API is unavailable (insecure contexts, older
 * browsers). Returns true when the text was copied.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (
      typeof navigator.clipboard !== 'undefined' &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path below.
  }

  try {
    if (typeof document.execCommand !== 'function') return false;
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Receive panel: QR code + full address + copy button for the connected wallet.
 *
 * Same modal pattern as WalletPicker (fixed overlay, focus trap, Escape and
 * overlay-click close). The QR code sits on a white tile so it stays
 * scannable in both light and dark mode.
 */
export default function ReceivePanel({ isOpen, onClose, publicKey }: ReceivePanelProps) {
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const copyTimerRef = useRef<number | null>(null);

  useFocusTrap(dialogRef, {
    active: isOpen,
    onEscape: onClose,
    initialFocusRef: closeButtonRef,
  });

  // The panel stays mounted while closed, so reset the copied state on close.
  useEffect(() => {
    if (!isOpen) setCopied(false);
  }, [isOpen]);

  useEffect(
    () => () => {
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    },
    [],
  );

  if (!isOpen) return null;

  const handleCopy = async () => {
    const ok = await copyText(publicKey);
    if (ok) {
      setCopied(true);
      toast.success('Address copied');
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Could not copy address');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${MODAL_OVERLAY}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="receive-panel-title"
        aria-describedby="receive-panel-description"
        className={`glass-card relative z-10 w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900 p-6 text-white shadow-2xl ${MODAL_CONTENT}`}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-gray-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD]"
          aria-label="Close receive panel"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <h2 id="receive-panel-title" className="mb-1 text-lg font-bold">
          Receive
        </h2>
        <p id="receive-panel-description" className="mb-5 text-sm text-gray-400">
          Scan the QR code or copy your address to receive funds on Stellar.
        </p>

        <div className="flex justify-center">
          <div
            data-testid="receive-qr"
            role="img"
            aria-label="QR code for your wallet address"
            className="rounded-2xl bg-white p-3"
          >
            <QRCodeSVG value={publicKey} size={192} level="M" bgColor="#FFFFFF" fgColor="#000000" />
          </div>
        </div>

        <p className="mt-5 break-all rounded-lg border border-gray-800 bg-gray-950/70 px-3 py-2 text-center font-mono text-xs text-gray-300">
          {publicKey}
        </p>

        <button
          type="button"
          onClick={() => void handleCopy()}
          className={clsx(
            'mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold bg-[#2C4BFD] text-white hover:bg-[#1a3bf0]',
            focusRing,
          )}
          aria-label="Copy wallet address"
        >
          {copied ? (
            <Check className="h-4 w-4" aria-hidden />
          ) : (
            <Copy className="h-4 w-4" aria-hidden />
          )}
          {copied ? 'Copied' : 'Copy address'}
        </button>
      </div>
    </div>
  );
}
