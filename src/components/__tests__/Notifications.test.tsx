// React import not required in this test file (JSX runtime handles it)
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotificationsBell from '../NotificationsBell';
import { useNotificationsStore } from '../../store/useNotificationsStore';
import * as api from '../../lib/api-client';
import { socketService } from '../../lib/socket';

let notificationHandler: ((payload: unknown) => void) | undefined;
// Mutable fixture state so individual tests can drive connect/disconnect
// transitions and wallet identity (issue #662).
let socketConnected = true;
let walletPublicKey: string | null = 'GTEST123';

vi.mock('../../lib/socket', () => ({
  socketService: {
    connect: vi.fn(),
    onNotification: vi.fn((cb: (payload: unknown) => void) => {
      notificationHandler = cb;
      return () => {
        notificationHandler = undefined;
      };
    }),
    joinNotifications: vi.fn(),
  },
}));

vi.mock('../../hooks/useConnectionStatus', () => ({
  useConnectionStatus: () => ({
    status: socketConnected ? 'connected' : 'disconnected',
    isConnected: socketConnected,
    isDisconnected: !socketConnected,
  }),
}));

vi.mock('../../store/useWalletStore', () => ({
  useWalletStore: Object.assign(
    vi.fn((selector?: (state: { publicKey: string | null }) => unknown) => {
      const state = { publicKey: walletPublicKey };
      return selector ? selector(state) : state;
    }),
    { getState: () => ({ publicKey: walletPublicKey }) },
  ),
}));

vi.mock('../../lib/api-client');

describe('Notifications', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    notificationHandler = undefined;
    socketConnected = true;
    walletPublicKey = 'GTEST123';
    // clear store between tests to avoid state leakage
    useNotificationsStore.getState().clear();
  });

  it('renders bell and fetches unread count', async () => {
    const mockedApi = vi.mocked(api.notificationsApi);
    mockedApi.getUnreadCount.mockResolvedValue({ unread: 3 });
    render(<NotificationsBell />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /open notifications/i })).toBeTruthy(),
    );
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('opens panel and fetches notifications list', async () => {
    const mockedApi = vi.mocked(api.notificationsApi);
    mockedApi.getUnreadCount.mockResolvedValue({ unread: 1 });
    mockedApi.getNotifications.mockResolvedValue([
      { id: 'n1', title: 'Round Update', message: 'Round changed', createdAt: new Date().toISOString(), read: false },
    ]);

    render(<NotificationsBell />);
    // wait for badge
    await waitFor(() => expect(screen.getByText('1')).toBeTruthy());

    // open panel
    fireEvent.click(screen.getByRole('button', { name: /open notifications/i }));

    await waitFor(() => expect(screen.getByText('Notifications')).toBeTruthy());
    expect(screen.getByText('Round Update')).toBeTruthy();
  });

  it('shows empty state when no notifications', async () => {
    const mockedApi = vi.mocked(api.notificationsApi);
    mockedApi.getUnreadCount.mockResolvedValue({ unread: 0 });
    mockedApi.getNotifications.mockResolvedValue([]);

    render(<NotificationsBell />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /open notifications/i })).toBeTruthy(),
    );

    fireEvent.click(screen.getByRole('button', { name: /open notifications/i }));

    await waitFor(() => expect(screen.getByText('No notifications')).toBeTruthy());
  });

  it('receives realtime notification via socket and updates badge and list', async () => {
    const mockedApi = vi.mocked(api.notificationsApi);
    mockedApi.getUnreadCount.mockResolvedValue({ unread: 0 });
    mockedApi.getNotifications.mockResolvedValue([]);

    render(<NotificationsBell />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /open notifications/i })).toBeTruthy(),
    );

    // trigger incoming notification
    const payload = { id: 'r1', title: 'Live Event', message: 'An event happened', createdAt: new Date().toISOString() };
    act(() => {
      notificationHandler?.(payload);
    });

    // badge should update to 1
    await waitFor(() => expect(screen.getByText('1')).toBeTruthy());

    // open panel and it should include the live notification
    fireEvent.click(screen.getByRole('button', { name: /open notifications/i }));
    await waitFor(() => expect(screen.getByText('Live Event')).toBeTruthy());
  });

  it('marks notification as read and updates badge', async () => {
    const mockedApi = vi.mocked(api.notificationsApi);
    mockedApi.getUnreadCount.mockResolvedValue({ unread: 1 });
    mockedApi.getNotifications.mockResolvedValue([
      { id: 'm1', title: 'To Read', message: 'Please read', createdAt: new Date().toISOString(), read: false },
    ]);
    mockedApi.markAsRead.mockResolvedValue();

    render(<NotificationsBell />);
    await waitFor(() => expect(screen.getByText('1')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /open notifications/i }));

    await waitFor(() => expect(screen.getByText('To Read')).toBeTruthy());
    // click mark-as-read button
    const markButton = screen.getByRole('button', { name: /mark notification/i });
    fireEvent.click(markButton);

    // badge should disappear
    await waitFor(() => expect(screen.queryByText('1')).toBeNull());
  });
});

/**
 * Issue #662 — the notifications room must be joined with the real
 * authenticated wallet id, only while the socket is connected, and re-joined
 * after a disconnect/reconnect cycle. The old code joined with the literal
 * placeholder "user" and fired the join before the handshake completed.
 */
describe('NotificationsBell socket join (#662)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notificationHandler = undefined;
    socketConnected = true;
    walletPublicKey = 'GTEST123';
    useNotificationsStore.getState().clear();
  });

  it('joins the notifications channel with the real wallet public key', async () => {
    vi.mocked(api.notificationsApi.getUnreadCount).mockResolvedValue({ unread: 0 });
    render(<NotificationsBell />);

    await waitFor(() =>
      expect(socketService.joinNotifications).toHaveBeenCalledWith('GTEST123'),
    );
  });

  it('never joins with the legacy placeholder "user"', async () => {
    vi.mocked(api.notificationsApi.getUnreadCount).mockResolvedValue({ unread: 0 });
    render(<NotificationsBell />);

    await waitFor(() => expect(socketService.joinNotifications).toHaveBeenCalled());
    for (const call of vi.mocked(socketService.joinNotifications).mock.calls) {
      expect(call[0]).not.toBe('user');
    }
  });

  it('skips the join while the socket is disconnected', async () => {
    socketConnected = false;
    vi.mocked(api.notificationsApi.getUnreadCount).mockResolvedValue({ unread: 0 });
    render(<NotificationsBell />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /open notifications/i })).toBeDisabled(),
    );
    expect(socketService.joinNotifications).not.toHaveBeenCalled();
  });

  it('re-joins after the socket transitions disconnected → connected', async () => {
    vi.mocked(api.notificationsApi.getUnreadCount).mockResolvedValue({ unread: 0 });

    socketConnected = false;
    const view = render(<NotificationsBell />);
    expect(socketService.joinNotifications).not.toHaveBeenCalled();

    // The connection comes up — e.g. socket.io reconnects.
    socketConnected = true;
    await act(async () => {
      view.rerender(<NotificationsBell />);
    });

    await waitFor(() =>
      expect(socketService.joinNotifications).toHaveBeenCalledWith('GTEST123'),
    );
  });

  it('re-joins when the wallet identity changes (account switch)', async () => {
    vi.mocked(api.notificationsApi.getUnreadCount).mockResolvedValue({ unread: 0 });

    const view = render(<NotificationsBell />);
    await waitFor(() =>
      expect(socketService.joinNotifications).toHaveBeenCalledWith('GTEST123'),
    );

    walletPublicKey = 'GSWITCHED456';
    await act(async () => {
      view.rerender(<NotificationsBell />);
    });

    await waitFor(() =>
      expect(socketService.joinNotifications).toHaveBeenLastCalledWith('GSWITCHED456'),
    );
  });

  it('does not join at all when no wallet is connected', async () => {
    walletPublicKey = null;
    vi.mocked(api.notificationsApi.getUnreadCount).mockResolvedValue({ unread: 0 });
    render(<NotificationsBell />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /open notifications/i })).toBeTruthy(),
    );
    expect(socketService.joinNotifications).not.toHaveBeenCalled();
    expect(socketService.connect).not.toHaveBeenCalled();
  });
});
