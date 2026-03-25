import React, { useEffect, useId, useRef, useState } from "react";
import { Bell } from "./icons";
import { useNotificationsStore } from "../store/useNotificationsStore";
import type { NotificationEventPayload } from "../types/notification";
import NotificationsPanel from "./NotificationsPanel";
import { appSocket } from "../lib/socket";

const NotificationsBell: React.FC = () => {
  const unread = useNotificationsStore((s) => s.unread);
  // call fetchUnread directly from the store to avoid selector identity causing
  // effect re-runs during tests
  // (we still subscribe to `unread` below for render updates)
  const addNotification = useNotificationsStore((s) => s.addNotification);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const joinedRef = useRef(false);

  useEffect(() => {
    void useNotificationsStore.getState().fetchUnread();
  }, []);


  useEffect(() => {
    if (joinedRef.current) return;
    appSocket.joinChannel("join:notifications");
    const off = appSocket.on(
      "join:notifications",
      "notification",
      (payload: unknown) => {
        addNotification(payload as NotificationEventPayload);
      },
    );
    joinedRef.current = true;
    return () => {
      off();
      try {
        appSocket.leaveChannel("join:notifications");
      } catch {
        // ignore
      }
      joinedRef.current = false;
    };
  }, [addNotification]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
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
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
        aria-label={bellLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="w-5 h-5 text-gray-700 dark:text-gray-200" aria-hidden />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs leading-none px-1.5" aria-hidden>
            {unread}
          </span>
        )}
      </button>
      {open && (
        <NotificationsPanel id={panelId} onClose={() => setOpen(false)} />
      )}
    </div>
  );
};

export default NotificationsBell;
