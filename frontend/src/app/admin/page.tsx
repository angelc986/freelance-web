"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

/* ═══════════════════════════════════════ TYPES ═══════════════════════════════════════ */

interface KpiStats {
  total_users: number; total_workers: number; total_contractors: number;
  total_jobs: number; active_jobs: number; disputed_jobs: number;
  completed_jobs: number; total_transactions: number; total_volume_usdt: number;
}

interface AdminUser {
  id: number; email: string; phone: string; full_name: string;
  cedula?: string; role: string; is_admin: boolean; is_active: boolean;
  is_verified: boolean; profile_completed: boolean;
  avatar_url?: string | null; avatar_verified?: boolean; cedula_locked?: boolean;
  address?: string; profession?: string; verified_at?: string | null;
  balance: number; rating_avg: number; wallet_address: string | null;
  created_at: string | null;
}

interface Paginated<T> { total: number; page: number; per_page: number; users?: T[]; jobs?: T[]; transactions?: T[]; }
interface Job { id: number; title: string; status: string; budget: number; client_id: number; worker_id: number | null; category?: string; location?: string; dispute_reason?: string; created_at: string | null; }
interface Tx { id: number; user_id: number; job_id: number | null; type: string; amount: number; status: string; created_at: string | null; }
interface Wallet { system_wallet: string; balance: number; total_deposits: number; total_withdrawals: number; pending_confirmation: number; }

interface UserDetailFull {
  user: {
    id: number; email: string; phone: string; full_name: string; cedula?: string;
    role: string; is_admin: boolean; is_active: boolean; balance: number; rating_avg: number;
    wallet_address: string | null; created_at: string | null; address?: string;
    profession?: string; latitude?: number; longitude?: number;
    avatar_url?: string | null; avatar_verified?: boolean; cedula_locked?: boolean;
    is_verified: boolean; verified_at?: string | null; profile_completed: boolean;
  };
  stats: { total_earned: number; total_spent: number; jobs_posted: number; jobs_completed: number; jobs_assigned: number; ratings_count: number };
  jobs_as_client: Job[];
  jobs_as_worker: Job[];
  transactions: Tx[];
  ratings: { id: number; rater_name: string; rating: number; comment: string }[];
}

/* ═══════════════════════════════════════ API ═══════════════════════════════════════ */

const API = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

async function adm<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API}/admin${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Error ${res.status}`);
  }
  return res.json();
}

/* ═══════════════════════════════════════ HELPERS ═══════════════════════════════════════ */

const fmt = (n: number) => n?.toLocaleString() ?? "0";
const usd = (n: number) => `$${n?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}`;
const since = (d: string | null) => {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  return `Hace ${Math.floor(hrs / 24)}d`;
};
const clsStatus: Record<string, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  disputed: "bg-orange-50 text-orange-700 border-orange-200",
  review_pending: "bg-purple-50 text-purple-700 border-purple-200",
};
const stLabel: Record<string, string> = {
  open: "Abierto", in_progress: "En progreso", completed: "Completado",
  cancelled: "Cancelado", disputed: "Disputado", review_pending: "Revisión",
};

/* ═══════════════════════════════════════ ICONS ═══════════════════════════════════════ */

const Ico = ({ d, c = "w-4 h-4" }: { d: string; c?: string }) => (
  <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const icons = {
  dashboard: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
  users: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  jobs: "M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z",
  txs: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  wallet: "M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3",
  dispute: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
  chart: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  sparkline: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941",
  refresh: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182",
  search: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
  menu: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5",
  x: "M6 18L18 6M6 6l12 12",
  check: "M4.5 12.75l6 6 9-13.5",
  logout: "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9",
  eye: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  download: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3",
  ban: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
  shield: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
  filter: "M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z",
  chevron: "M19.5 8.25l-7.5 7.5-7.5-7.5",
  edit: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
};

/* ═══════════════════════════════════════ MINI COMPONENTS ═══════════════════════════════════════ */

const Spinner = () => <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />;

const Toast = ({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg animate-slide-up flex items-center gap-2 ${type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
      <Ico d={type === "success" ? icons.check : icons.x} c="w-4 h-4 shrink-0" />
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><Ico d={icons.x} c="w-3 h-3" /></button>
    </div>
  );
};

const Kpi = ({ label, value, icon, accent, sub }: { label: string; value: string; icon: string; accent: string; sub?: string }) => (
  <div className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow`}>
    <div className="flex items-start justify-between mb-3">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
      <div className={`w-9 h-9 rounded-xl ${accent} flex items-center justify-center`}>
        <Ico d={icon} c="w-[18px] h-[18px]" />
      </div>
    </div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
  </div>
);

const Empty = ({ msg }: { msg: string }) => (
  <div className="text-center py-16 text-gray-400">
    <Ico d={icons.search} c="w-12 h-12 mx-auto mb-3 opacity-30" />
    <p className="text-sm">{msg}</p>
  </div>
);

const Avatar = ({ name, w = 8 }: { name: string; w?: number }) => (
  <div className={`w-${w} h-${w} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0`}>
    {name?.charAt(0)?.toUpperCase()}
  </div>
);

const InfoCell = ({ label, value, mono, className }: { label: string; value: string; mono?: boolean; className?: string }) => (
  <div className={`p-3 bg-gray-50 rounded-xl ${className || ""}`}>
    <div className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</div>
    <div className={`font-medium text-gray-900 mt-0.5 truncate text-xs ${mono ? "font-mono" : ""}`}>{value}</div>
  </div>
);

const StatCell = ({ label, value, accent }: { label: string; value: string; accent: string }) => (
  <div className="p-3 bg-gray-50 rounded-xl text-center">
    <div className={`text-base font-bold ${accent}`}>{value}</div>
    <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
  </div>
);

const Modal = ({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[85vh] overflow-y-auto animate-scale-in`}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <Ico d={icons.x} c="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════ MAIN PAGE ═══════════════════════════════════════ */

const safeTop = "env(safe-area-inset-top, 0px)";
const safeBot = "env(safe-area-inset-bottom, 0px)";

type Tab = "overview" | "users" | "jobs" | "transactions" | "disputes" | "wallet" | "analytics";

export default function AdminPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // ── State
  const [tab, setTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<KpiStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [disputes, setDisputes] = useState<Job[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedUserFull, setSelectedUserFull] = useState<UserDetailFull | null>(null);
  const [userDetailModal, setUserDetailModal] = useState(false);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const perPage = 20;

  // ── Data Loading
  const loadStats = useCallback(async () => {
    try { setStats(await adm<KpiStats>("/stats")); } catch { /* silent */ }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const q = new URLSearchParams();
      q.set("page", String(userPage));
      q.set("per_page", String(perPage));
      if (roleFilter) q.set("role", roleFilter);
      if (search) q.set("search", search);
      const data = await adm<Paginated<AdminUser>>(`/users?${q}`);
      setUsers(data.users || []);
      setUsersTotal(data.total);
    } catch { /* silent */ }
  }, [userPage, roleFilter, search]);

  const loadJobs = useCallback(async () => {
    try {
      const q = new URLSearchParams();
      if (statusFilter) q.set("status", statusFilter);
      const data = await adm<Paginated<Job>>(`/jobs?${q}`);
      setJobs(data.jobs || []);
    } catch { /* silent */ }
  }, [statusFilter]);

  const loadTxs = useCallback(async () => {
    try { const data = await adm<Paginated<Tx>>("/transactions?per_page=50"); setTxs(data.transactions || []); } catch { /* silent */ }
  }, []);

  const loadDisputes = useCallback(async () => {
    try { setDisputes(await adm<Job[]>("/disputes")); } catch { /* silent */ }
  }, []);

  const loadWallet = useCallback(async () => {
    try { setWallet(await adm<Wallet>("/wallet")); } catch { /* silent */ }
  }, []);

  // Auto-refresh
  useEffect(() => { loadStats(); const i = setInterval(loadStats, 30000); return () => clearInterval(i); }, [loadStats]);
  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { loadJobs(); }, [loadJobs]);
  useEffect(() => { loadTxs(); }, [loadTxs]);
  useEffect(() => { loadDisputes(); }, [loadDisputes]);
  useEffect(() => { loadWallet(); }, [loadWallet]);

  // ── Actions
  const action = async (fn: () => Promise<any>, ok: string) => {
    setLoading(true);
    try { await fn(); setToast({ msg: ok, type: "success" }); loadStats(); loadUsers(); loadJobs(); }
    catch (e: any) { setToast({ msg: e.message || "Error", type: "error" }); }
    finally { setLoading(false); }
  };

  const toggleStatus = (u: AdminUser) =>
    action(() => adm(`/users/${u.id}/status?is_active=${!u.is_active}`, { method: "PATCH" }),
      `Usuario ${u.is_active ? "suspendido" : "activado"}`);

  const toggleAdmin = (u: AdminUser) =>
    action(() => adm(`/users/${u.id}/admin?is_admin=${!u.is_admin}`, { method: "PATCH" }),
      `Admin ${u.is_admin ? "revocado" : "otorgado"}`);

  const viewUser = async (u: AdminUser) => {
    setSelectedUser(u); setSelectedUserFull(null); setUserDetailLoading(true); setUserDetailModal(true);
    try {
      const detail = await adm<UserDetailFull>(`/users/${u.id}/full`);
      setSelectedUserFull(detail);
    } catch { setToast({ msg: "Error al cargar detalles del usuario", type: "error" }); }
    finally { setUserDetailLoading(false); }
  };

  const deleteUser = async (userId: number) => {
    setLoading(true);
    try {
      await adm(`/users/${userId}`, { method: "DELETE" });
      setToast({ msg: "Usuario eliminado exitosamente", type: "success" });
      setUserDetailModal(false); setDeleteConfirmId(null); setDeleteStep(1);
      loadUsers(); loadStats();
    } catch (e: any) { setToast({ msg: e.message || "Error al eliminar", type: "error" }); }
    finally { setLoading(false); }
  };

  const exportCSV = () => {
    if (tab === "users" && users.length) {
      const csv = ["email,phone,full_name,role,is_active,balance,rating_avg,created_at"]
        .concat(users.map(u => `"${u.email}","${u.phone}","${u.full_name}","${u.role}",${u.is_active},${u.balance},${u.rating_avg},"${u.created_at}"`))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `turnogo_users_${Date.now()}.csv`; a.click();
      setToast({ msg: "CSV exportado", type: "success" });
    } else if (tab === "transactions" && txs.length) {
      const csv = ["id,user_id,job_id,type,amount,status,created_at"]
        .concat(txs.map(t => `${t.id},${t.user_id},${t.job_id || ""},"${t.type}",${t.amount},"${t.status}","${t.created_at}"`))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `turnogo_txs_${Date.now()}.csv`; a.click();
      setToast({ msg: "CSV exportado", type: "success" });
    } else {
      setToast({ msg: "No hay datos para exportar", type: "error" });
    }
  };

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Ico d={icons.shield} c="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso restringido</h2>
          <p className="text-gray-500 text-sm">Solo administradores pueden acceder a este panel.</p>
        </div>
      </div>
    );
  }

  /* ═══════ SIDEBAR ═══════ */
  const navItems: { id: Tab; label: string; icon: string }[] = [
    { id: "overview", label: "Dashboard", icon: icons.dashboard },
    { id: "analytics", label: "Analíticas", icon: icons.chart },
    { id: "users", label: "Usuarios", icon: icons.users },
    { id: "jobs", label: "Trabajos", icon: icons.jobs },
    { id: "transactions", label: "Transacciones", icon: icons.txs },
    { id: "disputes", label: "Disputas", icon: icons.dispute },
    { id: "wallet", label: "Wallet", icon: icons.wallet },
  ];

  const Sidebar = () => (
    <div className="w-60 shrink-0 bg-gray-900 text-gray-300 flex flex-col min-h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Ico d={icons.shield} c="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">Admin Console</div>
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">TurnoGO</div>
          </div>
        </div>
      </div>
      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(n => (
          <button
            key={n.id}
            onClick={() => { setTab(n.id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${tab === n.id ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white"}`}
          >
            <Ico d={n.icon} c="w-[18px] h-[18px]" />
            {n.label}
            {n.id === "disputes" && disputes.length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{disputes.length}</span>
            )}
          </button>
        ))}
      </nav>
      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <Avatar name={user?.full_name || "A"} w={7} />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white font-medium truncate">{user?.full_name}</div>
            <div className="text-[10px] text-gray-500 truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={() => { logout(); router.push("/"); }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors"
        >
          <Ico d={icons.logout} c="w-3.5 h-3.5" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  /* ═══════ MOBILE BOTTOM TAB ═══════ */
  const MobileTab = () => (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 flex overflow-x-auto"
      style={{ paddingBottom: safeBot }}>
      {navItems.slice(0, 5).map(n => (
        <button key={n.id} onClick={() => setTab(n.id)}
          className={`flex-1 flex flex-col items-center justify-center py-2 min-w-[64px] ${tab === n.id ? "text-primary" : "text-gray-400"}`}>
          <Ico d={n.icon} c="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">{n.label === "Dashboard" ? "Inicio" : n.label}</span>
        </button>
      ))}
    </nav>
  );

  /* ═══════ VIEWS ═══════ */

  const Overview = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500">Panel de control general</p>
        </div>
        <button onClick={loadStats} disabled={loading}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors disabled:opacity-50">
          <Ico d={icons.refresh} c="w-4 h-4" />
        </button>
      </div>

      {!stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse h-[104px]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <Kpi label="Usuarios" value={fmt(stats.total_users)} icon={icons.users} accent="bg-blue-50 text-blue-600" sub={`${stats.total_workers} trab. · ${stats.total_contractors} cont.`} />
          <Kpi label="Trabajos" value={fmt(stats.total_jobs)} icon={icons.jobs} accent="bg-emerald-50 text-emerald-600" sub={`${stats.active_jobs} activos · ${stats.completed_jobs} completados`} />
          <Kpi label="Volumen USDT" value={usd(stats.total_volume_usdt)} icon={icons.txs} accent="bg-amber-50 text-amber-600" sub={`${fmt(stats.total_transactions)} transacciones`} />
          <Kpi label="Disputas" value={fmt(stats.disputed_jobs)} icon={icons.dispute} accent="bg-red-50 text-red-600" sub={stats.disputed_jobs > 0 ? "Requieren atención" : "Todo en orden"} />
        </div>
      )}

      {/* Quick charts section */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Distribución de Trabajos</h3>
          {stats && (
            <div className="space-y-3">
              {[
                { label: "Abiertos", val: stats.active_jobs, color: "bg-blue-500", total: stats.total_jobs },
                { label: "Completados", val: stats.completed_jobs, color: "bg-emerald-500", total: stats.total_jobs },
                { label: "Disputados", val: stats.disputed_jobs, color: "bg-red-500", total: stats.total_jobs },
              ].map(b => (
                <div key={b.label}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{b.label}</span><span>{fmt(b.val)} ({((b.val / (b.total || 1)) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${b.color} transition-all duration-500`}
                      style={{ width: `${(b.val / (b.total || 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Distribución de Usuarios</h3>
          {stats && (
            <div className="flex items-center justify-center py-4">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="4"
                    strokeDasharray={`${(stats.total_workers / (stats.total_users || 1)) * 100} ${100 - (stats.total_workers / (stats.total_users || 1)) * 100}`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-gray-900">{fmt(stats.total_workers)}</span>
                  <span className="text-[10px] text-gray-500">Trabajadores</span>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-center gap-6 text-xs">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500" /> Trabajadores</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-200" /> Contratistas</div>
          </div>
        </div>
      </div>
    </div>
  );

  const AnalyticsView = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Analíticas</h2>
        <p className="text-sm text-gray-500">Datos avanzados para análisis</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{((stats.completed_jobs / (stats.total_jobs || 1)) * 100).toFixed(1)}%</div>
            <div className="text-[11px] text-gray-500 mt-1">Tasa completación</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{usd(stats.total_volume_usdt)}</div>
            <div className="text-[11px] text-gray-500 mt-1">Volumen total</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{usd(stats.total_jobs > 0 ? stats.total_volume_usdt / stats.total_jobs : 0)}</div>
            <div className="text-[11px] text-gray-500 mt-1">Ticket promedio</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{((stats.disputed_jobs / (stats.total_jobs || 1)) * 100).toFixed(1)}%</div>
            <div className="text-[11px] text-gray-500 mt-1">Tasa disputas</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{fmt(stats.total_users)}</div>
            <div className="text-[11px] text-gray-500 mt-1">Total usuarios</div>
          </div>
        </div>
      )}

      {/* Sparkline-style charts */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm flex items-center gap-2">
          <Ico d={icons.chart} c="w-4 h-4 text-blue-500" /> Resumen de Plataforma
        </h3>
        <div className="grid sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-blue-50 rounded-xl">
            <div className="text-lg font-bold text-blue-700">{fmt(stats?.active_jobs ?? 0)}</div>
            <div className="text-xs text-blue-500">Trabajos activos ahora</div>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl">
            <div className="text-lg font-bold text-emerald-700">{fmt(stats?.completed_jobs ?? 0)}</div>
            <div className="text-xs text-emerald-500">Completados históricos</div>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl">
            <div className="text-lg font-bold text-amber-700">{usd(stats?.total_volume_usdt ?? 0)}</div>
            <div className="text-xs text-amber-500">Volumen procesado</div>
          </div>
        </div>
      </div>

      {/* Data collection info */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 p-5">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <Ico d={icons.sparkline} c="w-4 h-4 text-indigo-500" /> Datos Recolectados para Análisis
        </h3>
        <div className="grid sm:grid-cols-2 gap-3 mt-3 text-xs text-gray-600">
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Crecimiento de usuarios por día</div>
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Tasa de retención de trabajadores</div>
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Tiempo promedio de completación</div>
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Categorías con mayor demanda</div>
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Distribución de calificaciones</div>
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Patrones de disputas y cancelaciones</div>
        </div>
      </div>
    </div>
  );

  const UsersView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Usuarios</h2>
          <p className="text-sm text-gray-500">{fmt(usersTotal)} registrados</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-600 transition-colors">
            <Ico d={icons.download} c="w-3.5 h-3.5" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Ico d={icons.search} c="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text" placeholder="Buscar por nombre, email o teléfono..."
            value={search} onChange={e => { setSearch(e.target.value); setUserPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all bg-white"
          />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setUserPage(1); }}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:border-primary outline-none">
          <option value="">Todos los roles</option>
          <option value="worker">Trabajador</option>
          <option value="contractor">Contratista</option>
          <option value="both">Ambos</option>
        </select>
      </div>

      {/* Table */}
      {users.length === 0 ? <Empty msg="No se encontraron usuarios" /> : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Rol</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Balance</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className={`hover:bg-gray-50/50 transition-colors ${!u.is_active ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.full_name} />
                        <div className="min-w-0">
                          <button onClick={() => viewUser(u)} className="font-medium text-gray-900 hover:text-primary truncate block text-left transition-colors">{u.full_name}</button>
                          <div className="text-xs text-gray-400 truncate">{u.email}</div>
                        </div>
                        {u.is_admin && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">ADMIN</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 capitalize hidden sm:table-cell">{u.role}</td>
                    <td className="px-4 py-3 text-right text-xs font-mono text-gray-700 hidden sm:table-cell">{usd(u.balance)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full border ${u.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                        {u.is_active ? "Activo" : "Suspendido"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => viewUser(u)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Ver detalle">
                          <Ico d={icons.eye} c="w-4 h-4" />
                        </button>
                        {!u.is_admin && (
                          <button onClick={() => toggleStatus(u)} disabled={loading}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title={u.is_active ? "Suspender" : "Activar"}>
                            <Ico d={u.is_active ? icons.ban : icons.check} c="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => toggleAdmin(u)} disabled={loading}
                          className={`p-1.5 rounded-lg hover:bg-indigo-50 transition-colors ${u.is_admin ? "text-indigo-500 hover:text-indigo-700" : "text-gray-400 hover:text-indigo-600"}`} title={u.is_admin ? "Quitar admin" : "Hacer admin"}>
                          <Ico d={icons.shield} c="w-4 h-4" />
                        </button>
                        {!u.is_admin && (
                          <button onClick={() => { viewUser(u); setDeleteConfirmId(u.id); setDeleteStep(1); }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Eliminar usuario">
                            <Ico d={icons.x} c="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {usersTotal > perPage && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">Página {userPage} de {Math.ceil(usersTotal / perPage)}</span>
              <div className="flex gap-1">
                <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1}
                  className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors">Anterior</button>
                <button onClick={() => setUserPage(p => p + 1)} disabled={userPage >= Math.ceil(usersTotal / perPage)}
                  className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors">Siguiente</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const JobsView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Trabajos</h2>
          <p className="text-sm text-gray-500">{fmt(jobs.length)} trabajos cargados</p>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:border-primary outline-none">
          <option value="">Todos los estados</option>
          <option value="open">Abierto</option>
          <option value="in_progress">En progreso</option>
          <option value="review_pending">Revisión</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
          <option value="disputed">Disputado</option>
        </select>
      </div>

      {jobs.length === 0 ? <Empty msg="No hay trabajos" /> : (
        <div className="space-y-2">
          {jobs.map(j => (
            <div key={j.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">{j.title}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    {j.category && <span>{j.category}</span>}
                    {j.location && <span>· {j.location}</span>}
                    <span>· ID #{j.id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${clsStatus[j.status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                    {stLabel[j.status] || j.status}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{usd(j.budget)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const TxsView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Transacciones</h2>
          <p className="text-sm text-gray-500">{fmt(txs.length)} transacciones</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-600 transition-colors">
          <Ico d={icons.download} c="w-3.5 h-3.5" /> Exportar CSV
        </button>
      </div>

      {txs.length === 0 ? <Empty msg="No hay transacciones" /> : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Tipo</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {txs.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">#{t.id}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">#{t.user_id}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 capitalize hidden sm:table-cell">{t.type}</td>
                    <td className="px-4 py-3 text-right text-xs font-mono font-semibold text-gray-900">{usd(t.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${t.status === "confirmed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-400 hidden sm:table-cell">{since(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const DisputesView = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Disputas</h2>
        <p className="text-sm text-gray-500">{fmt(disputes.length)} disputas activas</p>
      </div>
      {disputes.length === 0 ? <Empty msg="¡No hay disputas! Todo en orden 🎉" /> : (
        <div className="space-y-2">
          {disputes.map(d => (
            <div key={d.id} className="bg-white rounded-xl border border-red-100 p-4 hover:border-red-200 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 text-sm">{d.title}</div>
                  <div className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-0.5 rounded-lg inline-block">{d.dispute_reason || "Sin motivo especificado"}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-gray-900">{usd(d.budget)}</div>
                  <div className="text-[10px] text-gray-400">ID #{d.id}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const WalletView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Wallet del Sistema</h2>
          <p className="text-sm text-gray-500">Balance y actividad</p>
        </div>
        <button onClick={loadWallet} disabled={loading}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors disabled:opacity-50">
          <Ico d={icons.refresh} c="w-4 h-4" />
        </button>
      </div>

      {!wallet ? <Empty msg="Cargando wallet..." /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Balance</div>
            <div className="text-xl font-bold text-emerald-600">{usd(wallet.balance)}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Depósitos</div>
            <div className="text-xl font-bold text-blue-600">{usd(wallet.total_deposits)}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Retiros</div>
            <div className="text-xl font-bold text-amber-600">{usd(wallet.total_withdrawals)}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Pendientes</div>
            <div className="text-xl font-bold text-purple-600">{usd(wallet.pending_confirmation)}</div>
          </div>
        </div>
      )}
    </div>
  );

  /* ═══════ RENDER ═══════ */
  return (
    <div className="min-h-screen bg-gray-50 flex" style={{ paddingBottom: `calc(0px + ${safeBot})` }}>
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="absolute left-0 top-0 bottom-0 w-64 z-50 shadow-2xl" onClick={e => e.stopPropagation()}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Sidebar (desktop) */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="bg-white border-b border-gray-200 sticky top-0 z-30"
          style={{ paddingTop: safeTop, minHeight: `calc(3.5rem + ${safeTop})` }}
        >
          <div className="h-14 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
                <Ico d={icons.menu} c="w-5 h-5" />
              </button>
              <h1 className="text-sm font-bold text-gray-900 hidden sm:block">
                {navItems.find(n => n.id === tab)?.label || "Admin"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={loadStats} disabled={loading}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50" title="Refrescar">
                <Ico d={icons.refresh} c="w-4 h-4" />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-3 sm:p-6 pb-20 md:pb-6">
          {tab === "overview" && <Overview />}
          {tab === "analytics" && <AnalyticsView />}
          {tab === "users" && <UsersView />}
          {tab === "jobs" && <JobsView />}
          {tab === "transactions" && <TxsView />}
          {tab === "disputes" && <DisputesView />}
          {tab === "wallet" && <WalletView />}
        </main>
      </div>

      {/* Mobile Bottom Tab */}
      <MobileTab />

      {/* User Detail Modal — Full */}
      <Modal open={userDetailModal} onClose={() => { setUserDetailModal(false); setSelectedUserFull(null); setDeleteConfirmId(null); setDeleteStep(1); }} title="Detalle de Usuario" wide>
        {userDetailLoading ? (
          <div className="flex items-center justify-center py-12">
            <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : selectedUserFull ? (
          <div className="space-y-5">
            {/* Header — avatar + name + badges */}
            <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl">
              {selectedUserFull.user.avatar_url ? (
                <img src={selectedUserFull.user.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow" />
              ) : (
                <Avatar name={selectedUserFull.user.full_name} w={14} />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900 text-lg">{selectedUserFull.user.full_name}</span>
                  {selectedUserFull.user.is_admin && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">ADMIN</span>}
                  {selectedUserFull.user.is_verified && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">✓ Verificado</span>}
                  {!selectedUserFull.user.is_verified && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">No verificado</span>}
                  {selectedUserFull.user.profile_completed && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Perfil completo</span>}
                  {!selectedUserFull.user.profile_completed && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">Perfil incompleto</span>}
                </div>
                <div className="text-sm text-gray-500 mt-0.5">{selectedUserFull.user.email}</div>
                <div className="text-sm text-gray-400">{selectedUserFull.user.phone}</div>
                {selectedUserFull.user.is_active ? (
                  <span className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">Activo</span>
                ) : (
                  <span className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200">Suspendido</span>
                )}
              </div>
            </div>

            {/* Info Grid */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Información Personal</h4>
              <div className="grid grid-cols-2 gap-2">
                <InfoCell label="Cédula" value={selectedUserFull.user.cedula || "—"} mono />
                <InfoCell label="Rol" value={selectedUserFull.user.role === "worker" ? "Trabajador" : selectedUserFull.user.role === "contractor" ? "Contratista" : selectedUserFull.user.role} />
                <InfoCell label="Profesión" value={selectedUserFull.user.profession || "—"} />
                <InfoCell label="Dirección" value={selectedUserFull.user.address || "—"} />
                <InfoCell label="Cédula bloqueada" value={selectedUserFull.user.cedula_locked ? "Sí" : "No"} />
                <InfoCell label="Avatar verificado" value={selectedUserFull.user.avatar_verified ? "Sí" : "No"} />
                <InfoCell label="Registro" value={since(selectedUserFull.user.created_at)} />
                {selectedUserFull.user.verified_at && <InfoCell label="Verificado el" value={new Date(selectedUserFull.user.verified_at).toLocaleDateString()} />}
              </div>
            </div>

            {/* Wallet */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Wallet</h4>
              <div className="grid grid-cols-2 gap-2">
                <InfoCell label="Balance" value={usd(selectedUserFull.user.balance)} />
                <InfoCell label="Rating" value={selectedUserFull.user.rating_avg.toFixed(1) + " ★"} />
                <InfoCell label="Wallet Address" value={selectedUserFull.user.wallet_address || "No registrada"} mono className="col-span-2" />
              </div>
            </div>

            {/* Stats */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Métricas</h4>
              <div className="grid grid-cols-3 gap-2">
                <StatCell label="Ganado" value={usd(selectedUserFull.stats.total_earned)} accent="text-emerald-600" />
                <StatCell label="Gastado" value={usd(selectedUserFull.stats.total_spent)} accent="text-amber-600" />
                <StatCell label="Publicados" value={fmt(selectedUserFull.stats.jobs_posted)} accent="text-blue-600" />
                <StatCell label="Completados" value={fmt(selectedUserFull.stats.jobs_completed)} accent="text-purple-600" />
                <StatCell label="Asignados" value={fmt(selectedUserFull.stats.jobs_assigned)} accent="text-indigo-600" />
                <StatCell label="Calificaciones" value={fmt(selectedUserFull.stats.ratings_count)} accent="text-orange-600" />
              </div>
            </div>

            {/* Jobs */}
            {selectedUserFull.jobs_as_client.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Trabajos como Cliente ({selectedUserFull.jobs_as_client.length})</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedUserFull.jobs_as_client.map(j => (
                    <div key={j.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-gray-800 truncate block">{j.title}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${clsStatus[j.status] || ""}`}>{stLabel[j.status] || j.status}</span>
                      </div>
                      <span className="font-semibold text-gray-700 ml-2 shrink-0">{usd(j.budget)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedUserFull.jobs_as_worker.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Trabajos como Trabajador ({selectedUserFull.jobs_as_worker.length})</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedUserFull.jobs_as_worker.map(j => (
                    <div key={j.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-gray-800 truncate block">{j.title}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${clsStatus[j.status] || ""}`}>{stLabel[j.status] || j.status}</span>
                      </div>
                      <span className="font-semibold text-gray-700 ml-2 shrink-0">{usd(j.budget)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ratings */}
            {selectedUserFull.ratings.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Calificaciones ({selectedUserFull.ratings.length})</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedUserFull.ratings.map(r => (
                    <div key={r.id} className="text-xs bg-gray-50 rounded-lg px-3 py-2 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-gray-800">{r.rater_name}</span>
                        {r.comment && <span className="text-gray-500 ml-2">— {r.comment}</span>}
                      </div>
                      <span className="text-amber-500 font-semibold ml-2 shrink-0">{r.rating} ★</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transactions */}
            {selectedUserFull.transactions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Últimas Transacciones</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {selectedUserFull.transactions.slice(0, 10).map(t => (
                    <div key={t.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gray-400">#{t.id}</span>
                        <span className="capitalize text-gray-600">{t.type}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${t.status === "confirmed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{t.status}</span>
                      </div>
                      <span className="font-semibold text-gray-800">{usd(t.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delete Action */}
            {!selectedUserFull.user.is_admin && (
              <div className="border-t border-gray-100 pt-4 mt-2">
                {deleteConfirmId === selectedUserFull.user.id ? (
                  deleteStep === 1 ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm font-medium text-red-800 mb-1">¿Eliminar a {selectedUserFull.user.full_name}?</p>
                      <p className="text-xs text-red-600 mb-3">Esta acción es irreversible. Se eliminarán todos los datos asociados.</p>
                      <div className="flex gap-2">
                        <button onClick={() => setDeleteStep(2)}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors">
                          Sí, eliminar
                        </button>
                        <button onClick={() => { setDeleteConfirmId(null); setDeleteStep(1); }}
                          className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-xl hover:bg-gray-50 transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-100 border-2 border-red-400 rounded-xl p-4">
                      <p className="text-sm font-bold text-red-900 mb-1">⚠️ Confirmación final</p>
                      <p className="text-xs text-red-800 mb-3">Se perderán para siempre: perfil, trabajos asociados, transacciones, calificaciones y tokens de sesión de <strong>{selectedUserFull.user.full_name}</strong>.</p>
                      <div className="flex gap-2">
                        <button onClick={() => deleteUser(selectedUserFull.user.id)} disabled={loading}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                          {loading && <Spinner />}
                          {loading ? "Eliminando..." : "Confirmar eliminación definitiva"}
                        </button>
                        <button onClick={() => { setDeleteConfirmId(null); setDeleteStep(1); }}
                          className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-xl hover:bg-gray-50 transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  <button onClick={() => { setDeleteConfirmId(selectedUserFull.user.id); setDeleteStep(1); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors">
                    <Ico d={icons.x} c="w-3.5 h-3.5" /> Eliminar cuenta
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">No se pudo cargar la información del usuario.</div>
        )}
      </Modal>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
