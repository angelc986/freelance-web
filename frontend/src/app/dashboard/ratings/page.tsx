"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getUserRatings, type UserRatingSummary } from "@/lib/api";
import EmptyState from "@/components/EmptyState";
import PullToRefresh from "@/components/PullToRefresh";
import { StatSkeleton, CardSkeleton } from "@/components/Skeleton";

export default function RatingsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<UserRatingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRatings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const d = await getUserRatings(user.id);
      setData(d);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadRatings();
  }, [user]);

  if (!user) return null;

  const bd = data?.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const total = data?.total || 0;
  const avg = data?.avg || 0;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <PullToRefresh onRefresh={loadRatings}>
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard" className="text-gray hover:text-primary transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-dark">Mis calificaciones</h1>
          <p className="text-sm text-gray mt-0.5">Reseñas recibidas de otros usuarios</p>
        </div>
      </div>

      {loading ? (
        <div className="animate-fade-in">
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-gray-200 shimmer mb-3" />
                  <div className="h-4 w-32 bg-gray-200 rounded shimmer" />
                </div>
                <div className="space-y-3">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-4 w-3 bg-gray-200 rounded shimmer" />
                      <div className="h-3 w-3 bg-gray-200 rounded shimmer" />
                      <div className="flex-1 h-3 bg-gray-200 rounded-full shimmer" />
                      <div className="h-4 w-4 bg-gray-200 rounded shimmer" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-3 space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="h-4 w-28 bg-gray-200 rounded shimmer" />
                      <div className="h-3 w-16 bg-gray-200 rounded shimmer" />
                    </div>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => <div key={s} className="w-4 h-4 bg-gray-200 rounded shimmer" />)}
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-full shimmer" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : total === 0 ? (
        <EmptyState
          title="Sin calificaciones aún"
          description={user.role === "worker"
            ? "Completa trabajos para recibir reseñas de los contratistas."
            : "Publica y completa trabajos para recibir reseñas."}
          variant="ratings"
          actionLabel={user.role === "worker" ? "Buscar trabajos" : "Publicar trabajo"}
          actionHref={user.role === "worker" ? "/jobs" : "/jobs/new"}
        />
      ) : (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* LEFT: Average + breakdown */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:sticky lg:top-8">
              {/* Big number */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-accent-light/50 border-4 border-accent/20 mb-3">
                  <span className="text-3xl font-bold text-dark">{avg.toFixed(1)}</span>
                </div>
                <div className="flex justify-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-5 h-5 ${star <= Math.round(avg) ? "text-accent" : "text-gray-200"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray mt-1">
                  {total} reseña{total !== 1 ? "s" : ""} en total
                </p>
              </div>

              {/* Breakdown bars */}
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="text-gray w-3 text-right">{star}</span>
                    <svg className="w-3.5 h-3.5 text-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-700"
                        style={{ width: `${pct(bd[star])}%` }}
                      />
                    </div>
                    <span className="text-gray w-6 text-right text-xs font-medium">{bd[star]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Reviews list */}
          <div className="lg:col-span-3 space-y-3">
            {data?.reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-semibold text-dark text-sm">
                      {review.rater_name || `Usuario #${review.rater_id}`}
                    </span>
                    <div className="flex gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${star <= Math.round(review.rating) ? "text-accent" : "text-gray-200"}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray flex-shrink-0">
                    {review.created_at
                      ? new Date(review.created_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : ""}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray mt-1 leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}
