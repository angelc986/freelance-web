"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// ═══════════════════════════════════════════════════════ TYPES

interface User { id: number; email: string; phone: string; full_name: string; cedula: string; role: string; is_admin: boolean; is_active: boolean; balance: number; rating_avg: number; wallet_address: string | null; created_at: string | null; }
interface Stats { total_users: number; total_workers: number; total_contractors: number; total_jobs: number; active_jobs: number; disputed_jobs: number; completed_jobs: number; total_transactions: number; total_volume_usdt: number; }
interface Analytics { user_growth: { date: string; count: number }[]; job_trends: any[]; revenue_timeline: any[]; top_workers: { id: number; name: string; earnings: number; jobs: number; rating: number }[]; rating_distribution: Record<string, number>; new_users_today: number; active_users_today: number; growth_rate: number; }
interface UserDetail { user: User; stats: { total_earned: number; total_spent: number; jobs_posted: number; jobs_completed: number; jobs_assigned: number; ratings_count: number; }; jobs_as_client: any[]; jobs_as_worker: any[]; transactions: any[]; ratings: any[]; }
interface Job { id: number; title: string; status: string; budget: number; client_id: number; worker_id: number; dispute_reason?: string; location?: string; category?: string; created_at: string | null; }
interface Tx { id: number; user_id: number; job_id: number | null; type: string; amount: number; network?: string; tx_hash?: string; status: string; created_at: string | null; }
interface Dispute { id: number; title: string; budget: number; client_id: number; worker_id: number; dispute_reason: string; created_at: string | null; }
interface WalletInfo { system_wallet: string; balance: number; total_deposits: number; total_withdrawals: number; pending_confirmation: number; }

// ═══════════════════════════════════════════════════════ API

const API = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
async function adm<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API}/admin${path}`, { ...init, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers } });
  if (!res.ok) throw new Error(((await res.json().catch(() => ({}))).detail) || `Error ${res.status}`);
  return res.json();
}

// ═══════════════════════════════════════════════════════ ICONS

function Svg({ d, className = "w-[18px] h-[18px]" }: { d: string; className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
}
const I = {
  Dashboard: () => <Svg d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />,
  Users: () => <Svg d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />,
  Briefcase: () => <Svg d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />,
  Dollar: () => <Svg d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  AlertCircle: () => <Svg d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />,
  Wallet: () => <Svg d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />,
  Shield: () => <Svg d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />,
  Chart: () => <Svg d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />,
  TrendingUp: () => <Svg d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />,
  Refresh: () => <Svg d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />,
  Search: () => <Svg d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" className="w-4 h-4" />,
  Menu: () => <Svg d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" className="w-5 h-5" />,
  X: () => <Svg d="M6 18L18 6M6 6l12 12" className="w-4 h-4" />,
  Check: () => <Svg d="M4.5 12.75l6 6 9-13.5" className="w-4 h-4" />,
  LogOut: () => <Svg d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />,
};

// ═══════════════════════════════════════════════════════ COMPONENTS

function Badge({ label, color }: { label: string; color: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${color}`}>{label}</span>;
}

function Avatar({ name }: { name: string }) {
  return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{name.charAt(0).toUpperCase()}</div>;
}

function Pulse({ active }: { active: boolean }) {
  return <span className={`flex h-2 w-2 ${active ? "bg-emerald-400" : "bg-gray-500"}`}>
    <span className={`animate-ping absolute inline-flex h-2 w-2 rounded-full ${active ? "bg-emerald-400" : ""} opacity-75`} />
  </span>;
}

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-right-2 fade-in">
    <div className={`px-5 py-3 rounded-2xl shadow-2xl border text-sm flex items-center gap-3 backdrop-blur-xl ${type === "success" ? "bg-emerald-900/80 border-emerald-500/30 text-emerald-200" : "bg-red-900/80 border-red-500/30 text-red-200"}`}>
      {type === "success" ? <I.Check /> : <I.X />}{msg}<button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><I.X /></button>
    </div>
  </div>;
}

function KpiCard({ label, value, icon, trend, color, fmt }: { label: string; value: number | string; icon: React.ReactNode; trend?: string; color: string; fmt?: "curr" }) {
  const d = fmt === "curr" ? `$${(typeof value === "number" ? value : 0).toLocaleString()}` : typeof value === "number" ? value.toLocaleString() : value;
  return <div className="group bg-[#111118] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.12] transition-all">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>{icon}</div>
      {trend && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><I.TrendingUp />{trend}</span>}
    </div>
    <p className="text-2xl font-bold text-white tracking-tight font-mono">{d}</p>
    <p className="text-xs text-gray-500 mt-1">{label}</p>
  </div>;
}

// ─── MINI AREA CHART ─────────────────────────────────
function MiniChart({ data, color = "#3b82f6", h = 40, w = 200 }: { data: { date: string; count: number }[]; color?: string; h?: number; w?: number }) {
  if (!data || data.length < 2) return <div className="text-xs text-gray-600">Insufficient data</div>;
  const max = Math.max(...data.map(d => d.count), 1);
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - (d.count / max) * h}`).join(" ");
  const area = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - (d.count / max) * h}`).join(" ") + ` ${w},${h} 0,${h}`;
  return <svg width={w} height={h} className="w-full">
    <defs><linearGradient id={`g-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
    <polygon fill={`url(#g-${color.replace("#","")})`} points={area} />
    <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
  </svg>;
}

// ─── BAR CHART ───────────────────────────────────────
function BarChart({ data, color = "#3b82f6", h = 100 }: { data: Record<string, number>; color?: string; h?: number }) {
  const entries = Object.entries(data).sort(([a], [b]) => Number(a) - Number(b));
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return <div className="flex items-end gap-3 justify-center" style={{ height: h }}>
    {entries.map(([k, v]) => <div key={k} className="flex flex-col items-center gap-1">
      <div className="w-8 rounded-t-md transition-all duration-500 hover:opacity-80" style={{ height: `${(v / max) * (h - 20)}px`, backgroundColor: color }} />
      <span className="text-[10px] text-gray-500">{k}★</span>
      <span className="text-[10px] text-white font-mono">{v}</span>
    </div>)}
  </div>;
}

// ─── USER PROFILE MODAL ─────────────────────────────
function UserModal({ userId, onClose, onToast }: { userId: number; onClose: () => void; onToast: (msg: string, type: "success" | "error") => void; }) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [tab, setTab] = useState<"overview" | "jobs" | "ratings">("overview");

  useEffect(() => { adm<UserDetail>(`/users/${userId}/full`).then(setDetail).catch(e => onToast(e.message, "error")); }, [userId]);

  async function toggleStatus() {
    if (!detail) return;
    try {
      await adm(`/users/${userId}/status?is_active=${!detail.user.is_active}`, { method: "PATCH" });
      setDetail({ ...detail, user: { ...detail.user, is_active: !detail.user.is_active } });
      onToast(`User ${detail.user.is_active ? "suspended" : "activated"}`, "success");
    } catch (e: any) { onToast(e.message, "error"); }
  }

  if (!detail) return <ModalShell title="Loading..." onClose={onClose}><div className="flex items-center justify-center py-16"><div className="w-10 h-10 border-2 border-blue-500/50 border-t-blue-500 rounded-full animate-spin" /></div></ModalShell>;

  const { user, stats } = detail;
  const roleColor = "from-slate-800 to-gray-900";

  return <ModalShell title="" onClose={onClose}>
    {/* ═══ HERO HEADER ═══ */}
    <div className={`relative -mx-6 -mt-6 px-6 pt-12 pb-8 mb-6 bg-gradient-to-br ${roleColor} overflow-hidden`}>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      <div className="relative flex items-end gap-5">
        <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white text-4xl font-bold shadow-2xl flex-shrink-0">
          {user.full_name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0 pb-1">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white drop-shadow-sm">{user.full_name}</h2>
              <p className="text-sm text-white/70 mt-0.5">{user.email}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm border border-white/20`}>
                {user.is_admin ? "Admin" : user.role}
              </span>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${user.is_active ? "bg-white/10 text-gray-300 border border-white/20" : "bg-yellow-500/15 text-yellow-300/70 border border-yellow-500/20"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-gray-400" : "bg-yellow-400"}`} />
                {user.is_active ? "Active" : "Suspended"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/></svg>
              {user.phone || "—"}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"/></svg>
              {user.cedula || "—"}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Joined {user.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>

    {/* ═══ ADMIN ACTIONS ═══ */}
    <div className="flex items-center gap-3 mb-6 px-1">
      <button onClick={toggleStatus} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${user.is_active ? "bg-red-500/8 text-red-400/70 border-red-500/15 hover:bg-red-500/15 hover:border-red-500/30" : "bg-emerald-500/8 text-emerald-400/70 border-emerald-500/15 hover:bg-emerald-500/15 hover:border-emerald-500/30"}`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          {user.is_active 
            ? <><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></>
            : <><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></>
          }
        </svg>
        {user.is_active ? "Suspend Account" : "Reactivate Account"}
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>Rating:</span>
        <span className="flex items-center gap-0.5">{[1,2,3,4,5].map(s => <span key={s} className={`text-sm ${s <= Math.round(user.rating_avg) ? "text-amber-400" : "text-gray-600"}`}>★</span>)}</span>
        <span className="text-white font-medium ml-1">{user.rating_avg.toFixed(1)}</span>
      </div>
    </div>

    {/* ═══ STATS CARDS ═══ */}
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        { label: "Total Earned", value: `$${stats.total_earned.toFixed(2)}`, color: "text-emerald-400/80", bg: "bg-emerald-500/6", icon: "💰" },
        { label: "Total Spent", value: `$${stats.total_spent.toFixed(2)}`, color: "text-blue-400/80", bg: "bg-blue-500/6", icon: "💳" },
        { label: "Wallet Balance", value: `$${user.balance.toFixed(2)}`, color: "text-white/80", bg: "bg-white/[0.03]", icon: "👛" },
        { label: "Jobs Posted", value: stats.jobs_posted.toString(), color: "text-violet-400/80", bg: "bg-violet-500/6", icon: "📋" },
        { label: "Jobs Completed", value: stats.jobs_completed.toString(), color: "text-amber-400/80", bg: "bg-amber-500/6", icon: "✅" },
        { label: "Ratings Received", value: stats.ratings_count.toString(), color: "text-rose-400/80", bg: "bg-rose-500/6", icon: "⭐" },
      ].map(stat => (
        <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border border-white/[0.04] hover:border-white/[0.08] transition-all group`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg">{stat.icon}</span>
          </div>
          <p className={`text-lg font-bold font-mono ${stat.color} group-hover:scale-105 transition-transform`}>{stat.value}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>

    {/* ═══ CONTACT INFO CARD ═══ */}
    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 mb-6">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Information</h4>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2"><span className="text-gray-500 text-xs w-16">Email</span><span className="text-white truncate">{user.email}</span></div>
        <div className="flex items-center gap-2"><span className="text-gray-500 text-xs w-16">Phone</span><span className="text-white">{user.phone || "—"}</span></div>
        <div className="flex items-center gap-2"><span className="text-gray-500 text-xs w-16">Cedula</span><span className="text-white">{user.cedula || "—"}</span></div>
        <div className="flex items-center gap-2"><span className="text-gray-500 text-xs w-16">Wallet</span><span className="text-white font-mono text-xs truncate">{user.wallet_address || "—"}</span></div>
      </div>
    </div>

    {/* ═══ TABS ═══ */}
    <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 mb-4">
      {([
        { key: "overview" as const, label: "Activity", icon: "📊" },
        { key: "jobs" as const, label: "Jobs", icon: "💼" },
        { key: "ratings" as const, label: "Reviews", icon: "⭐" },
      ]).map(t => (
        <button key={t.key} onClick={() => setTab(t.key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.key ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-500 hover:text-white"}`}>
          <span>{t.icon}</span>{t.label}
        </button>
      ))}
    </div>

    {/* ─── OVERVIEW TAB ─── */}
    {tab === "overview" && (
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Transactions</h5>
        {detail.transactions.slice(0, 5).map((t: any) => (
          <div key={t.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/[0.02] transition-colors border-b border-white/[0.04] last:border-0">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${
                t.type === "deposit" ? "bg-emerald-500/10 text-emerald-400" : t.type === "withdraw" ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
              }`}>
                {t.type === "deposit" ? "↓" : t.type === "withdraw" ? "↑" : "↔"}
              </div>
              <div>
                <p className="text-sm text-white capitalize font-medium">{t.type}</p>
                <p className="text-xs text-gray-500">{t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-mono font-semibold ${t.type === "deposit" ? "text-emerald-400" : t.type === "withdraw" ? "text-red-400" : "text-white"}`}>
                {t.type === "deposit" ? "+" : t.type === "withdraw" ? "-" : ""}${t.amount?.toFixed(2)}
              </p>
              <Badge label={t.status?.replace("_", " ")} color={t.status === "confirmed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"} />
            </div>
          </div>
        ))}
        {detail.transactions.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No transactions yet</p>}
      </div>
    )}

    {/* ─── JOBS TAB ─── */}
    {tab === "jobs" && (
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {detail.jobs_as_worker.length === 0 && detail.jobs_as_client.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No jobs yet</p>
        )}
        {detail.jobs_as_worker.map((j: any) => (
          <div key={j.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/[0.02] transition-colors border border-white/[0.04] mb-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 rounded-full bg-teal-500" />
              <div>
                <p className="text-sm text-white font-medium">{j.title}</p>
                <p className="text-xs text-gray-500">Worker · {j.category || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-white font-medium">${j.budget}</span>
              <Badge label={j.status} color={j.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/[0.04] text-gray-400 border-white/[0.08]"} />
            </div>
          </div>
        ))}
        {detail.jobs_as_client.map((j: any) => (
          <div key={j.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/[0.02] transition-colors border border-white/[0.04] mb-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 rounded-full bg-blue-500" />
              <div>
                <p className="text-sm text-white font-medium">{j.title}</p>
                <p className="text-xs text-gray-500">Client · {j.category || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-white font-medium">${j.budget}</span>
              <Badge label={j.status} color="bg-white/[0.04] text-gray-400 border-white/[0.08]" />
            </div>
          </div>
        ))}
      </div>
    )}

    {/* ─── RATINGS TAB ─── */}
    {tab === "ratings" && (
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {detail.ratings.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>
            </div>
            <p className="text-sm text-gray-400">No reviews yet</p>
            <p className="text-xs text-gray-600 mt-1">Ratings will appear once jobs are completed</p>
          </div>
        ) : (
          detail.ratings.map((r: any) => (
            <div key={r.id} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 hover:border-white/[0.08] transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} className={`w-4 h-4 ${s <= r.rating ? "text-amber-400" : "text-gray-600"}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
                    </svg>
                  ))}
                  <span className="text-sm text-white font-medium ml-1">{r.rating.toFixed(1)}</span>
                </div>
                <span className="text-[10px] text-gray-600">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}</span>
              </div>
              {r.comment && (
                <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.04]">
                  <p className="text-sm text-gray-300 italic">&ldquo;{r.comment}&rdquo;</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    )}
  </ModalShell>;
}

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" onClick={onClose}>
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-[#16161f] border border-white/[0.08] rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar" onClick={e => e.stopPropagation()}>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">{title}</h3>
        <button onClick={onClose} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all"><I.X /></button>
      </div>
      {children}
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════ MAIN PAGE

type Section = "overview" | "users" | "jobs" | "transactions" | "disputes" | "wallet" | "analytics";
const NAV: { key: Section; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <I.Dashboard /> },
  { key: "analytics", label: "Analytics", icon: <I.Chart /> },
  { key: "users", label: "Users", icon: <I.Users /> },
  { key: "jobs", label: "Jobs", icon: <I.Briefcase /> },
  { key: "transactions", label: "Transactions", icon: <I.Dollar /> },
  { key: "disputes", label: "Disputes", icon: <I.AlertCircle /> },
  { key: "wallet", label: "Wallet", icon: <I.Wallet /> },
];

export default function AdminPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const refreshRef = useRef(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const [txFilter, setTxFilter] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [s, u, j, t, d, w, a] = await Promise.all([
        adm<Stats>("/stats"),
        adm<{ users: User[]; total: number }>("/users?per_page=200").catch(() => ({ users: [], total: 0 })),
        adm<{ jobs: Job[] }>("/jobs?per_page=200").catch(() => ({ jobs: [] })),
        adm<{ transactions: Tx[] }>("/transactions?per_page=200").catch(() => ({ transactions: [] })),
        adm<{ disputes: Dispute[] }>("/disputes?per_page=200").catch(() => ({ disputes: [] })),
        adm<WalletInfo>("/wallet").catch(() => null),
        adm<Analytics>("/analytics").catch(() => null),
      ]);
      setStats(s); setUsers(u.users); setUsersTotal(u.total);
      setJobs(j.jobs); setTxs(t.transactions); setDisputes(d.disputes);
      setWallet(w); setAnalytics(a);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (user?.is_admin) { loadData(); const iv = setInterval(loadData, 30000); return () => clearInterval(iv); } }, [user]);

  const toastFn = (msg: string, type: "success" | "error") => setToast({ msg, type });

  async function toggleUserStatus(id: number, active: boolean) {
    try { await adm(`/users/${id}/status?is_active=${active}`, { method: "PATCH" }); setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: active } : u)); toastFn(`User ${active ? "activated" : "suspended"}`, "success"); }
    catch (e: any) { toastFn(e.message, "error"); }
  }

  async function resolveDispute(jobId: number, resolution: string) {
    try { await adm(`/disputes/${jobId}/resolve?resolution=${resolution}`, { method: "POST" }); setDisputes(prev => prev.filter(d => d.id !== jobId)); toastFn(`Dispute resolved: ${resolution}`, "success"); loadData(); }
    catch (e: any) { toastFn(e.message, "error"); }
  }
  async function requestRefund(jobId: number) {
    try { await adm(`/refund/${jobId}`, { method: "POST" }); toastFn("Refund processed", "success"); loadData(); }
    catch (e: any) { toastFn(e.message, "error"); }
  }

  if (authLoading) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-blue-500/50 border-t-blue-500 rounded-full animate-spin" />
  </div>;

  if (!user || !user.is_admin) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
    <div className="text-gray-500">Access Denied</div>
  </div>;

  if (loading && !stats) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-blue-500/50 border-t-blue-500 rounded-full animate-spin" />
  </div>;

  return <div className="min-h-screen bg-[#0a0a0f] text-white">
    {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    {selectedUserId && <UserModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} onToast={toastFn} />}

    {/* MOBILE TOGGLE */}
    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="fixed top-4 left-4 z-[9997] lg:hidden p-2 rounded-xl bg-[#111118] border border-white/[0.06]"><I.Menu /></button>

    {/* SIDEBAR */}
    <aside className={`fixed inset-y-0 left-0 z-[9996] w-64 bg-[#0d0d15] border-r border-white/[0.04] transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/[0.04]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/20">A</div>
        <div><p className="text-white font-bold text-sm tracking-tight">Admin Console</p><p className="text-[10px] text-gray-500">TurnoGO</p></div>
      </div>
      <nav className="p-3 space-y-1">
        {NAV.map(({ key, label, icon }) => (
          <button key={key} onClick={() => { setSection(key); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${section === key ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "text-gray-500 hover:text-white hover:bg-white/[0.04] border border-transparent"}`}>
            {icon}<span>{label}</span>
            {key === "disputes" && disputes.length > 0 && <span className="ml-auto px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-medium border border-red-500/20">{disputes.length}</span>}
          </button>
        ))}
      </nav>
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-3 px-3 py-2"><Avatar name={user.full_name} /><div className="flex-1 min-w-0"><p className="text-xs font-medium text-white truncate">{user.full_name}</p><p className="text-[10px] text-gray-500">Administrator</p></div></div>
        <button onClick={logout} className="w-full mt-1 flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/[0.04] transition-all"><I.LogOut /><span>Sign Out</span></button>
      </div>
    </aside>
    {sidebarOpen && <div className="fixed inset-0 z-[9995] bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

    {/* MAIN */}
    <main className="lg:pl-64 min-h-screen">
      <header className="sticky top-0 z-50 h-16 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.04] flex items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-white capitalize tracking-tight">{section === "analytics" ? "Analytics" : section}</h1>
          <div className="h-4 w-px bg-white/[0.06]" />
          <span className="text-xs text-gray-500">{stats?.total_users ?? 0} users · {stats?.total_jobs ?? 0} jobs</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-emerald-400"><span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" /></span>Live · 30s</div>
          <button onClick={loadData} className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/[0.04] transition-all"><I.Refresh /></button>
        </div>
      </header>

      <div className="p-6 lg:p-8">

        {/* ═══ OVERVIEW ═══ */}
        {section === "overview" && stats && <>
          <div className="mb-6"><h2 className="text-xl font-bold text-white">Platform Overview</h2><p className="text-sm text-gray-500 mt-1">Real-time metrics · Auto-refreshes every 30 seconds</p></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label="Total Users" value={stats.total_users} color="bg-blue-500/10 text-blue-400" icon={<I.Users />} trend={`${((stats.total_workers / Math.max(stats.total_users, 1)) * 100).toFixed(0)}% workers`} />
            <KpiCard label="Active Jobs" value={stats.active_jobs} color="bg-emerald-500/10 text-emerald-400" icon={<I.Briefcase />} />
            <KpiCard label="Volume (USDT)" value={stats.total_volume_usdt} color="bg-violet-500/10 text-violet-400" icon={<I.Dollar />} fmt="curr" />
            <KpiCard label="Transactions" value={stats.total_transactions} color="bg-amber-500/10 text-amber-400" icon={<I.Wallet />} />
          </div>
          <div className="grid lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Job Distribution</h3>
              <div className="space-y-3">
                {[
                  { l: "Active", v: stats.active_jobs, m: stats.total_jobs, c: "bg-blue-500" },
                  { l: "Completed", v: stats.completed_jobs, m: stats.total_jobs, c: "bg-emerald-500" },
                  { l: "Disputed", v: stats.disputed_jobs, m: stats.total_jobs, c: "bg-red-500" },
                ].map(({ l, v, m, c }) => (
                  <div key={l} className="flex items-center gap-3"><span className="text-xs text-gray-400 w-20">{l}</span><div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden"><div className={`h-full rounded-full ${c}`} style={{ width: `${m > 0 ? (v / m) * 100 : 0}%` }} /></div><span className="text-xs font-mono text-white w-8 text-right">{v}</span></div>
                ))}
              </div>
            </div>
            <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">User Growth (30d)</h3>
              {analytics?.user_growth ? <MiniChart data={analytics.user_growth} h={60} /> : <div className="h-[60px] flex items-center justify-center"><span className="text-xs text-gray-600">No data</span></div>}
              <div className="flex items-center justify-between mt-3 text-xs">
                <span className="text-gray-500">New today: <strong className="text-white">{analytics?.new_users_today ?? 0}</strong></span>
                <span className={`${(analytics?.growth_rate ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>{analytics?.growth_rate ?? 0}% growth</span>
              </div>
            </div>
            <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Rating Distribution</h3>
              {analytics?.rating_distribution ? <BarChart data={analytics.rating_distribution} /> : <div className="h-[100px] flex items-center justify-center"><span className="text-xs text-gray-600">No data</span></div>}
            </div>
          </div>
          <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-white">Recent Users</h3><button onClick={() => setSection("users")} className="text-xs text-blue-400 hover:text-blue-300">View all</button></div>
            <div className="grid lg:grid-cols-2 gap-2">
              {users.slice(0, 6).map(u => (
                <button key={u.id} onClick={() => setSelectedUserId(u.id)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors text-left">
                  <Avatar name={u.full_name} />
                  <div className="flex-1 min-w-0"><p className="text-sm text-white truncate">{u.full_name}</p><p className="text-xs text-gray-500 truncate">{u.email}</p></div>
                  <Badge label={u.role} color="bg-white/[0.04] text-gray-400 border-white/[0.08]" />
                </button>
              ))}
            </div>
          </div>
        </>}

        {/* ═══ ANALYTICS ═══ */}
        {section === "analytics" && analytics && <>
          <div className="mb-6"><h2 className="text-xl font-bold text-white">Advanced Analytics</h2><p className="text-sm text-gray-500 mt-1">Growth metrics, trends, and platform performance</p></div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label="New Users Today" value={analytics.new_users_today} color="bg-blue-500/10 text-blue-400" icon={<I.Users />} trend={`${analytics.growth_rate}%`} />
            <KpiCard label="Active Today" value={analytics.active_users_today} color="bg-emerald-500/10 text-emerald-400" icon={<I.TrendingUp />} />
            <KpiCard label="Growth Rate" value={`${analytics.growth_rate}%`} color="bg-violet-500/10 text-violet-400" icon={<I.Chart />} />
            <KpiCard label="Total Jobs" value={stats?.total_jobs ?? 0} color="bg-amber-500/10 text-amber-400" icon={<I.Briefcase />} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-white">User Growth (30 days)</h3><span className="text-xs text-gray-500">Daily signups</span></div>
              <div className="h-48 flex items-end">
                {analytics.user_growth.length > 0 ? <MiniChart data={analytics.user_growth} h={160} w={600} /> : <div className="w-full text-center text-xs text-gray-600">No data yet</div>}
              </div>
            </div>
            <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-white">Revenue Timeline (30 days)</h3><span className="text-xs text-gray-500">Deposits vs withdrawals</span></div>
              {analytics.revenue_timeline.length > 0 ? (
                <div className="space-y-2">
                  {analytics.revenue_timeline.slice(-10).map(r => (
                    <div key={r.date} className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500 w-24">{r.date}</span>
                      <div className="flex-1 h-3 bg-white/[0.04] rounded-full overflow-hidden flex">
                        <div className="h-full bg-emerald-500/60 rounded-l-full" style={{ width: `${(r.deposits / Math.max(r.deposits + r.withdrawals, 1)) * 100}%` }} />
                        <div className="h-full bg-red-500/60 rounded-r-full" style={{ width: `${(r.withdrawals / Math.max(r.deposits + r.withdrawals, 1)) * 100}%` }} />
                      </div>
                      <span className="text-emerald-400 font-mono w-16 text-right">+${r.deposits}</span>
                      <span className="text-red-400 font-mono w-16 text-right">-${r.withdrawals}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="h-24 flex items-center justify-center text-xs text-gray-600">No transactions yet</div>}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Top Workers by Earnings</h3>
              {analytics.top_workers.length > 0 ? (
                <div className="space-y-2">
                  {analytics.top_workers.map((w, i) => (
                    <div key={w.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                      <span className="w-5 text-xs font-bold text-gray-500">#{i + 1}</span>
                      <Avatar name={w.name} />
                      <div className="flex-1 min-w-0"><p className="text-sm text-white truncate">{w.name}</p><p className="text-xs text-gray-500">{w.jobs} jobs · ⭐ {w.rating}</p></div>
                      <span className="text-sm font-bold text-emerald-400 font-mono">${w.earnings.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="h-24 flex items-center justify-center text-xs text-gray-600">No workers with earnings yet</div>}
            </div>
            <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Rating Distribution</h3>
              {analytics.rating_distribution ? (
                <BarChart data={analytics.rating_distribution} color="#f59e0b" h={160} />
              ) : <div className="h-24 flex items-center justify-center text-xs text-gray-600">No ratings yet</div>}
            </div>
          </div>
        </>}

        {/* ═══ USERS ═══ */}
        {section === "users" && <>
          <div className="flex items-center justify-between mb-6">
            <div><h2 className="text-xl font-bold text-white">User Management</h2><p className="text-sm text-gray-500 mt-1">{usersTotal} registered · Click a user for full profile</p></div>
            <div className="flex items-center gap-3">
              <div className="relative"><I.Search /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-48 lg:w-64 pl-9 pr-3 py-2 bg-[#111118] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-500 focus:border-blue-500/30 outline-none" /></div>
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-[#111118] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white outline-none"><option value="">All</option><option value="worker">Worker</option><option value="contractor">Contractor</option><option value="both">Both</option></select>
            </div>
          </div>
          <div className="bg-[#111118] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/[0.04]">
                  {["User", "Role", "Balance", "Rating", "Status", "Actions"].map(h => <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wider">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {users.filter(u => roleFilter ? u.role === roleFilter : true).filter(u => search ? u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.includes(search) : true).map(u => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setSelectedUserId(u.id)}>
                      <td className="px-5 py-3"><div className="flex items-center gap-3"><Avatar name={u.full_name} /><div><p className="text-sm text-white">{u.full_name}</p><p className="text-xs text-gray-500">{u.email}</p></div></div></td>
                      <td className="px-5 py-3"><Badge label={u.is_admin ? "Admin" : u.role} color={u.is_admin ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-white/[0.04] text-gray-400 border-white/[0.08]"}/></td>
                      <td className="px-5 py-3 font-mono text-sm text-white">${u.balance.toFixed(2)}</td>
                      <td className="px-5 py-3"><div className="flex items-center gap-1.5"><span className="text-amber-400 text-xs">★</span><span className="text-sm text-white">{u.rating_avg.toFixed(1)}</span></div></td>
                      <td className="px-5 py-3"><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-red-500"}`} /><span className="text-xs text-gray-400">{u.is_active ? "Active" : "Suspended"}</span></div></td>
                      <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {!u.is_admin && <button onClick={() => toggleUserStatus(u.id, !u.is_active)} className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${u.is_active ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"}`}>
                            {u.is_active ? "Suspend" : "Activate"}
                          </button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>}

        {/* ═══ JOBS ═══ */}
        {section === "jobs" && <>
          <div className="flex items-center justify-between mb-6">
            <div><h2 className="text-xl font-bold text-white">Jobs</h2><p className="text-sm text-gray-500 mt-1">{jobs.length} total</p></div>
            <div className="flex gap-2 flex-wrap">{["", "open", "in_progress", "completed", "disputed", "cancelled"].map(f => <button key={f} onClick={() => setJobFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${jobFilter === f ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-transparent text-gray-500 border-white/[0.06] hover:text-white"}`}>{f || "All"}</button>)}</div>
          </div>
          <div className="space-y-2">
            {jobs.filter(j => jobFilter ? j.status === jobFilter : true).map(j => (
              <div key={j.id} className="bg-[#111118] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.12] transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${j.status === "completed" ? "bg-emerald-500" : j.status === "disputed" ? "bg-red-500" : j.status === "in_progress" || j.status === "checked_in" ? "bg-blue-500" : j.status === "cancelled" ? "bg-gray-500" : "bg-amber-500"}`} />
                    <div className="min-w-0"><p className="text-sm text-white font-medium truncate">{j.title}</p><p className="text-xs text-gray-500">Job #{j.id} · {j.category || "—"} · {j.location || "—"}</p></div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0"><span className="text-sm font-mono text-white font-medium">${j.budget.toFixed(2)}</span><Badge label={j.status.replace("_", " ")} color={j.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : j.status === "disputed" ? "bg-red-500/10 text-red-400 border-red-500/20" : j.status === "in_progress" || j.status === "checked_in" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-white/[0.04] text-gray-400 border-white/[0.08]"}/></div>
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* ═══ TRANSACTIONS ═══ */}
        {section === "transactions" && <>
          <div className="flex items-center justify-between mb-6">
            <div><h2 className="text-xl font-bold text-white">Transaction Log</h2><p className="text-sm text-gray-500 mt-1">{txs.length} total · ${(stats?.total_volume_usdt || 0).toLocaleString()} volume</p></div>
            <select value={txFilter} onChange={e => setTxFilter(e.target.value)} className="bg-[#111118] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white outline-none"><option value="">All</option><option value="confirmed">Confirmed</option><option value="pending">Pending</option><option value="pending_confirmation">Awaiting</option><option value="failed">Failed</option></select>
          </div>
          <div className="bg-[#111118] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/[0.04]">
                  {["ID", "Type", "Amount", "Status", "Date", "TX Hash"].map(h => <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wider">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {txs.filter(t => txFilter ? t.status === txFilter : true).map(t => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 text-xs text-gray-400 font-mono">#{t.id}</td>
                      <td className="px-5 py-3"><Badge label={t.type} color={t.type === "deposit" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : t.type === "withdraw" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}/></td>
                      <td className="px-5 py-3 font-mono text-sm text-white">${t.amount.toFixed(2)}</td>
                      <td className="px-5 py-3"><Badge label={t.status.replace("_", " ")} color={t.status === "confirmed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : t.status === "failed" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}/></td>
                      <td className="px-5 py-3 text-xs text-gray-400">{t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}</td>
                      <td className="px-5 py-3 text-xs text-gray-600 font-mono">{t.tx_hash ? `${t.tx_hash.slice(0, 10)}...` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>}

        {/* ═══ DISPUTES ═══ */}
        {section === "disputes" && <>
          <div className="mb-6"><h2 className="text-xl font-bold text-white">Dispute Resolution</h2><p className="text-sm text-gray-500 mt-1">{disputes.length} open disputes</p></div>
          {disputes.length === 0 ? (
            <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center"><I.Check /></div>
              <h3 className="text-white font-semibold mb-1">All Clear</h3><p className="text-sm text-gray-500">No disputes at the moment.</p>
            </div>
          ) : <div className="space-y-3">{disputes.map(d => (
            <div key={d.id} className="bg-[#111118] border border-red-500/10 rounded-2xl p-5 hover:border-red-500/20 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse mt-1 flex-shrink-0" />
                  <div><h4 className="text-white font-medium">{d.title}</h4><p className="text-xs text-gray-500 mt-1">Job #{d.id}</p></div>
                </div>
                <span className="text-lg font-bold text-red-400 font-mono">${d.budget.toFixed(2)}</span>
              </div>
              {d.dispute_reason && <div className="p-4 bg-red-500/[0.03] border border-red-500/10 rounded-xl mb-4"><p className="text-xs text-gray-500 mb-1">Reason:</p><p className="text-sm text-gray-300">{d.dispute_reason}</p></div>}
              <div className="flex gap-3">
                <button onClick={() => resolveDispute(d.id, "approve")} className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">Approve (Pay</button>
                <button onClick={() => resolveDispute(d.id, "refund")} className="px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20 hover:bg-blue-500/20 transition-colors">Refund</button>
                <button onClick={() => resolveDispute(d.id, "cancel")} className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20 hover:bg-red-500/20 transition-colors">Cancel</button>
              </div>
            </div>
          ))}</div>}
        </>}

        {/* ═══ WALLET ═══ */}
        {section === "wallet" && wallet && <>
          <div className="mb-6"><h2 className="text-xl font-bold text-white">System Wallet</h2><p className="text-sm text-gray-500 mt-1">Polygon Amoy Testnet</p></div>
          <div className="grid lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-1 bg-[#111118] border border-white/[0.06] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-400 flex items-center justify-center"><I.Wallet /></div><div><h3 className="text-white font-semibold text-sm">Balance</h3><p className="text-[10px] text-gray-500">Available USDT</p></div></div>
              <p className="text-4xl font-bold text-white font-mono">${wallet.balance.toFixed(2)}</p>
              <div className="h-px bg-white/[0.04] my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-gray-400">Deposits</span><span className="text-emerald-400 font-mono">+${wallet.total_deposits.toFixed(2)}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-400">Withdrawals</span><span className="text-red-400 font-mono">-${wallet.total_withdrawals.toFixed(2)}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-400">Pending</span><span className="text-amber-400 font-mono">{wallet.pending_confirmation}</span></div>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Address</h3>
                <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3">
                  <code className="text-xs text-gray-300 font-mono flex-1 truncate">{wallet.system_wallet}</code>
                  <button onClick={() => { navigator.clipboard.writeText(wallet.system_wallet); toastFn("Copied", "success"); }} className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20 hover:bg-blue-500/20 transition-colors">Copy</button>
                </div>
              </div>
              <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-white">Recent</h3><button onClick={() => setSection("transactions")} className="text-xs text-blue-400 hover:text-blue-300">All</button></div>
                <div className="space-y-2">{txs.slice(0, 5).map(t => <div key={t.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${t.type === "deposit" ? "bg-emerald-500/10 text-emerald-400" : t.type === "withdraw" ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"}`}>{t.type === "deposit" ? "↓" : t.type === "withdraw" ? "↑" : "↔"}</div><div><p className="text-sm text-white capitalize">{t.type}</p><p className="text-xs text-gray-500">{t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}</p></div></div>
                  <div className="text-right"><p className={`text-sm font-mono font-medium ${t.type === "deposit" ? "text-emerald-400" : t.type === "withdraw" ? "text-red-400" : "text-white"}`}>{t.type === "deposit" ? "+" : t.type === "withdraw" ? "-" : ""}${t.amount.toFixed(2)}</p><Badge label={t.status} color={t.status === "confirmed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}/></div>
                </div>)}</div>
              </div>
            </div>
          </div>
        </>}

      </div>
    </main>
  </div>;
}
