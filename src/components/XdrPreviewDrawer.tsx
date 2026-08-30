import { useState } from 'react';
import { Check, ChevronDown, ChevronRight, Copy } from 'lucide-react';

interface XdrPreviewDrawerProps {
  /** Base64 XDR of the prepared, unsigned transaction. */
  xdr: string;
  /** Hash of the prepared transaction. */
  hash: string;
  /** Network passphrase the transaction is built against. */
  networkPassphrase?: string;
}

async function writeToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Optional "Advanced" drawer exposing the raw transaction XDR and hash before
 * the user approves in Freighter.
 *
 * Collapsed by default so the casual prediction path is unchanged — only users
 * who deliberately expand it see the payload.
 */
export default function XdrPreviewDrawer({ xdr, hash, networkPassphrase }: XdrPreviewDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const handleCopy = async () => {
    const ok = await writeToClipboard(xdr);
    setCopied(ok);
    setCopyFailed(!ok);
    window.setTimeout(() => {
      setCopied(false);
      setCopyFailed(false);
    }, 2000);
  };

  return (
    <div className="mb-5 rounded-xl border border-gray-800 bg-gray-950/70">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="xdr-preview-body"
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD]"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Advanced — transaction preview
        </span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
        )}
      </button>

      {isOpen && (
        <div id="xdr-preview-body" className="border-t border-gray-800 px-4 py-3">
          <p className="mb-3 text-xs text-gray-500">
            This is the exact unsigned transaction Freighter will ask you to approve.
          </p>

          <div className="mb-3">
            <span className="mb-1 block text-xs font-semibold text-gray-400">Transaction hash</span>
            <p className="break-all font-mono text-xs text-gray-300">{hash}</p>
          </div>

          {networkPassphrase && (
            <div className="mb-3">
              <span className="mb-1 block text-xs font-semibold text-gray-400">Network</span>
              <p className="break-words font-mono text-xs text-gray-300">{networkPassphrase}</p>
            </div>
          )}

          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-gray-400">XDR</span>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-2.5 py-1 text-xs font-semibold text-gray-300 transition-colors hover:border-gray-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD]"
              aria-label="Copy transaction XDR to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-green-400" aria-hidden />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" aria-hidden />
                  Copy
                </>
              )}
            </button>
          </div>

          <pre className="max-h-32 overflow-auto rounded-lg bg-black/40 p-3 text-[11px] leading-relaxed">
            <code className="break-all whitespace-pre-wrap font-mono text-gray-400">{xdr}</code>
          </pre>

          <p aria-live="polite" className="mt-2 text-xs">
            {copied && <span className="text-green-400">XDR copied to clipboard.</span>}
            {copyFailed && (
              <span className="text-amber-400">
                Could not access the clipboard — select the XDR above and copy manually.
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
