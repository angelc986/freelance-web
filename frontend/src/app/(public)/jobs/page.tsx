"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { listJobs, type Job } from "@/lib/api";
import Logo from "@/components/Logo";
import NotificationBell from "@/components/NotificationBell";
import PullToRefresh from "@/components/PullToRefresh";
import EmptyState from "@/components/EmptyState";
import { StatSkeleton } from "@/components/Skeleton";

const categories = [
  "Todas", "Gastronomía", "Logística", "Servicios", "Limpieza", "Eventos", "Retail",
];

// ─── SVG ICONS ───
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

// ─── SKELETON ───
function JobListSkeleton() {
  return (
    <div className="grid gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-gray-200 rounded-lg w-2/3 shimmer" />
              <div className="h-4 bg-gray-200 rounded-lg w-full shimmer" />
              <div className="h-4 bg-gray-200 rounded-lg w-3/4 shimmer" />
              <div className="flex gap-4">
                <div className="h-3 bg-gray-200 rounded w-20 shimmer" />
                <div className="h-3 bg-gray-200 rounded w-16 shimmer" />
                <div className="h-3 bg-gray-200 rounded w-14 shimmer" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <div className="h-7 bg-gray-200 rounded-lg w-16 shimmer" />
              <div className="h-5 bg-gray-200 rounded-full w-14 shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("Todas");

  const refreshJobs = useCallback(async () => {
    const jobs = await listJobs("open");
    setJobs(jobs);
  }, []);

  useEffect(() => {
    setLoading(true);
    listJobs("open")
      .then(setJobs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = category === "Todas" ? jobs : jobs.filter((j) => j.category === category);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
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

      <div className="flex-1 bg-light">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Back + Header */}
          <div className="mb-8 animate-fade-in">
            <a
              href="/dashboard"
              className="btn-ripple inline-flex items-center gap-1.5 px-4 py-1.5 border border-gray-200 text-sm text-gray font-medium rounded-full hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all mb-4"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Volver
            </a>
            <h1 className="text-2xl font-bold text-dark">Trabajos disponibles</h1>
            <p className="text-gray text-sm mt-1">Encuentra el turno ideal cerca de ti</p>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-6 animate-fade-in" style={{ animationDelay: "0.05s" }}>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  category === c
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray hover:border-primary hover:text-primary"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Job list */}
          {loading ? (
            <JobListSkeleton />
          ) : (
            <PullToRefresh onRefresh={refreshJobs}>
              {filtered.length === 0 ? (
                <div className="animate-fade-in">
                  <EmptyState
                    title="No hay trabajos disponibles"
                    description={`No encontramos trabajos en la categoría "${category}". Prueba con otra categoría.`}
                    variant="search"
                  />
                </div>
              ) : (
                <div className="grid gap-4">
                  {filtered.map((job, idx) => (
                    <a
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="bg-white rounded-xl p-5 border border-gray-200 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all group animate-stagger-pop"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-dark group-hover:text-primary transition-colors">
                            {job.title}
                          </h3>
                          <p className="text-sm text-gray mt-1 line-clamp-2">{job.description}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray">
                            <span className="inline-flex items-center gap-1">
                              <IconLocation className="w-3.5 h-3.5" />
                              {job.location}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <IconFolder className="w-3.5 h-3.5" />
                              {job.category}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <IconClock className="w-3.5 h-3.5" />
                              {job.duration}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-primary">${job.budget}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-secondary-light text-secondary text-[11px] font-medium rounded-full">
                            Abierto
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </PullToRefresh>
          )}
        </div>
      </div>
    </div>
  );
}
