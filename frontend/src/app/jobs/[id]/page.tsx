"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getJob, applyToJob, getApplications, acceptApplication, checkIn, completeRequest, approveJob, cancelJob, rateJob, getJobRatings, type Job, type Application, type RatingInfo } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [ratings, setRatings] = useState<RatingInfo[]>([]);

  const jobId = parseInt(id);

  const loadJob = async (): Promise<Job | null> => {
    setLoading(true);
    try {
      const j = await getJob(jobId);
      setJob(j);
      return j;
    } catch {
      router.push("/jobs");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadApps = () => {
    if (user && user.role === "contractor") {
      getApplications(jobId).then(setApps).catch(() => {});
    }
  };

  useEffect(() => {
    loadJob();
  }, [jobId]);

  useEffect(() => {
    if (!authLoading && user) loadApps();
  }, [user, authLoading, jobId]);

  const loadRatings = () => {
    getJobRatings(jobId).then(setRatings).catch(() => {});
  };

  useEffect(() => {
    if (job?.status === "completed") loadRatings();
  }, [job?.status, jobId]);

  const handleApply = async () => {
    if (!user) { router.push("/auth/login"); return; }
    setError("");
    setApplying(true);
    try {
      await applyToJob(jobId, message);
      await loadJob();
      loadApps();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setApplying(false);
    }
  };

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);

  const handleAction = async (action: () => Promise<any>, cb?: () => void) => {
    setError("");
    try {
      await action();
      if (cb) cb();
      const updated = await loadJob();
      if (updated?.status === "completed") loadRatings();
      loadApps();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleRate = async () => {
    setError("");
    setRatingLoading(true);
    try {
      await rateJob(jobId, { rating, comment: comment || undefined });
      setComment("");
      loadRatings();
      loadJob();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRatingLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) return null;

  const isOwner = user?.id === job.client_id;
  const isAssigned = user?.id === job.worker_id;
  const isWorker = user?.role === "worker";

  const statusColors: Record<string, string> = {
    open: "bg-secondary-light text-secondary",
    in_progress: "bg-primary-light text-primary",
    checked_in: "bg-accent-light text-accent",
    review_pending: "bg-purple-50 text-purple-600",
    completed: "bg-gray-100 text-gray",
    cancelled: "bg-red-50 text-red-500",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={user ? "/dashboard" : "/"}>
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className="text-sm text-gray hover:text-dark">Dashboard</Link>
            ) : (
              <>
                <a href="/auth/login" className="text-sm text-gray hover:text-dark">Iniciar sesión</a>
                <a href="/auth/register" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-full">Registrarse</a>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 bg-light py-8">
        <div className="max-w-5xl mx-auto px-4">
          <a href="/jobs" className="text-sm text-gray hover:text-primary mb-4 inline-block">← Volver a trabajos</a>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Job card */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-dark">{job.title}</h1>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray">
                      <span>📍 {job.location}</span>
                      <span>📂 {job.category}</span>
                      <span>⏱️ {job.duration}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-primary">${job.budget}</p>
                    <span className={`inline-block mt-1 px-3 py-0.5 text-xs font-medium rounded-full ${statusColors[job.status] || "bg-gray-100 text-gray"}`}>
                      {job.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="font-semibold text-dark mb-2">Descripción</h3>
                  <p className="text-sm text-gray leading-relaxed whitespace-pre-wrap">{job.description}</p>
                </div>
              </div>

              {/* Actions (visible when logged in) */}
              {user && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="font-semibold text-dark mb-4">Acciones</h3>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
                  )}

                  {/* Worker: Apply */}
                  {isWorker && job.status === "open" && !isAssigned && (
                    <div className="space-y-3">
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Escribe un mensaje al contratista (opcional)..."
                        className="w-full px-4 py-2.5 border border-gray-light rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm resize-none"
                        rows={3}
                      />
                      <button onClick={handleApply} disabled={applying} className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50">
                        {applying ? "Aplicando..." : "Aplicar a este trabajo"}
                      </button>
                    </div>
                  )}

                  {/* Owner: Cancel */}
                  {isOwner && (job.status === "open" || job.status === "in_progress") && (
                    <button onClick={() => handleAction(() => cancelJob(jobId))} className="px-6 py-2.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all">
                      Cancelar trabajo
                    </button>
                  )}

                  {/* Worker: Check-in */}
                  {isAssigned && job.status === "in_progress" && (
                    <button onClick={() => handleAction(() => checkIn(jobId))} className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all">
                      ✅ Hacer check-in (llegué al trabajo)
                    </button>
                  )}

                  {/* Worker: Complete request */}
                  {isAssigned && job.status === "checked_in" && (
                    <button onClick={() => handleAction(() => completeRequest(jobId))} className="px-6 py-2.5 bg-secondary text-white font-semibold rounded-xl hover:bg-secondary-dark transition-all">
                      ✅ Solicitar finalización
                    </button>
                  )}

                  {/* Owner: Approve */}
                  {isOwner && job.status === "review_pending" && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray">El trabajador ha solicitado finalizar este trabajo.</p>
                      <button onClick={() => handleAction(() => approveJob(jobId))} className="px-6 py-2.5 bg-secondary text-white font-semibold rounded-xl hover:bg-secondary-dark transition-all">
                        ✅ Aprobar y completar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ⭐ RATING SECTION (solo formulario, no reseñas ajenas) */}
              {job.status === "completed" && user && (isOwner || isAssigned) && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="font-semibold text-dark mb-4">⭐ Calificar este trabajo</h3>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
                  )}

                  {ratings.find(r => r.rater_id === user.id) ? (
                    <div className="text-sm text-gray flex items-center gap-2 p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="text-lg">✅</span>
                      <span>Ya calificaste este trabajo: <strong className="text-accent">{'★'.repeat(Math.round(ratings.find(r => r.rater_id === user.id)!.rating))}</strong></span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Star selector */}
                      <div>
                        <label className="block text-sm font-medium text-dark mb-2">
                          ¿Cómo fue tu experiencia?
                        </label>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className={`p-1.5 rounded-lg transition-all duration-150 hover:scale-110 focus:outline-none ${
                                star <= rating
                                  ? 'text-accent scale-110'
                                  : 'text-gray-200 hover:text-accent/50'
                              }`}
                            >
                              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </button>
                          ))}
                          <span className="ml-2 text-sm text-gray font-medium self-center">
                            {['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'][rating]}
                          </span>
                        </div>
                      </div>

                      {/* Comment */}
                      <div>
                        <label className="block text-sm font-medium text-dark mb-1.5">Comentario (opcional)</label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Cuéntale a otros sobre tu experiencia..."
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm resize-none"
                          rows={3}
                          maxLength={500}
                        />
                        <p className="text-xs text-gray mt-1 text-right">{comment.length}/500</p>
                      </div>

                      <button
                        onClick={handleRate}
                        disabled={ratingLoading}
                        className="w-full sm:w-auto px-6 py-2.5 bg-accent text-white font-semibold rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {ratingLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Enviando...
                          </span>
                        ) : (
                          'Enviar calificación'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Applications (contractor only) */}
              {isOwner && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="font-semibold text-dark mb-4">👥 Aplicaciones ({apps.length})</h3>
                  {apps.length === 0 ? (
                    <p className="text-sm text-gray">No hay aplicaciones aún</p>
                  ) : (
                    <div className="space-y-3">
                      {apps.map((app) => (
                        <div key={app.id} className="p-3 rounded-lg border border-gray-100">
                          <div className="flex items-center justify-between gap-2">
                            <Link
                              href={`/workers/${app.worker_id}`}
                              className="font-medium text-sm text-primary hover:underline"
                            >
                              {app.worker?.full_name || `Worker #${app.worker_id}`}
                            </Link>
                            <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              app.status === "pending" ? "bg-accent-light text-accent" : "bg-secondary-light text-secondary"
                            }`}>
                              {app.status}
                            </span>
                          </div>
                          {app.message && <p className="text-xs text-gray mt-1">{app.message}</p>}
                          {/* Aceptar botón — solo si está pendiente y el job está open */}
                          {app.status === "pending" && job.status === "open" && (
                            <button
                              onClick={() => handleAction(() => acceptApplication(jobId, app.id), loadApps)}
                              className="mt-2 w-full px-3 py-1.5 bg-secondary text-white text-xs font-medium rounded-lg hover:bg-secondary-dark transition-colors"
                            >
                              ✅ Aceptar trabajador
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Quick info */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-dark mb-3">💡 Tips</h3>
                <ul className="text-sm text-gray space-y-2">
                  <li>• Revisa bien la descripción antes de aplicar</li>
                  <li>• Los pagos son en USDT vía Polygon</li>
                  <li>• Califica a tu contratista/trabajador después</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
