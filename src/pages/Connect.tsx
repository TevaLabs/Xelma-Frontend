import { useState, useRef } from 'react';
import { useStellarAddressValidation } from '../hooks/useStellarAddressValidation';
import { type Network } from '../utils/validateStellarAddress';
import { Loader2, CheckCircle2, XCircle, Wallet, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import WalletConnect from '../components/WalletConnect';
import { useWalletStore } from '../store/useWalletStore';
import { useNavigate } from 'react-router-dom';

const Connect = () => {
  const [address, setAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<Network>('TESTNET');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { publicKey, status } = useWalletStore();
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
  const handleConnect = () => {
    if (!isValid) {
      toast.error('Please enter a valid Stellar address');
      return;
    }

    // Here you would typically connect to the address
    // For now, we'll just show a success message
    toast.success(`Connected to ${address.slice(0, 8)}...${address.slice(-8)} on ${selectedNetwork}`);
    
    // You can add your connection logic here
    // For example, update a store or call an API
  };

  // Get the feedback icon based on validation state
  const getFeedbackIcon = () => {
    if (isValidating) {
      return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
    }
    if (isValid) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    if (state !== 'idle' && state !== 'validating') {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return null;
  };

  // Get input border color based on validation state
  const getInputBorderColor = () => {
    if (isValidating) {
      return 'border-blue-300 focus:border-blue-500 focus:ring-blue-500';
    }
    if (isValid) {
      return 'border-green-300 focus:border-green-500 focus:ring-green-500';
    }
    if (state !== 'idle' && state !== 'validating') {
      return 'border-red-300 focus:border-red-500 focus:ring-red-500';
    }
    return 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Connect Wallet
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Connect your Freighter wallet to get started
              </p>
            </div>
          </div>

          {/* Primary path: Freighter wallet connection (shared flow) */}
          <div className="mb-6">
            <WalletConnect />
            {isConnected && (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="mt-4 w-full px-4 py-3 rounded-lg font-semibold bg-[#2C4BFD] hover:bg-[#1a3bf0] text-white shadow-lg shadow-blue-500/20 transition-all duration-200"
              >
                Continue to Dashboard
              </button>
            )}
          </div>

          {/* Advanced path toggle: optional manual address validation */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex w-full items-center justify-between text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-expanded={showAdvanced}
            >
              <span>Advanced: validate an address manually</span>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Network
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedNetwork('MAINNET')}
                className={clsx(
                  'flex-1 px-4 py-2 rounded-lg font-medium transition-all',
                  selectedNetwork === 'MAINNET'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
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
                  'bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500',
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
              <div className="mt-2 flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {isValid && (
              <div className="mt-2 flex items-start gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Address is valid and exists on {selectedNetwork}</span>
              </div>
            )}

            {/* Helper Text */}
            {state === 'idle' && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
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
                ? 'bg-[#2C4BFD] hover:bg-[#1a3bf0] text-white shadow-lg shadow-blue-500/20 cursor-pointer'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            )}
          >
            {isValidating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Validating...</span>
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                <span>Validate Address</span>
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