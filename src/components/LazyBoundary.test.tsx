import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import LazyBoundary from './LazyBoundary';

// Test component that throws an error to trigger LazyBoundary's error boundary
function FailingComponent() {
  throw new Error('Chunk load failure');
}

// Test component that renders successfully
function SuccessfulComponent() {
  return <div data-testid="success-content">Content loaded successfully</div>;
}

describe('LazyBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <LazyBoundary>
        <SuccessfulComponent />
      </LazyBoundary>,
    );

    expect(screen.getByTestId('success-content')).toBeInTheDocument();
    expect(screen.getByText('Content loaded successfully')).toBeInTheDocument();
  });

  it('displays error UI when a child component throws', () => {
    render(
      <LazyBoundary>
        <FailingComponent />
      </LazyBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Page Failed to Load')).toBeInTheDocument();
  });

  it('shows the fallback copy about chunk load failure', () => {
    render(
      <LazyBoundary>
        <FailingComponent />
      </LazyBoundary>,
    );

    const fallback = screen.getByText(
      /The network connection interrupted downloading page assets/,
    );
    expect(fallback).toBeInTheDocument();
  });

  it('displays the diagnostic message from the error', () => {
    render(
      <LazyBoundary>
        <FailingComponent />
      </LazyBoundary>,
    );

    // Error message should be visible in diagnostic section
    const diagnosticSection = screen.getByText('Diagnostic Message');
    expect(diagnosticSection).toBeInTheDocument();
    expect(screen.getByText('Chunk load failure')).toBeInTheDocument();
  });

  it('renders a Retry button when errors have not exceeded max retries', () => {
    render(
      <LazyBoundary>
        <FailingComponent />
      </LazyBoundary>,
    );

    const retryButton = screen.getByRole('button', { name: /Retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('renders a Go Home button for recovery', () => {
    render(
      <LazyBoundary>
        <FailingComponent />
      </LazyBoundary>,
    );

    const homeButton = screen.getByRole('button', { name: /Go Home/i });
    expect(homeButton).toBeInTheDocument();
  });

  it('has alert semantics for accessibility', () => {
    render(
      <LazyBoundary>
        <FailingComponent />
      </LazyBoundary>,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(alert).toHaveAttribute('aria-labelledby', 'lazy-boundary-heading');
    expect(alert).toHaveAttribute('aria-describedby', 'lazy-boundary-desc');
  });

  it('displays the heading with the error state', () => {
    render(
      <LazyBoundary>
        <FailingComponent />
      </LazyBoundary>,
    );

    expect(screen.getByText('Page Failed to Load')).toBeInTheDocument();
  });

  it('calls onReset when retry is clicked', () => {
    const onReset = vi.fn();

    render(
      <LazyBoundary onReset={onReset}>
        <FailingComponent />
      </LazyBoundary>,
    );

    const retryButton = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryButton);

    expect(onReset).toHaveBeenCalled();
  });
});
