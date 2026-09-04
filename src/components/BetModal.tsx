import { useState, useEffect, useRef, useCallback } from 'react';
import { useWalletStore, selectIsWalletConnected } from '../store/useWalletStore';
import { useAuthStore } from '../store/useAuthStore';
import { place_bet, place_precision_prediction, estimatePlaceBet, estimatePrecisionPrediction, humanizeContractError, type FeeEstimate } from '../lib/xelma-contract';
import { predictionsApi, type UserPrediction } from '../lib/api-client';
import XdrPreviewDrawer from './XdrPreviewDrawer';
import { MODAL_OVERLAY, MODAL_CONTENT } from '../utils/motion';
import TxStatusTimeline, { useTxStatusMachine } from './TxStatusTimeline';
import PredictionHelpTooltip from './PredictionHelpTooltip';

export interface PredictionData {
  direction: 'UP' | 'DOWN';
  stake: string;
  isLegend: boolean;
  exactPrice?: string;
  /** Share of the UP/DOWN pool held by each side (0-100). Present only for
   *  UP/DOWN rounds; used to surface the pool-imbalance soft warning. */
  poolUpPct?: number;
  poolDownPct?: number;
}

interface BetModalProps {
  isOpen: boolean;
  onClose: () => void;
  predictionData: PredictionData | null;
  onSuccess?: (txHash: string) => void;
  onPending?: (prediction: UserPrediction) => void;
  onPredictionError?: () => void;
}

type ModalView = 'confirm' | 'wallet_required';
type PredictionMode = 'direction' | 'precision';

const PRICE_MIN = 0.0001;
const PRICE_MAX = 10;
const PRICE_DECIMALS = 4;

// Issue #413 — a side that holds this share (or more) of the UP/DOWN pool is
// treated as "dominating". The warning is informational only and never blocks
// the submit.
const POOL_IMBALANCE_THRESHOLD_PCT = 70;

function parseBalance(balance: string | null): number {
  if (!balance) return 0;
  const numericPart = balance.replace(' XLM', '');
  return parseFloat(numericPart) || 0;
}

function computePresetStake(balanceStr: string | null | undefined, percentage: number): string {
  const available = parseBalance(balanceStr ?? null);
  if (available <= 0) return '';
  const raw = available * percentage;
  const factor = 10000;
  const truncated = Math.floor(raw * factor + 1e-9) / factor;
  const safeAmount = Math.min(truncated, available);
  return Number(safeAmount.toFixed(4)).toString();
}

function validateStake(value: string, walletBalance: string | null): string | null {
  if (!value.trim()) return 'Enter a stake amount';
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'Stake must be greater than 0';
  
  const availableBalance = parseBalance(walletBalance);
  if (amount > availableBalance) {
    return `Stake exceeds available balance (${walletBalance || '0.00 XLM'})`;
  }
  
  return null;
}

function validateExactPrice(value: string): string | null {
  if (!value.trim()) return 'Enter an exact price target';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'Exact price must be a valid number';
  if (amount < PRICE_MIN || amount > PRICE_MAX) return `Exact price must be between ${PRICE_MIN} and ${PRICE_MAX}`;
  const decimals = value.split('.')[1];
  if (decimals && decimals.length > PRICE_DECIMALS) return `Use ${PRICE_DECIMALS} decimal places or fewer`;
  return null;
}

export default function BetModal({ isOpen, onClose, predictionData, onSuccess, onPending, onPredictionError }: BetModalProps) {
  const isConnected = useWalletStore(selectIsWalletConnected);
  const publicKey = useWalletStore((s) => s.publicKey);
  const connect = useWalletStore((s) => s.connect);
  const balance = useWalletStore((s) => s.balance);
  const isWatchOnly = useWalletStore((s) => s.isWatchOnly);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Shared transaction status machine (preparing → signing → submitting → syncing)
  const tx = useTxStatusMachine();

  const initialView = (!isConnected || !isAuthenticated || isWatchOnly) ? 'wallet_required' : 'confirm';
  const [view, setView] = useState<ModalView>(initialView);
  const [isConnecting, setIsConnecting] = useState(false);
  const [mode, setMode] = useState<PredictionMode>(predictionData?.isLegend ? 'precision' : 'direction');
  const [direction, setDirection] = useState<'UP' | 'DOWN'>(predictionData?.direction ?? 'UP');
  const [stake, setStake] = useState(predictionData?.stake ?? '');
  const [exactPrice, setExactPrice] = useState(predictionData?.exactPrice ?? '');
  const [formError, setFormError] = useState('');
  const [inlineStakeError, setInlineStakeError] = useState('');
  const [outcomeAnnouncement, setOutcomeAnnouncement] = useState('');
  // Issue #413 — the pool-imbalance warning is dismissible; re-shown whenever
  // the modal is (re)opened or a new prediction is loaded.
  const [poolWarningDismissed, setPoolWarningDismissed] = useState(false);

  // Fee estimate state
  const [feeEstimate, setFeeEstimate] = useState<FeeEstimate | null>(null);
  const [feeEstimateStatus, setFeeEstimateStatus] = useState<'idle' | 'loading' | 'loaded' | 'failed'>('idle');
  const [feeEstimateError, setFeeEstimateError] = useState<string | null>(null);
  const estimateParamsRef = useRef('');

  // Auto-fetch fee estimate when the confirm step is active.
  // Uses a params-key guard to avoid re-fetching on every stake keystroke.
  useEffect(() => {
    if (view !== 'confirm' || tx.step !== 'idle' || !publicKey || !isConnected) return;

    const paramsKey = `${mode}:${direction}:${stake}:${exactPrice}`;
    if (estimateParamsRef.current === paramsKey) return;
    estimateParamsRef.current = paramsKey;

    let cancelled = false;

    const run = async () => {
      setFeeEstimateStatus('loading');
      setFeeEstimate(null);
      setFeeEstimateError(null);

      try {
        const isPrecision = mode === 'precision';

        if (isPrecision) {
          if (typeof estimatePrecisionPrediction !== 'function') {
            if (!cancelled) {
              setFeeEstimate(null);
              setFeeEstimateStatus('idle');
            }
            return;
          }

          const estimate = await estimatePrecisionPrediction(publicKey, direction, stake, exactPrice);
          if (!cancelled) {
            setFeeEstimate(estimate);
            setFeeEstimateStatus('loaded');
          }
          return;
        }

        if (typeof estimatePlaceBet !== 'function') {
          if (!cancelled) {
            setFeeEstimate(null);
            setFeeEstimateStatus('idle');
          }
          return;
        }

        const estimate = await estimatePlaceBet(publicKey, direction, stake);
        if (!cancelled) {
          setFeeEstimate(estimate);
          setFeeEstimateStatus('loaded');
        }
      } catch (err) {
        if (!cancelled) {
          // The raw error stays in the console via humanizeContractError;
          // only the friendly copy is surfaced in the modal.
          setFeeEstimateError(humanizeContractError(err, 'estimate'));
          setFeeEstimateStatus('failed');
        }
      }
    };

    run();

    return () => { cancelled = true; };
  }, [view, tx.step, publicKey, isConnected, mode, direction, stake, exactPrice]);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevPredictionData, setPrevPredictionData] = useState(predictionData);
  if (predictionData !== prevPredictionData && isOpen) {
    setPrevPredictionData(predictionData);
    setMode(predictionData?.isLegend ? 'precision' : 'direction');
    setDirection(predictionData?.direction ?? 'UP');
    setStake(predictionData?.stake ?? '');
    setExactPrice(predictionData?.exactPrice ?? '');
    setFormError('');
    setInlineStakeError('');
    setPoolWarningDismissed(false);
    setFeeEstimate(null);
    setFeeEstimateStatus('idle');
    setFeeEstimateError(null);
  }
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      const targetView = (!isConnected || !isAuthenticated || isWatchOnly) ? 'wallet_required' : 'confirm';
      setView(targetView);
      tx.reset();
      setPrevPredictionData(predictionData);
      setMode(predictionData?.isLegend ? 'precision' : 'direction');
      setDirection(predictionData?.direction ?? 'UP');
      setStake(predictionData?.stake ?? '');
      setExactPrice(predictionData?.exactPrice ?? '');
      setFormError('');
      setInlineStakeError('');
      setPoolWarningDismissed(false);
      setFeeEstimate(null);
      setFeeEstimateStatus('idle');
      setFeeEstimateError(null);
      setOutcomeAnnouncement('');
    }
  }

  // Reset estimate params ref when modal closes or prediction data changes
  useEffect(() => {
    if (!isOpen || predictionData !== prevPredictionData) {
      estimateParamsRef.current = '';
    }
  }, [isOpen, predictionData, prevPredictionData]);

  const handleConnectAndAuth = async () => {
    setIsConnecting(true);
    try {
      await connect();
      // Read post-connect state directly from the store to avoid stale closure values
      const { status, publicKey: pk } = useWalletStore.getState();
      const { isAuthenticated: ia } = useAuthStore.getState();
      if (status === 'connected' && pk && ia) {
        setView('confirm');
      }
    } catch (err) {
      console.error('Connection failed:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const availableBalance = parseBalance(balance);
  const arePresetsDisabled = !isConnected || availableBalance <= 0 || tx.isInFlight;

  const handlePresetClick = (percentage: number) => {
    const calculatedStake = computePresetStake(balance, percentage);
    handleStakeChange(calculatedStake);
  };

  const handleStakeChange = (value: string) => {
    setStake(value);
    setFormError('');
    const error = validateStake(value, balance);
    setInlineStakeError(error || '');
  };

  const handleConfirm = useCallback(async () => {
    const stakeError = validateStake(stake, balance);
    const exactPriceError = mode === 'precision' ? validateExactPrice(exactPrice) : null;

    if (stakeError || exactPriceError) {
      setFormError(stakeError || exactPriceError || 'Invalid prediction details');
      return;
    }

    // Acquire the in-flight lock — blocks double-submits while a transaction
    // is preparing / signing / submitting.
    if (!tx.start()) return;

    setFormError('');
    setView('confirm');

    if (!publicKey || !isConnected) {
      tx.reset();
      setView('wallet_required');
      return;
    }
    // Immediately show preparing state before starting async transaction
    tx.updateStatus('preparing');
    // Yield to the event loop so the UI can update before awaiting the contract call
    await new Promise(resolve => setTimeout(resolve, 0));
    try {
      if (onPending && publicKey) {
        onPending({
          id: `pending-${Date.now()}`,
          direction,
          stake,
          exactPrice: mode === 'precision' ? exactPrice : undefined,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          mode: mode === 'precision' ? 'precision' : 'updown',
          asset: 'XLM',
        } as UserPrediction);
      }

      const updateStatus = tx.updateStatus;
      let result;
      const isPrecision = mode === 'precision';

      if (isPrecision) {
        result = await place_precision_prediction(
          publicKey,
          direction,
          stake,
          exactPrice,
          updateStatus
        );
      } else {
        result = await place_bet(
          publicKey,
          direction,
          stake,
          updateStatus
        );
      }

      // Submit to backend
      await predictionsApi.submit({
        direction,
        stake,
        isLegend: mode === 'precision',
        exactPrice: mode === 'precision' ? exactPrice : undefined,
      });

      tx.succeed(result.txHash);
      if (onSuccess) {
        onSuccess(result.txHash);
      }
    } catch (err: unknown) {
      // Map the raw simulation/signing error to player-friendly copy; the raw
      // error is kept in the console for debugging by humanizeContractError.
      tx.fail(humanizeContractError(err, 'place_bet'));
      if (onPredictionError) {
        onPredictionError();
      }
    }
  }, [balance, direction, exactPrice, isConnected, mode, onPending, onPredictionError, onSuccess, publicKey, stake, tx]);

  const isTimelineVisible = view === 'confirm' && tx.step !== 'idle';

  const prevTxStepRef = useRef(tx.step);

  useEffect(() => {
    if (tx.step === prevTxStepRef.current) return;
    prevTxStepRef.current = tx.step;

    const timer = window.setTimeout(() => {
      if (tx.step === 'success') {
        setOutcomeAnnouncement(
          'Prediction submitted successfully. Your prediction has been successfully written on-chain and registered.',
        );
      } else if (tx.step === 'error') {
        setOutcomeAnnouncement(`Transaction failed. ${tx.errorMessage || 'An unexpected error occurred.'}`);
      } else {
        setOutcomeAnnouncement('');
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [tx.step, tx.errorMessage]);

  // Issue #413 — pool-imbalance soft warning. Present only for UP/DOWN rounds
  // (direction mode) when one side holds at least the imbalance threshold of
  // the pool. Informational and dismissible; it never blocks the submit.
  const poolUpPct = predictionData?.poolUpPct;
  const poolDownPct = predictionData?.poolDownPct;

  const handleDirectionRef = useRef<(dir: 'UP' | 'DOWN') => void>(() => {});
  const handleConfirmRef = useRef<() => void>(() => {});

  // Update ref values in useEffect to avoid updating during render
  useEffect(() => {
    handleDirectionRef.current = (dir) => { setDirection(dir); setFormError(''); };
    handleConfirmRef.current = handleConfirm;
  });

  useEffect(() => {
    if (!isOpen || view !== 'confirm') return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      const key = e.key;
      if (key === 'u' || key === 'U' || key === 'ArrowUp') {
        e.preventDefault();
        handleDirectionRef.current('UP');
      } else if (key === 'd' || key === 'D' || key === 'ArrowDown') {
        e.preventDefault();
        handleDirectionRef.current('DOWN');
      } else if (key === 'Enter') {
        e.preventDefault();
        handleConfirmRef.current();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, view]);

  if (!isOpen || !predictionData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {outcomeAnnouncement && (
        <div
          aria-live={tx.step === 'error' ? 'assertive' : 'polite'}
          aria-atomic="true"
          className="sr-only"
          role={tx.step === 'error' ? 'alert' : 'status'}
        >
          {outcomeAnnouncement}
        </div>
      )}
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${MODAL_OVERLAY}`} onClick={onClose} />
      <div className={`glass-card relative z-10 w-full max-w-md rounded-2xl bg-gray-900 border border-gray-800 p-6 text-white shadow-2xl ${MODAL_CONTENT}`}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>

        {view === 'wallet_required' && (
          <div className="text-center py-4">
            {isWatchOnly ? (
              <>
                <h3 className="text-lg font-bold text-purple-400 mb-2">Watch-Only Mode</h3>
                <p className="text-gray-400 text-sm mb-6">
                  You are viewing this address in watch-only mode. Connect a wallet with signing capability to submit predictions.
                </p>
                <button
                  onClick={handleConnectAndAuth}
                  disabled={isConnecting}
                  className="w-full py-3 bg-[#2C4BFD] hover:bg-[#2C4BFD]/80 rounded-xl font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isConnecting ? 'Connecting…' : 'Connect Wallet'}
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-red-400 mb-2">Wallet & Auth Required</h3>
                <p className="text-gray-400 text-sm mb-6">
                  You need to connect and authenticate your Stellar wallet to submit predictions.
                </p>
                <button
                  onClick={handleConnectAndAuth}
                  disabled={isConnecting}
                  className="w-full py-3 bg-[#2C4BFD] hover:bg-[#2C4BFD]/80 rounded-xl font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isConnecting ? 'Connecting…' : 'Connect & Authenticate'}
                </button>
              </>
            )}
          </div>
        )}

        {view === 'confirm' && tx.step === 'idle' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" id="prediction-modal-title">Confirm Prediction</h3>
              <PredictionHelpTooltip id="bet-modal-prediction-help-popover" />
            </div>

            <p className="mb-4 text-xs text-gray-500" aria-hidden="true">
              <kbd className="inline-block px-1.5 py-0.5 text-[11px] font-semibold border border-gray-600 rounded bg-gray-800 text-gray-300 leading-tight">U</kbd>
              {' '}<kbd className="inline-block px-1.5 py-0.5 text-[11px] font-semibold border border-gray-600 rounded bg-gray-800 text-gray-300 leading-tight">↑</kbd>
              {' '}UP ·{' '}
              <kbd className="inline-block px-1.5 py-0.5 text-[11px] font-semibold border border-gray-600 rounded bg-gray-800 text-gray-300 leading-tight">D</kbd>
              {' '}<kbd className="inline-block px-1.5 py-0.5 text-[11px] font-semibold border border-gray-600 rounded bg-gray-800 text-gray-300 leading-tight">↓</kbd>
              {' '}DOWN ·{' '}
              <kbd className="inline-block px-1.5 py-0.5 text-[11px] font-semibold border border-gray-600 rounded bg-gray-800 text-gray-300 leading-tight">Enter</kbd>
              {' '}Confirm
            </p>
            <span className="sr-only" role="status">
              Keyboard shortcuts: Press U or Arrow Up for UP, D or Arrow Down for DOWN, and Enter to confirm. Shortcuts disabled while typing in text fields.
            </span>

            {/* Inline wallet-disconnect guard — shown reactively if wallet drops mid-session */}
            {!isConnected && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-400">Wallet disconnected</p>
                  <p className="text-xs text-gray-400 mt-0.5">Connect your wallet to confirm.</p>
                </div>
                <button
                  onClick={handleConnectAndAuth}
                  disabled={isConnecting}
                  className="shrink-0 rounded-lg bg-[#2C4BFD] px-4 py-2 text-sm font-semibold transition hover:bg-[#2C4BFD]/80 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isConnecting ? 'Connecting…' : 'Connect'}
                </button>
              </div>
            )}

            {/* Issue #413 — soft pool-imbalance warning (UP/DOWN rounds only).
                Dismissible and informational; does not block the submit. */}
            {poolUpPct !== undefined &&
              poolDownPct !== undefined &&
              mode === 'direction' &&
              !poolWarningDismissed &&
              (poolUpPct >= POOL_IMBALANCE_THRESHOLD_PCT ||
                poolDownPct >= POOL_IMBALANCE_THRESHOLD_PCT) && (
                <div
                  className="mb-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3"
                  role="status"
                  data-testid="pool-imbalance-warning"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-amber-300">
                      {poolUpPct >= poolDownPct ? 'UP' : 'DOWN'} dominates this round's pool
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-300">
                      UP currently holds {poolUpPct}% of the pool and DOWN holds {poolDownPct}%.
                      Betting with the majority can mean smaller payouts, while betting against
                      it carries more risk. This won't block your prediction.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPoolWarningDismissed(true)}
                    className="shrink-0 rounded-md p-1 text-gray-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    aria-label="Dismiss pool imbalance warning"
                  >
                    ✕
                  </button>
                </div>
              )}

            <div className="mb-5 grid grid-cols-2 rounded-xl border border-gray-800 bg-gray-950/70 p-1" role="tablist" aria-label="Prediction input mode">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'direction'}
                onClick={() => { setMode('direction'); setFormError(''); }}
                className={`rounded-lg py-2 text-sm font-semibold transition ${mode === 'direction' ? 'bg-[#2C4BFD] text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Direction
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'precision'}
                onClick={() => { setMode('precision'); setFormError(''); }}
                className={`rounded-lg py-2 text-sm font-semibold transition ${mode === 'precision' ? 'bg-[#2C4BFD] text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Precision
              </button>
            </div>

            <div className="space-y-4 bg-gray-850 p-4 rounded-xl border border-gray-800 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">Mode</span>
                <span className="font-semibold">
                  {mode === 'precision' ? 'Legend Mode (Precision)' : 'UP/DOWN Match'}
                </span>
              </div>

              <div>
                <span className="mb-2 block text-sm text-gray-400">Direction</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['UP', 'DOWN'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setDirection(option)}
                      className={`rounded-lg border px-3 py-2 font-bold transition ${
                        direction === option
                          ? option === 'UP'
                            ? 'border-green-400 bg-green-500/15 text-green-400'
                            : 'border-red-400 bg-red-500/15 text-red-400'
                          : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {mode === 'precision' && (
                <div>
                  <label htmlFor="bet-modal-exact-price" className="mb-2 block text-sm text-gray-400">
                    Exact Price Target
                  </label>
                  <input
                    id="bet-modal-exact-price"
                    type="number"
                    inputMode="decimal"
                    min={PRICE_MIN}
                    max={PRICE_MAX}
                    step="0.0001"
                    value={exactPrice}
                    onChange={(event) => { setExactPrice(event.target.value); setFormError(''); }}
                    className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none transition focus:border-yellow-400"
                    placeholder="0.2295"
                  />
                  {exactPrice && <p className="mt-2 text-xs font-semibold text-yellow-400">${exactPrice}</p>}
                </div>
              )}

              <div className="border-t border-gray-800 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="bet-modal-stake" className="text-sm text-gray-400">Stake</label>
                  <div className="flex items-center gap-1" role="group" aria-label="Stake presets">
                    <button
                      type="button"
                      onClick={() => handlePresetClick(0.25)}
                      disabled={arePresetsDisabled}
                      className="rounded bg-gray-800 px-2 py-0.5 text-xs font-semibold text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                      aria-label="Set stake to 25% of balance"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetClick(0.5)}
                      disabled={arePresetsDisabled}
                      className="rounded bg-gray-800 px-2 py-0.5 text-xs font-semibold text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                      aria-label="Set stake to 50% of balance"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetClick(1.0)}
                      disabled={arePresetsDisabled}
                      className="rounded bg-gray-800 px-2 py-0.5 text-xs font-semibold text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                      aria-label="Set stake to Max available balance"
                    >
                      Max
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="bet-modal-stake"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.0000001"
                    value={stake}
                    onChange={(event) => handleStakeChange(event.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none transition focus:border-cyan-400"
                    placeholder="15"
                  />
                  <span className="font-bold text-cyan-400">XLM</span>
                </div>
                {stake && <p className="mt-2 text-xs text-cyan-300">{stake} XLM</p>}
                {inlineStakeError && <p className="mt-2 text-xs font-semibold text-red-400" role="alert">{inlineStakeError}</p>}
              </div>

              {formError && <p className="text-sm font-semibold text-red-400" role="alert">{formError}</p>}
            </div>

            {/* Fee & Resource Estimate */}
            <div className="mb-5 rounded-xl border border-gray-800 bg-gray-950/70 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  ⚡ Fee Estimate
                </span>
                {feeEstimateStatus === 'loading' && (
                  <div className="h-3 w-3 border-2 border-cyan-400/50 border-t-transparent rounded-full animate-spin" />
                )}
                {feeEstimateStatus === 'failed' && (
                  <span className="text-xs text-red-400" title={feeEstimateError ?? ''}>Error</span>
                )}
              </div>

              {feeEstimateStatus === 'idle' && (
                <p className="text-xs text-gray-500">
                  Enter prediction details to see estimated fee.
                </p>
              )}

              {feeEstimateStatus === 'loading' && (
                <div className="space-y-2 animate-pulse">
                  <div className="h-3 w-full rounded bg-white/10" />
                  <div className="h-3 w-3/4 rounded bg-white/10" />
                  <div className="h-3 w-5/6 rounded bg-white/10" />
                </div>
              )}

              {feeEstimateStatus === 'failed' && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                  <p className="text-xs font-semibold text-red-400">Simulation failed</p>
                  <p className="mt-1 text-xs text-red-300/80 break-words">
                    {feeEstimateError}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    Check your wallet balance and try again.
                  </p>
                </div>
              )}

              {feeEstimateStatus === 'loaded' && feeEstimate && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Base fee</span>
                    <span className="font-mono text-gray-300">{feeEstimate.baseFee} XLM</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Resource fee</span>
                    <span className="font-mono text-gray-300">{feeEstimate.resourceFee} XLM</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-800 pt-2 text-xs font-semibold">
                    <span className="text-gray-400">Total fee</span>
                    <span className="font-mono text-cyan-400">{feeEstimate.totalFee} XLM</span>
                  </div>
                  <details className="group mt-1">
                    <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-300 transition-colors">
                      Resource usage
                    </summary>
                    <div className="mt-2 space-y-1.5 pl-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">CPU instructions</span>
                        <span className="font-mono text-gray-400">{Number(feeEstimate.instructions).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Read bytes</span>
                        <span className="font-mono text-gray-400">{Number(feeEstimate.readBytes).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Write bytes</span>
                        <span className="font-mono text-gray-400">{Number(feeEstimate.writeBytes).toLocaleString()}</span>
                      </div>
                    </div>
                  </details>
                </div>
              )}
            </div>

            {feeEstimateStatus === 'loaded' && feeEstimate && (
              <XdrPreviewDrawer
                xdr={feeEstimate.xdr}
                hash={feeEstimate.hash}
                networkPassphrase={feeEstimate.networkPassphrase}
              />
            )}

            <button
              onClick={handleConfirm}
              disabled={!isConnected || feeEstimateStatus === 'failed' || tx.isInFlight}
              className="w-full py-3.5 bg-green-600 hover:bg-green-500 rounded-xl font-bold transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-green-600"
            >
              Confirm
            </button>
          </div>
        )}

        {isTimelineVisible && (
          <TxStatusTimeline
            step={tx.step}
            txHash={tx.txHash}
            errorMessage={tx.errorMessage}
            successTitle="Prediction Submitted!"
            successMessage="Your prediction has been successfully written on-chain and registered."
            onRetry={handleConfirm}
            onDone={onClose}
          />
        )}
      </div>
    </div>
  );
}
