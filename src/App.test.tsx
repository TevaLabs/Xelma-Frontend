import '@testing-library/jest-dom';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import './i18n';

// The routing contract under test only needs the router shell and NotFound.
// Mock the app chrome so an unknown path renders deterministically in jsdom.
vi.mock('sonner', () => ({ Toaster: () => <div data-testid="toaster" /> }));
vi.mock('./components/Navbar', () => ({ default: () => <div data-testid="navbar" /> }));
vi.mock('./components/CommandPalette', () => ({ default: () => <div /> }));
vi.mock('./components/RouteProgressBar', () => ({ default: () => <div /> }));
vi.mock('./components/RouteTransition', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('./components/OfflineBanner', () => ({ OfflineBanner: () => <div /> }));
vi.mock('./components/Footer', () => ({ default: () => <div data-testid="footer" /> }));
vi.mock('./components/OnboardingChecklist', () => ({ default: () => <div /> }));
vi.mock('./components/ErrorBoundary', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('./components/LazyBoundary', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('./pages/Landing', () => ({ default: () => <div data-testid="landing" /> }));
vi.mock('./pages/PublicProfile', () => ({
  default: () => (
    <div data-testid="public-profile-card">
      <span data-testid="profile-handle">@alice</span>
    </div>
  ),
}));

import App from './App';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App catch-all routing', () => {
  it('renders NotFound for an unmatched path via the single catch-all', async () => {
    renderAt('/definitely-not-a-route');

    expect(await screen.findByText("This path doesn't exist")).toBeInTheDocument();
    expect(screen.getByText('Unknown route')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to home/i })).toBeInTheDocument();
  });

  it('does not render NotFound for a real route', async () => {
    renderAt('/');

    expect(await screen.findByTestId('landing')).toBeInTheDocument();
    expect(screen.queryByText("This path doesn't exist")).not.toBeInTheDocument();
  });

  it('renders PublicProfile for /u/:handle', async () => {
    renderAt('/u/alice');

    expect(await screen.findByTestId('public-profile-card')).toBeInTheDocument();
    expect(screen.getByTestId('profile-handle')).toHaveTextContent('@alice');
  });

  it('keeps the skip link pointed at the main landmark', () => {
    renderAt('/definitely-not-a-route');

    expect(screen.getByRole('link', { name: /skip to main content/i })).toHaveAttribute(
      'href',
      '#main-content',
    );
  });
});
