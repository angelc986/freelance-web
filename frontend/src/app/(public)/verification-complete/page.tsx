"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getVerificationStatus } from "@/lib/api";
import "./auth.css";

type Status = "checking" | "verified" | "pending" | "error";

export default function VerificationCompletePage() {
  const [status, setStatus] = useState<Status>("checking");
  const [dots, setDots] = useState("");
  const [mounted, setMounted] = useState(false);
  const meshRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const checkStatus = async () => {
    try {
      const res = await getVerificationStatus();
      if (res.is_verified) { setStatus("verified"); return; }
      setStatus("pending");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setStatus((s) => (s === "checking" ? "pending" : s));
    }, 60000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);

  useEffect(() => {
    if (status !== "checking") return;
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 500);
    return () => clearInterval(t);
  }, [status]);

  return (
    <div className="phone-frame">
      <canvas ref={meshRef} className="mesh-canvas" />
      <div className="blob-layer">
        <div className="blob blob-1" /><div className="blob blob-2" />
        <div className="blob blob-3" /><div className="blob blob-4" /><div className="blob blob-5" />
      </div>
      <div className="aurora" />
      <canvas ref={particlesRef} className="particle-canvas" />

      <div className={`glass-container transition-all duration-700 ${mounted ? "opacity-100" : "opacity-0"}`}>
        {/* ─── Logo flotante mobile ─── */}
        <div className="absolute left-4 z-30 md:hidden" style={{ top: "calc(env(safe-area-inset-top,0px) + 14px)" }}>
          <Link href="/dashboard">
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs><linearGradient id="lgv" x1="0" y1="0" x2="48" y2="48"><stop offset="0%" stopColor="#2563EB"/><stop offset="100%" stopColor="#1D4ED8"/></linearGradient></defs>
              <circle cx="24" cy="24" r="22" fill="url(#lgv)"/>
              <path d="M15 16h18M24 16v16" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
            </svg>
          </Link>
        </div>

        {/* ─── Top bar desktop ─── */}
        <div className="top-row top-bar">
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <Link href="/dashboard">
                <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs><linearGradient id="tlg2" x1="0" y1="0" x2="48" y2="48"><stop offset="0%" stopColor="#2563EB"/><stop offset="100%" stopColor="#1D4ED8"/></linearGradient></defs>
                  <circle cx="24" cy="24" r="22" fill="url(#tlg2)"/>
                  <path d="M15 16h18M24 16v16" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
                </svg>
              </Link>
              <span className="text-lg font-bold tracking-tight" style={{ color: "#1E293B" }}>Turno<span style={{ color: "#2563EB" }}>GO</span></span>
              <div className="w-px h-4 bg-gray-300 mx-1" />
            </div>
            <Link href="/dashboard" className="flex items-center gap-1.5 text-[#475569] hover:text-[#2563EB] transition-colors text-sm font-medium ml-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              Volver al Dashboard
            </Link>
          </div>
        </div>

        {/* ─── Content ─── */}
        <div className="flex-1 flex flex-col justify-center items-center text-center px-6" style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 12px)" }}>
          {/* Icon */}
          <div className="relative mx-auto w-20 h-20 mb-5">
            <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-1000 ${
              status === "verified" ? "bg-[#2563EB]/30 scale-150" : "bg-[#2563EB]/20"
            }`} />
            <div className={`relative w-full h-full rounded-full flex items-center justify-center transition-all duration-700 shadow-lg ${
              status === "verified"
                ? "bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] shadow-blue-200/50"
                : "bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] shadow-blue-200/50"
            }`}>
              {status === "verified" ? (
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"
                    style={{
                      strokeDasharray: 30,
                      strokeDashoffset: mounted ? 0 : 30,
                      transition: "stroke-dashoffset 0.6s ease-out 0.3s",
                    }}
                  />
                </svg>
              ) : (
                <svg className="w-9 h-9 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                  <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
            </div>
          </div>

          {/* Title + message */}
          {status === "verified" ? (
            <>
              <h1 className="text-[26px] font-extrabold tracking-tight text-gray-900 mb-2">
                ¡Identidad verificada!
              </h1>
              <p className="text-gray-500 text-[15px] max-w-[280px] mx-auto leading-relaxed mb-3">
                Tu identidad ha sido verificada exitosamente. Ya puedes publicar y postularte a trabajos sin restricciones.
              </p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] text-[13px] font-medium border border-blue-200/50 mb-6">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Verificación completada
              </span>
            </>
          ) : status === "checking" ? (
            <>
              <h1 className="text-[26px] font-extrabold tracking-tight text-gray-900 mb-2">
                Verificando identidad{dots}
              </h1>
              <p className="text-gray-500 text-[15px] max-w-[280px] mx-auto leading-relaxed mb-6">
                Estamos procesando tu verificación. Esto tomará solo unos segundos.
              </p>
              <div className="w-full max-w-[200px] mx-auto">
                <div className="h-1 bg-blue-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#2563EB] rounded-full animate-pulse" style={{ width: "100%" }} />
                </div>
                <p className="text-gray-400 text-[12px] mt-2">Esperando confirmación</p>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-[26px] font-extrabold tracking-tight text-gray-900 mb-2">
                Pendiente de confirmación
              </h1>
              <p className="text-gray-500 text-[15px] max-w-[280px] mx-auto leading-relaxed mb-6">
                Tu verificación aún no se ha completado. Si ya terminaste en Didit, espera mientras confirmamos tus datos.
              </p>
            </>
          )}

          {/* Button */}
          <Link
            href="/dashboard"
            className={`group relative inline-flex items-center justify-center w-full max-w-[260px] px-6 py-3.5 rounded-2xl font-semibold text-[15px] transition-all duration-300 overflow-hidden ${
              status === "verified"
                ? "text-white shadow-lg shadow-blue-200/50 hover:shadow-blue-300/60"
                : "text-[#2563EB] border-2 border-[#2563EB]/30 hover:bg-blue-50 hover:border-[#2563EB]"
            }`}
            style={status === "verified" ? { background: "linear-gradient(135deg, #2563EB, #1D4ED8)" } : {}}
          >
            {status === "verified" && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(135deg, #1D4ED8, #1E40AF)" }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {status === "verified" ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                )}
              </svg>
              {status === "verified" ? "Ir al Dashboard" : "Volver al Dashboard"}
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </Link>

          {/* Footer */}
          <p className="text-gray-400 text-[13px] mt-8">
            TurnoGO — Tu seguridad es nuestra prioridad
          </p>
        </div>
      </div>
    </div>
  );
}
