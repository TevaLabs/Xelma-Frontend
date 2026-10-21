import '@testing-library/jest-dom';
import { render, screen, renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Landing, { useCountUp } from './Landing';
import { useReducedMotion } from '../hooks/useReducedMotion';
import '../i18n';
import i18n from '../i18n';

vi.mock('../components/HowItWorks', () => ({
  default: () => <div data-testid="how-it-works-mock">How It Works Mock</div>
}));

vi.mock('../components/ModeCards', () => ({
  default: () => <div data-testid="mode-cards-mock">Mode Cards Mock</div>
}));

vi.mock('../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => ({
    reduced: false,
    systemPreference: false,
    override: 'no-preference',
  })),
}));

beforeEach(() => {
  vi.mocked(useReducedMotion).mockReturnValue({
    reduced: false,
    systemPreference: false,
    override: 'no-preference',
  });
});

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

  it('renders final metric values immediately in Landing cards when reduced motion is preferred', () => {
    vi.mocked(useReducedMotion).mockReturnValue({
      reduced: true,
      systemPreference: true,
      override: 'reduce',
    });

    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    // Initial mock stats from mockLandingStats: 1247 rounds, 4.2M vXLM, 893 players
    expect(screen.getByText('1,247')).toBeInTheDocument();
    expect(screen.getByText('4.2M vXLM')).toBeInTheDocument();
    expect(screen.getByText('893')).toBeInTheDocument();
  });
});

describe('useCountUp', () => {
  it('returns target immediately without starting animation when reduced motion is on', () => {
    vi.mocked(useReducedMotion).mockReturnValue({
      reduced: true,
      systemPreference: true,
      override: 'reduce',
    });

    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    const { result } = renderHook(() => useCountUp(5000));

    expect(result.current).toBe(5000);
    expect(rafSpy).not.toHaveBeenCalled();

    rafSpy.mockRestore();
  });

  it('updates immediately when target changes while reduced motion is on without starting animation', () => {
    vi.mocked(useReducedMotion).mockReturnValue({
      reduced: true,
      systemPreference: true,
      override: 'reduce',
    });

    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    const { result, rerender } = renderHook(
      ({ target }) => useCountUp(target),
      { initialProps: { target: 100 } }
    );

    expect(result.current).toBe(100);
    expect(rafSpy).not.toHaveBeenCalled();

    rerender({ target: 250 });
    expect(result.current).toBe(250);
    expect(rafSpy).not.toHaveBeenCalled();

    rafSpy.mockRestore();
  });

  it('animates towards target when reduced motion is off', () => {
    vi.mocked(useReducedMotion).mockReturnValue({
      reduced: false,
      systemPreference: false,
      override: 'no-preference',
    });

    let rafCallback: FrameRequestCallback | null = null;
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb;
      return 123;
    });

    const { result } = renderHook(() => useCountUp(1000, 1000));

    // Value starts at 0 (below target)
    expect(result.current).toBe(0);
    expect(rafSpy).toHaveBeenCalledTimes(1);

    // Advance halfway through duration
    act(() => {
      if (rafCallback) {
        rafCallback(performance.now() + 500);
      }
    });
    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(1000);

    // Advance to end of duration
    act(() => {
      if (rafCallback) {
        rafCallback(performance.now() + 1000);
      }
    });
    expect(result.current).toBe(1000);

    rafSpy.mockRestore();
  });

  it('snaps to target immediately and cancels animation when reduced motion is toggled on', () => {
    vi.mocked(useReducedMotion).mockReturnValue({
      reduced: false,
      systemPreference: false,
      override: 'no-preference',
    });

    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const { result, rerender } = renderHook(() => useCountUp(1000));

    expect(result.current).toBe(0);

    // User enables reduced motion mid-animation
    vi.mocked(useReducedMotion).mockReturnValue({
      reduced: true,
      systemPreference: true,
      override: 'reduce',
    });

    rerender();
    expect(result.current).toBe(1000);
    expect(cancelSpy).toHaveBeenCalled();

    cancelSpy.mockRestore();
  });

  it('cancels pending animation frame on unmount when reduced motion is off', () => {
    vi.mocked(useReducedMotion).mockReturnValue({
      reduced: false,
      systemPreference: false,
      override: 'no-preference',
    });

    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const { unmount } = renderHook(() => useCountUp(1000));

    unmount();
    expect(cancelSpy).toHaveBeenCalled();

    cancelSpy.mockRestore();
  });
});

