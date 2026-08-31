import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Download, Wallet, Library, TrendingUp } from 'lucide-react';
import { MODAL_OVERLAY, MODAL_CONTENT } from '../utils/motion';
import { selectIsWalletConnected, useWalletStore } from '../store/useWalletStore';
import {
  completeOnboardingStep,
  ONBOARDING_DISMISSED_KEY,
  ONBOARDING_PROGRESS_EVENT,
  readOnboardingProgress,
  type OnboardingStepKey,
} from '../lib/onboarding';

interface Step {
  key: string;
  label: string;
  description: string;
  icon: typeof Download;
  link: string;
  external: boolean;
}

const STEPS: Step[] = [
  {
    key: 'install',
    label: 'Install Freighter',
    description: 'Get the Freighter wallet extension to interact with Stellar.',
    icon: Download,
    link: 'https://freighter.app',
    external: true,
  },
  {
    key: 'connect',
    label: 'Connect Wallet',
    description: 'Link your Freighter wallet to Xelma and authorize the connection.',
    icon: Wallet,
    link: '/connect',
    external: false,
  },
  {
    key: 'fund',
    label: 'Fund Testnet',
    description: 'Learn how to get free testnet XLM for practice predictions.',
    icon: Library,
    link: '/learn',
    external: false,
  },
  {
    key: 'predict',
    label: 'Place Practice Prediction',
    description: 'Put your vXLM to work — make your first prediction on the terminal.',
    icon: TrendingUp,
    link: '/dashboard',
    external: false,
  },
];

function StepAction({ step, complete, onNavigate }: { step: Step; complete: boolean; onNavigate: () => void }) {
  const Icon = step.icon;
  const content = (
    <div className={`flex items-start gap-3 rounded-xl border p-3.5 transition-colors ${complete ? 'border-emerald-400/20 bg-emerald-400/[0.06]' : 'border-white/5 bg-white/[0.02] hover:border-[#2C4BFD]/20 hover:bg-[#2C4BFD]/5'}`}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${complete ? 'bg-emerald-400/15 text-emerald-300' : 'bg-[#2C4BFD]/15 text-cyan-300'}`}>
        {complete ? <Check className="h-4 w-4" aria-hidden /> : <Icon className="h-4 w-4" aria-hidden />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${complete ? 'text-emerald-100' : 'text-white'}`}>{step.label}</p>
        <p className="mt-0.5 text-xs text-gray-400 leading-relaxed">{step.description}</p>
      </div>
      {complete && <span className="text-xs font-semibold text-emerald-300">Done</span>}
    </div>
  );

  if (step.external) {
    return (
      <a
        href={step.link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
      >
        {content}
      </a>
    );
  }

  return (
    <Link to={step.link} onClick={onNavigate}>
      {content}
    </Link>
  );
}

export default function OnboardingChecklist() {
  const isWalletConnected = useWalletStore(selectIsWalletConnected);
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    const dismissed = localStorage.getItem(ONBOARDING_DISMISSED_KEY);
    return !dismissed;
  });
  const [progress, setProgress] = useState(readOnboardingProgress);

  useEffect(() => {
    const syncProgress = () => setProgress(readOnboardingProgress());
    window.addEventListener(ONBOARDING_PROGRESS_EVENT, syncProgress);
    window.addEventListener('storage', syncProgress);
    return () => {
      window.removeEventListener(ONBOARDING_PROGRESS_EVENT, syncProgress);
      window.removeEventListener('storage', syncProgress);
    };
  }, []);

  useEffect(() => {
    // A connected Freighter wallet proves both that Freighter is available and
    // that the user has completed the connect milestone.
    if (isWalletConnected) {
      completeOnboardingStep('install');
      completeOnboardingStep('connect');
    }
  }, [isWalletConnected]);

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, 'true');
    setVisible(false);
  };

  const completedCount = Object.values(progress).filter(Boolean).length;
  const progressPercent = (completedCount / STEPS.length) * 100;

  if (!visible || Object.values(progress).every(Boolean)) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60 ${MODAL_OVERLAY}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div
        className={`relative w-full max-w-md rounded-2xl border border-[#BEC7FE]/12 bg-[#111827] p-6 shadow-2xl sm:p-8 ${MODAL_CONTENT}`}
      >
        <button
          onClick={dismiss}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          aria-label="Dismiss onboarding checklist"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-white">Welcome to Xelma</h2>
        <p className="mt-1 text-sm text-gray-400">
          Follow these steps to get started with on-chain predictions.
        </p>

        <div className="mt-5" aria-label={`${completedCount} of ${STEPS.length} onboarding steps completed`}>
          <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
            <span>Getting started</span>
            <span>{completedCount}/{STEPS.length} complete</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Onboarding completion progress" aria-valuemin={0} aria-valuemax={STEPS.length} aria-valuenow={completedCount}>
            <div className="h-full rounded-full bg-gradient-to-r from-[#2C4BFD] to-cyan-400 transition-[width] duration-200" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {STEPS.map((step) => (
            <StepAction key={step.key} step={step} complete={progress[step.key as OnboardingStepKey]} onNavigate={() => setVisible(false)} />
          ))}
        </div>

        <button
          onClick={dismiss}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#2C4BFD] to-[#06B6D4] px-4 py-3 text-sm font-bold text-white transition-all hover:opacity-90 cursor-pointer"
        >
          Let's Go
        </button>
      </div>
    </div>
  );
}
