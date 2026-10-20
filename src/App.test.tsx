import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./components/Navbar', () => ({ default: () => <nav data-testid="navbar" /> }));
vi.mock('./components/CommandPalette', () => ({ default: () => null }));
vi.mock('./components/RouteProgressBar', () => ({ default: () => null }));
vi.mock('./components/OnboardingChecklist', () => ({ default: () => null }));
vi.mock('./components/OfflineBanner', () => ({ OfflineBanner: () => null }));
vi.mock('./components/RouteTransition', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./pages/Landing', () => ({ default: () => <main>Landing</main> }));
vi.mock('./pages/Dashboard', () => ({ default: () => <main>Dashboard</main> }));
vi.mock('./pages/Learn', () => ({ default: () => <main>Learn</main> }));
vi.mock('./components/Footer', () => ({
  default: ({ variant }: { variant?: string }) => (
    <footer data-testid="footer" data-variant={variant ?? 'default'} />
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

describe('App footer', () => {
  it('renders the compact footer on /dashboard', async () => {
    renderAt('/dashboard');
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toHaveAttribute('data-variant', 'compact');
  });

  it('renders the default footer on other routes', async () => {
    renderAt('/learn');
    expect(await screen.findByText('Learn')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toHaveAttribute('data-variant', 'default');
  });

  it('does not render the global footer on the landing page', async () => {
    renderAt('/');
    expect(await screen.findByText('Landing')).toBeInTheDocument();
    expect(screen.queryByTestId('footer')).toBeNull();
  });
});
