"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { listJobs, type Job } from "@/lib/api";
import Logo from "@/components/Logo";
import PullToRefresh from "@/components/PullToRefresh";

const categories = [
  "Todas", "Gastronomía", "Logística", "Servicios", "Limpieza", "Eventos", "Retail",
];

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
              <Link href="/dashboard" className="text-sm text-gray hover:text-dark transition-colors">Dashboard</Link>
            ) : (
              <>
                <a href="/auth/login" className="text-sm text-gray hover:text-dark transition-colors">Iniciar sesión</a>
                <a href="/auth/register" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-full hover:bg-primary-dark transition-all">Registrarse</a>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 bg-light">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-dark">Trabajos disponibles</h1>
            <p className="text-gray text-sm mt-1">Encuentra el turno ideal cerca de ti</p>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  category === c
                    ? "bg-primary text-white"
                    : "bg-white border border-gray-200 text-gray hover:border-primary hover:text-primary"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Job list */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <PullToRefresh onRefresh={refreshJobs}>
              {filtered.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                  <p className="text-4xl mb-3">🔍</p>
                  <p className="text-gray">No hay trabajos disponibles en esta categoría</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filtered.map((job) => (
                    <a
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="bg-white rounded-xl p-5 border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-dark group-hover:text-primary transition-colors">
                            {job.title}
                          </h3>
                          <p className="text-sm text-gray mt-1 line-clamp-2">{job.description}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray">
                            <span>📍 {job.location}</span>
                            <span>📂 {job.category}</span>
                            <span>⏱️ {job.duration}</span>
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
