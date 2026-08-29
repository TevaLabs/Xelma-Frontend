/* eslint-disable react-refresh/only-export-components -- shared status-machine module (component + hook) */
import { Fragment, useCallback, useRef, useState } from 'react';
import { cn } from '../lib/utils';

/**
 * Steps of a Stellar / Freighter transaction lifecycle.
 *
 * `preparing`, `signing` and `submitting` map 1:1 to the phases exposed by the
 * contract wrapper (`onStatus` callbacks). `syncing` is an optional extra phase
 * used by flows that additionally register the result with the backend.
 */
export type TxProgressStep = 'preparing' | 'signing' | 'submitting' | 'syncing';

export type TxStatusStep = TxProgressStep | 'idle' | 'success' | 'error';

export interface TxStepCopy {
  preparing?: string;
  signing?: string;
  submitting?: string;
  syncing?: string;
}

export interface TxStatusTimelineProps {
  /** Current status-machine step. `idle` renders nothing. */
  step: TxStatusStep;
  /** On-chain transaction hash shown on the success screen. */
  txHash?: string;
  /** Error detail rendered on the error screen. */
  errorMessage?: string;
  /** Heading for the success screen (e.g. "Prediction Submitted!"). */
  successTitle?: string;
  /** Supporting text for the success screen. */
  successMessage?: string;
  /** Override the default StellarExpert explorer link for the tx hash. */
  explorerUrl?: string;
  /** Per-step copy overrides for the Freighter phases. */
  stepCopy?: TxStepCopy;
  /** Called when the user clicks Retry on the error screen. */
  onRetry?: () => void;
  /** Called when the user clicks Close / Cancel to leave the screen. */
  onDone?: () => void;
}

const DEFAULT_STEP_TITLES: Record<TxProgressStep, string> = {
  preparing: 'Preparing Transaction...',
  signing: 'Waiting for Freighter Signature...',
  submitting: 'Submitting Transaction to Network...',
  syncing: 'Syncing Prediction to Backend...',
};

const DEFAULT_STEP_HINTS: Record<TxProgressStep, string> = {
  preparing: 'Assembling the contract call and estimating fees.',
  signing: 'Approve the transaction in your Freighter wallet when prompted.',
  submitting: 'Broadcasting the signed transaction to the Stellar network.',
  syncing: 'Recording the transaction on your prediction history.',
};

const TIMELINE_STEPS: { key: TxProgressStep; label: string }[] = [
  { key: 'preparing', label: 'Prepare' },
  { key: 'signing', label: 'Sign' },
  { key: 'submitting', label: 'Submit' },
  { key: 'syncing', label: 'Sync' },
];

function isProgressStep(step: TxStatusStep): step is TxProgressStep {
  return (
    step === 'preparing' ||
    step === 'signing' ||
    step === 'submitting' ||
    step === 'syncing'
  );
}

/**
 * Truncate a transaction hash to `leading` + `trailing` characters with an
 * ellipsis in the middle, e.g. `abcdef…567890`. Short hashes are returned
 * unchanged.
 */
export function formatTxHash(txHash: string, leading = 6, trailing = 6): string {
  if (!txHash) return '';
  if (txHash.length <= leading + trailing) return txHash;
  return `${txHash.slice(0, leading)}…${txHash.slice(-trailing)}`;
}

/**
 * Minimal state machine shared by the BetModal and StatsCard claim flows.
 *
 * - `start()` acquires the in-flight lock and returns `false` if a transaction
 *   is already running, which prevents double-submits.
 * - `updateStatus` is passed straight to the contract wrapper's `onStatus`
 *   callback to advance preparing → signing → submitting.
 * - `succeed` / `fail` / `reset` move the machine to its terminal/idle states.
 */
export function useTxStatusMachine() {
  const [step, setStep] = useState<TxStatusStep>('idle');
  const [txHash, setTxHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const inFlightRef = useRef(false);

  const isInFlight = isProgressStep(step);

  const start = useCallback(() => {
    if (inFlightRef.current) return false;
    inFlightRef.current = true;
    setErrorMessage('');
    setTxHash('');
    setStep('preparing');
    return true;
  }, []);

  const updateStatus = useCallback((next: TxProgressStep) => {
    setStep(next);
  }, []);

  const succeed = useCallback((hash: string) => {
    setTxHash(hash);
    setErrorMessage('');
    inFlightRef.current = false;
    setStep('success');
  }, []);

  const fail = useCallback((message: string) => {
    setErrorMessage(message);
    setTxHash('');
    inFlightRef.current = false;
    setStep('error');
  }, []);

  const reset = useCallback(() => {
    inFlightRef.current = false;
    setTxHash('');
    setErrorMessage('');
    setStep('idle');
  }, []);

  return { step, txHash, errorMessage, isInFlight, start, updateStatus, succeed, fail, reset };
}

/**
 * Shared transaction status timeline for the prediction / claim flows.
 *
 * Renders the Freighter steps (preparing → signing → submitting → syncing) with
 * clear per-step copy, then a success screen with a truncated tx hash and an
 * explorer link, or an error screen with a retry action.
 */
export default function TxStatusTimeline({
  step,
  txHash,
  errorMessage,
  successTitle,
  successMessage,
  explorerUrl,
  stepCopy,
  onRetry,
  onDone,
}: TxStatusTimelineProps) {
  if (step === 'idle') return null;

  if (isProgressStep(step)) {
    const currentIndex = TIMELINE_STEPS.findIndex((s) => s.key === step);
    const title = stepCopy?.[step] ?? DEFAULT_STEP_TITLES[step];
    const hint = DEFAULT_STEP_HINTS[step];

    return (
      <div role="status" aria-live="polite" aria-atomic="true" className="text-center py-6">
        <div className="flex items-start justify-between gap-2">
          {TIMELINE_STEPS.map((s, index) => {
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;
            return (
              <Fragment key={s.key}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition-colors',
                      isActive && 'border-cyan-400 bg-cyan-500 text-white',
                      isCompleted && 'border-green-500 bg-green-500 text-white',
                      !isActive && !isCompleted && 'border-gray-700 bg-gray-800 text-gray-500',
                    )}
                  >
                    {isActive ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : isCompleted ? (
                      <span aria-hidden="true">✓</span>
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'mt-1.5 text-[10px] font-semibold uppercase tracking-wide',
                      isActive ? 'text-cyan-400' : isCompleted ? 'text-green-400' : 'text-gray-500',
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {index < TIMELINE_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'mt-4 h-0.5 flex-1 rounded-full',
                      index < currentIndex ? 'bg-green-500' : 'bg-gray-700',
                    )}
                  />
                )}
              </Fragment>
            );
          })}
        </div>
        <div className="mt-6">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-gray-400">{hint}</p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    const displayHash = txHash ? formatTxHash(txHash) : '';
    const href = explorerUrl ?? `https://stellarexpert.org/tx/${txHash ?? ''}`;

    return (
      <div role="status" className="text-center py-6">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-2xl font-bold text-green-500">
          ✓
        </div>
        <h3 className="mb-2 text-xl font-bold">{successTitle ?? 'Transaction Complete!'}</h3>
        <p className="mb-4 text-sm text-gray-400">
          {successMessage ?? 'Your transaction has been successfully written on-chain.'}
        </p>
        {displayHash && (
          <code
            className="mx-auto mb-5 block w-fit rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 font-mono text-xs text-cyan-300"
            title={txHash}
          >
            Tx: {displayHash}
          </code>
        )}
        <div className="space-y-3">
          {txHash && (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="block w-full rounded-xl bg-gray-800 py-3 font-semibold transition hover:bg-gray-700"
            >
              View on StellarExpert
            </a>
          )}
          {onDone && (
            <button
              type="button"
              onClick={onDone}
              className="w-full rounded-xl border border-gray-800 py-3 font-semibold transition hover:bg-gray-850"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div role="alert" className="text-center py-6">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-2xl font-bold text-red-500">
        ✕
      </div>
      <h3 className="mb-2 text-xl font-bold">Transaction Failed</h3>
      <p className="mb-6 break-words px-4 text-sm text-red-400">
        {errorMessage ?? 'An unexpected error occurred.'}
      </p>
      <div className="space-y-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="w-full rounded-xl bg-[#2C4BFD] py-3 font-semibold transition hover:bg-[#2C4BFD]/80"
          >
            Retry
          </button>
        )}
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="w-full rounded-xl border border-gray-800 py-3 font-semibold transition hover:bg-gray-850"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
