import React, { useEffect, useId, useRef, useState } from "react";
import { Bell } from "./icons";
import { useNotificationsStore } from "../store/useNotificationsStore";
import type { NotificationEventPayload } from "../types/notification";
import NotificationsPanel from "./NotificationsPanel";
import { socketService } from "../lib/socket";
import { useConnectionStatus } from "../hooks/useConnectionStatus";
import { useWalletStore } from "../store/useWalletStore";

const NotificationsBell: React.FC = () => {
  const unread = useNotificationsStore((s) => s.unread);
  const addNotification = useNotificationsStore((s) => s.addNotification);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const { isConnected } = useConnectionStatus();
  const publicKey = useWalletStore((s) => s.publicKey);

  useEffect(() => {
    void useNotificationsStore.getState().fetchUnread();
  }, []);

  useEffect(() => {
    // Issue #662 — join only with the real wallet identifier and only once
    // the socket is actually connected. Joining right after connect() fired
    // raced the handshake (socket not yet connected) and the server never
    // added us to the notification room.
    if (!publicKey || !isConnected) return;

    // (Re)connect defensively — no-op when the socket is already up.
    socketService.connect();

    const unsubscribe = socketService.onNotification((payload: unknown) => {
      addNotification(payload as NotificationEventPayload);
    });

    // Join the notifications channel with the authenticated wallet id.
    socketService.joinNotifications(publicKey);

    return () => {
      unsubscribe();
      // Note: Don't disconnect socket as other components may be using it.
      // Dropping `isConnected` back to false tears this down; the next
      // transition to connected re-runs the effect and re-joins the room.
    };
  }, [addNotification, publicKey, isConnected]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const bellLabel =
    unread > 0 ? `Open notifications, ${unread} unread` : "Open notifications";

  return (
    <div className="relative">
      <button
        type="button"
        ref={triggerRef}
        className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
          !isConnected ? 'opacity-50' : ''
        }`}
        aria-label={bellLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        disabled={!isConnected}
      >
        <Bell className="w-5 h-5 text-gray-700 dark:text-gray-200" aria-hidden />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs leading-none px-1.5" aria-hidden>
            {unread}
          </span>
        )}
        {!isConnected && (
          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" 
                title="Notifications offline" />
        )}
      </button>
      {open && (
        <NotificationsPanel
          id={panelId}
          onClose={() => {
            setOpen(false);
            triggerRef.current?.focus();
          }}
        />
      )}
    </div>
  );
};

export default NotificationsBell;
