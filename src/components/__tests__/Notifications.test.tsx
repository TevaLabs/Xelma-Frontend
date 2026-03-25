// React import not required in this test file (JSX runtime handles it)
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotificationsBell from '../NotificationsBell';
import { useNotificationsStore } from '../../store/useNotificationsStore';
import * as api from '../../lib/api-client';

// Mock socket with a triggerable handler
let socketHandlers: Record<string, ((payload: unknown) => void) | undefined> = {};
vi.mock('../../lib/socket', () => ({
  appSocket: {
    joinChannel: vi.fn(),
    leaveChannel: vi.fn(),
    on: vi.fn((channel: string, event: string, cb: (p: unknown) => void) => {
      const key = `${channel}:${event}`;
      socketHandlers[key] = cb;
      return () => {
        delete socketHandlers[key];
      };
    }),
  },
}));

vi.mock('../../lib/api-client');

describe('Notifications', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    socketHandlers = {};
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
      socketHandlers['join:notifications:notification']?.(payload);
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
