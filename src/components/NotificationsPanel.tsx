import React, { useEffect } from 'react';
import { useNotificationsStore } from '../store/useNotificationsStore';
import { Clock, Check } from './icons';
import { LoadingState, ErrorState, EmptyState } from './ui/StatusStates';

const NotificationsPanel: React.FC<{ id: string; onClose: () => void }> = ({
  id,
  onClose,
}) => {
  const titleId = `${id}-title`;
  const list = useNotificationsStore((s) => s.list);
  const loadingList = useNotificationsStore((s) => s.loadingList);
  const errorList = useNotificationsStore((s) => s.errorList);
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const fetchList = useNotificationsStore((s) => s.fetchList);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const handleRetry = () => {
    void fetchList();
  };

  return (
    <div
      id={id}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50"
    >
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
        <h2 id={titleId} className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Notifications
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notifications"
          className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
        >
          Close
        </button>
      </div>

      <div className="max-h-80 overflow-auto min-h-[200px]">
        {loadingList && (
          <LoadingState message="Loading notifications..." variant="skeleton" skeletonLines={4} className="p-4" />
        )}
        {errorList && !loadingList && (
          <ErrorState
            message={typeof errorList === 'string' && errorList.trim().startsWith('<')
              ? 'Server returned non-JSON response. Check API or auth.'
              : String(errorList)}
            onRetry={handleRetry}
            className="p-4"
          />
        )}
        {!loadingList && !errorList && list.length === 0 && (
          <EmptyState
            title="No notifications"
            message="You're all caught up! New notifications will appear here."
            icon={<Clock className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-4" />}
            className="p-4"
          />
        )}
        {!loadingList && !errorList && list.length > 0 && (
          <div>
            {list.map((n) => (
              <div
                key={n.id}
                className={`p-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3 ${n.read ? 'opacity-60' : ''}`}
              >
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{n.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{n.message}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
                {!n.read && (
                  <button
                    type="button"
                    aria-label={`Mark notification “${n.title}” as read`}
                    onClick={() => markAsRead(n.id)}
                    className="shrink-0 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                  >
                    <Check className="w-4 h-4" aria-hidden />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;
