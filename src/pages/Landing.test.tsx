import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Landing from './Landing';
import '../i18n';
import i18n from '../i18n';

vi.mock('../components/HowItWorks', () => ({
  default: () => <div data-testid="how-it-works-mock">How It Works Mock</div>
}));

vi.mock('../components/ModeCards', () => ({
  default: () => <div data-testid="mode-cards-mock">Mode Cards Mock</div>
}));

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('Landing Page', () => {
  it('renders hero section with headline and subtitle', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    const heroHeading = screen.getByRole('heading', { level: 1 });
    expect(heroHeading).toHaveTextContent(/read the market/i);
    expect(heroHeading).toHaveTextContent(/prove your call/i);
    expect(screen.getByText(/stellar prediction infrastructure/i)).toBeInTheDocument();
  });

  it('renders primary CTA linking to dashboard with proper a11y', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    const primaryCta = screen.getByRole('link', { name: /enter prediction terminal/i });
    expect(primaryCta).toBeInTheDocument();
    expect(primaryCta).toHaveAttribute('href', '/dashboard');
  });

  it('renders secondary CTA linking to how it works section with proper a11y', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    const secondaryCta = screen.getByRole('link', { name: /how it works/i });
    expect(secondaryCta).toBeInTheDocument();
    expect(secondaryCta).toHaveAttribute('href', '#how-it-works');
  });

  it('renders stats section with expected metric labels', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    expect(screen.getByText(/rounds resolved/i)).toBeInTheDocument();
    expect(screen.getByText(/practice volume/i)).toBeInTheDocument();
    expect(screen.getByText(/active predictors/i)).toBeInTheDocument();
  });

  it('renders Spanish translations when locale is changed to es', async () => {
    await i18n.changeLanguage('es');

    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    const heroHeading = screen.getByRole('heading', { level: 1 });
    expect(heroHeading).toHaveTextContent(/lee el mercado/i);
    expect(heroHeading).toHaveTextContent(/demuestra tu llamada/i);
    expect(screen.getByRole('link', { name: /entrar a la terminal de predicción/i })).toBeInTheDocument();
  });

  it('falls back to English when a translation key is missing in the selected locale', async () => {
    await i18n.changeLanguage('es');
    expect(i18n.t('testFallback')).toBe('Fallback test');
  });

  it('renders HowItWorks and ModeCards components', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    expect(screen.getByTestId('how-it-works-mock')).toBeInTheDocument();
    expect(screen.getByTestId('mode-cards-mock')).toBeInTheDocument();
  });
  
  it('includes proper a11y section anchors', () => {
    const { container } = render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
    
    // Check if the #how-it-works anchor exists
    expect(container.querySelector('#how-it-works')).toBeInTheDocument();
  });

  it('shows final stat values immediately when prefers-reduced-motion is true', () => {
    const originalMatchMedia = window.matchMedia;
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    // mockLandingStats has totalRounds: 1247
    // formatStat formats it as 1,247
    expect(screen.getByText('1,247')).toBeInTheDocument();
    
    // mockLandingStats has vXlmDistributed: 4200000
    // formatStat formats it as 4.2M
    expect(screen.getByText(/4\.2M/i)).toBeInTheDocument();
    
    // mockLandingStats has activePlayers: 893
    expect(screen.getByText('893')).toBeInTheDocument();

    window.matchMedia = originalMatchMedia;
  });
});
