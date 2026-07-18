"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { getVerificationStatus } from "@/lib/api";
import "../auth/auth.css";

type Status = "checking" | "verified" | "pending" | "rejected";

/* ═════════════ MESH GRADIENT (igual que auth) ═════════════ */
function useMeshGradient(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let nodes: { x: number; y: number; dx: number; dy: number; color: { r: number; g: number; b: number } }[] = [];
    let animId = 0;

    function init() {
      const w = canvas!.clientWidth; const h = canvas!.clientHeight;
      canvas!.width = w; canvas!.height = h;
      nodes = [
        { x: 0.15, y: 0.20, dx: 0.010, dy: 0.007, color: { r: 37, g: 99, b: 235 } },
        { x: 0.78, y: 0.18, dx: -0.008, dy: 0.009, color: { r: 59, g: 130, b: 246 } },
        { x: 0.82, y: 0.75, dx: 0.007, dy: -0.010, color: { r: 96, g: 165, b: 250 } },
        { x: 0.18, y: 0.78, dx: -0.011, dy: -0.006, color: { r: 147, g: 197, b: 253 } },
        { x: 0.50, y: 0.50, dx: 0.006, dy: 0.008, color: { r: 29, g: 78, b: 216 } },
      ];
    }

    function draw() {
      const w = canvas!.width; const h = canvas!.height;
      const imageData = ctx!.createImageData(w, h);
      const data = imageData.data;
      for (const n of nodes) {
        n.x += n.dx; n.y += n.dy;
        if (n.x < -0.15 || n.x > 1.15) n.dx *= -1;
        if (n.y < -0.15 || n.y > 1.15) n.dy *= -1;
      }
      const step = 2;
      for (let py = 0; py < h; py += step) {
        for (let px = 0; px < w; px += step) {
          const xn = px / w, yn = py / h;
          let r = 0, g = 0, b = 0, tw = 0;
          for (const n of nodes) {
            const ds = (xn - n.x) * (xn - n.x) + (yn - n.y) * (yn - n.y);
            const wgt = 1 / (ds * ds + 0.0002);
            r += n.color.r * wgt; g += n.color.g * wgt; b += n.color.b * wgt; tw += wgt;
          }
          r = Math.min(255, Math.round(r / tw * 1.1));
          g = Math.min(255, Math.round(g / tw * 1.1));
          b = Math.min(255, Math.round(b / tw * 1.1));
          const idx = (py * w + px) * 4;
          for (let dy = 0; dy < step && py + dy < h; dy++)
            for (let dx = 0; dx < step && px + dx < w; dx++) {
              const i = idx + (dy * w + dx) * 4;
              data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
            }
        }
      }
      ctx!.putImageData(imageData, 0, 0);
      animId = window.setTimeout(() => requestAnimationFrame(draw), 40);
    }

    init(); draw();
    const handleResize = () => { init(); };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId); clearTimeout(animId);
    };
  }, [canvasRef]);
}

/* ═════════════ PARTICLES (igual que auth) ═════════════ */
function useParticles(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    interface Particle { x: number; y: number; size: number; speedX: number; speedY: number; opacity: number; hue: string; }
    let particles: Particle[] = [];
    let animId = 0;

    function reset() {
      const w = canvas!.clientWidth; const h = canvas!.clientHeight;
      canvas!.width = w; canvas!.height = h;
      particles = Array.from({ length: 12 }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.1, speedY: (Math.random() - 0.5) * 0.1,
        opacity: Math.random() * 0.12 + 0.02,
        hue: "#2563EB",
      }));
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (const p of particles) {
        p.x += p.speedX; p.y += p.speedY;
        if (p.x < -10 || p.x > canvas!.width + 10) p.speedX *= -1;
        if (p.y < -10 || p.y > canvas!.height + 10) p.speedY *= -1;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(37,99,235,${p.opacity})`;
        ctx!.fill();
      }
      animId = requestAnimationFrame(draw);
    }

    reset(); draw();
    const handleResize = () => { reset(); };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, [canvasRef]);
}

/* ═════════════ PAGE ═════════════ */
export default function VerificationCompletePage() {
  const [status, setStatus] = useState<Status>("checking");
  const [dots, setDots] = useState("");
  const meshRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useMeshGradient(meshRef);
  useParticles(particlesRef);

  const checkStatus = useCallback(async () => {
    try {
      const res = await getVerificationStatus();
      if (res.is_verified) { setStatus("verified"); return; }
      setStatus("pending");
    } catch { setStatus("pending"); }
  }, []);

  useEffect(() => {
    checkStatus();
    intervalRef.current = setInterval(checkStatus, 3000);
    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setStatus((s) => (s === "checking" ? "pending" : s));
    }, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [checkStatus]);

  useEffect(() => {
    if (status !== "checking") return;
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 500);
    return () => clearInterval(t);
  }, [status]);

  return (
    <>
      {/* Force body/background identical to auth.css */}
      <style>{`
        html, body { margin: 0 !important; padding: 0 !important; height: 100% !important; overflow: hidden !important; background: linear-gradient(to bottom, #EFF6FF 0%, #EFF6FF 92%, #DBEAFE 96%, #BFDBFE 98%, #fff 100%) !important; }
      `}</style>

      <div className="phone-frame">
        <canvas ref={meshRef} className="mesh-canvas" />
        <div className="blob-layer">
          <div className="blob blob-1" /><div className="blob blob-2" />
          <div className="blob blob-3" /><div className="blob blob-4" /><div className="blob blob-5" />
        </div>
        <div className="aurora" />
        <canvas ref={particlesRef} className="particle-canvas" />

        <div className="glass-container">
          <div className="screen screen-active" style={{ pointerEvents: "auto" }}>
            {/* Top bar — identical to auth TopRowLogo */}
            <div className="top-row top-bar">
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/dashboard">
                    <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs><linearGradient id="vclg" x1="0" y1="0" x2="48" y2="48"><stop offset="0%" stopColor="#2563EB"/><stop offset="100%" stopColor="#1D4ED8"/></linearGradient></defs>
                      <circle cx="24" cy="24" r="22" fill="url(#vclg)"/>
                      <path d="M15 16h18M24 16v16" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
                      <path d="M33 28c3-2.5 4-6 3.5-9" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
                      <circle cx="36.5" cy="19" r="1.5" fill="white" opacity="0.8"/>
                      <circle cx="24" cy="24" r="3" fill="white" opacity="0.6"/>
                    </svg>
                  </Link>
                  <span className="logo-text" style={{ fontSize: 22 }}>Turno<span style={{ color: "#2563EB" }}>GO</span></span>
                  <div className="w-px h-4 bg-gray-300 mx-1" />
                </div>
                <Link href="/dashboard" className="btn-back" style={{ marginLeft: 0 }} aria-label="Volver">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              {/* Icon */}
              <div className="relative mx-auto w-20 h-20 mb-5">
                <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-1000 ${
                  status === "verified" ? "bg-[#2563EB]/30 scale-150" :
                  status === "rejected" ? "bg-red-400/30 scale-150" :
                  "bg-[#2563EB]/20"
                }`} />
                <div className={`relative w-full h-full rounded-full flex items-center justify-center transition-all duration-700 ${
                  status === "verified" ? "bg-gradient-to-br from-[#2563EB] to-[#1D4ED8]" :
                  status === "rejected" ? "bg-gradient-to-br from-red-400 to-red-600" :
                  "bg-gradient-to-br from-[#2563EB] to-[#1D4ED8]"
                }`}>
                  {status === "verified" ? (
                    <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  ) : status === "rejected" ? (
                    <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  ) : (
                    <svg className="w-9 h-9 text-white animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" /><path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                  )}
                </div>
              </div>

              {status === "verified" ? (
                <>
                  <h1 className="text-[26px] font-extrabold tracking-tight text-gray-900 mb-2">¡Identidad verificada!</h1>
                  <p className="text-gray-500 text-[15px] max-w-[280px] mx-auto leading-relaxed mb-3">Tu identidad ha sido verificada exitosamente. Ya puedes publicar y postularte a trabajos sin restricciones.</p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] text-[13px] font-medium border border-blue-200/50 mb-6">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Verificación completada
                  </span>
                </>
              ) : status === "rejected" ? (
                <>
                  <h1 className="text-[26px] font-extrabold tracking-tight text-gray-900 mb-2">Verificación rechazada</h1>
                  <p className="text-gray-500 text-[15px] max-w-[280px] mx-auto leading-relaxed mb-3">No pudimos verificar tu identidad. Intenta de nuevo o contacta a soporte.</p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-[13px] font-medium border border-red-200/50 mb-6">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                    No se pudo verificar
                  </span>
                </>
              ) : status === "checking" ? (
                <>
                  <h1 className="text-[26px] font-extrabold tracking-tight text-gray-900 mb-2">Verificando identidad{dots}</h1>
                  <p className="text-gray-500 text-[15px] max-w-[280px] mx-auto leading-relaxed mb-6">Estamos procesando tu verificación. Esto tomará solo unos segundos.</p>
                  <div className="w-full max-w-[200px] mx-auto">
                    <div className="h-1 bg-blue-100 rounded-full overflow-hidden"><div className="h-full bg-[#2563EB] rounded-full animate-pulse w-full" /></div>
                    <p className="text-gray-400 text-[12px] mt-2">Esperando confirmación</p>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-[26px] font-extrabold tracking-tight text-gray-900 mb-2">Pendiente de confirmación</h1>
                  <p className="text-gray-500 text-[15px] max-w-[280px] mx-auto leading-relaxed mb-6">Tu verificación aún no se ha completado. Si ya terminaste en Didit, espera mientras confirmamos tus datos.</p>
                </>
              )}

              <Link
                href="/dashboard"
                className={`btn-main ${status === "rejected" ? "" : ""}`}
                style={status === "rejected" ? {
                  background: "transparent", color: "#DC2626", border: "2px solid #FECACA",
                  boxShadow: "none", animation: "none",
                } : status === "verified" ? {} : {
                  background: "transparent", color: "#2563EB", border: "2px solid rgba(37,99,235,0.3)",
                  boxShadow: "none", animation: "none",
                }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    {status === "verified" ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    )}
                  </svg>
                  {status === "verified" ? "Ir al Dashboard" : status === "rejected" ? "Volver a intentar" : "Volver al Dashboard"}
                </span>
              </Link>

              <p className="text-gray-400 text-[13px] mt-8">TurnoGO — Tu seguridad es nuestra prioridad</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
