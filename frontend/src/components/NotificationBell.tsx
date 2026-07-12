"use client";

import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import Link from "next/link";

const eventIcons: Record<string, string> = {
  job_applied: "📋",
  job_accepted: "✅",
  job_completed: "🎉",
  job_disputed: "⚠️",
  job_cancelled: "❌",
  job_review_pending: "👀",
};

function getIcon(event: string) {
  return eventIcons[event] || "🔔";
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/[0.04] transition-all"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] min-h-[18px]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-gray-500"}`} />

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#16161f] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-[9999]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
            <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <>
                  <button onClick={markAllRead} className="text-xs text-blue-400 hover:text-blue-300">Leer todo</button>
                  <span className="text-gray-600">·</span>
                  <button onClick={clear} className="text-xs text-gray-500 hover:text-gray-300">Limpiar</button>
                </>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-white/[0.03] flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                </div>
                <p className="text-sm text-gray-500">Sin notificaciones</p>
                <p className="text-xs text-gray-600 mt-1">Te avisaremos cuando pase algo</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] ${n.read ? "" : "bg-blue-500/[0.03]"}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${n.read ? "bg-white/[0.03]" : "bg-blue-500/10"}`}>
                    {getIcon(n.event)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.read ? "text-gray-400" : "text-white"} leading-snug`}>{n.message}</p>
                    <p className="text-[10px] text-gray-600 mt-1">
                      {new Date(n.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-white/[0.04] text-center">
              <Link href="/dashboard" className="text-xs text-blue-400 hover:text-blue-300" onClick={() => setOpen(false)}>
                Ir al dashboard
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
