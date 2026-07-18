"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getVerificationStatus } from "@/lib/api";

type Status = "checking" | "verified" | "pending" | "rejected";

export default function VerificationCompletePage() {
  const [status, setStatus] = useState<Status>("checking");
  const [dots, setDots] = useState("");

  const checkStatus = async () => {
    try {
      const res = await getVerificationStatus();
      if (res.is_verified) { setStatus("verified"); return; }
      setStatus("pending");
    } catch { setStatus("pending"); }
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

  const logo = (
    <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="lgt" x1="0" y1="0" x2="48" y2="48"><stop offset="0%" stopColor="#2563EB"/><stop offset="100%" stopColor="#1D4ED8"/></linearGradient></defs>
      <circle cx="24" cy="24" r="22" fill="url(#lgt)"/>
      <path d="M15 16h18M24 16v16" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M33 28c3-2.5 4-6 3.5-9" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
      <circle cx="36.5" cy="19" r="1.5" fill="white" opacity="0.8"/>
      <circle cx="24" cy="24" r="3" fill="white" opacity="0.6"/>
    </svg>
  );

  return (
    <div style={{
      position: "absolute",
      top: 0, right: 0, bottom: 0, left: 0,
      height: "100dvh",
      overflow: "hidden",
      background: "linear-gradient(to bottom, #EFF6FF 0%, #EFF6FF 92%, #DBEAFE 96%, #BFDBFE 98%, #fff 100%)",
    }}>
      {/* Blobs flotantes */}
      <div style={{
        position: "absolute", top: 0, right: 0, bottom: 0, left: 0,
        zIndex: 1, overflow: "hidden", pointerEvents: "none",
      }}>
        <div style={{
          position: "absolute", width: "65%", height: "65%",
          top: "-20%", left: "-15%",
          borderRadius: "50%", filter: "blur(70px)", opacity: 0.45,
          background: "radial-gradient(circle, #3B82F6, transparent 70%)",
          animation: "float1 20s infinite alternate",
        }} />
        <div style={{
          position: "absolute", width: "55%", height: "55%",
          bottom: "-25%", right: "-10%",
          borderRadius: "50%", filter: "blur(70px)", opacity: 0.45,
          background: "radial-gradient(circle, #2563EB, transparent 70%)",
          animation: "float2 24s infinite alternate",
        }} />
        <div style={{
          position: "absolute", width: "50%", height: "50%",
          top: "30%", left: "35%",
          borderRadius: "50%", filter: "blur(70px)", opacity: 0.45,
          background: "radial-gradient(circle, #60A5FA, transparent 70%)",
          animation: "float3 30s infinite alternate",
        }} />
        <div style={{
          position: "absolute", width: "40%", height: "40%",
          top: "55%", left: "-8%",
          borderRadius: "50%", filter: "blur(70px)", opacity: 0.45,
          background: "radial-gradient(circle, #93C5FD, transparent 70%)",
          animation: "float4 28s infinite alternate",
        }} />
        <div style={{
          position: "absolute", width: "45%", height: "45%",
          top: "5%", right: "0",
          borderRadius: "50%", filter: "blur(70px)", opacity: 0.45,
          background: "radial-gradient(circle, #1D4ED8, transparent 70%)",
          animation: "float5 36s infinite alternate",
        }} />
      </div>

      {/* Aurora */}
      <div style={{
        position: "absolute", top: 0, right: 0, bottom: 0, left: 0,
        zIndex: 2, pointerEvents: "none",
        background: "conic-gradient(from 0deg at 50% 50%, transparent 0%, rgba(37,99,235,0.06) 25%, transparent 50%, rgba(59,130,246,0.04) 75%, transparent 100%)",
        filter: "blur(80px)",
        animation: "auroraSpin 45s linear infinite",
        opacity: 0.4,
      }} />

      {/* Glass container */}
      <div style={{
        position: "absolute", top: 0, right: 0, bottom: 0, left: 0,
        zIndex: 10,
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(18px) saturate(1.2)",
        WebkitBackdropFilter: "blur(18px) saturate(1.2)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 8, right: 8, height: 1,
          background: "linear-gradient(to right, transparent 5%, rgba(255,255,255,0.6) 25%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.6) 75%, transparent 95%)",
          zIndex: 99, pointerEvents: "none",
        }} />

        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflowY: "auto", padding: "48px 24px 12px" }}>
          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Logo + texto: desktop */}
              <div className="hidden md:flex items-center gap-2">
                <Link href="/dashboard">{logo}</Link>
                <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: "#1E293B" }}>Turno<span style={{ color: "#2563EB" }}>GO</span></span>
                <div style={{ width: 1, height: 16, background: "#D1D5DB", margin: "0 4px" }} />
              </div>
              {/* Back arrow */}
              <Link href="/dashboard" style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", cursor: "pointer" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "0 24px" }}>
            <div style={{ position: "relative", width: 80, height: 80, marginBottom: 20 }}>
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                filter: "blur(24px)", transition: "all 1s",
                background: status === "verified" ? "rgba(37,99,235,0.3)" : status === "rejected" ? "rgba(248,113,113,0.3)" : "rgba(37,99,235,0.2)",
                transform: status === "verified" || status === "rejected" ? "scale(1.5)" : "scale(1)",
              }} />
              <div style={{
                position: "relative", width: "100%", height: "100%", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: status === "verified"
                  ? "linear-gradient(135deg, #2563EB, #1D4ED8)"
                  : status === "rejected"
                  ? "linear-gradient(135deg, #F87171, #DC2626)"
                  : "linear-gradient(135deg, #2563EB, #1D4ED8)",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                transition: "all 0.7s",
              }}>
                {status === "verified" ? (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : status === "rejected" ? (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                ) : (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" style={{ opacity: 0.2 }} />
                    <path d="M12 2a10 10 0 019.95 9" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                )}
              </div>
            </div>

            {status === "verified" ? (
              <>
                <h1 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "#1E293B", marginBottom: 8 }}>¡Identidad verificada!</h1>
                <p style={{ color: "#64748B", fontSize: 15, maxWidth: 280, lineHeight: 1.5, marginBottom: 12 }}>Tu identidad ha sido verificada exitosamente. Ya puedes publicar y postularte a trabajos sin restricciones.</p>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, background: "#EFF6FF", color: "#2563EB", fontSize: 13, fontWeight: 500, border: "1px solid rgba(37,99,235,0.2)", marginBottom: 24 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verificación completada
                </span>
              </>
            ) : status === "rejected" ? (
              <>
                <h1 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "#1E293B", marginBottom: 8 }}>Verificación rechazada</h1>
                <p style={{ color: "#64748B", fontSize: 15, maxWidth: 280, lineHeight: 1.5, marginBottom: 12 }}>No pudimos verificar tu identidad. Intenta de nuevo o contacta a soporte.</p>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, background: "#FEF2F2", color: "#DC2626", fontSize: 13, fontWeight: 500, border: "1px solid rgba(220,38,38,0.2)", marginBottom: 24 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  No se pudo verificar
                </span>
              </>
            ) : status === "checking" ? (
              <>
                <h1 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "#1E293B", marginBottom: 8 }}>Verificando identidad{dots}</h1>
                <p style={{ color: "#64748B", fontSize: 15, maxWidth: 280, lineHeight: 1.5, marginBottom: 24 }}>Estamos procesando tu verificación. Esto tomará solo unos segundos.</p>
                <div style={{ width: "100%", maxWidth: 200 }}>
                  <div style={{ height: 4, background: "#DBEAFE", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "#2563EB", borderRadius: 4, width: "100%", animation: "pulse 2s ease-in-out infinite" }} />
                  </div>
                  <p style={{ color: "#9CA3AF", fontSize: 12, marginTop: 8 }}>Esperando confirmación</p>
                </div>
              </>
            ) : (
              <>
                <h1 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "#1E293B", marginBottom: 8 }}>Pendiente de confirmación</h1>
                <p style={{ color: "#64748B", fontSize: 15, maxWidth: 280, lineHeight: 1.5, marginBottom: 24 }}>Tu verificación aún no se ha completado. Si ya terminaste en Didit, espera mientras confirmamos tus datos.</p>
              </>
            )}

            <Link href="/dashboard" style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", maxWidth: 260, padding: "14px 24px",
              borderRadius: 12, fontWeight: 600, fontSize: 15, textDecoration: "none",
              transition: "all 0.3s",
              background: status === "verified" ? "linear-gradient(135deg, #2563EB, #3B82F6)" : undefined,
              color: status === "verified" ? "white" : status === "rejected" ? "#DC2626" : "#2563EB",
              border: status === "verified" ? "none" : status === "rejected" ? "2px solid #FECACA" : "2px solid rgba(37,99,235,0.3)",
              boxShadow: status === "verified" ? "0 4px 15px rgba(37,99,235,0.3)" : undefined,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                {status === "verified" ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                )}
              </svg>
              {status === "verified" ? "Ir al Dashboard" : status === "rejected" ? "Volver a intentar" : "Volver al Dashboard"}
            </Link>

            <p style={{ color: "#9CA3AF", fontSize: 13, marginTop: 32 }}>TurnoGO — Tu seguridad es nuestra prioridad</p>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes float1 { 0% { transform: translate(0,0) scale(1) rotate(0); } 33% { transform: translate(40px,-25px) scale(1.12) rotate(4deg); } 66% { transform: translate(-20px,15px) scale(0.92) rotate(-2deg); } 100% { transform: translate(15px,-8px) scale(1.04) rotate(1deg); } }
        @keyframes float2 { 0% { transform: translate(0,0) scale(1) rotate(0); } 50% { transform: translate(-35px,20px) scale(1.15) rotate(-6deg); } 100% { transform: translate(20px,-15px) scale(0.88) rotate(5deg); } }
        @keyframes float3 { 0% { transform: translate(0,0) scale(1) rotate(0); } 25% { transform: translate(25px,8px) scale(1.08) rotate(2deg); } 75% { transform: translate(-40px,-20px) scale(0.94) rotate(-3deg); } 100% { transform: translate(8px,25px) scale(1.06) rotate(3deg); } }
        @keyframes float4 { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(-30px,-35px) scale(1.2); } 100% { transform: translate(35px,15px) scale(0.82); } }
        @keyframes float5 { 0% { transform: translate(0,0) scale(1) rotate(0); } 40% { transform: translate(-45px,12px) scale(0.92) rotate(-3deg); } 80% { transform: translate(20px,-25px) scale(1.12) rotate(5deg); } 100% { transform: translate(-8px,8px) scale(1.04) rotate(-1deg); } }
        @keyframes auroraSpin { to { transform: rotate(360deg); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
