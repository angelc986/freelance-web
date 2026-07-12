"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getUser, getUserRatings, type UserPublic, type UserRatingSummary } from "@/lib/api";
import Logo from "@/components/Logo";

export default function WorkerProfilePage() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [worker, setWorker] = useState<UserPublic | null>(null);
  const [ratings, setRatings] = useState<UserRatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const userId = parseInt(id);
    if (isNaN(userId)) {
      setError("Usuario inválido");
      setLoading(false);
      return;
    }

    Promise.all([
      getUser(userId),
      getUserRatings(userId),
    ])
      .then(([w, r]) => {
        setWorker(w);
        setRatings(r);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light">
        <div className="text-center">
          <p className="text-4xl mb-3">😕</p>
          <p className="text-gray text-sm">{error}</p>
          <Link href="/jobs" className="text-primary text-sm mt-4 inline-block hover:underline">
            ← Volver a trabajos
          </Link>
        </div>
      </div>
    );
  }

  if (!worker) return null;

  const isWorker = worker.role === "worker";
  const bd = ratings?.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  // Función para calcular porcentaje de cada estrella
  const pct = (n: number) =>
    ratings?.total ? Math.round((n / ratings.total) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-light">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={user ? "/dashboard" : "/"}>
            <Logo size="sm" />
          </Link>
          <Link href="/jobs" className="text-sm text-gray hover:text-primary transition-colors">
            ← Volver a trabajos
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 py-8">
        <div className="max-w-3xl mx-auto px-4">
          {/* ===== PROFILE CARD ===== */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white flex-shrink-0 ${
                  isWorker
                    ? "bg-gradient-to-br from-secondary to-secondary-dark"
                    : "bg-gradient-to-br from-primary to-primary-dark"
                }`}
              >
                {worker.full_name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-dark">{worker.full_name}</h1>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                  <span
                    className={`px-3 py-0.5 text-xs font-medium rounded-full ${
                      isWorker
                        ? "bg-secondary-light text-secondary"
                        : "bg-primary-light text-primary"
                    }`}
                  >
                    {isWorker ? "🧑‍💼 Trabajador" : "🏢 Contratista"}
                  </span>
                  <span
                    className={`px-3 py-0.5 text-xs font-medium rounded-full ${
                      worker.is_active
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-500"
                    }`}
                  >
                    {worker.is_active ? "✅ Disponible" : "🔴 No disponible"}
                  </span>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(worker.rating_avg)
                            ? "text-accent"
                            : "text-gray-200"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-lg font-bold text-dark">{worker.rating_avg.toFixed(1)}</span>
                  <span className="text-sm text-gray">
                    · {ratings?.total || 0} reseña{ratings?.total !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray text-xs">Rol</p>
                <p className="text-dark font-medium">{isWorker ? "Trabajador" : "Contratista"}</p>
              </div>
              <div>
                <p className="text-gray text-xs">Calificación</p>
                <p className="text-dark font-medium">{worker.rating_avg.toFixed(1)} / 5.0</p>
              </div>
              <div>
                <p className="text-gray text-xs">Miembro desde</p>
                <p className="text-dark font-medium">
                  {worker.created_at
                    ? new Date(worker.created_at).toLocaleDateString("es-US", {
                        year: "numeric",
                        month: "short",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* ===== RATINGS SECTION ===== */}
          {ratings && ratings.total > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mt-4">
              <h2 className="text-lg font-bold text-dark mb-6">⭐ Reseñas</h2>

              <div className="grid sm:grid-cols-2 gap-8">
                {/* Average + breakdown */}
                <div className="space-y-4">
                  {/* Big average */}
                  <div className="text-center sm:text-left">
                    <span className="text-5xl font-bold text-dark">{ratings.avg.toFixed(1)}</span>
                    <span className="text-gray text-sm ml-1">/ 5.0</span>
                    <div className="flex justify-center sm:justify-start gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(ratings.avg)
                              ? "text-accent"
                              : "text-gray-200"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm text-gray mt-1">
                      {ratings.total} reseña{ratings.total !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Breakdown bars */}
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className="flex items-center gap-2 text-sm">
                        <span className="text-gray w-3 text-right">{star}</span>
                        <svg className="w-3.5 h-3.5 text-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full transition-all duration-500"
                            style={{ width: `${pct(bd[star])}%` }}
                          />
                        </div>
                        <span className="text-gray w-8 text-right text-xs">{bd[star]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Individual reviews */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {ratings.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 rounded-xl border border-gray-100 bg-gray-50/50"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-dark">
                          {review.rater_name || `Usuario #${review.rater_id}`}
                        </span>
                        <span className="text-xs text-gray">
                          {review.created_at
                            ? new Date(review.created_at).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : ""}
                        </span>
                      </div>
                      <div className="flex gap-0.5 mb-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= Math.round(review.rating)
                                ? "text-accent"
                                : "text-gray-200"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="text-center mt-6">
            {isWorker ? (
              <p className="text-sm text-gray">
                ¿Tienes un trabajo para este trabajador?{" "}
                <Link href="/jobs/new" className="text-primary hover:underline font-medium">
                  Publica un trabajo
                </Link>
              </p>
            ) : (
              <p className="text-sm text-gray">
                ¿Quieres trabajar con este contratista?{" "}
                <Link href="/jobs" className="text-primary hover:underline font-medium">
                  Busca sus trabajos
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
