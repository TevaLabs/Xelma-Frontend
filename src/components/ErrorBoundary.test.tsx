import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

/**
 * Whether the child's underlying failure is currently active.
 *
 * This is the "transient cause" model rather than a throw-counter. That is
 * deliberate: React 19 re-invokes a component's render function when it throws
 * (up to ~3 times inside the same commit), so a "throw on the first render
 * then succeed" counter heals itself before `getDerivedStateFromError` ever
 * runs and the boundary never shows its fallback. Tying the throw to an
 * external cause makes the fallback deterministic, and matches the real
 * scenario the Retry button exists for: a transient failure that has gone away
 * by the time the user retries.
 */
let failureActive = true;

/**
 * Counts *committed* mounts of the child.
 *
 * The throwing render never reaches its effect, so this stays 0 while the
 * fallback is showing and becomes 1 only after a real, fresh mount. That is
 * what distinguishes a genuine remount from an error flag being cleared on a
 * subtree that was never torn down.
 */
let mountCount = 0;

function TransientlyFailingChild() {
  useEffect(() => {
    mountCount += 1;
  }, []);

  if (failureActive) {
    throw new Error('child exploded');
  }

  return <p>Recovered content</p>;
}

function renderBoundary() {
  return render(
    <ErrorBoundary>
      <TransientlyFailingChild />
    </ErrorBoundary>,
  );
}

beforeEach(() => {
  failureActive = true;
  mountCount = 0;
  // The boundary logs via componentDidCatch and React logs uncaught render
  // errors; keep the expected noise out of the reporter output.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('<ErrorBoundary />', () => {
  it('renders its fallback UI when a child throws', () => {
    renderBoundary();

    // Query the real fallback: role="alert" plus the component's own copy.
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Something went wrong' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'An unexpected error occurred on this page. You can retry or go back home.',
      ),
    ).toBeInTheDocument();

    // The failed child never committed, so none of its output is present.
    expect(screen.queryByText('Recovered content')).not.toBeInTheDocument();
    expect(mountCount).toBe(0);
  });

  it('offers both recovery actions in the fallback', () => {
    renderBoundary();

    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go Home' })).toBeInTheDocument();
  });

  it('remounts the children successfully after Retry is clicked', () => {
    renderBoundary();

    expect(screen.queryByText('Recovered content')).not.toBeInTheDocument();
    expect(mountCount).toBe(0);

    // The transient cause is gone, but the boundary still holds the error
    // until Retry is pressed. Asserting this intermediate state is what makes
    // the test meaningful: recovery is caused by the click, not by the cause
    // disappearing on its own.
    failureActive = false;
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('Recovered content')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    // Not merely "the fallback went away" — the child's recovered output is
    // actually rendered, through a fresh mount (mount count 0 -> 1).
    expect(screen.getByText('Recovered content')).toBeInTheDocument();
    expect(mountCount).toBe(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('surfaces the fallback again if the child keeps failing on retry', () => {
    // Guards the retry path in both directions: Retry must not be a one-way
    // door that renders a broken child into the page.
    renderBoundary();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('Recovered content')).not.toBeInTheDocument();
    expect(mountCount).toBe(0);
  });

  it('is exercised standalone, without LazyBoundary in the tree', () => {
    // App.tsx composes ErrorBoundary > LazyBoundary, and LazyBoundary is a
    // second error boundary with its own *different* fallback. Rendering
    // ErrorBoundary on its own keeps this test pinned to its own retry logic:
    // the copy asserted below belongs to ErrorBoundary, not LazyBoundary
    // (whose fallback reads "This page failed to load" and whose Retry button
    // has no type="button"). Reintroducing the wrapper here would fail this.
    const { container } = renderBoundary();

    expect(container.textContent).toContain('Something went wrong');
    expect(container.textContent).not.toContain('This page failed to load');

    failureActive = false;
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(screen.getByText('Recovered content')).toBeInTheDocument();
  });
});
