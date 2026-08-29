import { useCallback, useRef, useState } from 'react';
import { Check, Code, Copy, X } from 'lucide-react';
import { toast } from 'sonner';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { MODAL_OVERLAY, PANEL_SLIDE_RIGHT } from '../utils/motion';
import {
  SOROBAN_RPC_URL,
  XELMA_CONTRACT_ID,
  NETWORK_PASSPHRASE,
} from '../lib/stellarConfig';

interface DevSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CopyableFieldProps {
  label: string;
  value: string;
}

async function writeToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function CopyableField({ label, value }: CopyableFieldProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const ok = await writeToClipboard(value);
    if (ok) {
      setCopied(true);
      toast.success(`${label} copied`);
      window.setTimeout(() => setCopied(false), 1500);
    } else {
      toast.error('Copy failed', { description: 'Your browser may be blocking clipboard access.' });
    }
  }, [label, value]);

  return (
    <div className="rounded-xl border border-[#BEC7FE]/15 bg-white/[0.03] p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <div className="flex items-start gap-2">
        <code className="flex-1 break-all whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-200">
          {value}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-lg border border-white/10 p-1.5 text-gray-400 transition-colors hover:border-[#2C4BFD]/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD]"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function DevSettingsDrawer({ isOpen, onClose }: DevSettingsDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(drawerRef, {
    active: isOpen,
    onEscape: onClose,
    initialFocusRef: closeButtonRef,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex">
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${MODAL_OVERLAY}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dev-settings-title"
        className={`relative ml-auto flex h-full w-full max-w-md flex-col border-l border-[#BEC7FE]/10 bg-[#0A0F1A] shadow-2xl ${PANEL_SLIDE_RIGHT}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/5 p-5">
          <div>
            <h2 id="dev-settings-title" className="flex items-center gap-2 text-lg font-bold text-white">
              <Code className="h-4 w-4 text-[#22D3EE]" aria-hidden />
              Developer settings
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              On-chain configuration loaded from environment variables.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD]"
            aria-label="Close developer settings"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <CopyableField label="Soroban RPC URL" value={SOROBAN_RPC_URL} />
          <CopyableField label="Network passphrase" value={NETWORK_PASSPHRASE} />
          <CopyableField label="Xelma contract ID" value={XELMA_CONTRACT_ID} />

          <p className="pt-2 text-center text-xs text-gray-500">
            Values are resolved at build time from{' '}
            <code className="rounded bg-white/5 px-1 py-0.5 font-mono text-[11px] text-gray-300">
              VITE_*
            </code>{' '}
            environment variables.
          </p>
        </div>
      </div>
    </div>
  );
}
