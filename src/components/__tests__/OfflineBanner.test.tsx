import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import { OfflineBanner } from '../OfflineBanner';

vi.mock('../../hooks/useConnectionStatus', () => ({
  useConnectionStatus: vi.fn(),
}));

const mockConnectionStatus = (isDisconnected: boolean, reconnect = vi.fn()) => {
  vi.mocked(useConnectionStatus).mockReturnValue({
    isDisconnected,
    reconnect,
  } as unknown as ReturnType<typeof useConnectionStatus>);
  return reconnect;
};

describe('OfflineBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing while connected', () => {
    mockConnectionStatus(false);

    render(<OfflineBanner />);

    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
  });

  it('renders an assertive alert with reconnect and dismiss actions when disconnected', () => {
    mockConnectionStatus(true);

    render(<OfflineBanner />);

    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByText(/connection lost/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reconnect/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dismiss connection alert/i })).toBeInTheDocument();
  });

  it('calls reconnect from the hook when reconnect is clicked', () => {
    const reconnect = mockConnectionStatus(true);

    render(<OfflineBanner />);
    fireEvent.click(screen.getByRole('button', { name: /reconnect/i }));

    expect(reconnect).toHaveBeenCalledTimes(1);
  });

  it('hides when dismissed', () => {
    mockConnectionStatus(true);

    render(<OfflineBanner />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss connection alert/i }));

    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
  });

  it('shows again after a new disconnection following a dismissal', () => {
    mockConnectionStatus(true);
    const { rerender } = render(<OfflineBanner />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss connection alert/i }));
    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();

    mockConnectionStatus(false);
    rerender(<OfflineBanner />);
    mockConnectionStatus(true);
    rerender(<OfflineBanner />);

    expect(screen.getByTestId('offline-banner')).toBeInTheDocument();
  });
});
