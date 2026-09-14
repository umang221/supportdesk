"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/format-relative-time";
import { fetchNotifications, markNotificationRead } from "@/lib/api/notifications";
import { subscribeRealtime } from "@/lib/realtime/realtimeClient";
import { BellIcon } from "@/components/ui/icons";

const NOTIFICATION_LIST_LIMIT = 20;

/**
 * Bell button + dropdown panel showing the current user's own notifications
 * (scoped server-side by session, see /api/notifications). Loads once on
 * mount via REST (the source of truth) and then stays live via the
 * /api/realtime SSE stream (see lib/realtime/realtimeClient) — a new
 * notification for this user is pushed in and prepended without the panel
 * needing to be open or the page reloaded.
 */
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [now, setNow] = useState(null);

  function load() {
    fetchNotifications({ limit: NOTIFICATION_LIST_LIMIT })
      .then((data) => {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        setNow(Date.now());
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    return subscribeRealtime("notification:created", (notification) => {
      setNotifications((list) => [notification, ...list]);
      setUnreadCount((count) => count + 1);
      setNow(Date.now());
    });
  }, []);

  function handleRetry() {
    setIsLoading(true);
    setError(null);
    load();
  }

  function handleToggle() {
    setIsOpen((open) => !open);
  }

  async function handleMarkRead(id) {
    const previous = notifications;
    setNotifications((list) => list.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await markNotificationRead(id);
    } catch {
      // Revert on failure so the badge/list stay consistent with the server.
      setNotifications(previous);
      setUnreadCount((count) => count + 1);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-sla-critical-text" aria-hidden="true" />
        ) : null}
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-border-subtle bg-surface-card shadow-lg">
            <div className="flex items-center justify-between border-b border-border-subtle px-space-md py-space-sm">
              <span className="text-label-sm font-semibold text-text-primary">Notifications</span>
              {unreadCount > 0 ? (
                <span className="text-label-sm text-text-tertiary">{unreadCount} unread</span>
              ) : null}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <p className="px-space-md py-space-lg text-center text-body-sm text-text-tertiary">Loading…</p>
              ) : error ? (
                <div className="px-space-md py-space-lg text-center">
                  <p className="text-body-sm text-text-tertiary">{error}</p>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="mt-2 text-label-sm font-medium text-primary hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <p className="px-space-md py-space-lg text-center text-body-sm text-text-tertiary">
                  You&rsquo;re all caught up.
                </p>
              ) : (
                <ul>
                  {notifications.map((notification) => (
                    <li key={notification._id}>
                      <button
                        type="button"
                        onClick={() => !notification.read && handleMarkRead(notification._id)}
                        className={cn(
                          "flex w-full items-start gap-2 border-b border-border-subtle px-space-md py-space-sm text-left last:border-b-0 hover:bg-surface-hover",
                          !notification.read && "bg-accent-subtle/40"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                            notification.read ? "bg-transparent" : "bg-primary"
                          )}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-body-sm text-text-primary">{notification.message}</span>
                          <span className="mt-0.5 block text-label-sm text-text-tertiary">
                            {now ? formatRelativeTime(notification.createdAt, now) : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
