import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Wallet, Library, TrendingUp, Check } from 'lucide-react';
import { MODAL_OVERLAY, MODAL_CONTENT } from '../utils/motion';
import {
  ONBOARDING_KEY,
  getOnboardingStepsState,
  isAllOnboardingStepsComplete,
  markOnboardingStepComplete,
  type OnboardingStepKey,
  type OnboardingStepsState,
} from '../utils/onboarding';
import {
  useWalletStore,
  selectIsWalletConnected,
  parseXlmBalance,
} from '../store/useWalletStore';

interface Step {
  key: OnboardingStepKey;
  label: string;
  description: string;
  icon: typeof Wallet;
  link: string;
  external: boolean;
}

const STEPS: Step[] = [
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

function StepAction({
  step,
  isCompleted,
  onDismiss,
}: {
  step: Step;
  isCompleted: boolean;
  onDismiss: () => void;
}) {
  const Icon = step.icon;
  const content = (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3.5 transition-colors ${
        isCompleted
          ? 'border-green-500/20 bg-green-500/5'
          : 'border-white/5 bg-white/[0.02] hover:border-[#2C4BFD]/20 hover:bg-[#2C4BFD]/5'
      }`}
      data-testid={`onboarding-step-${step.key}`}
      data-completed={isCompleted}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-[#2C4BFD]/15 text-cyan-300'
        }`}
      >
        {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-semibold ${isCompleted ? 'text-green-300 line-through' : 'text-white'}`}>
            {step.label}
          </p>
          {isCompleted && (
            <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-400">
              Complete
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-gray-400 leading-relaxed">{step.description}</p>
      </div>
    </div>
  );

  if (isCompleted) {
    return <div>{content}</div>;
  }

  if (step.external) {
    return (
      <a href={step.link} target="_blank" rel="noopener noreferrer" onClick={onDismiss}>
        {content}
      </a>
    );
  }

  return (
    <Link to={step.link} onClick={onDismiss}>
      {content}
    </Link>
  );
}

export default function OnboardingChecklist() {
  const [stepsState, setStepsState] = useState<OnboardingStepsState>(() => getOnboardingStepsState());
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    const dismissed = localStorage.getItem(ONBOARDING_KEY);
    if (dismissed) return false;
    const initialSteps = getOnboardingStepsState();
    return !isAllOnboardingStepsComplete(initialSteps);
  });

  // Reactive store subscription to track connect and fund milestones
  useEffect(() => {
    const syncWalletMilestones = (state: ReturnType<typeof useWalletStore.getState>) => {
      const isConnected = selectIsWalletConnected(state);
      if (isConnected) {
        markOnboardingStepComplete('connect');
        const numericBal = parseXlmBalance(state.balance);
        if (numericBal !== null && numericBal > 0) {
          markOnboardingStepComplete('fund');
        }
      }
    };

    // Check initial state
    syncWalletMilestones(useWalletStore.getState());

    // Subscribe to Zustand store changes
    const unsubscribe = useWalletStore.subscribe((state) => syncWalletMilestones(state));
    return () => unsubscribe();
  }, []);

  // Listen for step complete events
  useEffect(() => {
    const handleStepComplete = () => {
      const current = getOnboardingStepsState();
      setStepsState(current);
      if (isAllOnboardingStepsComplete(current)) {
        setVisible(false);
      }
    };

    window.addEventListener('xelma:onboarding-step-complete', handleStepComplete);
    return () => {
      window.removeEventListener('xelma:onboarding-step-complete', handleStepComplete);
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      // localStorage unavailable
    }
    setVisible(false);
  };

  if (!visible) return null;

  const completedCount = STEPS.filter((s) => stepsState[s.key]).length;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60 ${MODAL_OVERLAY}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
      data-testid="onboarding-checklist-modal"
    >
      <div
        className={`relative w-full max-w-md rounded-2xl border border-[#BEC7FE]/12 bg-[#111827] p-6 shadow-2xl sm:p-8 ${MODAL_CONTENT}`}
      >
        <button
          onClick={dismiss}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          aria-label="Dismiss onboarding checklist"
          data-testid="onboarding-dismiss-button"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Welcome to Xelma</h2>
          <span className="text-xs font-semibold text-cyan-400" data-testid="onboarding-progress-indicator">
            {completedCount}/{STEPS.length} Complete
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-400">
          Follow these steps to get started with on-chain predictions.
        </p>

        <div className="mt-6 space-y-3">
          {STEPS.map((step) => (
            <StepAction
              key={step.key}
              step={step}
              isCompleted={Boolean(stepsState[step.key])}
              onDismiss={dismiss}
            />
          ))}
        </div>

        <button
          onClick={dismiss}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#2C4BFD] to-[#06B6D4] px-4 py-3 text-sm font-bold text-white transition-all hover:opacity-90 cursor-pointer"
          data-testid="onboarding-action-button"
        >
          Let's Go
        </button>
      </div>
    </div>
  );
}
