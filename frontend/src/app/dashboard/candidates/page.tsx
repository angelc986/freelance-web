"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getMyApplicants, acceptApplication, type JobWithApplicants, type ApplicantBrief } from "@/lib/api";
import PullToRefresh from "@/components/PullToRefresh";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

// ─── SVG ICONS ───
function IconArrowLeft() { return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>); }
function IconUsers() { return (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>); }
function IconStar({ className = "w-3.5 h-3.5" }: { className?: string }) { return (<svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>); }
function IconClock() { return (<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>); }
function IconChat() { return (<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>); }
function IconCheck() { return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>); }
function IconX() { return (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>); }
function IconEmail() { return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>); }
function IconPhone() { return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>); }
function IconId() { return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg>); }
function IconCalendar() { return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>); }
function IconCheckBadge() { return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>); }

// ─── SKELETON ───
function Skeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <div className="h-5 bg-gray-200 rounded-lg w-1/3 shimmer" />
          <div className="space-y-3">
            {[1, 2].map((j) => (
              <div key={j} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gray-200 shimmer" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3 shimmer" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const now = new Date(); const d = new Date(dateStr); const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "Ahora";
  if (diff < 3600) return "Hace " + Math.floor(diff / 60) + " min";
  if (diff < 86400) return "Hace " + Math.floor(diff / 3600) + " h";
  if (diff < 172800) return "Ayer";
  return "Hace " + Math.floor(diff / 86400) + " d\u00edas";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

const statusBadges: Record<string, { label: string; color: string }> = {
  pending:  { label: "Postulado", color: "bg-amber-50 text-amber-600 border-amber-200" },
  accepted: { label: "Aceptado",  color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  rejected: { label: "Rechazado", color: "bg-red-50 text-red-500 border-red-200" },
};

// ─── MODAL ───
function WorkerModal({ applicant, onClose }: { applicant: ApplicantBrief; onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const initials = applicant.worker_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleBackdrop = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
  };

  const badge = statusBadges[applicant.status] || { label: applicant.status, color: "bg-gray-100 text-gray border-gray-200" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdrop}
      style={{ animation: "fadeIn 0.15s ease-out" }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col"
        style={{ animation: "modalSlideUp 0.25s ease-out" }}
      >
        {/* Header con gradiente */}
        <div className="relative flex-shrink-0 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 rounded-t-3xl px-6 pt-10 pb-14 text-white text-center overflow-hidden">
          {/* Pattern decorativo */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 200 200"><circle cx="30" cy="30" r="20" fill="white"/><circle cx="170" cy="40" r="15" fill="white"/><circle cx="100" cy="80" r="12" fill="white"/><circle cx="45" cy="120" r="8" fill="white"/><circle cx="160" cy="130" r="10" fill="white"/><circle cx="80" cy="170" r="6" fill="white"/><circle cx="140" cy="180" r="7" fill="white"/></svg>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-all z-10">
            <IconX />
          </button>
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold mx-auto mb-4 ring-4 ring-white/20 shadow-lg">
            {initials}
          </div>
          <h2 className="text-xl font-bold text-white">{applicant.worker_name}</h2>
          <div className="flex items-center justify-center gap-3 mt-2">
            {applicant.worker_rating > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 text-white text-xs font-medium">
                <IconStar className="w-3.5 h-3.5" /> {applicant.worker_rating.toFixed(1)}
              </span>
            )}
            <span className={"inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg border " + badge.color}>
              {badge.label}
            </span>
          </div>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pt-0 pb-6 -mt-8 space-y-4 scrollbar-thin">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: applicant.jobs_completed, label: "Trabajos", color: "text-blue-600", bg: "bg-blue-50" },
              { value: applicant.worker_rating > 0 ? applicant.worker_rating.toFixed(1) : "\u2014", label: "Rating", color: "text-amber-600", bg: "bg-amber-50" },
              { value: applicant.jobs_completed, label: "Completados", color: "text-emerald-600", bg: "bg-emerald-50" },
            ].map((s, i) => (
              <div key={i} className={"rounded-2xl " + s.bg + " p-4 text-center"}>
                <p className={"text-xl font-bold " + s.color}>{s.value}</p>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Info del worker */}
          <div className="bg-gray-50 rounded-2xl p-1 divide-y divide-gray-100">
            {[
              { icon: <IconEmail />, bg: "bg-blue-100 text-blue-600", label: "Correo", value: applicant.worker_email || "\u2014" },
              { icon: <IconPhone />, bg: "bg-green-100 text-green-600", label: "Tel\u00e9fono", value: applicant.worker_phone || "\u2014" },
              { icon: <IconId />, bg: "bg-violet-100 text-violet-600", label: "C\u00e9dula", value: applicant.worker_cedula || "\u2014" },
              { icon: <IconCalendar />, bg: "bg-amber-100 text-amber-600", label: "Miembro desde", value: applicant.worker_since ? formatDate(applicant.worker_since) : "\u2014" },
            ].map((row, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3">
                <div className={"w-9 h-9 rounded-xl " + row.bg + " flex items-center justify-center flex-shrink-0"}>{row.icon}</div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{row.label}</p>
                  <p className="text-sm font-medium text-gray-800 truncate">{row.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mensaje */}
          {applicant.message && (
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <IconChat />
                <p className="text-[10px] text-blue-600 font-medium uppercase tracking-wider">Mensaje del postulante</p>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{applicant.message}</p>
            </div>
          )}

          {/* Fecha postulación */}
          <p className="text-center text-xs text-gray-400 pb-2">Se postul\u00f3 {timeAgo(applicant.created_at)}</p>
        </div>
      </div>
    </div>
  );
}

// ─── APPLICANT CARD ───
function ApplicantCard({ applicant, jobId, onAccept, loadingId, onNameClick }: {
  applicant: ApplicantBrief;
  jobId: number;
  onAccept: (jobId: number, appId: number) => void;
  loadingId: number | null;
  onNameClick: (app: ApplicantBrief) => void;
}) {
  const badge = statusBadges[applicant.status] || { label: applicant.status, color: "bg-gray-100 text-gray border-gray-200" };
  const initials = applicant.worker_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className={"flex items-start gap-3 p-4 rounded-xl border transition-all " + (
      applicant.status === "accepted" ? "bg-emerald-50/50 border-emerald-200" :
      applicant.status === "rejected" ? "bg-gray-50 border-gray-200" :
      "bg-white border-gray-100 hover:border-primary/30 hover:shadow-sm"
    )}>
      <button onClick={() => onNameClick(applicant)} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 hover:ring-2 hover:ring-blue-300 transition-all">
        {initials}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => onNameClick(applicant)} className="font-semibold text-sm text-dark hover:text-primary transition-colors text-left cursor-pointer">{applicant.worker_name}</button>
          {applicant.worker_rating > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-600">
              <IconStar />{applicant.worker_rating.toFixed(1)}
            </span>
          )}
          <span className={"inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border " + badge.color}>{badge.label}</span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-[11px] text-gray">
          <span className="inline-flex items-center gap-1"><IconClock />{timeAgo(applicant.created_at)}</span>
          {applicant.jobs_completed > 0 && (
            <span className="inline-flex items-center gap-1"><IconCheckBadge />{applicant.jobs_completed} completados</span>
          )}
        </div>
        {applicant.message && (
          <div className="mt-2 flex items-start gap-1.5 text-xs text-gray-700 bg-gray-50 rounded-lg p-2.5">
            <div className="mt-0.5 flex-shrink-0"><IconChat /></div>
            <p className="leading-relaxed">{applicant.message}</p>
          </div>
        )}
      </div>
      <div className="flex-shrink-0">
        {applicant.status === "pending" && (
          <button onClick={() => onAccept(jobId, applicant.id)} disabled={loadingId === applicant.id}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0">
            {loadingId === applicant.id ? (
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            ) : <IconCheck />}
            Aceptar
          </button>
        )}
      </div>
    </div>
  );
}

// ─── PAGE ───
export default function CandidatesPage() {
  const { user } = useAuth();
  const [data, setData] = useState<JobWithApplicants[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [selected, setSelected] = useState<ApplicantBrief | null>(null);

  const load = useCallback(async () => {
    if (!user || user.role !== "contractor") return;
    setLoading(true);
    try { const result = await getMyApplicants(); setData(result); } catch { setData([]); }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleAccept = useCallback(async (jobId: number, appId: number) => {
    setLoadingId(appId);
    try { await acceptApplication(jobId, appId); await load(); } catch {}
    setLoadingId(null);
  }, [load]);

  if (!user) return null;
  if (user.role !== "contractor") {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <h2 className="text-lg font-semibold text-dark mb-2">Solo para contratistas</h2>
        <p className="text-sm text-gray mb-6">Esta secci\u00f3n es para ver qui\u00e9n aplic\u00f3 a tus trabajos.</p>
        <Link href="/dashboard" className="text-sm text-primary hover:underline">&larr; Volver al inicio</Link>
      </div>
    );
  }

  const withApplicants = data.filter((d) => d.applicants.length > 0);
  const withoutApplicants = data.filter((d) => d.applicants.length === 0);

  return (
    <>
      {selected && <WorkerModal applicant={selected} onClose={() => setSelected(null)} />}

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="w-8 h-8 rounded-lg bg-gray-100 text-gray flex items-center justify-center hover:bg-gray-200 transition-colors"><IconArrowLeft /></Link>
            <div>
              <h1 className="text-xl font-bold text-dark">Candidatos</h1>
              <p className="text-sm text-gray mt-0.5">{withApplicants.length} trabajo{withApplicants.length !== 1 ? "s" : ""} con postulaciones</p>
            </div>
          </div>
          <Link href="/jobs/new" className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-all shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Publicar
          </Link>
        </div>

        {loading ? <Skeleton /> : (
          <PullToRefresh onRefresh={load}>
            {withApplicants.length === 0 ? (
              <div className="animate-fade-in">
                <EmptyState title="No hay candidatos" description="A\u00fan nadie ha aplicado a tus trabajos." variant="jobs" actionLabel="Ver mis trabajos" actionHref="/dashboard/jobs" />
              </div>
            ) : (
              <div className="space-y-6">
                {withApplicants.map((item, idx) => (
                  <div key={item.job.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-stagger-pop" style={{ animationDelay: (idx * 0.08).toString() + "s" }}>
                    <Link href={"/jobs/" + item.job.id} className="flex items-center justify-between px-5 py-4 border-b border-gray-100 hover:bg-gray-50/50 transition-colors group">
                      <div>
                        <h3 className="font-semibold text-dark group-hover:text-primary transition-colors">{item.job.title}</h3>
                        <p className="text-xs text-gray mt-0.5">{item.job.location} &middot; ${item.job.budget}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                        <IconUsers />{item.applicants.length} candidato{item.applicants.length !== 1 ? "s" : ""}
                      </span>
                    </Link>
                    <div className="p-4 space-y-3">
                      {item.applicants.map((app) => (
                        <ApplicantCard key={app.id} applicant={app} jobId={item.job.id} onAccept={handleAccept} loadingId={loadingId} onNameClick={setSelected} />
                      ))}
                    </div>
                  </div>
                ))}
                {withoutApplicants.length > 0 && (
                  <details className="group">
                    <summary className="text-sm text-gray cursor-pointer hover:text-primary transition-colors p-2 rounded-lg hover:bg-gray-50" style={{ listStyle: "none" }}>
                      <span className="inline-flex items-center gap-1">
                        <svg className={"w-3 h-3 transition-transform group-open:rotate-90"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        {withoutApplicants.length} trabajo{withoutApplicants.length !== 1 ? "s" : ""} sin candidatos
                      </span>
                    </summary>
                    <div className="mt-2 space-y-2">
                      {withoutApplicants.map((item) => (
                        <Link key={item.job.id} href={"/jobs/" + item.job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <span className="text-sm font-medium text-dark">{item.job.title}</span>
                          <span className="text-xs text-gray">${item.job.budget}</span>
                        </Link>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </PullToRefresh>
        )}
      </div>
    </>
  );
}
