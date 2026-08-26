import { createRef } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import RoundCard from '../RoundCard';
import type { MockRound } from '../../types';
import { useSettingsStore } from '../../store/useSettingsStore';

describe('RoundCard Component', () => {
  const defaultRound: MockRound = {
    id: 1,
    asset: 'BTC',
    mode: 'updown',
    status: 'live',
    startPrice: 67420,
    poolUp: 2500,
    poolDown: 1500,
    closesInSeconds: 150,
  };

  it('renders asset details, mode, reference price, and pool size correctly', () => {
    render(<RoundCard round={defaultRound} onSubmitPrediction={vi.fn()} />);

    expect(screen.getByText('BTC/USD')).toBeInTheDocument();
    expect(screen.getByText('UP/DOWN')).toBeInTheDocument();
    expect(screen.getByText(/reference \$67,420/i)).toBeInTheDocument();
    expect(screen.getByText(/pool: 4\.00k vxlm/i)).toBeInTheDocument();
  });

  it('renders UP/DOWN percentage layout for updown mode', () => {
    render(<RoundCard round={defaultRound} onSubmitPrediction={vi.fn()} />);

    expect(screen.getByText('UP 63%')).toBeInTheDocument();
    expect(screen.getByText('DOWN 37%')).toBeInTheDocument();
  });

  it('renders forecasts count for precision mode', () => {
    const precisionRound: MockRound = {
      ...defaultRound,
      mode: 'precision',
      totalPool: 4000,
      predictionCount: 15,
    };
    render(<RoundCard round={precisionRound} onSubmitPrediction={vi.fn()} />);

    expect(screen.getByText('PRECISION')).toBeInTheDocument();
    expect(screen.getByText('15 forecasts submitted')).toBeInTheDocument();
  });

  it('renders OPEN status when status is new and closesInSeconds is high', () => {
    const newRound: MockRound = {
      ...defaultRound,
      status: 'new',
      closesInSeconds: 200,
    };
    render(<RoundCard round={newRound} onSubmitPrediction={vi.fn()} />);

    expect(screen.getByText('OPEN')).toBeInTheDocument();
  });

  it('renders CLOSING SOON status when closesInSeconds is low', () => {
    const closingRound: MockRound = {
      ...defaultRound,
      closesInSeconds: 80,
    };
    render(<RoundCard round={closingRound} onSubmitPrediction={vi.fn()} />);

    expect(screen.getByText('CLOSING SOON')).toBeInTheDocument();
  });

  it('renders LIVE status when closesInSeconds is high and status is live', () => {
    const liveRound: MockRound = {
      ...defaultRound,
      status: 'live',
      closesInSeconds: 200,
    };
    render(<RoundCard round={liveRound} onSubmitPrediction={vi.fn()} />);

    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('renders countdown timer formatted text', () => {
    vi.useFakeTimers();
    render(<RoundCard round={defaultRound} onSubmitPrediction={vi.fn()} />);

    expect(screen.getByText('02:30')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('updates the countdown timer text as time passes using fake timers', () => {
    vi.useFakeTimers();
    render(<RoundCard round={defaultRound} onSubmitPrediction={vi.fn()} />);

    expect(screen.getByText('02:30')).toBeInTheDocument();

    // Advance time one second at a time to allow React effects to re-register the interval
    for (let i = 0; i < 10; i++) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }

    expect(screen.getByText('02:20')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('enables the submit button when closesInSeconds > 0', () => {
    render(<RoundCard round={defaultRound} onSubmitPrediction={vi.fn()} />);

    const button = screen.getByRole('button', { name: /submit prediction/i });
    expect(button).toBeEnabled();
  });

  it('disables the submit button when closesInSeconds <= 0', () => {
    const expiredRound: MockRound = {
      ...defaultRound,
      closesInSeconds: 0,
    };
    render(<RoundCard round={expiredRound} onSubmitPrediction={vi.fn()} />);

    const button = screen.getByRole('button', { name: /submit prediction/i });
    expect(button).toBeDisabled();
  });

  it('triggers onSubmitPrediction callback when clicked while enabled', () => {
    const onSubmitPredictionMock = vi.fn();
    render(<RoundCard round={defaultRound} onSubmitPrediction={onSubmitPredictionMock} />);

    const button = screen.getByRole('button', { name: /submit prediction/i });
    fireEvent.click(button);

    expect(onSubmitPredictionMock).toHaveBeenCalledTimes(1);
    expect(onSubmitPredictionMock).toHaveBeenCalledWith(defaultRound);
  });

  it('does not trigger onSubmitPrediction callback when clicked while disabled', () => {
    const onSubmitPredictionMock = vi.fn();
    const expiredRound: MockRound = {
      ...defaultRound,
      closesInSeconds: 0,
    };
    render(<RoundCard round={expiredRound} onSubmitPrediction={onSubmitPredictionMock} />);

    const button = screen.getByRole('button', { name: /submit prediction/i });
    fireEvent.click(button);

    expect(onSubmitPredictionMock).not.toHaveBeenCalled();
  });

  // Issue #175 — Improve RoundCard touch targets and mobile card layout
  describe('Mobile layout & touch targets (#175)', () => {
    it('submit button enforces a minimum 44px tap target height', () => {
      render(<RoundCard round={defaultRound} onSubmitPrediction={vi.fn()} />);
      const button = screen.getByTestId('round-card-submit');
      expect(button.className).toMatch(/min-h-\[44px\]/);
      expect(button.className).toMatch(/py-3/);
      expect(button.className).toMatch(/w-full/);
    });

    it('article element caps vertical padding on mobile and grows on >=640px', () => {
      render(<RoundCard round={defaultRound} onSubmitPrediction={vi.fn()} />);
      const article = screen.getByTestId('round-card');
      expect(article.className).toMatch(/\bp-4\b/);
      expect(article.className).toMatch(/\bsm:p-5\b/);
    });

    it('article uses flex-col stacking so metadata wraps under the title on small screens', () => {
      render(<RoundCard round={defaultRound} onSubmitPrediction={vi.fn()} />);
      const meta = screen.getByTestId('round-card-meta');
      // Mobile (<640px) must collapse to a column to keep one-handed reach.
      expect(meta.className).toMatch(/\bflex-col\b/);
      expect(meta.className).toMatch(/\bgap-2\b/);
      // ≥640px breakpoint switches to a justified row.
      expect(meta.className).toMatch(/\bsm:flex-row\b/);
      expect(meta.className).toMatch(/\bsm:justify-between\b/);
    });

    it('header element stacks asset info and mode badge on mobile and sits side-by-side on >=640px', () => {
      const { container } = render(<RoundCard round={defaultRound} onSubmitPrediction={vi.fn()} />);
      const header = container.querySelector('header');
      expect(header).not.toBeNull();
      const headerClass = header!.className;
      expect(headerClass).toMatch(/\bflex-col\b/);
      expect(headerClass).toMatch(/\bsm:flex-row\b/);
      expect(headerClass).toMatch(/\bsm:justify-between\b/);
    });

    it('pool text uses break-words to prevent overflow on tight viewports', () => {
      render(<RoundCard round={defaultRound} onSubmitPrediction={vi.fn()} />);
      const pool = screen.getByTestId('round-card-pool');
      expect(pool.className).toMatch(/\bbreak-words\b/);
    });

    it('asset title block truncates overflowing reference strings', () => {
      const wideRound: MockRound = {
        ...defaultRound,
        startPrice: 123_456_789,
      };
      const { container } = render(<RoundCard round={wideRound} onSubmitPrediction={vi.fn()} />);
      const referencePrice = container.querySelector('p.truncate');
      expect(referencePrice).not.toBeNull();
    });
  });

  describe('deep-link highlighting', () => {
    afterEach(() => {
      useSettingsStore.getState().setMotionPreference('system');
    });

    it('marks data-highlighted="false" and omits highlight styling by default', () => {
      render(<RoundCard round={defaultRound} onSubmitPrediction={vi.fn()} />);
      const card = screen.getByTestId('round-card');

      expect(card).toHaveAttribute('data-highlighted', 'false');
      expect(card.className).not.toMatch(/accent-border-teal/);
      expect(card.className).not.toMatch(/accent-pulse/);
    });

    it('applies the highlight border and pulse animation when isHighlighted is true', () => {
      render(<RoundCard round={defaultRound} onSubmitPrediction={vi.fn()} isHighlighted />);
      const card = screen.getByTestId('round-card');

      expect(card).toHaveAttribute('data-highlighted', 'true');
      expect(card.className).toMatch(/accent-border-teal/);
      expect(card.className).toMatch(/accent-pulse/);
    });

    it('omits the pulse animation (but keeps the border) when reduced motion is preferred', () => {
      useSettingsStore.getState().setMotionPreference('reduce');

      render(<RoundCard round={defaultRound} onSubmitPrediction={vi.fn()} isHighlighted />);
      const card = screen.getByTestId('round-card');

      expect(card.className).toMatch(/accent-border-teal/);
      expect(card.className).not.toMatch(/accent-pulse/);
    });

    it('forwards a ref to the underlying <article> element', () => {
      const ref = createRef<HTMLElement>();
      render(<RoundCard round={defaultRound} onSubmitPrediction={vi.fn()} ref={ref} />);

      expect(ref.current).not.toBeNull();
      expect(ref.current?.tagName).toBe('ARTICLE');
      expect(ref.current).toBe(screen.getByTestId('round-card'));
    });
  });
});
