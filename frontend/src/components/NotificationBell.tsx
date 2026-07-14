"use client";

import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import Link from "next/link";

// ─── SVG ICONS ───
function IconBell({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

function IconClipboard({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}

function IconCheckCircle({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconAlertTriangle({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function IconXCircle({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ─── EVENT ICON MAP ───
const eventConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  job_applied:        { icon: <IconClipboard className="w-4 h-4" />,      color: "bg-blue-50 text-blue-600" },
  job_accepted:       { icon: <IconCheckCircle className="w-4 h-4" />,     color: "bg-emerald-50 text-emerald-600" },
  job_completed:      { icon: <IconCheckCircle className="w-4 h-4" />,     color: "bg-emerald-50 text-emerald-600" },
  job_disputed:       { icon: <IconAlertTriangle className="w-4 h-4" />,   color: "bg-red-50 text-red-500" },
  job_cancelled:      { icon: <IconXCircle className="w-4 h-4" />,         color: "bg-red-50 text-red-500" },
  job_review_pending: { icon: <IconClipboard className="w-4 h-4" />,       color: "bg-violet-50 text-violet-600" },
};

function getEventStyle(event: string) {
  return eventConfig[event] || { icon: <IconBell className="w-4 h-4" />, color: "bg-gray-100 text-gray" };
}

function formatNotifDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);

  if (hours < 1) {
    const mins = Math.floor(diff / 60000);
    return mins < 1 ? "Ahora" : `Hace ${mins} min`;
  }
  if (hours < 24) {
    return `Hace ${hours} h`;
  }
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, clear, connected } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-gray hover:text-dark hover:bg-gray-100 transition-all"
        aria-label="Notificaciones"
      >
        <IconBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Connection dot */}
      <span className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full border border-white ${connected ? "bg-emerald-400" : "bg-gray-300"}`} />

      {/* Mobile backdrop */}
      {open && <div className="fixed inset-0 z-[9998] md:hidden" onClick={() => setOpen(false)} />}

      {/* Dropdown */}
      {open && (
        <div className="
          fixed md:absolute
          left-4 right-4 md:left-auto md:right-0
          top-20 md:top-full md:mt-2
          z-[9999]
          bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden
          animate-page-enter
          max-h-[75vh] flex flex-col
        ">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <IconBell className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-dark">Notificaciones</h3>
              {unreadCount > 0 && (
                <span className="text-[11px] font-medium text-gray bg-gray-100 px-2 py-0.5 rounded-full">
                  {unreadCount} nueva{unreadCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <>
                  <button onClick={markAllRead} className="text-xs font-medium text-primary hover:text-primary-dark transition-colors">
                    Leer todo
                  </button>
                  <span className="text-gray-200">|</span>
                  <button onClick={clear} className="text-xs text-gray hover:text-dark transition-colors">
                    Limpiar
                  </button>
                </>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto modal-scroll">
            {notifications.length === 0 ? (
              <div className="text-center py-10 px-5">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <IconBell className="w-6 h-6 text-gray" />
                </div>
                <p className="text-sm font-medium text-dark">Sin notificaciones</p>
                <p className="text-xs text-gray mt-1">Te avisaremos cuando pase algo</p>
              </div>
            ) : (
              notifications.map((n, i) => {
                const evStyle = getEventStyle(n.event);
                const isLast = i === notifications.length - 1;
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors ${isLast ? "" : "border-b border-gray-50"} ${n.read ? "bg-white" : "bg-blue-50/40"}`}
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${evStyle.color}`}>
                      {evStyle.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${n.read ? "text-gray" : "text-dark font-medium"}`}>
                        {n.message}
                      </p>
                      <p className="text-[11px] text-gray mt-1">
                        {formatNotifDate(n.created_at)}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 text-center bg-gray-50/50">
              <Link
                href="/dashboard"
                className="text-xs font-medium text-primary hover:text-primary-dark transition-colors inline-flex items-center gap-1"
                onClick={() => setOpen(false)}
              >
                Ir al dashboard
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
