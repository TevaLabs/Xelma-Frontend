import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

vi.mock('./components/Navbar', () => ({ default: () => <nav data-testid="navbar" /> }));
vi.mock('./components/CommandPalette', () => ({ default: () => null }));
vi.mock('./components/RouteProgressBar', () => ({ default: () => null }));
vi.mock('./components/OfflineBanner', () => ({ OfflineBanner: () => null }));
vi.mock('./components/Footer', () => ({ default: () => null }));
vi.mock('./components/OnboardingChecklist', () => ({ default: () => null }));
vi.mock('./pages/Landing', () => ({ default: () => <main id="main-content" tabIndex={-1}>Landing</main> }));

describe('App skip-to-content landmark', () => {
  it('renders skip link targeting #main-content', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('skip link href matches the main-content landmark on the rendered route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    const targetId = skipLink.getAttribute('href')?.replace('#', '');
    expect(targetId).toBe('main-content');
    const targetElement = document.getElementById(targetId!);
    expect(targetElement).toBeInTheDocument();
    expect(targetElement?.tagName.toLowerCase()).toBe('main');
  });
});
