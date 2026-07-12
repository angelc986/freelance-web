"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useAuth } from "./AuthContext";

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

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);
  const evRef = useRef<EventSource | null>(null);
  const idCounter = useRef(0);

  const addNotif = useCallback((event: string, message: string, data?: any) => {
    idCounter.current += 1;
    const n: Notification = {
      id: `notif-${idCounter.current}-${Date.now()}`,
      event,
      message,
      data,
      read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [n, ...prev].slice(0, 50)); // max 50
  }, []);

  useEffect(() => {
    if (!user) {
      evRef.current?.close();
      evRef.current = null;
      setConnected(false);
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const connect = () => {
      const es = new EventSource(`${process.env.NEXT_PUBLIC_API_URL || "/api/v1"}/events?token=${token}`);

      es.onopen = () => setConnected(true);

      es.onmessage = (e) => {
        if (!e.data) return;
        try {
          const { event, data } = JSON.parse(e.data);
          const icons: Record<string, string> = {
            job_applied: "📋",
            job_accepted: "✅",
            job_completed: "🎉",
            job_disputed: "⚠️",
            job_cancelled: "❌",
            job_review_pending: "👀",
          };
          addNotif(event, data?.message || "Nueva notificación", data);
        } catch {}
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        // Reconnect after 5s
        setTimeout(connect, 5000);
      };

      evRef.current = es;
    };

    connect();

    return () => {
      evRef.current?.close();
      evRef.current = null;
      setConnected(false);
    };
  }, [user, addNotif]);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clear = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, clear, connected }}>
      {children}
    </NotificationContext.Provider>
  );
}
