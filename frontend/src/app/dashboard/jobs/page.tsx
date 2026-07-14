"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { myJobs, getMyApplications, type Job, type Application } from "@/lib/api";
import PullToRefresh from "@/components/PullToRefresh";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

// ─── SVG ICONS ───
function IconBriefcase({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75a24 24 0 01-7.577-1.22 2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  );
}

function IconCheckCircle({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconXCircle({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconArrowLeft({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function IconClock({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconLocation({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

function IconChat({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}

// ─── STATUS CONFIG ───
const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  open:          { label: "Abierto",        color: "bg-emerald-50 text-emerald-600 border-emerald-200",         icon: "🟢" },
  in_progress:   { label: "En progreso",    color: "bg-blue-50 text-blue-600 border-blue-200",                 icon: "🔵" },
  checked_in:    { label: "Check-in",       color: "bg-amber-50 text-amber-600 border-amber-200",              icon: "🟡" },
  review_pending:{ label: "Revisión",       color: "bg-violet-50 text-violet-600 border-violet-200",           icon: "🟣" },
  completed:     { label: "Completado",     color: "bg-gray-100 text-gray-500 border-gray-200",                icon: "✅" },
  cancelled:     { label: "Cancelado",      color: "bg-red-50 text-red-500 border-red-200",                    icon: "❌" },
};

const appBadgeConfig: Record<string, { label: string; color: string }> = {
  pending:  { label: "Postulado",  color: "bg-amber-50 text-amber-600 border-amber-200" },
  rejected: { label: "Rechazado",  color: "bg-red-50 text-red-500 border-red-200" },
  accepted: { label: "Aceptado",   color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
};

const statusSvgs: Record<string, string> = {
  open: "🟢",
  in_progress: "🔵",
  checked_in: "🟡",
  review_pending: "🟣",
  completed: "✅",
  cancelled: "❌",
};

// ─── SKELETON ───
function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-5 border border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-gray-200 rounded-lg w-2/3 shimmer" />
              <div className="flex gap-4">
                <div className="h-3 bg-gray-200 rounded w-20 shimmer" />
                <div className="h-3 bg-gray-200 rounded w-16 shimmer" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <div className="h-7 bg-gray-200 rounded-lg w-16 shimmer" />
              <div className="h-5 bg-gray-200 rounded-full w-20 shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── PAGE ───
export default function DashboardJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Map<number, Application>>(new Map());
  const [filter, setFilter] = useState("active");
  const [loading, setLoading] = useState(true);

  const loadJobs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [mine, apps] = await Promise.all([
        myJobs(),
        getMyApplications().catch(() => [] as Application[]),
      ]);
      setJobs(mine);
      const appMap = new Map<number, Application>();
      for (const app of apps) {
        appMap.set(app.job_id, app);
      }
      setApplications(appMap);
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  if (!user) return null;

  const isWorker = user.role === "worker";

  const activeStatuses = ["open", "in_progress", "checked_in", "review_pending"];

  const filtered = filter === "active"
    ? jobs.filter((j) => activeStatuses.includes(j.status))
    : jobs.filter((j) => j.status === filter);

  const tabs = [
    { key: "active",    label: "Activos",     icon: <IconBriefcase className="w-4 h-4" /> },
    { key: "completed", label: "Completados", icon: <IconCheckCircle className="w-4 h-4" /> },
    { key: "cancelled", label: "Cancelados",  icon: <IconXCircle className="w-4 h-4" /> },
  ];

  const counts = {
    active: jobs.filter((j) => activeStatuses.includes(j.status)).length,
    completed: jobs.filter((j) => j.status === "completed").length,
    cancelled: jobs.filter((j) => j.status === "cancelled").length,
  };

  const getAppBadge = (job: Job) => {
    if (!isWorker) return null;
    const app = applications.get(job.id);
    if (!app) return null;
    const cfg = appBadgeConfig[app.status];
    if (!cfg) return null;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border ${cfg.color}`}>
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-100 text-gray flex items-center justify-center hover:bg-gray-200 transition-colors">
            <IconArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-dark">
              {isWorker ? "Mis postulaciones" : "Mis trabajos"}
            </h1>
            <p className="text-sm text-gray mt-0.5">{jobs.length} en total</p>
          </div>
        </div>
        {!isWorker && (
          <Link
            href="/jobs/new"
            className="btn-ripple inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark hover:-translate-y-0.5 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Publicar
          </Link>
        )}
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6 animate-fade-in" style={{ animationDelay: "0.05s" }}>
        {tabs.map((t) => {
          const count = counts[t.key as keyof typeof counts];
          return (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === t.key
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray hover:border-primary/40 hover:text-primary"
              }`}
            >
              {t.icon}
              {t.label}
              {count > 0 && (
                <span className={`ml-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                  filter === t.key ? "bg-white/20" : "bg-gray-100 text-gray"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* LIST */}
      {loading ? (
        <ListSkeleton />
      ) : (
        <PullToRefresh onRefresh={loadJobs}>
          {filtered.length === 0 ? (
            <div className="animate-fade-in">
              <EmptyState
                title={filter === "active" ? "No tienes trabajos activos" :
                        filter === "completed" ? "No hay trabajos completados" :
                        "No hay trabajos cancelados"}
                description={isWorker
                  ? "Postúlate a un trabajo para empezar."
                  : "Publica tu primer trabajo para empezar."}
                variant="jobs"
                actionLabel={isWorker ? "Buscar trabajos" : "Publicar trabajo"}
                actionHref={isWorker ? "/jobs" : "/jobs/new"}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((job, idx) => {
                const st = statusConfig[job.status] || { label: job.status, color: "bg-gray-100 text-gray border-gray-200", icon: "📌" };
                return (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="group bg-white rounded-2xl p-5 border border-gray-200 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between gap-4 animate-stagger-pop"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-dark group-hover:text-primary transition-colors truncate">
                          {job.title}
                        </h3>
                        {getAppBadge(job)}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray">
                        <span className="inline-flex items-center gap-1">
                          <IconLocation className="w-3.5 h-3.5" />
                          {job.location}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <IconClock className="w-3.5 h-3.5" />
                          {job.duration}
                        </span>
                        {isWorker && applications.get(job.id)?.message && (
                          <span className="inline-flex items-center gap-1 text-gray truncate max-w-[150px]">
                            <IconChat className="w-3.5 h-3.5" />
                            {applications.get(job.id)?.message}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                      <p className="text-lg font-bold text-primary">${job.budget}</p>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full border ${st.color}`}>
                        <span>{st.icon}</span>
                        {st.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </PullToRefresh>
      )}
    </div>
  );
}
