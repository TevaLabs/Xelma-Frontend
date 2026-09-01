import { useState, useRef } from 'react';
import { useStellarAddressValidation } from '../hooks/useStellarAddressValidation';
import { type Network } from '../utils/validateStellarAddress';
import { CheckCircle2, XCircle, Wallet, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import WalletConnect from '../components/WalletConnect';
import BalancesPanel from '../components/BalancesPanel';
import FriendbotFundCard from '../components/FriendbotFundCard';
import { useWalletStore } from '../store/useWalletStore';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '../components/ui/Spinner';

const Connect = () => {
  const [address, setAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<Network>('TESTNET');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { publicKey, status, setWatchOnly, isWatchOnly, disconnect } = useWalletStore();
  const isConnected = status === 'connected' && Boolean(publicKey);

  const {
    state,
    isValid,
    isValidating,
    errorMessage,
  } = useStellarAddressValidation(address, selectedNetwork);

  // Handle input change with auto-formatting
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Strip all spaces
    value = value.replace(/\s/g, '');

    // Force uppercase
    value = value.toUpperCase();

    setAddress(value);
  };

  // Handle paste with auto-formatting
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');

    // Strip spaces and force uppercase
    const formatted = pastedText.replace(/\s/g, '').toUpperCase();

    setAddress(formatted);

    // Set cursor position after pasted content
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(formatted.length, formatted.length);
      }
    }, 0);
  };

  // Handle connect button click
  const handleConnect = async () => {
    if (!isValid) {
      toast.error('Please enter a valid Stellar address');
      return;
    }

    // Use watch-only mode for manual address connection
    await setWatchOnly(address);
  };

  // Get the feedback icon based on validation state
  const getFeedbackIcon = () => {
    if (isValidating) {
      return <Spinner label="Validating address" size="sm" />;
    }
    if (isValid) {
      return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    }
    if (state !== 'idle' && state !== 'validating') {
      return <XCircle className="w-5 h-5 text-red-400" />;
    }
    return null;
  };

  // Get input border color based on validation state
  const getInputBorderColor = () => {
    if (isValidating) {
      return 'border-cyan-500/50 focus:border-cyan-400 focus:ring-cyan-400/30';
    }
    if (isValid) {
      return 'border-green-500/50 focus:border-green-400 focus:ring-green-400/30';
    }
    if (state !== 'idle' && state !== 'validating') {
      return 'border-red-500/50 focus:border-red-400 focus:ring-red-400/30';
    }
    return 'border-gray-700 focus:border-[#2C4BFD] focus:ring-[#2C4BFD]/30';
  };

  return (
    <div className="xelma-grid-bg min-h-screen relative flex items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(44,75,253,0.15),_transparent_60%)]" />
      <div className="pointer-events-none absolute -left-24 top-32 h-80 w-80 rounded-full bg-cyan-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-16 h-96 w-96 rounded-full bg-[#2C4BFD]/8 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#2C4BFD] to-[#22D3EE] flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {isWatchOnly ? 'Watch-Only Mode' : 'Connect Wallet'}
              </h1>
              <p className="text-sm text-gray-400">
                {isWatchOnly
                  ? 'Viewing an address without signing capability'
                  : 'Connect your Freighter wallet to get started'}
              </p>
            </div>
          </div>

          {/* Primary path: Freighter wallet connection (shared flow) */}
          <div className="mb-6">
            {isWatchOnly ? (
              <>
                <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-semibold">Watch-only address active</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-400 break-all font-mono">{publicKey}</p>
                </div>
                <BalancesPanel className="mt-4" />
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => disconnect()}
                    className="flex-1 rounded-xl border border-gray-700 px-4 py-3 text-sm font-bold text-gray-400 hover:bg-white/5 transition-colors"
                  >
                    Disconnect
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="btn-primary flex-1 rounded-xl px-4 py-3 text-sm font-bold"
                  >
                    Continue to Dashboard
                  </button>
                </div>
              </>
            ) : (
              <>
                <WalletConnect />
                {isConnected && (
                  <>
                    <FriendbotFundCard className="mt-4" />
                    <BalancesPanel className="mt-4" />
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="btn-primary mt-4 w-full rounded-xl px-4 py-3 text-sm font-bold"
                    >
                      Continue to Dashboard
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Advanced path toggle: optional watch-only mode */}
          <div className="border-t border-[#BEC7FE]/10 pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex w-full items-center justify-between text-sm font-medium text-gray-400 hover:text-white transition-colors"
              aria-expanded={showAdvanced}
            >
              <span>Watch-only: view an address without signing</span>
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {showAdvanced && (
          <>
          {/* Network Selection */}
          <div className="mb-6 mt-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Network
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedNetwork('MAINNET')}
                className={clsx(
                  'flex-1 px-4 py-2 rounded-lg font-medium transition-all',
                  selectedNetwork === 'MAINNET'
                    ? 'bg-[#2C4BFD] text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                )}
              >
                Mainnet
              </button>
              <button
                type="button"
                onClick={() => setSelectedNetwork('TESTNET')}
                className={clsx(
                  'flex-1 px-4 py-2 rounded-lg font-medium transition-all',
                  selectedNetwork === 'TESTNET'
                    ? 'bg-[#2C4BFD] text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                )}
              >
                Testnet
              </button>
            </div>
          </div>

          {/* Address Input */}
          <div className="mb-4">
            <label
              htmlFor="stellar-address"
              className="block text-sm font-medium text-gray-400 mb-2"
            >
              Stellar Address
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="stellar-address"
                type="text"
                value={address}
                onChange={handleInputChange}
                onPaste={handlePaste}
                placeholder="GABCDEFGHIJKLMNOPQRSTUVWXYZ..."
                className={clsx(
                  'w-full px-4 py-3 pr-12 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all',
                  'bg-gray-950 text-white placeholder-gray-500',
                  getInputBorderColor()
                )}
                maxLength={56}
                autoComplete="off"
                spellCheck="false"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {getFeedbackIcon()}
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-2 flex items-start gap-2 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {isValid && (
              <div className="mt-2 flex items-start gap-2 text-sm text-green-400">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Address is valid and exists on {selectedNetwork}</span>
              </div>
            )}

            {/* Helper Text */}
            {state === 'idle' && (
              <p className="mt-2 text-xs text-gray-500">
                Enter a 56-character Stellar address (starts with G for Mainnet)
              </p>
            )}
          </div>

          {/* Connect Button */}
          <button
            type="button"
            onClick={handleConnect}
            disabled={!isValid || isValidating}
            className={clsx(
              'w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200',
              'flex items-center justify-center gap-2',
              isValid && !isValidating
                ? 'bg-[#2C4BFD] hover:bg-[#1a3bf0] text-white cursor-pointer'
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            )}
          >
            {isValidating ? (
              <>
                <Spinner size="sm" />
                <span>Validating...</span>
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                <span>View in Watch-Only Mode</span>
              </>
            )}
          </button>
          </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Connect;