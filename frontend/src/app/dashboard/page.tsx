"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import EmptyState from "@/components/EmptyState";
import PullToRefresh from "@/components/PullToRefresh";
import { StatSkeleton, CardSkeleton, ActivitySkeleton } from "@/components/Skeleton";
import VerificationBanner from "@/components/VerificationBanner";
import { myJobs, getMyApplications, getBalance, getMyApplicants, type Job, type Application } from "@/lib/api";

// ─── TYPES ───
interface ActivityItem {
  type: string;
  action: string;
  title: string;
  status: string;
  id: number;
  date: string;
}

// ─── SVG ICONS ───
function IconBriefcase({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75a24 24 0 01-7.577-1.22 2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  );
}

function IconStar({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function IconWallet({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  );
}

function IconInbox({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />
    </svg>
  );
}

function IconSearch({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function IconClipboard({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}

function IconPlusCircle({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconUsers({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function IconCreditCard({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  );
}

// ─── COLOR THEMES ───
const themes = [
  {
    bg: "from-blue-500 to-blue-600",
    shadow: "shadow-blue-500/20",
    light: "bg-blue-50",
    icon: "text-blue-600",
    gradient: "bg-gradient-to-br from-blue-50 to-white",
    border: "border-blue-100",
  },
  {
    bg: "from-blue-400 to-blue-500",
    shadow: "shadow-blue-400/20",
    light: "bg-blue-50",
    icon: "text-blue-600",
    gradient: "bg-gradient-to-br from-blue-50 to-white",
    border: "border-blue-100",
  },
  {
    bg: "from-cyan-500 to-blue-600",
    shadow: "shadow-cyan-500/20",
    light: "bg-cyan-50",
    icon: "text-cyan-600",
    gradient: "bg-gradient-to-br from-cyan-50 to-white",
    border: "border-cyan-100",
  },
  {
    bg: "from-indigo-500 to-blue-600",
    shadow: "shadow-indigo-500/20",
    light: "bg-indigo-50",
    icon: "text-indigo-600",
    gradient: "bg-gradient-to-br from-indigo-50 to-white",
    border: "border-indigo-100",
  },
];

// ─── COMPONENT ───
export default function DashboardPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [balance, setBalance] = useState(0);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [candidateCount, setCandidateCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const isWorker = user.role === "worker";
      const [j, a, bal, applicants] = await Promise.all([
        myJobs(),
        getMyApplications().catch(() => []),
        getBalance().catch(() => ({ balance: 0 })),
        (!isWorker ? getMyApplicants().catch(() => []) : Promise.resolve([])),
      ]);
      setJobs(j);
      setApps(a);
      if (!isWorker) {
        const count = (applicants as { applicants: unknown[] }[]).reduce((sum, item) => sum + item.applicants.length, 0);
        setCandidateCount(count);
      }
      setBalance(bal.balance);

      const acts: ActivityItem[] = [];
      for (const job of j.slice(0, 5)) {
        const isC = job.client_id === user.id;
        const m: Record<string, string> = {
          open: isC ? "Publicaste" : "Postulaste",
          in_progress: isC ? "Aceptaste trabajador para" : "Comenzaste",
          checked_in: "Check-in en",
          review_pending: "Solicitaste finalizar",
          completed: isC ? "Completaste" : "Finalizaste",
          cancelled: "Cancelaste",
        };
        acts.push({
          type: "job",
          action: m[job.status] || "Actualizaste",
          title: job.title,
          status: job.status,
          id: job.id,
          date: job.updated_at || job.created_at || "",
        });
      }
      for (const app of a.slice(0, 5)) {
        acts.push({
          type: "application",
          action: "Postulaste a",
          title: `Trabajo #${app.job_id}`,
          status: app.status,
          id: app.job_id,
          date: app.created_at,
        });
      }
      acts.sort((x, y) => (x.date > y.date ? -1 : 1));
      setActivity(acts.slice(0, 10));
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user) return null;

  const isWorker = user.role === "worker";
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === "completed").length;
  const pendingApps = apps.filter((a) => a.status === "pending").length;
  const appliedJobs = isWorker ? apps.length : 0;

  const stats = [
    {
      label: "Balance",
      value: "$" + balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      icon: <IconWallet />,
      href: "/dashboard/wallet",
      theme: themes[0],
    },
    {
      label: isWorker ? "Trabajos realizados" : "Trabajos publicados",
      value: isWorker ? completedJobs : totalJobs,
      icon: <IconBriefcase />,
      href: "/dashboard/jobs?filter=completed",
      theme: themes[1],
    },
    {
      label: "Calificación",
      value: user.rating_avg.toFixed(1),
      suffix: " / 5.0",
      icon: <IconStar />,
      href: "/dashboard/ratings",
      theme: themes[2],
    },
    {
      label: isWorker ? "Postulaciones" : "Candidatos",
      value: isWorker ? appliedJobs : candidateCount,
      icon: <IconInbox />,
      href: isWorker ? "/dashboard/jobs" : "/dashboard/candidates",
      theme: themes[3],
    },
  ];

  const quickActions = isWorker
    ? [
        { label: "Buscar trabajos", href: "/jobs", icon: <IconSearch />, desc: "Encuentra turnos cerca de ti", color: "from-blue-500 to-blue-600 text-white" },
        { label: "Mis postulaciones", href: "/dashboard/jobs", icon: <IconClipboard />, desc: "Revisa el estado de tus aplicaciones", color: "from-indigo-500 to-blue-600 text-white" },
        { label: "Mi billetera", href: "/dashboard/wallet", icon: <IconCreditCard />, desc: "Revisa tu saldo y movimientos", color: "from-cyan-500 to-blue-600 text-white" },
      ]
    : [
        { label: "Publicar trabajo", href: "/jobs/new", icon: <IconPlusCircle />, desc: "Crea un nuevo turno disponible", color: "from-blue-500 to-blue-600 text-white" },
        { label: "Ver candidatos", href: "/dashboard/candidates", icon: <IconUsers />, desc: "Revisa quién aplicó a tus trabajos", color: "from-indigo-500 to-blue-600 text-white" },
        { label: "Depositar fondos", href: "/dashboard/wallet", icon: <IconCreditCard />, desc: "Agrega USDT a tu wallet", color: "from-cyan-500 to-blue-600 text-white" },
      ];

  const statusMap: Record<string, { label: string; color: string }> = {
    open: { label: "Abierto", color: "bg-blue-50 text-blue-700" },
    in_progress: { label: "En progreso", color: "bg-blue-50 text-blue-700" },
    checked_in: { label: "Check-in", color: "bg-blue-50 text-blue-700" },
    review_pending: { label: "Revisión", color: "bg-yellow-50 text-yellow-700" },
    completed: { label: "Completado", color: "bg-gray-50 text-gray-500" },
    cancelled: { label: "Cancelado", color: "bg-gray-50 text-gray-500" },
    pending: { label: "Pendiente", color: "bg-blue-50 text-blue-700" },
    accepted: { label: "Aceptado", color: "bg-blue-50 text-blue-700" },
  };

  const typeIcon: Record<string, (c?: string) => React.ReactNode> = {
    job: (c) => <IconBriefcase className={c || "w-5 h-5"} />,
    application: (c) => <IconInbox className={c || "w-5 h-5"} />,
    transaction: (c) => <IconWallet className={c || "w-5 h-5"} />,
  };

  return (
    <PullToRefresh onRefresh={loadData}>
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* ═══════ WELCOME ═══════ */}
      <div className="animate-fade-in">
        <div className="text-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-dark">
              Hola, {user.full_name.split(" ")[0]}
            </h1>
            <p className="text-xs sm:text-sm text-gray">
              {isWorker
                ? "Encuentra trabajos cerca de ti y empieza a ganar."
                : "Publica turnos y encuentra trabajadores verificados."}
            </p>
          </div>
        </div>
        <div className="mt-3 h-px bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />
      </div>

      {/* ═══════ VERIFICATION BANNER ═══════ */}
      {user && !user.is_verified && (
        <VerificationBanner onComplete={() => window.location.reload()} />
      )}

      {/* ═══════ STATS CARDS (stagger entrance) ═══════ */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 stagger-children">
        {stats.map((s, i) => (
          <Link
            key={s.label}
            href={s.href}
            className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border ${s.theme.border} ${s.theme.gradient} p-3 sm:p-5 hover:shadow-lg ${s.theme.shadow} hover:-translate-y-1 transition-all duration-300`}
          >
            {/* Gradient accent bar - solo desktop */}
            <div className={`hidden sm:block absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.theme.bg}`} />

            <div className="relative z-10 flex sm:block items-center gap-3 sm:gap-0">
              {/* Icon */}
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-xl ${s.theme.light} flex items-center justify-center ${s.theme.icon} shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                {s.icon}
              </div>

              <div className="min-w-0">
                {/* Value */}
                <div className="flex items-baseline gap-1">
                  <p className="text-lg sm:text-2xl font-bold text-dark truncate">{s.value}</p>
                  {(s as any).suffix && <span className="text-xs sm:text-sm text-gray">{(s as any).suffix}</span>}
                </div>

                {/* Label */}
                <p className="text-[11px] sm:text-sm text-gray mt-0 sm:mt-1 group-hover:text-dark transition-colors truncate">{s.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ═══════ QUICK ACTIONS ═══════ */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-dark mb-3 sm:mb-4 flex items-center gap-2">
          <div className="w-1.5 h-5 bg-gradient-to-b from-primary to-blue-500 rounded-full"></div>
          Acciones rápidas
        </h2>
        <div className="grid sm:grid-cols-3 gap-3 sm:gap-5 stagger-children">
          {quickActions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="group relative bg-white rounded-xl sm:rounded-2xl border border-gray-200/80 p-4 sm:p-6 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 overflow-hidden"
            >
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Icon with subtle background */}
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 group-hover:shadow-lg transition-all duration-300`}>
                {a.icon}
              </div>

              <h3 className="font-semibold text-sm sm:text-base text-dark group-hover:text-primary transition-colors relative z-10">
                {a.label}
              </h3>
              <p className="text-xs sm:text-sm text-gray mt-0.5 sm:mt-1 leading-relaxed relative z-10">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══════ RECENT ACTIVITY ═══════ */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200/70 overflow-hidden shadow-sm shadow-gray-200/20">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100/80 flex items-center justify-between bg-gradient-to-r from-white to-blue-50/30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center shadow-sm">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-sm sm:text-base font-semibold text-dark">Actividad reciente</h2>
          </div>
          <Link href="/dashboard/jobs" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
            Ver todo
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <ActivitySkeleton />
        ) : activity.length === 0 ? (
          <EmptyState
            title="Sin actividad aún"
            description={isWorker ? "Postúlate a un trabajo para empezar." : "Publica tu primer trabajo."}
            actionLabel={isWorker ? "Buscar trabajos" : "Publicar trabajo"}
            actionHref={isWorker ? "/jobs" : "/jobs/new"}
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {activity.map((act, i) => {
              const st = statusMap[act.status] || { label: act.status, color: "bg-gray-100 text-gray" };
              const IconComp = typeIcon[act.type];
              return (
                <Link
                  key={i}
                  href={act.type === "transaction" ? "/dashboard/wallet" : `/jobs/${act.id}`}
                  className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 hover:bg-blue-50/30 transition-colors group"
                >
                  {/* Timeline dot */}
                  <div className="relative flex items-center justify-center">
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm ${
                      act.type === "job" ? "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600" :
                      act.type === "application" ? "bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600" :
                      "bg-gradient-to-br from-cyan-50 to-cyan-100 text-cyan-600"
                    }`}>
                      {IconComp && IconComp("w-3.5 h-3.5 sm:w-4 sm:h-4")}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-dark">
                      <span className="font-medium">{act.action}</span>
                      <span className="text-gray ml-1">{act.title}</span>
                    </p>
                  </div>

                  <span className={`inline-block flex-shrink-0 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-medium rounded-full shadow-sm ${st.color}`}>
                    {st.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </PullToRefresh>
  );
}

