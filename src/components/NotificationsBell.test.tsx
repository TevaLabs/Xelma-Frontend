import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotificationsBell from './NotificationsBell';
import { useNotificationsStore } from '../store/useNotificationsStore';
import { useWalletStore } from '../store/useWalletStore';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { socketService } from '../lib/socket';

// Mock socketService
let mockNotificationCallback: ((payload: unknown) => void) | undefined;
const mockUnsubscribe = vi.fn();

vi.mock('../lib/socket', () => ({
  socketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    onNotification: vi.fn((cb: (payload: unknown) => void) => {
      mockNotificationCallback = cb;
      return mockUnsubscribe;
    }),
    joinNotifications: vi.fn(),
  },
}));

// Mock useConnectionStatus hook
vi.mock('../hooks/useConnectionStatus', () => ({
  useConnectionStatus: vi.fn(),
}));

// Mock useWalletStore hook
vi.mock('../store/useWalletStore', () => ({
  useWalletStore: vi.fn(),
}));

// Mock NotificationsPanel to keep component tests focused
vi.mock('./NotificationsPanel', () => ({
  default: ({ id, onClose }: { id: string; onClose: () => void }) => (
    <div data-testid="notifications-panel" id={id} role="dialog">
      <p>Notifications Panel Content</p>
      <button type="button" onClick={onClose} aria-label="Close panel">
        Close
      </button>
    </div>
  ),
}));

describe('NotificationsBell', () => {
  let fetchUnreadSpy: ReturnType<typeof vi.fn>;
  let addNotificationSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNotificationCallback = undefined;

    // Reset store state
    useNotificationsStore.setState({
      unread: 0,
      list: [],
      loadingCount: false,
      loadingList: false,
      errorCount: null,
      errorList: null,
    });

    fetchUnreadSpy = vi.fn().mockResolvedValue(undefined);
    addNotificationSpy = vi.fn();
    useNotificationsStore.getState().fetchUnread = fetchUnreadSpy;
    useNotificationsStore.getState().addNotification = addNotificationSpy;

    // Default connection status: connected
    vi.mocked(useConnectionStatus).mockReturnValue({
      status: 'connected',
      isConnected: true,
      isConnecting: false,
      isReconnecting: false,
      isDisconnected: false,
      reconnect: vi.fn(),
    });

    // Default wallet: connected
    vi.mocked(useWalletStore).mockImplementation(((selector: (state: { publicKey: string | null }) => unknown) => {
      const state = { publicKey: 'G_TEST_PUBLIC_KEY_123' };
      return selector ? selector(state) : state;
    }) as unknown as typeof useWalletStore);
  });

  describe('Lifecycle & Unread Badge', () => {
    it('calls fetchUnread on mount', () => {
      render(<NotificationsBell />);
      expect(fetchUnreadSpy).toHaveBeenCalledTimes(1);
    });

    it('renders bell with default aria-label and no badge when unread is 0', () => {
      render(<NotificationsBell />);

      const button = screen.getByRole('button', { name: 'Open notifications' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-haspopup', 'dialog');
      expect(button).toHaveAttribute('aria-controls');

      // No unread badge should be rendered
      expect(screen.queryByText(/^[0-9]+$/)).not.toBeInTheDocument();
    });

    it('renders badge and updated aria-label when unread count is greater than 0', () => {
      useNotificationsStore.setState({ unread: 4 });

      render(<NotificationsBell />);

      const button = screen.getByRole('button', { name: 'Open notifications, 4 unread' });
      expect(button).toBeInTheDocument();

      const badge = screen.getByText('4');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-red-500');
    });
  });

  describe('Panel Open / Close Interactions', () => {
    it('opens and closes the panel when clicking the bell button', () => {
      render(<NotificationsBell />);

      const button = screen.getByRole('button', { name: /open notifications/i });
      const panelId = button.getAttribute('aria-controls')!;

      // Initially closed
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByTestId('notifications-panel')).not.toBeInTheDocument();

      // Click to open
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      const panel = screen.getByTestId('notifications-panel');
      expect(panel).toBeInTheDocument();
      expect(panel).toHaveAttribute('id', panelId);

      // Click to close
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByTestId('notifications-panel')).not.toBeInTheDocument();
    });

    it('closes the panel and restores focus to trigger button when Escape key is pressed', () => {
      render(<NotificationsBell />);

      const button = screen.getByRole('button', { name: /open notifications/i });
      const focusSpy = vi.spyOn(button, 'focus');

      // Open panel
      fireEvent.click(button);
      expect(screen.getByTestId('notifications-panel')).toBeInTheDocument();

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByTestId('notifications-panel')).not.toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(focusSpy).toHaveBeenCalled();
    });

    it('does not error or alter state when Escape is pressed while panel is closed', () => {
      render(<NotificationsBell />);

      const button = screen.getByRole('button', { name: /open notifications/i });
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByTestId('notifications-panel')).not.toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes the panel and restores focus to trigger button when panel calls onClose', () => {
      render(<NotificationsBell />);

      const button = screen.getByRole('button', { name: /open notifications/i });
      const focusSpy = vi.spyOn(button, 'focus');

      // Open panel
      fireEvent.click(button);
      expect(screen.getByTestId('notifications-panel')).toBeInTheDocument();

      // Trigger panel onClose via child button
      const closeButton = screen.getByRole('button', { name: 'Close panel' });
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('notifications-panel')).not.toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('Socket Lifecycle & Channel Interactions', () => {
    it('connects to socket and joins notifications channel when publicKey is present', () => {
      render(<NotificationsBell />);

      expect(socketService.connect).toHaveBeenCalledTimes(1);
      expect(socketService.joinNotifications).toHaveBeenCalledWith('G_TEST_PUBLIC_KEY_123');
      expect(socketService.onNotification).toHaveBeenCalledTimes(1);
    });

    it('does not connect to socket or join channel when publicKey is null', () => {
      vi.mocked(useWalletStore).mockImplementation(((selector: (state: { publicKey: string | null }) => unknown) => {
        const state = { publicKey: null };
        return selector ? selector(state) : state;
      }) as unknown as typeof useWalletStore);

      render(<NotificationsBell />);

      expect(socketService.connect).not.toHaveBeenCalled();
      expect(socketService.joinNotifications).not.toHaveBeenCalled();
      expect(socketService.onNotification).not.toHaveBeenCalled();
    });

    it('routes incoming real-time notifications to addNotification store action', () => {
      render(<NotificationsBell />);

      expect(mockNotificationCallback).toBeDefined();

      const samplePayload = {
        id: 'evt-123',
        title: 'New Round',
        message: 'Round 42 started',
        createdAt: new Date().toISOString(),
        read: false,
      };

      act(() => {
        mockNotificationCallback?.(samplePayload);
      });

      expect(addNotificationSpy).toHaveBeenCalledWith(samplePayload);
    });

    it('unsubscribes from socket notifications on unmount without disconnecting socket', () => {
      const { unmount } = render(<NotificationsBell />);

      expect(mockUnsubscribe).not.toHaveBeenCalled();

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
      expect(socketService.disconnect).not.toHaveBeenCalled();
    });

    it('resubscribes when publicKey changes', () => {
      let currentPublicKey = 'G_ACCOUNT_A';
      vi.mocked(useWalletStore).mockImplementation(((selector: (state: { publicKey: string | null }) => unknown) => {
        const state = { publicKey: currentPublicKey };
        return selector ? selector(state) : state;
      }) as unknown as typeof useWalletStore);

      const { rerender } = render(<NotificationsBell />);

      expect(socketService.joinNotifications).toHaveBeenCalledWith('G_ACCOUNT_A');

      // Change public key
      currentPublicKey = 'G_ACCOUNT_B';
      rerender(<NotificationsBell />);

      // Unsubscribed previous
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
      // Joined with new key
      expect(socketService.joinNotifications).toHaveBeenCalledWith('G_ACCOUNT_B');
    });
  });

  describe('Connection Status & Disconnected Styling Hooks', () => {
    it('applies disconnected styling, disabled state, and offline dot when disconnected', () => {
      vi.mocked(useConnectionStatus).mockReturnValue({
        status: 'disconnected',
        isConnected: false,
        isConnecting: false,
        isReconnecting: false,
        isDisconnected: true,
        reconnect: vi.fn(),
      });

      render(<NotificationsBell />);

      const button = screen.getByRole('button', { name: /open notifications/i });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-50');

      // Offline dot
      const offlineIndicator = screen.getByTitle('Notifications offline');
      expect(offlineIndicator).toBeInTheDocument();
      expect(offlineIndicator).toHaveClass('bg-red-500');
    });

    it('does not allow opening the panel when disconnected', () => {
      vi.mocked(useConnectionStatus).mockReturnValue({
        status: 'disconnected',
        isConnected: false,
        isConnecting: false,
        isReconnecting: false,
        isDisconnected: true,
        reconnect: vi.fn(),
      });

      render(<NotificationsBell />);

      const button = screen.getByRole('button', { name: /open notifications/i });
      fireEvent.click(button);

      expect(screen.queryByTestId('notifications-panel')).not.toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('applies connected styling and enables button when connected', () => {
      vi.mocked(useConnectionStatus).mockReturnValue({
        status: 'connected',
        isConnected: true,
        isConnecting: false,
        isReconnecting: false,
        isDisconnected: false,
        reconnect: vi.fn(),
      });

      render(<NotificationsBell />);

      const button = screen.getByRole('button', { name: /open notifications/i });
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveClass('opacity-50');
      expect(screen.queryByTitle('Notifications offline')).not.toBeInTheDocument();
    });
  });
});
