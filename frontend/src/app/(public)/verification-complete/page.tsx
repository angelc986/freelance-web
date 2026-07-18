"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getVerificationStatus } from "@/lib/api";

type Status = "checking" | "verified" | "pending" | "error";

function TurnoGOLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#logo-g)" />
      {/* T */}
      <path d="M10 10h20v2.5H21.5V30h-3V12.5H10V10z" fill="white" />
    </svg>
  );
}

export default function VerificationCompletePage() {
  const [status, setStatus] = useState<Status>("checking");
  const [dots, setDots] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const checkStatus = async () => {
    try {
      const res = await getVerificationStatus();
      if (res.is_verified) { setStatus("verified"); return; }
      setStatus("pending");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
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
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-white">
      {/* █═ Animated background █═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.08] animate-pulse"
          style={{ background: "radial-gradient(circle, #2563EB, transparent 70%)", animationDuration: "6s" }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.06] animate-pulse"
          style={{ background: "radial-gradient(circle, #059669, transparent 70%)", animationDuration: "8s" }} />

        {/* Dots pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #2563EB 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* █═ Card █═══ */}
      <div className={`relative z-10 w-full max-w-[420px] transition-all duration-700 ${
        mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200/60 p-10 shadow-xl shadow-blue-900/5 text-center">

          {/* █═ Logo + Brand █═══ */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <TurnoGOLogo size={36} />
            <span className="text-xl font-bold bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] bg-clip-text text-transparent tracking-tight">
              TurnoGO
            </span>
          </div>

          {/* █═ Icon █═══ */}
          <div className="relative mx-auto w-24 h-24 mb-6">
            {/* Glow */}
            <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-1000 ${
              status === "verified" ? "bg-emerald-400/30 scale-150" : "bg-blue-400/20"
            }`} />

            {/* Circle */}
            <div className={`relative w-full h-full rounded-full flex items-center justify-center transition-all duration-700 shadow-lg ${
              status === "verified"
                ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-200/50"
                : "bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-200/50"
            }`}>
              {status === "verified" ? (
                <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"
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
                <svg className="w-10 h-10 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                  <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
            </div>
          </div>

          {/* █═ Content █═══ */}
          <div className="space-y-2 mb-8">
            {status === "verified" ? (
              <>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  ¡Identidad verificada!
                </h1>
                <p className="text-gray-500 text-[15px] leading-relaxed">
                  Tu identidad ha sido verificada exitosamente. Ya puedes publicar y postularte a trabajos sin restricciones.
                </p>
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[13px] font-medium border border-emerald-200/50">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verificación completada
                  </span>
                </div>
              </>
            ) : status === "checking" ? (
              <>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Verificando identidad{dots}
                </h1>
                <p className="text-gray-500 text-[15px] leading-relaxed">
                  Estamos procesando tu verificación. Esto tomará solo unos segundos.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Pendiente de confirmación
                </h1>
                <p className="text-gray-500 text-[15px] leading-relaxed">
                  Tu verificación aún no se ha completado. Si ya terminaste el proceso en Didit, espera mientras confirmamos tus datos.
                </p>
              </>
            )}
          </div>

          {/* █═ Button █═══ */}
          <Link
            href="/dashboard"
            className={`group relative inline-flex items-center justify-center w-full px-6 py-3.5 rounded-2xl font-semibold text-[15px] transition-all duration-300 overflow-hidden ${
              status === "verified"
                ? "text-white shadow-lg shadow-emerald-200/50 hover:shadow-emerald-300/60"
                : "text-[#2563EB] border-2 border-[#2563EB]/30 hover:bg-blue-50 hover:border-[#2563EB]"
            }`}
            style={status === "verified" ? { background: "linear-gradient(135deg, #059669, #10B981)" } : {}}
          >
            {status === "verified" && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <svg className={`w-5 h-5 transition-all duration-300 ${status === "verified" ? "group-hover:scale-110" : "group-hover:rotate-[-10deg]"}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

          {/* Progress bar for checking state */}
          {status === "checking" && (
            <div className="mt-6">
              <div className="h-1 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] rounded-full animate-pulse"
                  style={{ animationDuration: "2s", width: "100%" }}
                />
              </div>
              <p className="text-gray-400 text-[12px] mt-2">Esperando confirmación del servicio de verificación</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-[13px] mt-6">
          TurnoGO — Tu seguridad es importante para nosotros
        </p>
      </div>
    </div>
  );
}
