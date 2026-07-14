"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead, type NotificationItem } from "@/lib/api";

interface Notification {
  id: string;
  event: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
  connected: boolean;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markRead: () => {},
  markAllRead: () => {},
  clear: () => {},
  connected: false,
});

export function useNotifications() {
  return useContext(NotificationContext);
}

const STORAGE_PREFIX = "turnogo_notifs_";
const MAX_NOTIFS = 50;

function getStorageKey(userId: number) {
  return `${STORAGE_PREFIX}${userId}`;
}

function loadFromStorage(userId: number): Notification[] {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed: Notification[] = JSON.parse(raw);
    return parsed.slice(0, MAX_NOTIFS);
  } catch {
    return [];
  }
}

function saveToStorage(userId: number, notifs: Notification[]) {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(notifs.slice(0, MAX_NOTIFS)));
  } catch {
    // localStorage full or unavailable
  }
}

function toLocalNotif(item: NotificationItem): Notification {
  return {
    id: `notif-${item.id}`,
    event: item.event,
    message: item.message,
    data: item.data,
    read: item.read,
    created_at: item.created_at,
  };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load local + fetch from API on mount
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setConnected(false);
      return;
    }

    const saved = loadFromStorage(user.id);
    setNotifications(saved);

    // Initial fetch
    getNotifications(20).then((items) => {
      if (items.length > 0) {
        const local = items.map(toLocalNotif);
        setNotifications(local);
        saveToStorage(user.id, local);
        setConnected(true);
      }
    }).catch(() => {});

    // Poll every 10 seconds
    const poll = setInterval(() => {
      getNotifications(20).then((items) => {
        if (items.length > 0) {
          const local = items.map(toLocalNotif);
          setNotifications(local);
          saveToStorage(user.id, local);
        }
        setConnected(true);
      }).catch(() => {
        setConnected(false);
      });
    }, 10000);

    pollRef.current = poll;

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      setConnected(false);
    };
  }, [user?.id]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    // Extract numeric ID
    const numId = parseInt(id.replace("notif-", ""));
    if (!isNaN(numId)) {
      try {
        await markNotificationRead(numId);
      } catch {}
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead();
    } catch {}
  }, []);

  const clear = useCallback(() => {
    setNotifications([]);
    if (user) {
      localStorage.removeItem(getStorageKey(user.id));
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, clear, connected }}>
      {children}
    </NotificationContext.Provider>
  );
}
