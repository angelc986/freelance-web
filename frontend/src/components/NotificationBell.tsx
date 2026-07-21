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
  const [animIn, setAnimIn] = useState(false);
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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  const toggleOpen = () => {
    if (!open) {
      setOpen(true);
      requestAnimationFrame(() => setAnimIn(true));
    } else {
      setAnimIn(false);
      setTimeout(() => setOpen(false), 200);
    }
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={toggleOpen}
        className="relative p-2 rounded-xl text-gray hover:text-dark hover:bg-gray-100 transition-all group"
        aria-label="Notificaciones"
      >
        <div className="relative">
          <IconBell className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-gradient-to-br from-red-500 to-rose-500 text-white text-[10px] font-bold rounded-full px-1 shadow-sm shadow-red-200 animate-bounce-in">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* Connection indicator */}
      <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2">
        <span className={`block w-1.5 h-1.5 rounded-full ring-2 ring-white transition-colors duration-300 ${connected ? "bg-emerald-400" : "bg-gray-300"}`} />
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className={`fixed inset-0 z-[9998] md:hidden transition-opacity duration-200 ${animIn ? "opacity-100" : "opacity-0"}`}
          onClick={() => { setAnimIn(false); setTimeout(() => setOpen(false), 200); }}
        >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div
          className={`
            fixed md:fixed
            inset-x-4 top-20 md:inset-x-auto md:right-4 md:top-16
            z-[9999]
            bg-white/90 backdrop-blur-2xl
            rounded-2xl shadow-2xl shadow-black/10 border border-white/50
            overflow-hidden
            max-h-[75vh] flex flex-col
            transition-all duration-200 ease-out
            ${animIn ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95 pointer-events-none"}
            w-full md:w-[400px]
`}
        >
          {/* Glass top gradient */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200/60 to-transparent" />

          {/* Header */}
          <div className="relative flex items-center justify-between px-5 py-4 border-b border-gray-100/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-primary flex items-center justify-center shadow-sm">
                <IconBell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-dark leading-tight">Notificaciones</h3>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {unreadCount} nueva{unreadCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <>
                  <button onClick={markAllRead} className="text-xs font-medium text-primary hover:text-primary-dark px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-all">
                    Leer todo
                  </button>
                  <span className="text-gray-200/80">|</span>
                  <button onClick={clear} className="text-xs text-gray hover:text-dark px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-all">
                    Limpiar
                  </button>
                </>
              )}
            </div>
          </div>

          {/* List */}
          <div className="relative max-h-80 overflow-y-auto modal-scroll">
            {notifications.length === 0 ? (
              <div className="text-center py-14 px-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <svg className="w-7 h-7 text-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-dark">Todo al día</p>
                <p className="text-xs text-gray mt-1.5 max-w-[200px] mx-auto leading-relaxed">No hay notificaciones nuevas. Te avisaremos cuando algo requiera tu atención.</p>
              </div>
            ) : (
              notifications.map((n, i) => {
                const evStyle = getEventStyle(n.event);
                const isLast = i === notifications.length - 1;
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`relative flex items-start gap-3.5 px-5 py-4 cursor-pointer transition-all duration-150 ${isLast ? "" : "border-b border-gray-50/80"} ${n.read ? "bg-transparent hover:bg-gray-50/50" : "bg-blue-50/30 hover:bg-blue-50/60"}`}
                  >
                    {/* Read indicator line */}
                    {!n.read && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary to-blue-400" />}

                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${evStyle.color} ${n.read ? "opacity-70" : ""}`}>
                      {evStyle.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className={`text-sm leading-snug ${n.read ? "text-gray " : "text-dark font-medium"}`}>
                        {n.message}
                      </p>
                      <p className="text-[11px] text-gray mt-1.5 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${n.read ? "bg-gray-200" : "bg-primary"}`} />
                        {formatNotifDate(n.created_at)}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {!n.read && (
                      <div className="flex items-center pt-1">
                        <span className="w-2 h-2 rounded-full bg-gradient-to-br from-primary to-blue-400 shadow-sm shadow-blue-200" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="relative px-5 py-3.5 border-t border-gray-100/80 bg-gradient-to-b from-gray-50/50 to-transparent text-center">
              <button
                onClick={() => setOpen(false)}
                className="text-xs font-medium text-primary hover:text-primary-dark transition-colors inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Ver en el dashboard
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
