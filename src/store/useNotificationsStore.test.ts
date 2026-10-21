import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNotificationsStore } from './useNotificationsStore';
import type { NotificationItem, NotificationEventPayload } from '../types/notification';

// Mock the API client
vi.mock('../lib/api-client', () => ({
  notificationsApi: {
    getUnreadCount: vi.fn(),
    getNotifications: vi.fn(),
    markAsRead: vi.fn(),
  },
}));

import { notificationsApi } from '../lib/api-client';

const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'Round Started',
    message: 'A new prediction round has started',
    createdAt: '2024-01-01T10:00:00Z',
    read: false,
  },
  {
    id: '2',
    title: 'Prediction Won',
    message: 'Your prediction was correct!',
    createdAt: '2024-01-01T09:00:00Z',
    read: true,
  },
];

describe('useNotificationsStore', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useNotificationsStore.setState({
      unread: 0,
      list: [],
      loadingCount: false,
      loadingList: false,
      errorCount: null,
      errorList: null,
    });
  });

  describe('initial state', () => {
    it('starts with empty state', () => {
      const state = useNotificationsStore.getState();
      expect(state.unread).toBe(0);
      expect(state.list).toEqual([]);
      expect(state.loadingCount).toBe(false);
      expect(state.loadingList).toBe(false);
      expect(state.errorCount).toBeNull();
      expect(state.errorList).toBeNull();
    });
  });

  describe('fetchUnread', () => {
    it('successfully fetches unread count', async () => {
      vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ unread: 5 });

      await useNotificationsStore.getState().fetchUnread();

      const state = useNotificationsStore.getState();
      expect(state.unread).toBe(5);
      expect(state.loadingCount).toBe(false);
      expect(state.errorCount).toBeNull();
    });

    it('sets loading state during fetch', async () => {
      let resolvePromise: (value: { unread: number }) => void;
      const promise = new Promise<{ unread: number }>((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(notificationsApi.getUnreadCount).mockReturnValue(promise);

      const fetchPromise = useNotificationsStore.getState().fetchUnread();
      
      // Check loading state
      expect(useNotificationsStore.getState().loadingCount).toBe(true);
      expect(useNotificationsStore.getState().errorCount).toBeNull();

      resolvePromise!({ unread: 3 });
      await fetchPromise;

      expect(useNotificationsStore.getState().loadingCount).toBe(false);
    });

    it('handles fetch error', async () => {
      const error = new Error('Network error');
      vi.mocked(notificationsApi.getUnreadCount).mockRejectedValue(error);

      await useNotificationsStore.getState().fetchUnread();

      const state = useNotificationsStore.getState();
      expect(state.loadingCount).toBe(false);
      expect(state.errorCount).toBe('Network error');
      expect(state.unread).toBe(0); // Should remain unchanged
    });

    it('clears previous error on successful fetch', async () => {
      // Set initial error state
      useNotificationsStore.setState({ errorCount: 'Previous error' });

      vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ unread: 2 });

      await useNotificationsStore.getState().fetchUnread();

      const state = useNotificationsStore.getState();
      expect(state.errorCount).toBeNull();
      expect(state.unread).toBe(2);
    });
  });

  describe('fetchList', () => {
    it('successfully fetches notifications list', async () => {
      vi.mocked(notificationsApi.getNotifications).mockResolvedValue(mockNotifications);

      await useNotificationsStore.getState().fetchList();

      const state = useNotificationsStore.getState();
      expect(state.list).toEqual(mockNotifications);
      expect(state.loadingList).toBe(false);
      expect(state.errorList).toBeNull();
    });

    it('merges fetched items with existing realtime items', async () => {
      // Set existing realtime notification
      const realtimeNotification: NotificationItem = {
        id: '3',
        title: 'Realtime Alert',
        message: 'This came via websocket',
        createdAt: '2024-01-01T11:00:00Z',
        read: false,
      };
      useNotificationsStore.setState({ list: [realtimeNotification] });

      vi.mocked(notificationsApi.getNotifications).mockResolvedValue(mockNotifications);

      await useNotificationsStore.getState().fetchList();

      const state = useNotificationsStore.getState();
      expect(state.list).toHaveLength(3);
      expect(state.list).toContain(realtimeNotification);
      expect(state.list).toEqual(expect.arrayContaining(mockNotifications));
    });

    it('avoids duplicates when merging', async () => {
      // Set existing notification that will also be in API response
      useNotificationsStore.setState({ list: [mockNotifications[0]] });

      vi.mocked(notificationsApi.getNotifications).mockResolvedValue(mockNotifications);

      await useNotificationsStore.getState().fetchList();

      const state = useNotificationsStore.getState();
      expect(state.list).toHaveLength(2); // No duplicates
      expect(state.list.filter(n => n.id === '1')).toHaveLength(1);
    });

    it('handles empty response', async () => {
      vi.mocked(notificationsApi.getNotifications).mockResolvedValue([]);

      await useNotificationsStore.getState().fetchList();

      const state = useNotificationsStore.getState();
      expect(state.list).toEqual([]);
      expect(state.loadingList).toBe(false);
    });

    it('handles fetch error', async () => {
      const error = new Error('API error');
      vi.mocked(notificationsApi.getNotifications).mockRejectedValue(error);

      await useNotificationsStore.getState().fetchList();

      const state = useNotificationsStore.getState();
      expect(state.loadingList).toBe(false);
      expect(state.errorList).toBe('API error');
    });
  });

  describe('addNotification', () => {
    it('adds new notification to the beginning of list', () => {
      useNotificationsStore.setState({ 
        list: mockNotifications,
        unread: 1 
      });

      const newPayload: NotificationEventPayload = {
        id: '3',
        title: 'New Alert',
        message: 'Fresh notification',
        createdAt: '2024-01-01T12:00:00Z',
      };

      useNotificationsStore.getState().addNotification(newPayload);

      const state = useNotificationsStore.getState();
      expect(state.list).toHaveLength(3);
      expect(state.list[0]).toEqual({
        id: '3',
        title: 'New Alert',
        message: 'Fresh notification',
        createdAt: '2024-01-01T12:00:00Z',
        read: false,
      });
      expect(state.unread).toBe(2);
    });

    it('increments unread count', () => {
      useNotificationsStore.setState({ unread: 5 });

      const payload: NotificationEventPayload = {
        id: '4',
        title: 'Test',
        message: 'Test message',
        createdAt: '2024-01-01T13:00:00Z',
      };

      useNotificationsStore.getState().addNotification(payload);

      expect(useNotificationsStore.getState().unread).toBe(6);
    });
  });

  describe('markAsRead', () => {
    beforeEach(() => {
      useNotificationsStore.setState({
        list: mockNotifications,
        unread: 1,
      });
    });

    it('optimistically marks notification as read', async () => {
      vi.mocked(notificationsApi.markAsRead).mockResolvedValue(undefined);

      await useNotificationsStore.getState().markAsRead('1');

      const state = useNotificationsStore.getState();
      const notification = state.list.find(n => n.id === '1');
      expect(notification?.read).toBe(true);
      expect(state.unread).toBe(0);
    });

    it('decrements unread count only for unread notifications', async () => {
      vi.mocked(notificationsApi.markAsRead).mockResolvedValue(undefined);

      // Mark already read notification
      await useNotificationsStore.getState().markAsRead('2');

      const state = useNotificationsStore.getState();
      expect(state.unread).toBe(1); // Should not change
    });

    it('reverts on API failure by refetching count', async () => {
      const fetchUnreadSpy = vi.fn().mockResolvedValue(undefined);
      useNotificationsStore.setState({ fetchUnread: fetchUnreadSpy });

      vi.mocked(notificationsApi.markAsRead).mockRejectedValue(new Error('API error'));

      await useNotificationsStore.getState().markAsRead('1');

      expect(fetchUnreadSpy).toHaveBeenCalled();
    });

    it('rolls back list item and unread count on API failure', async () => {
      const fetchUnreadSpy = vi.fn().mockResolvedValue(undefined);
      useNotificationsStore.setState({ fetchUnread: fetchUnreadSpy });

      vi.mocked(notificationsApi.markAsRead).mockRejectedValue(new Error('API error'));

      await useNotificationsStore.getState().markAsRead('1');

      const state = useNotificationsStore.getState();
      expect(state.list.find((n) => n.id === '1')?.read).toBe(false);
      expect(state.unread).toBe(1);
    });

    it('applies optimistic update before the API resolves', async () => {
      let resolveApi: () => void;
      vi.mocked(notificationsApi.markAsRead).mockReturnValue(
        new Promise<void>((resolve) => {
          resolveApi = resolve;
        })
      );

      const markPromise = useNotificationsStore.getState().markAsRead('1');

      // API still pending, but state should already be updated
      const optimisticState = useNotificationsStore.getState();
      expect(optimisticState.list.find((n) => n.id === '1')?.read).toBe(true);
      expect(optimisticState.unread).toBe(0);

      resolveApi!();
      await markPromise;

      const finalState = useNotificationsStore.getState();
      expect(finalState.list.find((n) => n.id === '1')?.read).toBe(true);
      expect(finalState.unread).toBe(0);
    });

    it('handles non-existent notification ID gracefully', async () => {
      vi.mocked(notificationsApi.markAsRead).mockResolvedValue(undefined);

      await useNotificationsStore.getState().markAsRead('non-existent');

      const state = useNotificationsStore.getState();
      expect(state.unread).toBe(1); // Should not change
    });

    it('prevents unread count from going negative', async () => {
      useNotificationsStore.setState({ unread: 0 });
      vi.mocked(notificationsApi.markAsRead).mockResolvedValue(undefined);

      await useNotificationsStore.getState().markAsRead('1');

      expect(useNotificationsStore.getState().unread).toBe(0);
    });
  });

  describe('clear', () => {
    it('resets all notification state', () => {
      useNotificationsStore.setState({
        unread: 5,
        list: mockNotifications,
        loadingCount: true,
        errorCount: 'Some error',
      });

      useNotificationsStore.getState().clear();

      const state = useNotificationsStore.getState();
      expect(state.unread).toBe(0);
      expect(state.list).toEqual([]);
    });
  });

  describe('concurrent operations', () => {
    it('handles concurrent fetchUnread calls', async () => {
      const mockFetchUnread = vi.fn().mockResolvedValue(undefined);
      vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ unread: 3 });
      
      // Mock the store's fetchUnread method
      useNotificationsStore.setState({ 
        fetchUnread: mockFetchUnread
      });

      const promises = [
        mockFetchUnread(),
        mockFetchUnread(),
        mockFetchUnread(),
      ];

      await Promise.all(promises);

      expect(mockFetchUnread).toHaveBeenCalledTimes(3);
    });

    it('handles adding notifications while fetching list', async () => {
      let resolveFetch: (value: NotificationItem[]) => void;
      const fetchPromise = new Promise<NotificationItem[]>((resolve) => {
        resolveFetch = resolve;
      });
      vi.mocked(notificationsApi.getNotifications).mockReturnValue(fetchPromise);

      const fetchListPromise = useNotificationsStore.getState().fetchList();

      // Add notification while fetch is in progress
      const newPayload: NotificationEventPayload = {
        id: '3',
        title: 'Concurrent',
        message: 'Added during fetch',
        createdAt: '2024-01-01T12:00:00Z',
      };
      useNotificationsStore.getState().addNotification(newPayload);

      resolveFetch!(mockNotifications);
      await fetchListPromise;

      const state = useNotificationsStore.getState();
      expect(state.list).toHaveLength(3);
      expect(state.list.some(n => n.id === '3')).toBe(true);
    });
  });
});