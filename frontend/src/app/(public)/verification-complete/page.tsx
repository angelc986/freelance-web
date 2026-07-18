"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getVerificationStatus } from "@/lib/api";

type Status = "checking" | "verified" | "pending" | "error";

export default function VerificationCompletePage() {
  const [status, setStatus] = useState<Status>("checking");
  const [dots, setDots] = useState("");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await getVerificationStatus();
        if (res.is_verified) {
          setStatus("verified");
          return;
        }
        setStatus("pending");
      } catch {
        setStatus("error");
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setStatus((s) => (s === "checking" ? "pending" : s));
    }, 60000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Animated dots
  useEffect(() => {
    if (status !== "checking") return;
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 500);
    return () => clearInterval(t);
  }, [status]);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#0B1120]">
      {/* █═ Animated background █═══ */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #2563EB, transparent 70%)" }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #059669, transparent 70%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #3B82F6, transparent 70%)" }} />

        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* █═ Card █═══ */}
      <div className="relative z-10 w-full max-w-[420px]">
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-10 shadow-2xl text-center">

          {/* █═ Icon █═══ */}
          <div className="relative mx-auto w-24 h-24 mb-8">
            {/* Glow behind icon */}
            <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-1000 ${
              status === "verified" ? "bg-emerald-500/40 scale-150" : "bg-blue-500/30"
            }`} />

            {/* Circle */}
            <div className={`relative w-full h-full rounded-full flex items-center justify-center transition-all duration-700 ${
              status === "verified"
                ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30"
                : "bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/30"
            }`}>
              {status === "verified" ? (
                <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" className="animate-[draw_0.6s_ease-out_forwards]"
                    style={{ strokeDasharray: 30, strokeDashoffset: 0 }} />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                  <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
            </div>
          </div>

          {/* █═ Content █═══ */}
          {status === "verified" ? (
            <>
              <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">
                Identidad verificada
              </h1>
              <p className="text-gray-400 text-[15px] leading-relaxed mb-3">
                Tu identidad ha sido verificada exitosamente. Ya puedes publicar y postularte a trabajos sin restricciones.
              </p>
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-[13px] mb-8">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Verificado correctamente
              </div>
            </>
          ) : status === "checking" ? (
            <>
              <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">
                Verificando identidad{dots}
              </h1>
              <p className="text-gray-400 text-[15px] leading-relaxed mb-8">
                Estamos procesando tu verificación. Esto tomará solo unos segundos.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">
                Verificación en proceso
              </h1>
              <p className="text-gray-400 text-[15px] leading-relaxed mb-3">
                Tu verificación aún no se ha completado. Si ya terminaste en Didit, espera unos segundos mientras confirmamos los datos.
              </p>
              <p className="text-gray-500 text-[13px] mb-8">
                Si el problema persiste, vuelve a intentar desde el dashboard.
              </p>
            </>
          )}

          {/* █═ Button █═══ */}
          <Link
            href="/dashboard"
            className={`group relative inline-flex items-center justify-center w-full px-6 py-3.5 rounded-2xl font-semibold text-[15px] transition-all duration-300 overflow-hidden ${
              status === "verified"
                ? "text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                : "text-white border border-white/20 hover:bg-white/10"
            }`}
            style={status === "verified" ? { background: "linear-gradient(135deg, #059669, #10B981)" } : {}}
          >
            {status === "verified" && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(135deg, #10B981, #059669)" }} />
            )}
            <span className="relative z-10 flex items-center gap-2">
              Ir al Dashboard
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-[13px] mt-8">
          TurnoGO — Tu seguridad es nuestra prioridad
        </p>
      </div>
    </div>
  );
}
