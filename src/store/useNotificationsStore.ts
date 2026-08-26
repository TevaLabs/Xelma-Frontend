import { create } from 'zustand';
import type { NotificationItem, NotificationEventPayload } from '../types/notification';
import { notificationsApi } from '../lib/api-client';
import { normalizeApiError } from '../lib/api';

interface NotificationsState {
  unread: number;
  list: NotificationItem[];
  loadingCount: boolean;
  loadingList: boolean;
  errorCount?: string | null;
  errorList?: string | null;
  fetchUnread: () => Promise<void>;
  fetchList: () => Promise<void>;
  addNotification: (payload: NotificationEventPayload) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clear: () => void;
}

export const useNotificationsStore = create<NotificationsState>()((set, get) => ({
  unread: 0,
  list: [],
  loadingCount: false,
  loadingList: false,
  errorCount: null,
  errorList: null,
  fetchUnread: async () => {
    set({ loadingCount: true, errorCount: null });
    try {
      const res = await notificationsApi.getUnreadCount();
      set({ unread: res.unread });
    } catch (rawErr) {
      const err = normalizeApiError(rawErr, 'Failed to load unread count');
      set({ errorCount: err.message });
    } finally {
      set({ loadingCount: false });
    }
  },
  fetchList: async () => {
    set({ loadingList: true, errorList: null });
    try {
      const res = await notificationsApi.getNotifications();
      const items = res as NotificationItem[];
      // merge fetched items with any existing realtime items to avoid dropping
      // notifications that arrived while the panel was closed
      set((state) => {
        const existing = state.list ?? [];
        const fetchedIds = new Set(items.map((i) => i.id));
        const merged = [...items, ...existing.filter((e) => !fetchedIds.has(e.id))];
        return { list: merged };
      });
    } catch (rawErr) {
      const err = normalizeApiError(rawErr, 'Failed to load notifications');
      set({ errorList: err.message });
    } finally {
      set({ loadingList: false });
    }
  },
  addNotification: (payload) => {
    const item: NotificationItem = {
      id: payload.id,
      title: payload.title,
      message: payload.message,
      createdAt: payload.createdAt,
      read: false,
    };
    set((state) => ({ list: [item, ...state.list], unread: state.unread + 1 }));
  },
  markAsRead: async (id: string) => {
    // optimistic update
    set((state) => ({ list: state.list.map(n => n.id === id ? { ...n, read: true } : n), unread: Math.max(0, state.unread - (state.list.find(n => n.id === id && !n.read) ? 1 : 0)) }));
    try {
      await notificationsApi.markAsRead(id);
    } catch {
      // revert on failure by refetching count
      await get().fetchUnread();
    }
  },
  markAllAsRead: async () => {
    // Optimistic update: mark all local items as read and reset badge
    set((state) => ({
      list: state.list.map((n) => ({ ...n, read: true })),
      unread: 0,
    }));
    try {
      await notificationsApi.markAllAsRead();
    } catch {
      // If the batch endpoint fails, fall back to per-item calls for unread items
      const unreadIds = get().list.filter((n) => !n.read).map((n) => n.id);
      await Promise.allSettled(unreadIds.map((id) => notificationsApi.markAsRead(id)));
      // Sync the badge count from the server
      await get().fetchUnread();
    }
  },
  clear: () => set({ unread: 0, list: [] }),
}));
