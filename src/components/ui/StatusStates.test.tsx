import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState, ErrorState, LoadingState } from './StatusStates';

describe('LoadingState', () => {
  it('renders the spinner variant with status role and busy semantics', () => {
    render(<LoadingState />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent('Loading content...');
  });

  it('renders the skeleton variant with status role and busy semantics', () => {
    render(<LoadingState variant="skeleton" />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Loading content...')).toBeInTheDocument();
  });

  it('respects the skeletonLines prop (header bar + requested lines)', () => {
    render(<LoadingState variant="skeleton" skeletonLines={5} />);

    const status = screen.getByRole('status');
    expect(status.querySelectorAll('.animate-pulse')).toHaveLength(6);
  });

  it('renders a custom message and hides the default copy', () => {
    render(<LoadingState message="Fetching leaderboard..." />);

    expect(screen.getByText('Fetching leaderboard...')).toBeInTheDocument();
    expect(screen.queryByText('Loading content...')).not.toBeInTheDocument();
  });

  it('omits the message paragraph when the message is empty (skeleton variant)', () => {
    render(<LoadingState variant="skeleton" message="" />);

    expect(screen.getByRole('status').querySelector('p')).toBeNull();
  });

  it('applies a custom className to the root container', () => {
    render(<LoadingState className="my-custom-class" />);

    expect(screen.getByRole('status')).toHaveClass('my-custom-class');
  });
});

describe('ErrorState', () => {
  it('renders the default title and the provided error message', () => {
    render(<ErrorState message="Failed to load rounds" />);

    expect(screen.getByRole('heading', { name: 'Oops! Something went wrong' })).toBeInTheDocument();
    expect(screen.getByText('Failed to load rounds')).toBeInTheDocument();
  });

  it('renders a custom title when provided', () => {
    render(<ErrorState title="Connection lost" message="Could not reach the backend" />);

    expect(screen.getByRole('heading', { name: 'Connection lost' })).toBeInTheDocument();
  });

  it('invokes onRetry when the Try Again button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Failed to load rounds" onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('fires onRetry for every click', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Failed to load rounds" onRetry={onRetry} />);

    const retry = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retry);
    fireEvent.click(retry);

    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it('hides the retry button when no onRetry handler is provided', () => {
    render(<ErrorState message="Failed to load rounds" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies a custom className to the root container', () => {
    render(<ErrorState message="Failed to load rounds" className="custom-error" />);

    expect(screen.getByText('Failed to load rounds').closest('div')).toHaveClass('custom-error');
  });
});

describe('EmptyState', () => {
  it('renders the provided title and message copy', () => {
    render(
      <EmptyState
        title="No predictions yet"
        message="Place your first prediction to see it here."
      />,
    );

    expect(screen.getByRole('heading', { name: 'No predictions yet' })).toBeInTheDocument();
    expect(screen.getByText('Place your first prediction to see it here.')).toBeInTheDocument();
  });

  it('renders a fallback icon when no icon or variant is given', () => {
    const { container } = render(<EmptyState title="Empty" message="Nothing here yet" />);

    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders a custom icon instead of the default one', () => {
    render(
      <EmptyState
        title="Empty"
        message="Nothing here yet"
        icon={<span data-testid="custom-icon">★</span>}
      />,
    );

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders a themed illustration when a variant is provided', () => {
    const { container } = render(
      <EmptyState title="Empty" message="Nothing here yet" variant="offline" />,
    );

    // Stellar illustrations render at 96x96; the lucide fallback does not.
    expect(container.querySelector('svg[viewBox="0 0 96 96"]')).not.toBeNull();
  });

  it('applies a custom className to the root container', () => {
    render(<EmptyState title="Empty" message="Nothing here yet" className="custom-empty" />);

    expect(screen.getByText('Nothing here yet').closest('div')).toHaveClass('custom-empty');
  });
});
