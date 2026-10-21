import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

/**
 * Routing regression tests for the app shell.
 *
 * The bug this guards against: two `path="*"` routes in the route table, the
 * first one redirecting to "/". React Router only ever matches the first
 * catch-all, so the 404 page was unreachable and every unknown URL bounced
 * back to the landing page.
 */

// The app chrome (wallet header, command palette, footer, onboarding modal)
// is stubbed so the suite stays deterministic and free of wallet/socket side
// effects. Only the route table is under test here.
vi.mock('./components/Navbar', () => ({
  default: () => <div data-testid="navbar-stub" />,
}));
vi.mock('./components/CommandPalette', () => ({
  default: () => <div data-testid="command-palette-stub" />,
}));
vi.mock('./components/Footer', () => ({
  default: () => <div data-testid="footer-stub" />,
}));
vi.mock('./components/OnboardingChecklist', () => ({
  default: () => null,
}));
vi.mock('./components/OfflineBanner', () => ({
  OfflineBanner: () => null,
}));
vi.mock('sonner', async (importOriginal) => ({
  ...(await importOriginal<typeof import('sonner')>()),
  Toaster: () => null,
}));

// Page modules are stubbed so we can assert *which* route matched without
// mounting the real (network-bound) page implementations. NotFound is
// deliberately NOT stubbed — it is the subject of these tests.
vi.mock('./pages/Landing', () => ({
  default: () => <div data-testid="landing-page" />,
}));
vi.mock('./pages/Dashboard', () => ({
  default: () => <div data-testid="dashboard-page" />,
}));

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

/**
 * Extract every `<Route ...>` declaration from the App source, keeping only
 * the catch-all ones (`path="*"`). React Router matches routes in
 * declaration order and never falls through to a second catch-all, so the
 * number and the target of these declarations are part of the contract.
 */
function catchAllRouteDeclarations(source: string): string[] {
  return source
    .split('<Route')
    .slice(1)
    // Comments are stripped first so a route that is only *mentioned* in a
    // comment (e.g. the "do not add a second catch-all" note) is not counted.
    .map((declaration) =>
      declaration
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|\s)\/\/.*$/gm, ''),
    )
    .filter((declaration) => /path=["']\*["']/.test(declaration));
}

describe('App routing', () => {
  it('renders the 404 page for an unknown path', () => {
    renderApp('/this-route-does-not-exist');

    expect(
      screen.getByRole('heading', { level: 1, name: /this path doesn't exist/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText(/unknown route/i)).toBeInTheDocument();
  });

  it('does not redirect unknown paths to the landing page', () => {
    renderApp('/this-route-does-not-exist');

    expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /this path doesn't exist/i })).toBeInTheDocument();
  });

  it('still renders the landing page on the root route', () => {
    renderApp('/');

    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1, name: /this path doesn't exist/i })).not.toBeInTheDocument();
  });

  it('still renders a matched route instead of the catch-all', async () => {
    renderApp('/dashboard');

    expect(await screen.findByTestId('dashboard-page')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1, name: /this path doesn't exist/i })).not.toBeInTheDocument();
  });

  it('declares exactly one catch-all route and points it at NotFound', () => {
    const appSourcePath = join(dirname(fileURLToPath(import.meta.url)), 'App.tsx');
    const source = readFileSync(appSourcePath, 'utf8');
    const catchAlls = catchAllRouteDeclarations(source);

    expect(catchAlls).toHaveLength(1);
    expect(catchAlls[0]).toMatch(/element=\{<NotFound\s*\/>/);
    expect(catchAlls[0]).not.toMatch(/Navigate/);
  });
});
