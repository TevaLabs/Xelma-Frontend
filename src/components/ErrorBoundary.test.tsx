import { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

function ProblemChild({ shouldThrow, message }: { shouldThrow: boolean; message?: string }) {
  if (shouldThrow) {
    throw new Error(message || 'Test route crash');
  }
  return <div>Healthy Route Content</div>;
}

describe('ErrorBoundary', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  const originalLocation = window.location;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: 'http://localhost/dashboard', reload: vi.fn() },
    });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  it('renders children without error when component functions normally', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Healthy Route Content')).toBeInTheDocument();
  });

  it('catches forced throw in a route and renders branded recovery UI', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} message="Critical database disconnect" />
      </ErrorBoundary>,
    );

    const alertContainer = screen.getByRole('alert');
    expect(alertContainer).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    expect(screen.getByText(/critical database disconnect/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
  });

  it('logs the uncaught error once upon catching', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} message="Log error check" />
      </ErrorBoundary>,
    );

    const boundaryErrorCalls = consoleSpy.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('[ErrorBoundary] uncaught error:'),
    );
    expect(boundaryErrorCalls).toHaveLength(1);
  });

  it('remounts children when Retry is clicked', () => {
    let throwState = true;
    function DynamicThrower() {
      if (throwState) {
        throw new Error('Dynamic failure');
      }
      return <div>Recovered Component</div>;
    }

    const { rerender } = render(
      <ErrorBoundary>
        <DynamicThrower />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    throwState = false;
    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    rerender(
      <ErrorBoundary>
        <DynamicThrower />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Recovered Component')).toBeInTheDocument();
  });

  it('navigates home when Go Home is clicked', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    const goHomeBtn = screen.getByRole('button', { name: /go home/i });
    fireEvent.click(goHomeBtn);

    expect(window.location.href).toBe('/');
  });

  it('enforces maximum retry limit to avoid infinite retry loops', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} message="Persistent crash" />
      </ErrorBoundary>,
    );

    // Initial throw
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();

    // Retry 1
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(screen.getByText(/retry attempt 1 of 3/i)).toBeInTheDocument();

    // Retry 2
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(screen.getByText(/retry attempt 2 of 3/i)).toBeInTheDocument();

    // Retry 3 -> hits MAX_RETRIES threshold
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(screen.getByText(/max retries exceeded \(3\/3\)/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^retry$/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();

    // Clicking Reload Page invokes window.location.reload
    fireEvent.click(screen.getByRole('button', { name: /reload page/i }));
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });

  it('manages focus accessibility by shifting focus to retry action', async () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    await waitFor(() => {
      const retryBtn = screen.getByRole('button', { name: /retry/i });
      expect(document.activeElement).toBe(retryBtn);
    });
  });
});
