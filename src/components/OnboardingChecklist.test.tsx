import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import OnboardingChecklist from './OnboardingChecklist';

// The exact storage key the component owns (also asserted by the e2e fixtures).
const ONBOARDING_KEY = 'xelma_onboarding_dismissed';

/**
 * jsdom + src/test/setup.ts back localStorage with an in-memory mock, so these
 * tests exercise the real read/write/dismiss flow — no extra mocking is needed
 * beyond clearing storage between tests. The component renders react-router
 * `Link`s, hence the MemoryRouter wrapper.
 */
function renderChecklist() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <OnboardingChecklist />
    </MemoryRouter>,
  );
}

describe('OnboardingChecklist dismiss persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the checklist when the storage key is absent', () => {
    expect(localStorage.getItem(ONBOARDING_KEY)).toBeNull();
    renderChecklist();

    expect(screen.getByRole('heading', { name: /welcome to xelma/i })).toBeInTheDocument();
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  it('writes the storage key when dismissed and hides the checklist', () => {
    renderChecklist();

    fireEvent.click(screen.getByRole('button', { name: /dismiss onboarding checklist/i }));

    expect(localStorage.getItem(ONBOARDING_KEY)).toBe('true');
    expect(screen.queryByRole('heading', { name: /welcome to xelma/i })).not.toBeInTheDocument();
  });

  it("dismisses via the Let's Go button", () => {
    renderChecklist();

    fireEvent.click(screen.getByRole('button', { name: /let's go/i }));

    expect(localStorage.getItem(ONBOARDING_KEY)).toBe('true');
    expect(screen.queryByRole('heading', { name: /welcome to xelma/i })).not.toBeInTheDocument();
  });

  it('dismisses when the backdrop overlay is clicked', () => {
    const { container } = renderChecklist();

    // The overlay is the component's root element; clicking it (not a child)
    // must trigger the backdrop dismiss path.
    fireEvent.click(container.firstElementChild!);

    expect(localStorage.getItem(ONBOARDING_KEY)).toBe('true');
    expect(screen.queryByRole('heading', { name: /welcome to xelma/i })).not.toBeInTheDocument();
  });

  it('dismisses when a checklist step link is clicked', () => {
    renderChecklist();

    fireEvent.click(screen.getByText('Connect Wallet'));

    expect(localStorage.getItem(ONBOARDING_KEY)).toBe('true');
    expect(screen.queryByRole('heading', { name: /welcome to xelma/i })).not.toBeInTheDocument();
  });

  it('stays dismissed after a remount', () => {
    const first = renderChecklist();
    fireEvent.click(screen.getByRole('button', { name: /dismiss onboarding checklist/i }));
    expect(localStorage.getItem(ONBOARDING_KEY)).toBe('true');
    first.unmount();

    renderChecklist();

    expect(screen.queryByRole('heading', { name: /welcome to xelma/i })).not.toBeInTheDocument();
  });

  it('shows the checklist again once the storage key is cleared and remounted', () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    const first = renderChecklist();
    expect(screen.queryByRole('heading', { name: /welcome to xelma/i })).not.toBeInTheDocument();
    first.unmount();

    localStorage.removeItem(ONBOARDING_KEY);
    renderChecklist();

    expect(screen.getByRole('heading', { name: /welcome to xelma/i })).toBeInTheDocument();
  });
});
