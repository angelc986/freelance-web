"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getJob, updateJob, applyToJob, getApplications, getMyApplications, acceptApplication, checkIn, completeRequest, approveJob, cancelJob, rateJob, getJobRatings, type Job, type Application, type RatingInfo } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import NotificationBell from "@/components/NotificationBell";

// ─── SVG COMPONENTS ───
function IconArrowLeft({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
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

function IconFolder({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
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

function IconUsers({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function IconLightbulb({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  );
}

function IconCheck({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function IconStarFull({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function IconX({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconEdit({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

function IconTrash({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ─── STATUS CONFIG ───
const statusConfig: Record<string, { label: string; color: string }> = {
  open:          { label: "Abierto",        color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  in_progress:   { label: "En progreso",    color: "bg-blue-50 text-blue-600 border-blue-200" },
  checked_in:    { label: "Check-in",       color: "bg-amber-50 text-amber-600 border-amber-200" },
  review_pending:{ label: "Revision",       color: "bg-violet-50 text-violet-600 border-violet-200" },
  completed:     { label: "Completado",     color: "bg-gray-100 text-gray-500 border-gray-200" },
  cancelled:     { label: "Cancelado",      color: "bg-red-50 text-red-500 border-red-200" },
};

// ─── HAVERSINE DISTANCE (meters) ───
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const CHECKIN_RADIUS_M = 100; // must be within 100m of job location

// ─── CHECKIN MODAL ───
function CheckinModal({
  jobLat,
  jobLng,
  jobLocation,
  onClose,
  onCheckin,
}: {
  jobLat: number | null;
  jobLng: number | null;
  jobLocation: string;
  onClose: () => void;
  onCheckin: () => void;
}) {
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [gpsStatus, setGpsStatus] = useState<"idle" | "locating" | "denied" | "success" | "too-far">("idle");
  const [distance, setDistance] = useState<number | null>(null);

  const handleCheckin = () => {
    setError("");

    if (jobLat == null || jobLng == null) {
      setError("Este trabajo no tiene coordenadas de ubicaci\u00f3n. Contacta al empleador.");
      return;
    }

    if (!navigator.geolocation) {
      setError("Tu dispositivo no soporta geolocalizaci\u00f3n.");
      return;
    }

    setChecking(true);
    setGpsStatus("locating");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = haversineDistance(
          pos.coords.latitude,
          pos.coords.longitude,
          jobLat,
          jobLng
        );
        setDistance(Math.round(dist));

        if (dist <= CHECKIN_RADIUS_M) {
          setGpsStatus("success");
          setChecking(false);
          onCheckin();
        } else {
          setGpsStatus("too-far");
          setChecking(false);
        }
      },
      (err) => {
        setChecking(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus("denied");
          setError("Permiso de ubicaci\u00f3n denegado. Activa el GPS y permite el acceso a la ubicaci\u00f3n en tu navegador.");
        } else {
          setError("No se pudo obtener tu ubicaci\u00f3n. Verifica que el GPS est\u00e9 activado.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl animate-modal-enter p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
          aria-label="Cerrar"
        >
          <svg className="w-4 h-4 text-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon */}
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${
          gpsStatus === "too-far" ? "bg-red-50" :
          gpsStatus === "locating" ? "bg-amber-50" :
          "bg-primary/10"
        }`}>
          {gpsStatus === "locating" ? (
            <span className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          ) : gpsStatus === "too-far" ? (
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          ) : (
            <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          )}
        </div>

        <h3 className="text-lg font-bold text-dark mb-2 text-center">
          {gpsStatus === "too-far" ? "Est\u00e1s muy lejos" :
           gpsStatus === "locating" ? "Obteniendo ubicaci\u00f3n..." :
           "\u00bfEst\u00e1s en la ubicaci\u00f3n del trabajo?"}
        </h3>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center">
            {error}
          </div>
        )}

        {/* Too far message */}
        {gpsStatus === "too-far" && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 text-center">
            <p className="font-medium">Est\u00e1s a <strong>{distance}m</strong> de la ubicaci\u00f3n.</p>
            <p className="text-xs mt-1 text-amber-600">Debes estar a menos de {CHECKIN_RADIUS_M}m para hacer check-in.<br />Ubicaci\u00f3n del trabajo: <strong>{jobLocation}</strong></p>
          </div>
        )}

        {/* Normal info */}
        {gpsStatus === "idle" && (
          <p className="text-sm text-gray text-center mb-6 leading-relaxed">
            Verificaremos que est\u00e9s cerca de <strong>{jobLocation}</strong> antes de permitir el check-in.
          </p>
        )}

        {/* Locating */}
        {gpsStatus === "locating" && (
          <p className="text-sm text-gray text-center mb-6 leading-relaxed">
            Verificando tu ubicaci\u00f3n GPS...
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={checking}
            className="flex-1 py-3 border border-gray-200 text-gray text-sm font-medium rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Volver
          </button>
          {gpsStatus === "too-far" ? (
            <button
              onClick={() => {
                setGpsStatus("idle");
                setError("");
                setDistance(null);
              }}
              className="flex-1 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all shadow-sm"
            >
              Intentar de nuevo
            </button>
          ) : (
            <button
              onClick={handleCheckin}
              disabled={checking || gpsStatus === "locating"}
              className="flex-1 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all shadow-sm disabled:opacity-50"
            >
              {checking ? "Verificando..." : "Estoy aqu\u00ed"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SKELETON ───
function DetailSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-light">
      <header className="border-b border-gray-200 bg-white h-16" />
      <div className="flex-1 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="space-y-4">
                  <div className="h-8 bg-gray-200 rounded-lg w-2/3 shimmer" />
                  <div className="flex gap-3">
                    <div className="h-4 bg-gray-200 rounded w-20 shimmer" />
                    <div className="h-4 bg-gray-200 rounded w-24 shimmer" />
                    <div className="h-4 bg-gray-200 rounded w-16 shimmer" />
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="h-4 bg-gray-200 rounded w-1/4 shimmer" />
                  <div className="h-4 bg-gray-200 rounded w-full shimmer" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 shimmer" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-1/2 shimmer" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 shimmer" />
                  <div className="h-4 bg-gray-200 rounded w-2/3 shimmer" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ───
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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

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
    if (!authLoading && user) {
      loadApps();
      // Check if worker already applied
      if (user.role === "worker") {
        getMyApplications().then(myApps => {
          const found = myApps.find(a => a.job_id === jobId);
          if (found) {
            setHasApplied(true);
            setAppliedSuccess(true);
          }
        }).catch(() => {});
      }
    }
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
      setAppliedSuccess(true);
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

  if (loading || authLoading) return <DetailSkeleton />;
  if (!job) return null;

  const isOwner = user?.id === job.client_id;
  const isAssigned = user?.id === job.worker_id;
  const isWorker = user?.role === "worker";

  const st = statusConfig[job.status] || { label: job.status, color: "bg-gray-100 text-gray border-gray-200" };

  const ratingLabels = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];

  return (
    <>
      <div className="min-h-screen flex flex-col bg-light">
        {/* Navbar — safe-area aware */}
        <header className="border-b border-gray-200 bg-white/60 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-4 flex items-center justify-between" style={{ minHeight: 'calc(4rem + env(safe-area-inset-top, 0px))', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
            <Link href={user ? "/dashboard" : "/"}>
              <Logo size="sm" />
            </Link>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <NotificationBell />
                  <Link href="/dashboard" className="btn-ripple inline-flex items-center gap-1.5 px-4 py-1.5 border border-gray-200 text-sm text-gray font-medium rounded-full hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                    Panel
                  </Link>
                </>
              ) : (
                <>
                  <a href="/auth/login" className="text-sm text-gray hover:text-dark transition-colors">Iniciar sesi&oacute;n</a>
                  <a href="/auth/register" className="btn-ripple px-4 py-2 text-sm font-medium text-white bg-primary rounded-full hover:bg-primary-dark transition-all">Registrarse</a>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 py-8">
          <div className="max-w-5xl mx-auto px-4 animate-fade-in">
            {/* Back link — returns to previous page, not always /jobs */}
            <button
              onClick={() => {
                // Volver a la pagina anterior. Si no hay historial, ir a dashboard o jobs
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.push(user ? "/dashboard/jobs" : "/jobs");
                }
              }}
              className="btn-ripple inline-flex items-center gap-1.5 px-4 py-1.5 border border-gray-200 text-sm text-gray font-medium rounded-full hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all mb-4"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Volver
            </button>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* ===== MAIN ===== */}
              <div className="lg:col-span-2 space-y-4">
                {/* Job card */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 animate-page-enter">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h1 className="text-2xl font-bold text-dark">{job.title}</h1>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray">
                        <span className="inline-flex items-center gap-1">
                          <IconLocation className="w-4 h-4" />
                          {job.location}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <IconFolder className="w-4 h-4" />
                          {job.category}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <IconClock className="w-4 h-4" />
                          {job.duration}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold text-primary">${job.budget}</p>
                      <div className="flex items-center justify-end gap-1.5 mt-1">
                        {hasApplied && (
                          <span className="inline-block px-3 py-0.5 text-xs font-medium rounded-full border bg-gray-50 text-gray border-gray-200">
                            Aplicado
                          </span>
                        )}
                        <span className={`inline-block px-3 py-0.5 text-xs font-medium rounded-full border ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h3 className="font-semibold text-dark mb-2">Descripci&oacute;n</h3>
                    <p className="text-sm text-gray leading-relaxed whitespace-pre-wrap">{job.description}</p>
                  </div>
                </div>

                {/* Actions */}
                {user && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 animate-stagger-pop">
                    <h3 className="font-semibold text-dark mb-4">Acciones</h3>

                    {error && (
                      <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2 animate-fade-in">
                        <IconX className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Worker: Apply */}
                    {isWorker && job.status === "open" && !isAssigned && (
                      appliedSuccess ? (
                        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/60 text-center animate-fade-in">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-emerald-700">Postulaci&oacute;n enviada</p>
                          <p className="text-xs text-gray mt-0.5">El contratista revisar&aacute; tu solicitud</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Escribe un mensaje al contratista (opcional)..."
                            className="input-glow w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all text-sm resize-none bg-white"
                            rows={3}
                          />
                          <button
                            onClick={handleApply}
                            disabled={applying}
                            className="btn-ripple px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 shadow-md shadow-primary/20"
                          >
                            {applying ? (
                              <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Aplicando...
                              </span>
                            ) : "Aplicar a este trabajo"}
                          </button>
                        </div>
                      )
                    )}

                    {/* Owner: Actions row */}
                    {isOwner && (job.status === "open" || job.status === "in_progress") && (
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Edit button */}
                        <button
                          onClick={() => router.push(`/jobs/${jobId}/edit`)}
                          className="btn-ripple inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray text-sm font-medium rounded-xl hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
                        >
                          <IconEdit className="w-4 h-4" />
                          Editar
                        </button>

                        {/* Cancel button */}
                        <button
                          onClick={() => setShowCancelModal(true)}
                          className="btn-ripple inline-flex items-center gap-2 px-5 py-2.5 border border-red-200 text-red-500 text-sm font-medium rounded-xl hover:bg-red-50 hover:border-red-300 transition-all"
                        >
                          <IconTrash className="w-4 h-4" />
                          Cancelar
                        </button>
                      </div>
                    )}

                    {/* Worker: Check-in */}
                    {isAssigned && job.status === "in_progress" && (
                      <>
                        <button
                          onClick={() => setShowCheckinModal(true)}
                          className="btn-ripple flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all shadow-md shadow-primary/20"
                        >
                          <IconCheck className="w-5 h-5" />
                          Llegu&eacute; al trabajo
                        </button>

                        {/* Check-in location confirmation modal */}
                        {showCheckinModal && (
                          <CheckinModal
                            jobLat={job.latitude ?? null}
                            jobLng={job.longitude ?? null}
                            jobLocation={job.location}
                            onClose={() => setShowCheckinModal(false)}
                            onCheckin={() => {
                              setShowCheckinModal(false);
                              handleAction(() => checkIn(jobId));
                            }}
                          />
                        )}
                      </>
                    )}

                    {/* Worker: Complete request */}
                    {isAssigned && job.status === "checked_in" && (
                      <button
                        onClick={() => handleAction(() => completeRequest(jobId))}
                        className="btn-ripple flex items-center gap-2 px-6 py-2.5 bg-secondary text-white font-semibold rounded-xl hover:brightness-110 transition-all shadow-sm"
                      >
                        <IconCheck className="w-5 h-5" />
                        Solicitar finalizaci&oacute;n
                      </button>
                    )}

                    {/* Owner: Approve */}
                    {isOwner && job.status === "review_pending" && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray">El trabajador ha solicitado finalizar este trabajo.</p>
                        <button
                          onClick={() => handleAction(() => approveJob(jobId))}
                          className="btn-ripple flex items-center gap-2 px-6 py-2.5 bg-secondary text-white font-semibold rounded-xl hover:brightness-110 transition-all shadow-sm"
                        >
                          <IconCheck className="w-5 h-5" />
                          Aprobar y completar
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Rating section */}
                {job.status === "completed" && user && (isOwner || isAssigned) && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 animate-stagger-pop" style={{ animationDelay: "0.1s" }}>
                    <h3 className="font-semibold text-dark mb-4">Calificar este trabajo</h3>

                    {error && (
                      <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2">
                        <IconX className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                        <span>{error}</span>
                      </div>
                    )}

                    {ratings.find(r => r.rater_id === user.id) ? (
                      <div className="text-sm text-gray flex items-center gap-2 p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="text-accent font-medium">
                          {"★".repeat(Math.round(ratings.find(r => r.rater_id === user.id)!.rating))}
                        </span>
                        <span>Ya calificaste este trabajo</span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Stars */}
                        <div>
                          <label className="block text-sm font-medium text-dark mb-2">
                            &iquest;C&oacute;mo fue tu experiencia?
                          </label>
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className={`p-1.5 rounded-lg transition-all duration-150 hover:scale-110 focus:outline-none ${
                                  star <= rating
                                    ? "text-accent scale-110"
                                    : "text-gray-200 hover:text-accent/50"
                                }`}
                              >
                                <IconStarFull className="w-7 h-7" />
                              </button>
                            ))}
                            <span className="ml-2 text-sm text-gray font-medium self-center">
                              {ratingLabels[rating]}
                            </span>
                          </div>
                        </div>

                        {/* Comment */}
                        <div>
                          <label className="block text-sm font-medium text-dark mb-1.5">Comentario (opcional)</label>
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Cu&eacute;ntale a otros sobre tu experiencia..."
                            className="input-glow w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all text-sm resize-none bg-white"
                            rows={3}
                            maxLength={500}
                          />
                          <p className="text-xs text-gray mt-1 text-right">{comment.length}/500</p>
                        </div>

                        <button
                          onClick={handleRate}
                          disabled={ratingLoading}
                          className="btn-ripple w-full sm:w-auto px-6 py-2.5 bg-accent text-white font-semibold rounded-xl hover:brightness-110 transition-all disabled:opacity-50 shadow-sm"
                        >
                          {ratingLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Enviando...
                            </span>
                          ) : "Enviar calificaci&oacute;n"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ===== SIDEBAR ===== */}
              <div className="space-y-4">
                {/* Applications */}
                {isOwner && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 animate-stagger-pop">
                    <div className="flex items-center gap-2 mb-4">
                      <IconUsers className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-dark">Aplicaciones ({apps.length})</h3>
                    </div>

                    {apps.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                          <IconUsers className="w-6 h-6 text-gray" />
                        </div>
                        <p className="text-sm text-gray">No hay aplicaciones a&uacute;n</p>
                        <p className="text-xs text-gray mt-1">Los trabajadores ver&aacute;n este trabajo y aplicar&aacute;n</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {apps.map((app) => (
                          <div key={app.id} className="p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                            <div className="flex items-center justify-between gap-2">
                              <Link
                                href={`/workers/${app.worker_id}`}
                                className="font-medium text-sm text-primary hover:underline"
                              >
                                {app.worker?.full_name || `Worker #${app.worker_id}`}
                              </Link>
                              <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                                app.status === "pending"
                                  ? "bg-amber-50 text-amber-600 border-amber-200"
                                  : "bg-emerald-50 text-emerald-600 border-emerald-200"
                              }`}>
                                {app.status === "pending" ? "Pendiente" : "Aceptado"}
                              </span>
                            </div>
                            {app.message && (
                              <p className="text-xs text-gray mt-1.5 line-clamp-2">{app.message}</p>
                            )}
                            {app.status === "pending" && job.status === "open" && (
                              <button
                                onClick={() => handleAction(() => acceptApplication(jobId, app.id), loadApps)}
                                className="btn-ripple mt-2 w-full px-3 py-1.5 bg-secondary text-white text-xs font-medium rounded-lg hover:brightness-110 transition-colors flex items-center justify-center gap-1"
                              >
                                <IconCheck className="w-3.5 h-3.5" />
                                Aceptar trabajador
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tips */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <IconLightbulb className="w-4 h-4 text-accent" />
                    <h3 className="font-semibold text-dark text-sm">Tips</h3>
                  </div>
                  <ul className="space-y-2.5 text-xs text-gray">
                    <li className="flex gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      Revisa bien la descripci&oacute;n antes de aplicar
                    </li>
                    <li className="flex gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      Los pagos son en USDT v&iacute;a Polygon &mdash; seguro y r&aacute;pido
                    </li>
                    <li className="flex gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      Califica a tu contratista/trabajador despu&eacute;s de completar
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setShowCancelModal(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
          <div
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl animate-modal-enter p-7 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-dark mb-2">&iquest;Cancelar trabajo?</h3>
            <p className="text-sm text-gray mb-6">
              Esta acci&oacute;n no se puede deshacer. El trabajo se cancelar&aacute; y se notificar&aacute; a los postulados.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 border border-gray-200 text-gray text-sm font-medium rounded-xl hover:bg-gray-50 transition-all"
              >
                Volver
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  handleAction(() => cancelJob(jobId));
                }}
                className="flex-1 py-3 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-all shadow-sm"
              >
                S&iacute;, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
