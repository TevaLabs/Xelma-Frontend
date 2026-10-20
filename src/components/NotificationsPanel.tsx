import React, { useEffect, useRef } from 'react';
import { useNotificationsStore } from '../store/useNotificationsStore';
import { Check } from './icons';
import { LoadingState, ErrorState, EmptyState } from './ui/StatusStates';
import { useFocusTrap } from '../hooks/useFocusTrap';

const NotificationsPanel: React.FC<{ id: string; onClose: () => void }> = ({
  id,
  onClose,
}) => {
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const list = useNotificationsStore((s) => s.list);
  const loadingList = useNotificationsStore((s) => s.loadingList);
  const errorList = useNotificationsStore((s) => s.errorList);
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);
  const fetchList = useNotificationsStore((s) => s.fetchList);
  const unreadCount = list.filter((notification) => !notification.read).length;

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const handleRetry = () => {
    void fetchList();
  };

  useFocusTrap(panelRef, {
    active: true,
    initialFocusRef: closeButtonRef,
    onEscape: onClose,
    restoreFocus: false,
  });

  return (
    <div
      id={id}
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tabIndex={-1}
      className="glass-card absolute right-0 z-50 mt-2 flex max-h-[min(80vh,36rem)] w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-[#0A0F1A]/90 p-4 backdrop-blur-xl">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Inbox
          </p>
          <h2 id={titleId} className="mt-1 text-lg font-semibold tracking-tight text-white">
            Notifications
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="shrink-0 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-200">
              {unreadCount} unread
            </span>
          )}
          {unreadCount > 0 && (
            <button
              type="button"
              aria-label="Mark all notifications as read"
              onClick={() => void markAllAsRead()}
              className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-[#BEC7FE] hover:bg-[#2C4BFD]/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A] transition-colors"
            >
              Mark all as read
            </button>
          )}
          <button
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close notifications"
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A]"
          >
            Close
          </button>
        </div>
      </div>
      <p id={descriptionId} className="sr-only">
        Review notifications and mark unread items as read.
      </p>

      <div className="max-h-80 min-h-[200px] flex-1 overflow-auto">
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
            variant="offline"
            title="No notifications"
            message="You're all caught up! New notifications will appear here."
            className="p-4"
          />
        )}
        {!loadingList && !errorList && list.length > 0 && (
          <div>
            {list.map((n) => (
              <div
                key={n.id}
                className={`flex items-start justify-between gap-3 border-b border-white/[0.06] p-4 transition-colors last:border-b-0 ${n.read ? 'opacity-60' : 'bg-cyan-400/[0.035]'}`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-medium text-slate-100">
                    {!n.read && (
                      <>
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.75)]"
                          aria-hidden
                        />
                        <span className="sr-only">Unread notification</span>
                      </>
                    )}
                    <span className="truncate">{n.title}</span>
                  </div>
                  <div className="mt-1 text-sm leading-relaxed text-slate-400">{n.message}</div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
                {!n.read && (
                  <button
                    type="button"
                    aria-label={`Mark notification "${n.title}" as read`}
                    onClick={() => markAsRead(n.id)}
                    className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] p-2 text-cyan-200 transition-colors hover:border-cyan-300/30 hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A]"
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
