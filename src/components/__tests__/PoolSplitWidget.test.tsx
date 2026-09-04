/**
 * Unit tests for PoolSplitWidget — Issue #312
 *
 * Covers:
 *  - Correct percentage calculations with mock pool totals
 *  - Color + pattern: both UP and DOWN segments are rendered (not color-only)
 *  - Accessible sr-only summary text
 *  - Empty / zero-pool state
 *  - Edge cases: one side is zero, very skewed splits
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PoolSplitWidget } from '../PoolSplitWidget';

describe('PoolSplitWidget', () => {
  // ── Rendering ─────────────────────────────────────────────────────────────

  it('renders the widget wrapper', () => {
    render(<PoolSplitWidget poolUp={2500} poolDown={1500} />);
    expect(screen.getByTestId('pool-split-widget')).toBeInTheDocument();
  });

  it('renders the split bar', () => {
    render(<PoolSplitWidget poolUp={2500} poolDown={1500} />);
    expect(screen.getByTestId('pool-split-bar')).toBeInTheDocument();
  });

  // ── Percentage maths ──────────────────────────────────────────────────────

  it('calculates correct UP% and DOWN% for a 2500/1500 split (63/37)', () => {
    render(<PoolSplitWidget poolUp={2500} poolDown={1500} />);
    // 2500/(2500+1500) = 62.5 → Math.round = 63; DOWN = 100-63 = 37
    expect(screen.getByTestId('pool-split-up-label').textContent).toMatch(/UP 63%/i);
    expect(screen.getByTestId('pool-split-down-label').textContent).toMatch(/DOWN 37%/i);
  });

  it('UP% + DOWN% always sum to 100', () => {
    render(<PoolSplitWidget poolUp={1000} poolDown={3000} />);
    // 1000/(1000+3000) = 25 % → DOWN = 75 %
    expect(screen.getByTestId('pool-split-up-label').textContent).toMatch(/UP 25%/i);
    expect(screen.getByTestId('pool-split-down-label').textContent).toMatch(/DOWN 75%/i);
  });

  it('handles an equal 50/50 split', () => {
    render(<PoolSplitWidget poolUp={500} poolDown={500} />);
    expect(screen.getByTestId('pool-split-up-label').textContent).toMatch(/UP 50%/i);
    expect(screen.getByTestId('pool-split-down-label').textContent).toMatch(/DOWN 50%/i);
  });

  it('handles a heavily skewed UP 99 / DOWN 1 split', () => {
    render(<PoolSplitWidget poolUp={990} poolDown={10} />);
    expect(screen.getByTestId('pool-split-up-label').textContent).toMatch(/UP 99%/i);
    expect(screen.getByTestId('pool-split-down-label').textContent).toMatch(/DOWN 1%/i);
  });

  // ── Bar segments (color + pattern dual encoding) ──────────────────────────

  it('renders both UP and DOWN bar segments (not color-only)', () => {
    render(<PoolSplitWidget poolUp={700} poolDown={300} />);
    expect(screen.getByTestId('pool-split-up-bar')).toBeInTheDocument();
    expect(screen.getByTestId('pool-split-down-bar')).toBeInTheDocument();
  });

  it('UP segment width reflects the correct ratio', () => {
    render(<PoolSplitWidget poolUp={3000} poolDown={1000} />);
    const upBar = screen.getByTestId('pool-split-up-bar');
    // 3000 / 4000 = 75 %
    expect(upBar).toHaveStyle({ width: '75%' });
  });

  it('DOWN segment width reflects the correct ratio', () => {
    render(<PoolSplitWidget poolUp={3000} poolDown={1000} />);
    const downBar = screen.getByTestId('pool-split-down-bar');
    // 100 - 75 = 25 %
    expect(downBar).toHaveStyle({ width: '25%' });
  });

  it('UP segment has a data-pattern attribute identifying the stripe pattern (not color-only)', () => {
    render(<PoolSplitWidget poolUp={600} poolDown={400} />);
    const upBar = screen.getByTestId('pool-split-up-bar');
    expect(upBar).toHaveAttribute('data-pattern', 'stripe-up');
  });

  it('DOWN segment has a data-pattern attribute identifying the stripe pattern (not color-only)', () => {
    render(<PoolSplitWidget poolUp={600} poolDown={400} />);
    const downBar = screen.getByTestId('pool-split-down-bar');
    expect(downBar).toHaveAttribute('data-pattern', 'stripe-down');
  });

  it('UP and DOWN segments use different pattern identifiers', () => {
    render(<PoolSplitWidget poolUp={600} poolDown={400} />);
    const upPattern = screen.getByTestId('pool-split-up-bar').getAttribute('data-pattern');
    const downPattern = screen.getByTestId('pool-split-down-bar').getAttribute('data-pattern');
    expect(upPattern).not.toBe(downPattern);
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  it('renders a sr-only text summary', () => {
    render(<PoolSplitWidget poolUp={2500} poolDown={1500} />);
    const summary = screen.getByTestId('pool-split-sr-summary');
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveClass('sr-only');
  });

  it('sr-only summary contains UP percentage and vXLM amount', () => {
    render(<PoolSplitWidget poolUp={2500} poolDown={1500} />);
    const summary = screen.getByTestId('pool-split-sr-summary');
    expect(summary.textContent).toMatch(/UP/i);
    expect(summary.textContent).toMatch(/63%/);
    expect(summary.textContent).toMatch(/2\.50K vXLM/i);
  });

  it('sr-only summary contains DOWN percentage and vXLM amount', () => {
    render(<PoolSplitWidget poolUp={2500} poolDown={1500} />);
    const summary = screen.getByTestId('pool-split-sr-summary');
    expect(summary.textContent).toMatch(/DOWN/i);
    // downPct = 100 - Math.round(2500/4000 * 100) = 100 - 63 = 37
    expect(summary.textContent).toMatch(/37%/);
    expect(summary.textContent).toMatch(/1\.50K vXLM/i);
  });

  it('sr-only summary contains total pool amount', () => {
    render(<PoolSplitWidget poolUp={2500} poolDown={1500} />);
    const summary = screen.getByTestId('pool-split-sr-summary');
    expect(summary.textContent).toMatch(/total/i);
    expect(summary.textContent).toMatch(/4\.00K vXLM/i);
  });

  it('bar has role="img" with an aria-label matching the sr-only summary', () => {
    render(<PoolSplitWidget poolUp={2500} poolDown={1500} />);
    const bar = screen.getByRole('img');
    expect(bar).toBeInTheDocument();
    const ariaLabel = bar.getAttribute('aria-label') ?? '';
    expect(ariaLabel).toMatch(/UP/i);
    expect(ariaLabel).toMatch(/DOWN/i);
  });

  // ── Pool totals sub-line ──────────────────────────────────────────────────

  it('renders the pool totals sub-line when pools are non-zero', () => {
    render(<PoolSplitWidget poolUp={2500} poolDown={1500} />);
    expect(screen.getByTestId('pool-split-totals')).toBeInTheDocument();
  });

  it('pool totals show formatted vXLM amounts', () => {
    render(<PoolSplitWidget poolUp={2500} poolDown={1500} />);
    expect(screen.getByText('2.50K vXLM')).toBeInTheDocument();
    expect(screen.getByText('1.50K vXLM')).toBeInTheDocument();
    expect(screen.getByText(/Total 4\.00K vXLM/)).toBeInTheDocument();
  });

  // ── Empty / zero-pool state ───────────────────────────────────────────────

  it('renders the empty state when both pools are zero', () => {
    render(<PoolSplitWidget poolUp={0} poolDown={0} />);
    // No bar segments when empty
    expect(screen.queryByTestId('pool-split-up-bar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pool-split-down-bar')).not.toBeInTheDocument();
  });

  it('renders the empty state when props are omitted', () => {
    render(<PoolSplitWidget />);
    expect(screen.queryByTestId('pool-split-up-bar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pool-split-down-bar')).not.toBeInTheDocument();
  });

  it('hides the totals sub-line in the empty state', () => {
    render(<PoolSplitWidget poolUp={0} poolDown={0} />);
    expect(screen.queryByTestId('pool-split-totals')).not.toBeInTheDocument();
  });

  it('shows em-dash placeholders in labels when pool is empty', () => {
    render(<PoolSplitWidget poolUp={0} poolDown={0} />);
    expect(screen.getByTestId('pool-split-up-label').textContent).toMatch(/UP\s*—/);
    expect(screen.getByTestId('pool-split-down-label').textContent).toMatch(/DOWN\s*—/);
  });

  it('sr-only summary says "no predictions yet" in the empty state', () => {
    render(<PoolSplitWidget poolUp={0} poolDown={0} />);
    const summary = screen.getByTestId('pool-split-sr-summary');
    expect(summary.textContent).toMatch(/no predictions yet/i);
  });

  // ── One-sided pool edge case ──────────────────────────────────────────────

  it('handles a pool with all funds on UP side', () => {
    render(<PoolSplitWidget poolUp={1000} poolDown={0} />);
    expect(screen.getByTestId('pool-split-up-label').textContent).toMatch(/UP 100%/i);
    expect(screen.getByTestId('pool-split-down-label').textContent).toMatch(/DOWN 0%/i);
  });

  it('handles a pool with all funds on DOWN side', () => {
    render(<PoolSplitWidget poolUp={0} poolDown={1000} />);
    expect(screen.getByTestId('pool-split-up-label').textContent).toMatch(/UP 0%/i);
    expect(screen.getByTestId('pool-split-down-label').textContent).toMatch(/DOWN 100%/i);
  });

  // ── Custom props ──────────────────────────────────────────────────────────

  it('accepts a custom barHeight prop', () => {
    render(<PoolSplitWidget poolUp={500} poolDown={500} barHeight={24} />);
    const bar = screen.getByTestId('pool-split-bar');
    expect(bar).toHaveStyle({ height: '24px' });
  });

  it('accepts a custom className and applies it to the wrapper', () => {
    render(<PoolSplitWidget poolUp={500} poolDown={500} className="mt-4 test-cls" />);
    const wrapper = screen.getByTestId('pool-split-widget');
    expect(wrapper.className).toMatch(/test-cls/);
  });
});
