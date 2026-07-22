"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getJob, updateJob, applyToJob, getApplications, getMyApplications, acceptApplication, checkIn, completeRequest, verifyCompletion, approveJob, cancelJob, requestCorrection, disputeJob, rateJob, getJobRatings, type Job, type Application, type RatingInfo } from "@/lib/api";
import ActionModal from "@/components/ActionModal";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import NotificationBell from "@/components/NotificationBell";
import BackButton from "@/components/BackButton";

// ─── SVG COMPONENTS ───
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
  disputed:      { label: "En disputa",     color: "bg-orange-50 text-orange-600 border-orange-200" },
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
      setError("Este trabajo no tiene coordenadas de ubicación. Contacta al empleador.");
      return;
    }

    if (!navigator.geolocation) {
      setError("Tu dispositivo no soporta geolocalización.");
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
        if (err.code === 1) {
          setGpsStatus("denied");
          setError("Permiso de ubicación denegado. Activa el GPS y permite el acceso a la ubicación en tu navegador.");
        } else {
          setError("No se pudo obtener tu ubicación. Verifica que el GPS esté activado.");
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
          gpsStatus === "too-far" ? "bg-gray-100" :
          gpsStatus === "locating" ? "bg-gray-100" :
          "bg-primary/10"
        }`}>
          {gpsStatus === "locating" ? (
            <span className="w-7 h-7 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : gpsStatus === "too-far" ? (
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
          {gpsStatus === "too-far" ? "Ubicación incorrecta" :
           gpsStatus === "locating" ? "Obteniendo ubicación..." :
           "¿Estás en la ubicación del trabajo?"}
        </h3>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 text-center">
            {error}
          </div>
        )}

        {/* Too far message */}
        {gpsStatus === "too-far" && (
          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 text-center space-y-2">
            <p className="font-medium text-gray-800">
              No estás en la ubicación del trabajo
            </p>
            <p className="text-gray-500">
              Te encuentras a <strong className="text-gray-700">{distance}m</strong> de la dirección indicada.
              Debes estar a menos de {CHECKIN_RADIUS_M}m para poder hacer check-in.
            </p>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-400">
                <strong className="text-gray-500">Ubicación del trabajo:</strong> {jobLocation}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Asegúrate de estar en la dirección correcta. Si no la encuentras, contacta al contratista para solicitar indicaciones.
              </p>
            </div>
          </div>
        )}

        {/* Normal info — solo si no hay error y no hay otro estado */}
        {!error && gpsStatus === "idle" && (
          <p className="text-sm text-gray text-center mb-6 leading-relaxed">
            Verificaremos que estés cerca de <strong>{jobLocation}</strong> antes de permitir el check-in.
          </p>
        )}

        {/* Locating */}
        {gpsStatus === "locating" && (
          <p className="text-sm text-gray text-center mb-6 leading-relaxed">
            Verificando tu ubicación GPS...
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
              {checking ? "Verificando..." : "Estoy aquí"}
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
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  // Correction / Dispute modals
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

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

  const handleVerify = async () => {
    setVerifyError("");
    if (!verificationCode || verificationCode.length !== 6) {
      setVerifyError("Ingresa el código de 6 dígitos que el contratista te dará.");
      return;
    }
    setVerifyLoading(true);
    try {
      await verifyCompletion(jobId, verificationCode);
      setShowVerifyModal(false);
      setVerificationCode("");
      const updated = await loadJob();
      if (updated?.status === "completed") loadRatings();
      loadApps();
    } catch (e: any) {
      setVerifyError(e.message);
    } finally {
      setVerifyLoading(false);
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
                  <a href="/auth/login" className="text-sm text-gray hover:text-dark transition-colors">Iniciar sesión</a>
                  <a href="/auth/register" className="btn-ripple px-4 py-2 text-sm font-medium text-white bg-primary rounded-full hover:bg-primary-dark transition-all">Registrarse</a>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 py-8">
          <div className="max-w-5xl mx-auto px-4 animate-fade-in">
            {/* Back link — returns to previous page, not always /jobs */}
            <BackButton
              onClick={() => {
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.push(user ? "/dashboard/jobs" : "/jobs");
                }
              }}
              label="Volver"
            />

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
                    <h3 className="font-semibold text-dark mb-2">Descripción</h3>
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
                          <p className="text-sm font-medium text-emerald-700">Postulación enviada</p>
                          <p className="text-xs text-gray mt-0.5">El contratista revisará tu solicitud</p>
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
                          Llegué al trabajo
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
                        onClick={() => handleAction(() => completeRequest(jobId), () => setShowVerifyModal(true))}
                        className="btn-ripple flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all shadow-md shadow-primary/20"
                      >
                        <IconCheck className="w-5 h-5" />
                        Solicitar finalización
                      </button>
                    )}

                    {/* Worker: Verify completion code (after requesting) */}
                    {isAssigned && job.status === "review_pending" && (
                      <div className="space-y-3">
                        {/* Si el contractor pidio correccion */}
                        {job.correction_note ? (
                          <>
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                                <span className="font-semibold text-amber-800">El contratista solicita una corrección</span>
                              </div>
                              <p className="text-sm text-amber-700 ml-7">{job.correction_note}</p>
                              {job.evidence_images && (() => { try { const imgs = JSON.parse(job.evidence_images); if (imgs.length) return (<div className="flex gap-2 mt-3 ml-7 flex-wrap">{imgs.map((url: string, i: number) => (<img key={i} src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-amber-200" />))}</div>); } catch {} return null; })()}
                            </div>
                            <button
                              onClick={() => handleAction(() => completeRequest(jobId), () => setShowVerifyModal(true))}
                              className="btn-ripple flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all shadow-sm w-full"
                            >
                              <IconCheck className="w-5 h-5" />
                              Ya lo corregí — Solicitar código nuevo
                            </button>
                            <button
                              onClick={() => setShowDisputeModal(true)}
                              className="btn-ripple flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray text-sm font-medium rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all w-full"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                              </svg>
                              Disputar
                            </button>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-gray">
                              Solicitud enviada. El contratista tiene tu código de verificación.
                            </p>
                            {job.completion_code ? (
                              <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                  onClick={() => setShowVerifyModal(true)}
                                  className="btn-ripple flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all shadow-sm flex-1"
                                >
                                  <IconCheck className="w-5 h-5" />
                                  Ingresar código de verificación
                                </button>
                                <button
                                  onClick={() => setShowDisputeModal(true)}
                                  className="btn-ripple flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray text-sm font-medium rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                  </svg>
                                  Disputar
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowDisputeModal(true)}
                                className="btn-ripple flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray text-sm font-medium rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                                Disputar
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Verification code modal */}
                    {showVerifyModal && (
                      <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        onClick={() => { setShowVerifyModal(false); setVerifyError(""); setVerificationCode(""); }}
                      >
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
                        <div
                          className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl animate-modal-enter p-7"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => { setShowVerifyModal(false); setVerifyError(""); setVerificationCode(""); }}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
                            aria-label="Cerrar"
                          >
                            <svg className="w-4 h-4 text-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>

                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                          </div>

                          <h3 className="text-lg font-bold text-dark mb-2 text-center">
                            Código de verificación
                          </h3>

                          {verifyError && (
                            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 text-center">
                              {verifyError}
                            </div>
                          )}

                          <p className="text-sm text-gray text-center mb-4 leading-relaxed">
                            El contratista recibió un código de 6 dígitos. Pídeselo e ingrésalo aquí para completar el trabajo.
                          </p>

                          <div className="mb-4">
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              autoComplete="one-time-code"
                              placeholder="000000"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                              className="w-full text-center text-2xl font-bold tracking-[0.3em] py-4 px-3 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all bg-white"
                            />
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => { setShowVerifyModal(false); setVerifyError(""); setVerificationCode(""); }}
                              disabled={verifyLoading}
                              className="flex-1 py-3 border border-gray-200 text-gray text-sm font-medium rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleVerify}
                              disabled={verifyLoading || verificationCode.length !== 6}
                              className="flex-1 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all shadow-sm disabled:opacity-50"
                            >
                              {verifyLoading ? "Verificando..." : "Verificar"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Owner: Review actions (codigo + correccion + disputa) */}
                    {isOwner && job.status === "review_pending" && (
                      <div className="space-y-4">
                        <p className="text-sm text-gray">
                          El trabajador ha solicitado finalizar este trabajo.
                        </p>

                        {/* Codigo de verificacion */}
                        {job.completion_code && (
                          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-center">
                            <p className="text-xs text-gray mb-1">Código de verificación</p>
                            <p className="text-2xl font-bold tracking-[0.3em] text-primary">{job.completion_code}</p>
                            <p className="text-xs text-gray mt-2">
                              Si el trabajo está bien hecho, comparte este código con el trabajador.
                            </p>
                          </div>
                        )}

                        {/* Si ya recibio una correccion antes, mostrar nota previa */}
                        {(job.correction_count ?? 0) > 0 && job.correction_note && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="text-sm text-amber-800">
                              <span className="font-semibold">Corrección solicitada anteriormente:</span> {job.correction_note}
                            </p>
                            {job.evidence_images && (() => { try { const imgs = JSON.parse(job.evidence_images); if (imgs.length) return (<div className="flex gap-2 mt-2 flex-wrap">{imgs.map((url: string, i: number) => (<img key={i} src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-amber-200" />))}</div>); } catch {} return null; })()}
                          </div>
                        )}

                        {/* Botones de accion */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          {/* Solicitar correccion */}
                          {job.completion_code && (
                            <button
                              onClick={() => setShowCorrectionModal(true)}
                              className="btn-ripple flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-700 font-medium text-sm rounded-xl hover:bg-amber-100 transition-all border border-amber-200"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                              Solicitar corrección
                            </button>
                          )}

                          {/* Disputa (solo si ya se pidio correccion al menos 1 vez) */}
                          {(job.correction_count ?? 0) >= 1 && job.completion_code && (
                            <button
                              onClick={() => setShowDisputeModal(true)}
                              className="btn-ripple flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 font-medium text-sm rounded-xl hover:bg-red-100 transition-all border border-red-200"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                              </svg>
                              Abrir disputa
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Disputed info */}
                {job.status === "disputed" && (user && (isOwner || isAssigned)) && (
                  <div className="bg-white rounded-2xl p-6 border border-orange-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-dark">Trabajo en disputa</h3>
                        <p className="text-sm text-gray mt-1">
                          Abierta por el <strong>{job.dispute_by === "contractor" ? "contratista" : "trabajador"}</strong>.
                          Los fondos (${job.budget.toFixed(2)} USDT) están retenidos hasta que un administrador resuelva.
                        </p>
                        {job.dispute_reason && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-sm text-gray">
                              <span className="font-medium">Motivo:</span> {job.dispute_reason}
                            </p>
                            {job.evidence_images && (() => { try { const imgs = JSON.parse(job.evidence_images); if (imgs.length) return (<div className="flex gap-2 mt-2 flex-wrap">{imgs.map((url: string, i: number) => (<img key={i} src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />))}</div>); } catch {} return null; })()}
                          </div>
                        )}
                        {job.disputed_at && (
                          <p className="text-xs text-gray-400 mt-3">
                            Abierta el {new Date(job.disputed_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>
                    </div>
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
                            placeholder="Cuéntale a otros sobre tu experiencia..."
                            className="input-glow w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all text-sm resize-none bg-white"
                            rows={3}
                            maxLength={500}
                          />
                          <p className="text-xs text-gray mt-1 text-right">{comment.length}/500</p>
                        </div>

                        <button
                          onClick={handleRate}
                          disabled={ratingLoading}
                          className="btn-ripple w-full sm:w-auto px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 shadow-md shadow-primary/20"
                        >
                          {ratingLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Enviando...
                            </span>
                          ) : "Enviar calificación"}
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
                        <p className="text-sm text-gray">No hay aplicaciones aún</p>
                        <p className="text-xs text-gray mt-1">Los trabajadores verán este trabajo y aplicarán</p>
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
                                className="btn-ripple mt-2 w-full px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-1"
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
                      Revisa bien la descripción antes de aplicar
                    </li>
                    <li className="flex gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      Los pagos son en USDT vía Polygon &mdash; seguro y rápido
                    </li>
                    <li className="flex gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      Califica a tu contratista/trabajador después de completar
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
            <h3 className="text-lg font-bold text-dark mb-2">¿Cancelar trabajo?</h3>
            <p className="text-sm text-gray mb-6">
              Esta acción no se puede deshacer. El trabajo se cancelará y se notificará a los postulados.
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
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Correction Modal */}
      <ActionModal
        open={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
        onSubmit={(text, images) => {
          setModalLoading(true);
          requestCorrection(jobId, text, images)
            .then(() => { setModalLoading(false); loadJob(); })
            .catch(() => setModalLoading(false));
        }}
        title="Solicitar corrección"
        subtitle="Describe qué necesita ajustar o mejorar el trabajador"
        placeholder="Ej: Falta limpiar la cocina, la pintura de la pared izquierda no quedó pareja..."
        submitLabel="Enviar corrección"
        loading={modalLoading}
      />

      {/* Dispute Modal */}
      <ActionModal
        open={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        onSubmit={(text, images) => {
          setModalLoading(true);
          disputeJob(jobId, text, images)
            .then(() => { setModalLoading(false); loadJob(); })
            .catch(() => setModalLoading(false));
        }}
        title="Abrir disputa"
        subtitle="Explica el motivo de la disputa. Los fondos quedarán retenidos hasta que un administrador resuelva."
        placeholder="Describe por qué no estás de acuerdo con el resultado del trabajo..."
        submitLabel="Abrir disputa"
        submitDanger
        loading={modalLoading}
      />

    </>
  );
}
