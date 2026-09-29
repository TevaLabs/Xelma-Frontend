import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import OnboardingChecklist from '../OnboardingChecklist';
import { useWalletStore } from '../../store/useWalletStore';
import {
  ONBOARDING_KEY,
  ONBOARDING_STEPS_KEY,
  markOnboardingStepComplete,
  setOnboardingStepsState,
} from '../../utils/onboarding';

function renderChecklist() {
  return render(
    <MemoryRouter>
      <OnboardingChecklist />
    </MemoryRouter>,
  );
}

describe('OnboardingChecklist', () => {
  beforeEach(() => {
    localStorage.clear();
    useWalletStore.setState({
      status: 'idle',
      publicKey: null,
      balance: null,
      network: null,
      errorMessage: null,
      errorCode: null,
      networkMismatch: false,
      isWatchOnly: false,
    });
  });

  it('Wallet-connect auto-completes the connect step', async () => {
    renderChecklist();

    expect(screen.getByTestId('onboarding-step-connect')).toHaveAttribute('data-completed', 'false');

    act(() => {
      useWalletStore.setState({
        status: 'connected',
        publicKey: 'GBCXTESTWALLETADDRESS123456789012345678901234567890123456',
        balance: '0.00 XLM',
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('onboarding-step-connect')).toHaveAttribute('data-completed', 'true');
    });

    const saved = JSON.parse(localStorage.getItem(ONBOARDING_STEPS_KEY) || '{}');
    expect(saved.connect).toBe(true);
  });

  it('Completion state persists across a simulated reload (localStorage read on mount)', () => {
    setOnboardingStepsState({
      connect: true,
      fund: true,
      predict: false,
    });

    renderChecklist();

    expect(screen.getByTestId('onboarding-step-connect')).toHaveAttribute('data-completed', 'true');
    expect(screen.getByTestId('onboarding-step-fund')).toHaveAttribute('data-completed', 'true');
    expect(screen.getByTestId('onboarding-step-predict')).toHaveAttribute('data-completed', 'false');
    expect(screen.getByTestId('onboarding-progress-indicator')).toHaveTextContent('2/3 Complete');
  });

  it('Auto-dismiss fires when all three steps complete', async () => {
    setOnboardingStepsState({
      connect: true,
      fund: true,
      predict: false,
    });

    renderChecklist();

    expect(screen.getByTestId('onboarding-checklist-modal')).toBeInTheDocument();

    act(() => {
      markOnboardingStepComplete('predict');
    });

    await waitFor(() => {
      expect(screen.queryByTestId('onboarding-checklist-modal')).not.toBeInTheDocument();
    });

    expect(localStorage.getItem(ONBOARDING_KEY)).toBe('true');
  });

  it('Manual dismiss still works independently', () => {
    renderChecklist();

    expect(screen.getByTestId('onboarding-checklist-modal')).toBeInTheDocument();

    const dismissButton = screen.getByTestId('onboarding-dismiss-button');
    fireEvent.click(dismissButton);

    expect(screen.queryByTestId('onboarding-checklist-modal')).not.toBeInTheDocument();
    expect(localStorage.getItem(ONBOARDING_KEY)).toBe('true');
  });
});
