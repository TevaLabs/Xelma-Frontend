import { act, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import OnboardingChecklist from './OnboardingChecklist';
import { useWalletStore } from '../store/useWalletStore';
import { ONBOARDING_PROGRESS_KEY } from '../lib/onboarding';

function resetWallet() {
  useWalletStore.setState({
    status: 'idle',
    publicKey: null,
    network: null,
    balance: null,
    errorMessage: null,
    errorCode: null,
    networkMismatch: false,
  });
}

describe('OnboardingChecklist', () => {
  beforeEach(() => {
    localStorage.clear();
    resetWallet();
  });

  afterEach(() => {
    resetWallet();
  });

  it('marks the install and connect steps complete when the wallet store connects', async () => {
    render(
      <BrowserRouter>
        <OnboardingChecklist />
      </BrowserRouter>,
    );

    await act(async () => {
      useWalletStore.setState({ status: 'connected', publicKey: 'GCONNECTED' });
    });

    await waitFor(() => {
      expect(screen.getByText('2/4 complete')).toBeInTheDocument();
      expect(screen.getAllByText('Done')).toHaveLength(2);
    });

    expect(JSON.parse(localStorage.getItem(ONBOARDING_PROGRESS_KEY) ?? '{}')).toMatchObject({
      install: true,
      connect: true,
      fund: false,
      predict: false,
    });
  });
});
