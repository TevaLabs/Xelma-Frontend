import { useState } from 'react';
import { useWalletStore, selectIsWalletConnected } from '../store/useWalletStore';
import { useAuthStore } from '../store/useAuthStore';
import { place_bet, place_precision_prediction } from '../lib/xelma-contract';
import { predictionsApi } from '../lib/api-client';
import { MODAL_OVERLAY, MODAL_CONTENT } from '../utils/motion';

export interface PredictionData {
  direction: 'UP' | 'DOWN';
  stake: string;
  isLegend: boolean;
  exactPrice?: string;
}

interface BetModalProps {
  isOpen: boolean;
  onClose: () => void;
  predictionData: PredictionData | null;
  onSuccess?: (txHash: string) => void;
}

type Step = 'confirm' | 'wallet_required' | 'preparing' | 'signing' | 'submitting' | 'syncing' | 'success' | 'error';
type PredictionMode = 'direction' | 'precision';

const PRICE_MIN = 0.0001;
const PRICE_MAX = 10;
const PRICE_DECIMALS = 4;

function parseBalance(balance: string | null): number {
  if (!balance) return 0;
  const numericPart = balance.replace(' XLM', '');
  return parseFloat(numericPart) || 0;
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

export default function BetModal({ isOpen, onClose, predictionData, onSuccess }: BetModalProps) {
  const isConnected = useWalletStore(selectIsWalletConnected);
  const publicKey = useWalletStore((s) => s.publicKey);
  const connect = useWalletStore((s) => s.connect);
  const balance = useWalletStore((s) => s.balance);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const initialStep = (!isConnected || !isAuthenticated) ? 'wallet_required' : 'confirm';

  const [step, setStep] = useState<Step>(initialStep);
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [mode, setMode] = useState<PredictionMode>(predictionData?.isLegend ? 'precision' : 'direction');
  const [direction, setDirection] = useState<'UP' | 'DOWN'>(predictionData?.direction ?? 'UP');
  const [stake, setStake] = useState(predictionData?.stake ?? '');
  const [exactPrice, setExactPrice] = useState(predictionData?.exactPrice ?? '');
  const [formError, setFormError] = useState('');
  const [inlineStakeError, setInlineStakeError] = useState('');

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
  }
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      const targetStep = (!isConnected || !isAuthenticated) ? 'wallet_required' : 'confirm';
      setStep(targetStep);
      setErrorMsg('');
      setTxHash('');
      setPrevPredictionData(predictionData);
      setMode(predictionData?.isLegend ? 'precision' : 'direction');
      setDirection(predictionData?.direction ?? 'UP');
      setStake(predictionData?.stake ?? '');
      setExactPrice(predictionData?.exactPrice ?? '');
      setFormError('');
      setInlineStakeError('');
    }
  }

  if (!isOpen || !predictionData) return null;

  const handleConnectAndAuth = async () => {
    setIsConnecting(true);
    try {
      await connect();
      // Read post-connect state directly from the store to avoid stale closure values
      const { status, publicKey: pk } = useWalletStore.getState();
      const { isAuthenticated: ia } = useAuthStore.getState();
      if (status === 'connected' && pk && ia) {
        setStep('confirm');
      }
    } catch (err) {
      console.error('Connection failed:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleStakeChange = (value: string) => {
    setStake(value);
    setFormError('');
    const error = validateStake(value, balance);
    setInlineStakeError(error || '');
  };

  const handleConfirm = async () => {
    const stakeError = validateStake(stake, balance);
    const exactPriceError = mode === 'precision' ? validateExactPrice(exactPrice) : null;

    if (stakeError || exactPriceError) {
      setFormError(stakeError || exactPriceError || 'Invalid prediction details');
      return;
    }

    setFormError('');
    setStep('preparing');

    if (!publicKey || !isConnected) {
      setStep('wallet_required');
      return;
    }
    // Immediately show preparing state before starting async transaction
    setStep('preparing');
    // Yield to the event loop so the UI can update before awaiting the contract call
    await new Promise(resolve => setTimeout(resolve, 0));
    try {
      const updateStatus = (s: 'preparing' | 'signing' | 'submitting') => {
        setStep(s);
      };

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

      setTxHash(result.txHash);
      setStep('syncing');

      // Submit to backend
      await predictionsApi.submit({
        direction,
        stake,
        isLegend: mode === 'precision',
        exactPrice: mode === 'precision' ? exactPrice : undefined,
      });

      setStep('success');
      if (onSuccess) {
        onSuccess(result.txHash);
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Prediction submission error:', error);
      setErrorMsg(error.message || 'An unexpected error occurred');
      setStep('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${MODAL_OVERLAY}`} onClick={onClose} />
      <div className={`glass-card relative z-10 w-full max-w-md rounded-2xl bg-gray-900 border border-gray-800 p-6 text-white shadow-2xl ${MODAL_CONTENT}`}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>

        {step === 'wallet_required' && (
          <div className="text-center py-4">
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
          </div>
        )}

        {step === 'confirm' && (
          <div>
            <h3 className="text-lg font-bold mb-4" id="prediction-modal-title">Confirm Prediction</h3>

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
                <label htmlFor="bet-modal-stake" className="mb-2 block text-sm text-gray-400">Stake</label>
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

            <button
              onClick={handleConfirm}
              disabled={!isConnected}
              className="w-full py-3.5 bg-green-600 hover:bg-green-500 rounded-xl font-bold transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-green-600"
            >
              Confirm
            </button>
          </div>
        )}

        {(step === 'preparing' || step === 'signing' || step === 'submitting' || step === 'syncing') && (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-lg font-semibold">
              {step === 'preparing' && 'Preparing Transaction...'}
              {step === 'signing' && 'Waiting for Freighter Signature...'}
              {step === 'submitting' && 'Submitting Transaction to Network...'}
              {step === 'syncing' && 'Syncing Prediction to Backend...'}
            </h3>
            <p className="text-gray-400 text-sm mt-2">
              Please check your wallet interface if prompted.
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              ✓
            </div>
            <h3 className="text-xl font-bold mb-2">Prediction Submitted!</h3>
            <p className="text-gray-400 text-sm mb-6">
              Your prediction has been successfully written on-chain and registered.
            </p>
            <div className="space-y-3">
              <a
                href={`https://stellarexpert.org/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="block w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition"
              >
                View on StellarExpert
              </a>
              <button
                onClick={onClose}
                className="w-full py-3 border border-gray-800 hover:bg-gray-850 rounded-xl font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              ✕
            </div>
            <h3 className="text-xl font-bold mb-2">Transaction Failed</h3>
            <p className="text-red-400 text-sm mb-6 px-4 break-words">
              {errorMsg}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleConfirm}
                className="w-full py-3 bg-[#2C4BFD] hover:bg-[#2C4BFD]/80 rounded-xl font-semibold transition"
              >
                Retry
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 border border-gray-800 hover:bg-gray-850 rounded-xl font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
