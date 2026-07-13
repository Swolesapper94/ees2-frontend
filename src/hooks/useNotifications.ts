"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api/client";

export const NOTIFICATIONS_REFRESH_EVENT = "ees2:notifications-refresh";

export type NotificationCategory =
  | "EVAL_LIFECYCLE"
  | "MILESTONE"
  | "COLLABORATION"
  | "DELEGATE"
  | "SYSTEM";

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
  readAt?: string | null;
  createdAt: string;
  evaluationId?: string | null;
}

interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.get<NotificationsResponse>("/notifications");
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Silently fail — never crash the UI over notification errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    const handleRefresh = () => { void fetchNotifications(); };
    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, handleRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, handleRefresh);
    };
  }, [fetchNotifications]);

  const dismiss = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await api.patch(`/notifications/${id}`, { action: "dismiss" }).catch(() => {});
  }, []);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
      ),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await api.patch(`/notifications/${id}`, { action: "read" }).catch(() => {});
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
    );
    setUnreadCount(0);
    await api.patch("/notifications", {}).catch(() => {});
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);
    await api.delete("/notifications").catch(() => {});
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    dismiss,
    markRead,
    markAllRead,
    clearAll,
    refresh: fetchNotifications,
  };
}
