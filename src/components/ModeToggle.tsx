import { Shield, Zap, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type DashboardMode = 'practice' | 'on-chain';

export interface ModeToggleProps {
  mode: DashboardMode;
  onChangeMode: (mode: DashboardMode) => void;
  isWalletConnected: boolean;
  onPromptConnect: () => void;
  className?: string;
}

export default function ModeToggle({
  mode,
  onChangeMode,
  isWalletConnected,
  onPromptConnect,
  className = '',
}: ModeToggleProps) {
  const { t } = useTranslation();

  const handleOnChainClick = () => {
    if (!isWalletConnected) {
      onPromptConnect();
    } else {
      onChangeMode('on-chain');
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0F172A]/80 p-1 backdrop-blur-md ${className}`}
      role="radiogroup"
      aria-label={t('dashboard.modeToggle.label', 'Trading mode')}
      data-testid="dashboard-mode-toggle"
    >
      {/* Practice Mode Button */}
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'practice'}
        onClick={() => onChangeMode('practice')}
        data-testid="mode-practice-btn"
        className={`group relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
          mode === 'practice'
            ? 'border border-cyan-500/40 bg-cyan-500/15 text-cyan-200 shadow-sm shadow-cyan-500/10'
            : 'border border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200'
        }`}
      >
        <Shield className="h-3.5 w-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
        <div className="flex flex-col text-left">
          <span className="leading-none">{t('dashboard.modeToggle.practice', 'Practice')}</span>
          <span className="mt-0.5 text-[10px] font-normal text-cyan-300/80 leading-none" data-testid="practice-risk-free-label">
            {t('dashboard.modeToggle.practiceSubtitle', 'virtual xLM, no on-chain risk')}
          </span>
        </div>
      </button>

      {/* On-Chain Mode Button */}
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'on-chain'}
        onClick={handleOnChainClick}
        data-testid="mode-onchain-btn"
        className={`group relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
          mode === 'on-chain'
            ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-200 shadow-sm shadow-emerald-500/10'
            : 'border border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200'
        }`}
        title={!isWalletConnected ? t('dashboard.modeToggle.connectRequired', 'Connect wallet to switch to On-Chain mode') : undefined}
      >
        {isWalletConnected ? (
          <Zap className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
        ) : (
          <Lock className="h-3.5 w-3.5 text-amber-400/80 shrink-0" aria-hidden="true" />
        )}
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1 leading-none">
            <span>{t('dashboard.modeToggle.onChain', 'On-Chain')}</span>
            {!isWalletConnected && (
              <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-medium text-amber-300">
                Wallet needed
              </span>
            )}
          </div>
          <span className="mt-0.5 text-[10px] font-normal text-gray-400 leading-none">
            {t('dashboard.modeToggle.onChainSubtitle', 'Live Stellar smart contracts')}
          </span>
        </div>
      </button>
    </div>
  );
}
