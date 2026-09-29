export const ONBOARDING_KEY = 'xelma_onboarding_dismissed';
export const ONBOARDING_STEPS_KEY = 'xelma_onboarding_steps';

export type OnboardingStepKey = 'connect' | 'fund' | 'predict';

export interface OnboardingStepsState {
  connect: boolean;
  fund: boolean;
  predict: boolean;
}

export const DEFAULT_ONBOARDING_STEPS: OnboardingStepsState = {
  connect: false,
  fund: false,
  predict: false,
};

export function getOnboardingStepsState(): OnboardingStepsState {
  if (typeof window === 'undefined') return DEFAULT_ONBOARDING_STEPS;
  try {
    const raw = localStorage.getItem(ONBOARDING_STEPS_KEY);
    if (!raw) return DEFAULT_ONBOARDING_STEPS;
    const parsed = JSON.parse(raw);
    return {
      connect: Boolean(parsed?.connect),
      fund: Boolean(parsed?.fund),
      predict: Boolean(parsed?.predict),
    };
  } catch {
    return DEFAULT_ONBOARDING_STEPS;
  }
}

export function setOnboardingStepsState(state: OnboardingStepsState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ONBOARDING_STEPS_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable
  }
}

export function isAllOnboardingStepsComplete(state: OnboardingStepsState = getOnboardingStepsState()): boolean {
  return Boolean(state.connect && state.fund && state.predict);
}

export function markOnboardingStepComplete(step: OnboardingStepKey): OnboardingStepsState {
  const current = getOnboardingStepsState();
  if (current[step]) return current;

  const next: OnboardingStepsState = {
    ...current,
    [step]: true,
  };
  setOnboardingStepsState(next);

  if (isAllOnboardingStepsComplete(next)) {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      // localStorage unavailable
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('xelma:onboarding-step-complete', {
        detail: { step, state: next },
      }),
    );
  }

  return next;
}
