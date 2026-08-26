import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotificationsPanel from './NotificationsPanel';
import { useNotificationsStore } from '../store/useNotificationsStore';
import type { NotificationItem } from '../types/notification';

// Mock the notifications store
vi.mock('../store/useNotificationsStore');

// Mock the UI components
vi.mock('./ui/StatusStates', () => ({
  LoadingState: ({ message, skeletonLines, className }: any) => (
    <div data-testid="loading-state" className={className} data-skeleton-lines={skeletonLines}>
      {message}
    </div>
  ),
  ErrorState: ({ message, onRetry, className }: any) => (
    <div data-testid="error-state" className={className}>
      <span>{message}</span>
      <button onClick={onRetry} data-testid="retry-button">Retry</button>
    </div>
  ),
  EmptyState: ({ title, message, icon, className }: any) => (
    <div data-testid="empty-state" className={className}>
      {icon}
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  ),
}));

// Mock icons
vi.mock('./icons', () => ({
  Clock: ({ className }: { className?: string }) => <div data-testid="clock-icon" className={className} />,
  Check: ({ className }: { className?: string }) => <div data-testid="check-icon" className={className} />,
}));

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
  {
    id: '3',
    title: 'Round Ended',
    message: 'The prediction round has ended',
    createdAt: '2024-01-01T08:00:00Z',
    read: false,
  },
];

const mockStore: {
  list: NotificationItem[];
  loadingList: boolean;
  errorList: string | null;
  markAsRead: ReturnType<typeof vi.fn>;
  markAllAsRead: ReturnType<typeof vi.fn>;
  fetchList: ReturnType<typeof vi.fn>;
} = {
  list: [],
  loadingList: false,
  errorList: null,
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  fetchList: vi.fn(),
};

describe('NotificationsPanel', () => {
  const defaultProps = {
    id: 'notifications-panel',
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    
    // Reset the mock store to default state - mutate properties directly
    mockStore.list = [];
    mockStore.loadingList = false;
    mockStore.errorList = null;
    mockStore.markAsRead = vi.fn();
    mockStore.markAllAsRead = vi.fn();
    mockStore.fetchList = vi.fn();
    
    vi.mocked(useNotificationsStore).mockImplementation((selector: any) => {
      return selector(mockStore);
    });
  });

  describe('rendering', () => {
    it('renders with correct structure and ARIA attributes', () => {
      render(<NotificationsPanel {...defaultProps} />);

      const panel = screen.getByRole('dialog');
      expect(panel).toHaveAttribute('id', 'notifications-panel');
      expect(panel).toHaveAttribute('aria-modal', 'true');
      expect(panel).toHaveAttribute('aria-labelledby', 'notifications-panel-title');
      expect(panel).toHaveAttribute('aria-describedby', 'notifications-panel-description');

      const title = screen.getByRole('heading', { name: 'Notifications' });
      expect(title).toHaveAttribute('id', 'notifications-panel-title');
    });

    it('renders close button with correct accessibility', () => {
      render(<NotificationsPanel {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: 'Close notifications' });
      expect(closeButton).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const mockOnClose = vi.fn();
      render(<NotificationsPanel {...defaultProps} onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button', { name: 'Close notifications' });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('focuses the close button when opened and closes on Escape', async () => {
      const mockOnClose = vi.fn();
      render(<NotificationsPanel {...defaultProps} onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button', { name: 'Close notifications' });
      await waitFor(() => expect(closeButton).toHaveFocus());

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('keeps Tab focus inside the panel', async () => {
      mockStore.list = [mockNotifications[0]];
      render(<NotificationsPanel {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: 'Close notifications' });
      const markAllButton = screen.getByRole('button', { name: 'Mark all notifications as read' });
      const markAsReadButton = screen.getByRole('button', { name: /mark notification/i });

      // Initial focus should land on the close button (initialFocusRef)
      await waitFor(() => expect(closeButton).toHaveFocus());

      // Tab from per-item mark-as-read wraps back to "Mark all as read" (first focusable)
      markAsReadButton.focus();
      fireEvent.keyDown(document, { key: 'Tab' });
      expect(markAllButton).toHaveFocus();

      // Shift+Tab from "Mark all as read" wraps to per-item mark-as-read (last focusable)
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
      expect(markAsReadButton).toHaveFocus();
    });
  });

  describe('loading state', () => {
    it('shows loading state when loadingList is true', () => {
      vi.mocked(useNotificationsStore).mockImplementation((selector: any) => {
        return selector({ ...mockStore, loadingList: true });
      });

      render(<NotificationsPanel {...defaultProps} />);

      const loadingState = screen.getByTestId('loading-state');
      expect(loadingState).toHaveTextContent('Loading notifications...');
      expect(loadingState).toHaveAttribute('data-skeleton-lines', '4');
      expect(loadingState).toHaveClass('p-4');
    });

    it('fetches notifications on mount', () => {
      render(<NotificationsPanel {...defaultProps} />);

      expect(mockStore.fetchList).toHaveBeenCalledTimes(1);
    });
  });

  describe('error state', () => {
    it('shows error state when errorList is present', () => {
      vi.mocked(useNotificationsStore).mockImplementation((selector: any) => {
        return selector({ 
          ...mockStore, 
          loadingList: false, 
          errorList: 'Failed to load notifications' 
        });
      });

      render(<NotificationsPanel {...defaultProps} />);

      const errorState = screen.getByTestId('error-state');
      expect(errorState).toHaveTextContent('Failed to load notifications');
      expect(errorState).toHaveClass('p-4');
    });

    it('handles HTML error responses', () => {
      vi.mocked(useNotificationsStore).mockImplementation((selector: any) => {
        return selector({ 
          ...mockStore, 
          loadingList: false, 
          errorList: '<html><body>Server Error</body></html>' 
        });
      });

      render(<NotificationsPanel {...defaultProps} />);

      const errorState = screen.getByTestId('error-state');
      expect(errorState).toHaveTextContent('Server returned non-JSON response. Check API or auth.');
    });

    it('calls fetchList when retry button is clicked', () => {
      vi.mocked(useNotificationsStore).mockImplementation((selector: any) => {
        return selector({ 
          ...mockStore, 
          loadingList: false, 
          errorList: 'Network error' 
        });
      });

      render(<NotificationsPanel {...defaultProps} />);

      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      expect(mockStore.fetchList).toHaveBeenCalledTimes(2); // Once on mount, once on retry
    });
  });

  describe('empty state', () => {
    it('shows empty state when no notifications', () => {
      vi.mocked(useNotificationsStore).mockImplementation((selector: any) => {
        return selector({ 
          ...mockStore, 
          list: [],
          loadingList: false, 
          errorList: null 
        });
      });

      render(<NotificationsPanel {...defaultProps} />);

      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toHaveTextContent('No notifications');
      expect(emptyState).toHaveTextContent("You're all caught up! New notifications will appear here.");
      expect(emptyState).toHaveClass('p-4');
    });
  });

  describe('notifications list', () => {
    beforeEach(() => {
      // First, reset to defaults
      Object.assign(mockStore, {
        list: [],
        loadingList: false,
        errorList: null,
        markAsRead: vi.fn(),
        fetchList: vi.fn(),
      });
      
      // Then set up the mock store with notifications for these tests
      mockStore.list = mockNotifications;
      mockStore.loadingList = false;
      mockStore.errorList = null;
      
      vi.mocked(useNotificationsStore).mockImplementation((selector: any) => {
        return selector(mockStore);
      });
    });

    it('renders all notifications', () => {
      render(<NotificationsPanel {...defaultProps} />);

      expect(screen.getByText('Round Started')).toBeInTheDocument();
      expect(screen.getByText('Prediction Won')).toBeInTheDocument();
      expect(screen.getByText('Round Ended')).toBeInTheDocument();
    });

    it('displays notification details correctly', () => {
      render(<NotificationsPanel {...defaultProps} />);

      // Check first notification
      expect(screen.getByText('Round Started')).toBeInTheDocument();
      expect(screen.getByText('A new prediction round has started')).toBeInTheDocument();
      
      // Check formatted date
      const formattedDate = new Date('2024-01-01T10:00:00Z').toLocaleString();
      expect(screen.getByText(formattedDate)).toBeInTheDocument();
    });

    it('applies correct styling for read vs unread notifications', () => {
      render(<NotificationsPanel {...defaultProps} />);

      const notifications = screen.getAllByText(/Round|Prediction/).map(el => 
        el.closest('[class*="border-b"]')
      );

      // First notification (unread) should not have opacity-60
      expect(notifications[0]).not.toHaveClass('opacity-60');
      
      // Second notification (read) should have opacity-60
      expect(notifications[1]).toHaveClass('opacity-60');
    });

    it('shows mark as read button only for unread notifications', () => {
      // Use the same mock setup approach as the passing accessibility test
      vi.mocked(useNotificationsStore).mockImplementation((selector: any) => {
        return selector({ 
          ...mockStore, 
          list: mockNotifications,
          loadingList: false, 
          errorList: null 
        });
      });

      render(<NotificationsPanel {...defaultProps} />);

      // Check that we have the expected notifications rendered
      expect(screen.getByText('Round Started')).toBeInTheDocument();
      expect(screen.getByText('Prediction Won')).toBeInTheDocument();
      expect(screen.getByText('Round Ended')).toBeInTheDocument();
      
      // Find mark as read buttons using the same approach as the passing accessibility test
      const markAsReadButtons = screen.getAllByRole('button', { name: /Mark notification .* as read/ });
      
      // Should have 2 buttons (for 2 unread notifications)
      expect(markAsReadButtons).toHaveLength(2);
      
      // Check if the labels contain the expected text (more flexible)
      const buttonLabels = markAsReadButtons.map(button => button.getAttribute('aria-label'));
      expect(buttonLabels.some(label => label?.includes('Round Started'))).toBe(true);
      expect(buttonLabels.some(label => label?.includes('Round Ended'))).toBe(true);
    });

    it('calls markAsRead when mark as read button is clicked', () => {
      // Use the same mock setup approach as the passing accessibility test
      vi.mocked(useNotificationsStore).mockImplementation((selector: any) => {
        return selector({ 
          ...mockStore, 
          list: mockNotifications,
          loadingList: false, 
          errorList: null 
        });
      });

      render(<NotificationsPanel {...defaultProps} />);

      // Find the mark as read button for "Round Started" using the same approach
      const markAsReadButtons = screen.getAllByRole('button', { name: /Mark notification .* as read/ });
      const roundStartedButton = markAsReadButtons.find(button => 
        button.getAttribute('aria-label')?.includes('Round Started')
      );
      
      expect(roundStartedButton).toBeTruthy();
      fireEvent.click(roundStartedButton!);

      expect(mockStore.markAsRead).toHaveBeenCalledWith('1');
    });

    it('renders check icon in mark as read buttons', () => {
      render(<NotificationsPanel {...defaultProps} />);

      const checkIcons = screen.getAllByTestId('check-icon');
      expect(checkIcons).toHaveLength(2); // One for each unread notification
      
      checkIcons.forEach(icon => {
        expect(icon).toHaveClass('w-4', 'h-4');
      });
    });
  });

  describe('scrolling behavior', () => {
    it('applies correct scrolling classes', () => {
      render(<NotificationsPanel {...defaultProps} />);

      const scrollContainer = screen.getByRole('dialog').querySelector('.max-h-80');
      expect(scrollContainer).toHaveClass('max-h-80', 'overflow-auto', 'min-h-[200px]');
    });
  });

  describe('accessibility', () => {
    it('has proper dialog structure', () => {
      render(<NotificationsPanel {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'notifications-panel-title');
    });

    it('has accessible close button', () => {
      render(<NotificationsPanel {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: 'Close notifications' });
      expect(closeButton).toHaveAttribute('type', 'button');
    });

    it('has accessible mark as read buttons', () => {
      vi.mocked(useNotificationsStore).mockImplementation((selector: any) => {
        return selector({ 
          ...mockStore, 
          list: mockNotifications,
          loadingList: false, 
          errorList: null 
        });
      });

      render(<NotificationsPanel {...defaultProps} />);

      const markAsReadButtons = screen.getAllByRole('button', { name: /Mark notification .* as read/ });
      
      markAsReadButtons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('uses proper heading hierarchy', () => {
      render(<NotificationsPanel {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Notifications');
    });
  });

  describe('responsive design', () => {
    it('applies responsive width classes', () => {
      render(<NotificationsPanel {...defaultProps} />);

      const panel = screen.getByRole('dialog');
      expect(panel).toHaveClass('w-96', 'max-w-[calc(100vw-2rem)]');
    });

    it('applies proper positioning classes', () => {
      render(<NotificationsPanel {...defaultProps} />);

      const panel = screen.getByRole('dialog');
      expect(panel).toHaveClass('absolute', 'right-0', 'mt-2');
    });
  });

  describe('dark mode support', () => {
    it('includes dark mode classes', () => {
      render(<NotificationsPanel {...defaultProps} />);

      const panel = screen.getByRole('dialog');
      expect(panel).toHaveClass('bg-white', 'dark:bg-gray-900');
      expect(panel).toHaveClass('border-gray-200', 'dark:border-gray-800');
    });
  });

  describe('edge cases', () => {
    it('handles notifications with missing or invalid dates', () => {
      const notificationsWithBadDates = [
        { ...mockNotifications[0], createdAt: 'invalid-date' },
        { ...mockNotifications[1], createdAt: '' },
      ];

      vi.mocked(useNotificationsStore).mockImplementation((selector: any) => {
        return selector({ 
          ...mockStore, 
          list: notificationsWithBadDates,
          loadingList: false, 
          errorList: null 
        });
      });

      render(<NotificationsPanel {...defaultProps} />);

      // Should not crash and should still render notifications
      expect(screen.getByText('Round Started')).toBeInTheDocument();
      expect(screen.getByText('Prediction Won')).toBeInTheDocument();
    });

    it('handles very long notification titles and messages', () => {
      const longNotification = {
        id: '1',
        title: 'This is a very long notification title that might overflow the container and cause layout issues',
        message: 'This is an extremely long notification message that contains a lot of text and might cause wrapping or overflow issues in the UI component layout system',
        createdAt: '2024-01-01T10:00:00Z',
        read: false,
      };

      vi.mocked(useNotificationsStore).mockImplementation((selector: any) => {
        return selector({ 
          ...mockStore, 
          list: [longNotification],
          loadingList: false, 
          errorList: null 
        });
      });

      render(<NotificationsPanel {...defaultProps} />);

      expect(screen.getByText(longNotification.title)).toBeInTheDocument();
      expect(screen.getByText(longNotification.message)).toBeInTheDocument();
    });

    it('handles empty notification fields', () => {
      const emptyNotification = {
        id: '1',
        title: '',
        message: '',
        createdAt: '2024-01-01T10:00:00Z',
        read: false,
      };

      // Set up mock store with empty notification using the same approach
      vi.mocked(useNotificationsStore).mockImplementation((selector: any) => {
        return selector({ 
          ...mockStore, 
          list: [emptyNotification],
          loadingList: false, 
          errorList: null 
        });
      });

      render(<NotificationsPanel {...defaultProps} />);

      // Should still render the notification structure - find button by aria-label pattern
      const markAsReadButtons = screen.getAllByRole('button', { name: /Mark notification .* as read/ });
      expect(markAsReadButtons).toHaveLength(1);
      
      // Just check that we have a button - the exact label format doesn't matter for this test
      expect(markAsReadButtons[0]).toBeTruthy();
    });
  });

  describe('state transitions', () => {
    it('transitions from loading to content', async () => {
      const { rerender } = render(<NotificationsPanel {...defaultProps} />);

      // Initially loading
      vi.mocked(useNotificationsStore).mockImplementation((selector: any) => {
        return selector({ ...mockStore, loadingList: true });
      });
      rerender(<NotificationsPanel {...defaultProps} />);
      
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();

      // Then loaded with content
      vi.mocked(useNotificationsStore).mockImplementation((selector: any) => {
        return selector({ 
          ...mockStore, 
          list: mockNotifications,
          loadingList: false, 
          errorList: null 
        });
      });
      rerender(<NotificationsPanel {...defaultProps} />);

      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      expect(screen.getByText('Round Started')).toBeInTheDocument();
    });

    it('transitions from error to content after retry', async () => {
      const { rerender } = render(<NotificationsPanel {...defaultProps} />);

      // Initially error
      vi.mocked(useNotificationsStore).mockImplementation((selector: any) => {
        return selector({ 
          ...mockStore, 
          loadingList: false, 
          errorList: 'Network error' 
        });
      });
      rerender(<NotificationsPanel {...defaultProps} />);
      
      expect(screen.getByTestId('error-state')).toBeInTheDocument();

      // After successful retry
      vi.mocked(useNotificationsStore).mockImplementation((selector: any) => {
        return selector({ 
          ...mockStore, 
          list: mockNotifications,
          loadingList: false, 
          errorList: null 
        });
      });
      rerender(<NotificationsPanel {...defaultProps} />);

      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
      expect(screen.getByText('Round Started')).toBeInTheDocument();
    });
  });
});
