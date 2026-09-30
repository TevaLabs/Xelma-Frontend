import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LazyBoundary from './LazyBoundary';

const ThrowingChild = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test chunk load error');
  }
  return <div>Normal Content Loaded</div>;
};

describe('LazyBoundary Component', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('renders children when no error occurs', () => {
    render(
      <LazyBoundary>
        <ThrowingChild shouldThrow={false} />
      </LazyBoundary>
    );

    expect(screen.getByText('Normal Content Loaded')).toBeInTheDocument();
  });

  it('renders accessible alert role and explicit button type on error', () => {
    render(
      <LazyBoundary>
        <ThrowingChild shouldThrow={true} />
      </LazyBoundary>
    );

    const alertBox = screen.getByRole('alert');
    expect(alertBox).toBeInTheDocument();
    expect(alertBox).toHaveAttribute('aria-live', 'assertive');

    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).toHaveAttribute('type', 'button');
  });

  it('resets error state when Retry button is clicked', () => {
    let shouldThrow = true;
    const { rerender } = render(
      <LazyBoundary>
        <ThrowingChild shouldThrow={shouldThrow} />
      </LazyBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    shouldThrow = false;
    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    rerender(
      <LazyBoundary>
        <ThrowingChild shouldThrow={shouldThrow} />
      </LazyBoundary>
    );

    expect(screen.getByText('Normal Content Loaded')).toBeInTheDocument();
  });
});
