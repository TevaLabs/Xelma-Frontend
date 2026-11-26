import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const wallet = vi.hoisted(() => ({ publicKey: 'GUSER_A' as string | null }));

const notificationState = vi.hoisted(() => ({
  unread: 0,
  addNotification: vi.fn(),
  fetchUnread: vi.fn(),
}));

vi.mock('../../store/useWalletStore', () => ({
  useWalletStore: Object.assign(
    vi.fn((selector?: (state: { publicKey: string | null }) => unknown) =>
      selector ? selector(wallet) : wallet,
    ),
    { getState: () => wallet },
  ),
}));

vi.mock('../../store/useNotificationsStore', () => ({
  useNotificationsStore: Object.assign(
    vi.fn((selector?: (state: typeof notificationState) => unknown) =>
      selector ? selector(notificationState) : notificationState,
    ),
    { getState: () => notificationState },
  ),
}));

vi.mock('../../lib/socket', () => ({
  socketService: {
    connect: vi.fn(),
    onNotification: vi.fn(() => () => {}),
    joinNotifications: vi.fn(),
    leaveNotifications: vi.fn(),
  },
}));

vi.mock('../../hooks/useConnectionStatus', () => ({
  useConnectionStatus: () => ({ isConnected: true, status: 'connected' }),
}));

import NotificationsBell from '../NotificationsBell';
import { socketService } from '../../lib/socket';

describe('NotificationsBell socket identity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    wallet.publicKey = 'GUSER_A';
  });

  it('joins the notifications channel with the connected wallet id', () => {
    render(<NotificationsBell />);

    expect(socketService.joinNotifications).toHaveBeenCalledWith('GUSER_A');
  });

  it('re-joins with the new id and leaves the previous channel when the user changes', () => {
    const { rerender } = render(<NotificationsBell />);
    expect(socketService.joinNotifications).toHaveBeenLastCalledWith('GUSER_A');

    wallet.publicKey = 'GUSER_B';
    rerender(<NotificationsBell />);

    expect(socketService.leaveNotifications).toHaveBeenCalledWith('GUSER_A');
    expect(socketService.joinNotifications).toHaveBeenLastCalledWith('GUSER_B');
  });

  it('leaves the notifications channel when the wallet disconnects (logout)', () => {
    const { rerender } = render(<NotificationsBell />);
    expect(socketService.joinNotifications).toHaveBeenLastCalledWith('GUSER_A');

    wallet.publicKey = null;
    rerender(<NotificationsBell />);

    expect(socketService.leaveNotifications).toHaveBeenCalledWith('GUSER_A');
    expect(socketService.joinNotifications).toHaveBeenCalledTimes(1);
  });
});
