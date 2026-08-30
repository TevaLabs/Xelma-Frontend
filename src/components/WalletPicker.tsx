import { useEffect, useRef, useState } from 'react';
import { Loader2, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';
import { WALLET_ADAPTERS, type WalletAdapter, type WalletId } from '../lib/wallets';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { MODAL_CONTENT, MODAL_OVERLAY } from '../utils/motion';

interface WalletPickerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the chosen wallet once the user picks an available adapter. */
  onSelect: (id: WalletId) => void | Promise<void>;
  /** True while the parent is completing the connection for the chosen wallet. */
  isConnecting?: boolean;
  /** Wallet currently being connected, used to scope the spinner to one row. */
  connectingId?: WalletId | null;
}

type AvailabilityMap = Partial<Record<WalletId, boolean>>;

function WalletRow({
  adapter,
  isAvailable,
  isChecking,
  isConnecting,
  onSelect,
}: {
  adapter: WalletAdapter;
  isAvailable: boolean | undefined;
  isChecking: boolean;
  isConnecting: boolean;
  onSelect: () => void;
}) {
  const isStub = !adapter.isImplemented;
  // Stub rows stay focusable/clickable (no native `disabled`) so selecting
  // one can surface an informational toast instead of silently doing
  // nothing — a fully disabled button gives keyboard/screen-reader users no
  // feedback at all. Implemented-but-unavailable adapters (extension not
  // installed) and in-flight connections still use real `disabled`.
  const nativeDisabled = (adapter.isImplemented && isAvailable === false) || isConnecting;
  const isVisuallyDisabled = isStub || nativeDisabled;

  let badge: string | null = null;
  if (isStub) {
    badge = 'Coming soon';
  } else if (isChecking) {
    badge = 'Checking…';
  } else if (isAvailable === false) {
    badge = 'Not installed';
  }

  const badgeId = badge ? `wallet-badge-${adapter.id}` : undefined;
  const hintId = isStub && adapter.comingSoonHint ? `wallet-hint-${adapter.id}` : undefined;
  const describedBy = [badgeId, hintId].filter(Boolean).join(' ') || undefined;

  const handleClick = () => {
    if (isStub) {
      toast.info(`${adapter.name} is coming soon`, {
        description:
          adapter.comingSoonHint ?? `${adapter.name} support isn't wired up yet — try Freighter for now.`,
      });
      return;
    }
    onSelect();
  };

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        disabled={nativeDisabled}
        aria-disabled={isVisuallyDisabled}
        title={isStub ? adapter.comingSoonHint : undefined}
        aria-describedby={describedBy}
        className="flex w-full items-center gap-3 rounded-xl border border-gray-800 bg-gray-950/70 px-4 py-3 text-left transition-colors enabled:hover:border-[#2C4BFD]/50 enabled:hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD]"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#2C4BFD] to-[#22D3EE] text-white"
          aria-hidden
        >
          <Wallet className="h-4 w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">{adapter.name}</span>
            {badge && (
              <span
                id={badgeId}
                className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-400"
              >
                {badge}
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-xs text-gray-500">{adapter.description}</span>
        </span>

        {isConnecting && (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#22D3EE]" aria-hidden />
        )}
      </button>
      {hintId && (
        // Kept outside the <button> so it augments the accessible
        // *description* (via aria-describedby) without also bleeding into
        // the button's accessible *name* — a name that quotes "Freighter"
        // would otherwise collide with lookups for the real Freighter row.
        <span id={hintId} className="sr-only">
          {adapter.comingSoonHint}
        </span>
      )}
    </li>
  );
}

/**
 * Wallet selection modal.
 *
 * Renders one row per registered `WalletAdapter`. Freighter is fully wired;
 * adapters that report `isImplemented: false` render as "Coming soon" — dimmed
 * and never forwarded to `onSelect`, but still selectable so choosing one
 * surfaces an informational toast instead of looking broken.
 */
export default function WalletPicker({
  isOpen,
  onClose,
  onSelect,
  isConnecting = false,
  connectingId = null,
}: WalletPickerProps) {
  const [availability, setAvailability] = useState<AvailabilityMap>({});
  const [isChecking, setIsChecking] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(dialogRef, {
    active: isOpen,
    onEscape: onClose,
    initialFocusRef: closeButtonRef,
  });

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const run = async () => {
      setIsChecking(true);

      const entries = await Promise.all(
        WALLET_ADAPTERS.map(async (adapter) => {
          if (!adapter.isImplemented) return [adapter.id, false] as const;
          try {
            const { isAvailable } = await adapter.isAvailable();
            return [adapter.id, isAvailable] as const;
          } catch {
            return [adapter.id, false] as const;
          }
        }),
      );

      if (cancelled) return;
      setAvailability(Object.fromEntries(entries) as AvailabilityMap);
      setIsChecking(false);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

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
        aria-labelledby="wallet-picker-title"
        className={`glass-card relative z-10 w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900 p-6 text-white shadow-2xl ${MODAL_CONTENT}`}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-gray-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD]"
          aria-label="Close wallet picker"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <h2 id="wallet-picker-title" className="mb-1 text-lg font-bold">
          Connect a wallet
        </h2>
        <p className="mb-5 text-sm text-gray-400">
          Choose how you want to sign transactions on Xelma.
        </p>

        <ul className="space-y-2">
          {WALLET_ADAPTERS.map((adapter) => (
            <WalletRow
              key={adapter.id}
              adapter={adapter}
              isAvailable={availability[adapter.id]}
              isChecking={isChecking && adapter.isImplemented}
              isConnecting={isConnecting && connectingId === adapter.id}
              onSelect={() => void onSelect(adapter.id)}
            />
          ))}
        </ul>

        <p className="mt-5 text-xs text-gray-500">
          New to Stellar wallets?{' '}
          <a
            href="https://www.freighter.app/"
            target="_blank"
            rel="noreferrer"
            className="text-[#BEC7FE] underline hover:text-white"
          >
            Install Freighter
          </a>{' '}
          to get started.
        </p>
      </div>
    </div>
  );
}
