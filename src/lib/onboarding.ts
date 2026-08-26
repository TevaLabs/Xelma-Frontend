export const ONBOARDING_DISMISSED_KEY = 'xelma_onboarding_dismissed';
export const ONBOARDING_PROGRESS_KEY = 'xelma_onboarding_progress';
export const ONBOARDING_PROGRESS_EVENT = 'xelma:onboarding-progress';

export type OnboardingStepKey = 'install' | 'connect' | 'fund' | 'predict';
export type OnboardingProgress = Record<OnboardingStepKey, boolean>;

export const EMPTY_ONBOARDING_PROGRESS: OnboardingProgress = {
  install: false,
  connect: false,
  fund: false,
  predict: false,
};

export function readOnboardingProgress(): OnboardingProgress {
  if (typeof window === 'undefined') return EMPTY_ONBOARDING_PROGRESS;

  try {
    const stored = JSON.parse(localStorage.getItem(ONBOARDING_PROGRESS_KEY) ?? '{}') as Partial<OnboardingProgress>;
    return {
      install: stored.install === true,
      connect: stored.connect === true,
      fund: stored.fund === true,
      predict: stored.predict === true,
    };
  } catch {
    return EMPTY_ONBOARDING_PROGRESS;
  }
}

/** Records a real onboarding milestone and notifies the mounted checklist. */
export function completeOnboardingStep(step: OnboardingStepKey): void {
  if (typeof window === 'undefined') return;

  const progress = { ...readOnboardingProgress(), [step]: true };
  localStorage.setItem(ONBOARDING_PROGRESS_KEY, JSON.stringify(progress));
  if (Object.values(progress).every(Boolean)) {
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, 'true');
  }
  window.dispatchEvent(new Event(ONBOARDING_PROGRESS_EVENT));
}
