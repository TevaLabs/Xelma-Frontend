import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import App from './App';
import './i18n';

/**
 * Issue #658 — the app must keep exactly one catch-all route and it must
 * render the branded NotFound page. Regression: a duplicate `path="*"`
 * redirecting to `/` shadowed the 404, so unknown URLs silently bounced
 * users back to the landing page.
 */
function renderAppAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App routing — single catch-all renders NotFound (#658)', () => {
  it('renders the branded 404 page for an unknown route', () => {
    renderAppAt('/definitely-not-a-route');

    expect(screen.getByRole('heading', { level: 1, name: /this path doesn't exist/i })).toBeInTheDocument();
    expect(screen.getByText('Unknown route')).toBeInTheDocument();
    // 404 CTAs are present and point at real destinations.
    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /open terminal/i })).toHaveAttribute('href', '/dashboard');
  });

  it('keeps the skip-to-content link wired to the 404 main region', () => {
    renderAppAt('/definitely-not-a-route');

    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });

  it('does not redirect unknown paths to the landing page', () => {
    renderAppAt('/definitely-not-a-route');

    // The landing hero would render this heading; the 404 page must render
    // instead, proving no wildcard redirect is shadowing the catch-all.
    expect(screen.queryByText(/read the market/i)).not.toBeInTheDocument();
  });
});
