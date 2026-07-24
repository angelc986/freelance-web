"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "@/lib/api";
import Logo from "@/components/Logo";
import "../auth.css";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MESH GRADIENT (Canvas) — mismo que auth/page.tsx
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function useMeshGradient(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let nodes: { x: number; y: number; dx: number; dy: number; color: { r: number; g: number; b: number } }[] = [];
    let animId = 0;

    function init() {
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      canvas!.width = w;
      canvas!.height = h;
      nodes = [
        { x: 0.15, y: 0.20, dx: 0.010, dy: 0.007, color: { r: 37, g: 99, b: 235 } },
        { x: 0.78, y: 0.18, dx: -0.008, dy: 0.009, color: { r: 59, g: 130, b: 246 } },
        { x: 0.82, y: 0.75, dx: 0.007, dy: -0.010, color: { r: 96, g: 165, b: 250 } },
        { x: 0.18, y: 0.78, dx: -0.011, dy: -0.006, color: { r: 147, g: 197, b: 253 } },
        { x: 0.50, y: 0.50, dx: 0.006, dy: 0.008, color: { r: 29, g: 78, b: 216 } },
      ];
    }

    function draw() {
      const w = canvas!.width;
      const h = canvas!.height;
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
          const xn = px / w;
          const yn = py / h;
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
          for (let dy = 0; dy < step && py + dy < h; dy++) {
            for (let dx = 0; dx < step && px + dx < w; dx++) {
              const i = idx + (dy * w + dx) * 4;
              data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
            }
          }
        }
      }

      ctx!.putImageData(imageData, 0, 0);
      animId = window.setTimeout(() => requestAnimationFrame(draw), 40);
    }

    init();
    draw();

    const handleResize = () => { init(); };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      clearTimeout(animId);
    };
  }, [canvasRef]);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PARTICLES (Canvas) — mismo que auth/page.tsx
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function useParticles(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    interface Particle {
      x: number; y: number; size: number;
      speedX: number; speedY: number; opacity: number; hue: string;
    }
    let particles: Particle[] = [];
    let animId = 0;

    function reset() {
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      canvas!.width = w;
      canvas!.height = h;
      particles = Array.from({ length: 12 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.1,
        speedY: (Math.random() - 0.5) * 0.1,
        opacity: Math.random() * 0.12 + 0.02,
        hue: Math.random() > 0.3 ? "37,99,235" : "59,130,246",
      }));
    }

    function animate() {
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.speedX; p.y += p.speedY;
        if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; if (p.y > h + 10) p.y = -10;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${p.hue},${p.opacity})`;
        ctx!.fill();
      }
      animId = requestAnimationFrame(animate);
    }

    reset();
    animate();

    const handleResize = () => reset();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, [canvasRef]);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   FLOATING PARTICLES (CSS burbujas)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function Bubbles({ count = 15 }: { count?: number }) {
  const bubbles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
    duration: `${6 + Math.random() * 6}s`,
  }));

  return (
    <>
      {bubbles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            borderRadius: "50%",
            background: "#2563EB",
            opacity: 0.18,
            pointerEvents: "none",
            zIndex: 11,
            width: p.size,
            height: p.size,
            left: p.left,
            top: p.top,
            animation: "float-particle 6s ease-in-out infinite",
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PASSWORD STRENGTH CHECKER
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: "Muy debil", color: "#EF4444" };
  if (score === 2) return { score, label: "Debil", color: "#F59E0B" };
  if (score === 3) return { score, label: "Buena", color: "#3B82F6" };
  if (score === 4) return { score, label: "Fuerte", color: "#10B981" };
  return { score, label: "Muy fuerte", color: "#059669" };
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   RESET PASSWORD FORM
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const strength = getStrength(newPassword);
  const passwordsMatch = confirmPassword === "" || newPassword === confirmPassword;
  const canSubmit =
    tokenFromUrl &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    status !== "loading";

  useEffect(() => {
    if (!tokenFromUrl) {
      setErrorMsg("Enlace invalido. Solicita un nuevo enlace de recuperacion.");
      setStatus("error");
    }
  }, [tokenFromUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenFromUrl, new_password: newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.detail || "Error al cambiar la contrasena.");
        setStatus("error");
        return;
      }

      setStatus("success");
      setTimeout(() => router.push("/auth?screen=login"), 2500);
    } catch {
      setErrorMsg("Error de conexion. Intenta de nuevo.");
      setStatus("error");
    }
  }

  return (
    <>
      {status === "success" ? (
        /* ── Success ── */
        <div style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
          padding: "20px 20px 16px",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          zIndex: 20,
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "80px", height: "80px", borderRadius: "24px",
              background: "rgba(5,150,105,.08)", border: "1.5px solid rgba(5,150,105,.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px",
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ color: "#1F2937", fontSize: "22px", fontWeight: 700, margin: "0 0 8px" }}>
              Contrasena actualizada
            </h2>
            <p style={{ color: "#6B7280", fontSize: "15px", lineHeight: "1.7" }}>
              Tu contrasena ha sido cambiada exitosamente.
            </p>
            <p style={{ color: "#9CA3AF", fontSize: "13px", marginTop: "4px" }}>
              Redirigiendo al inicio de sesion...
            </p>
          </div>
        </div>
      ) : !tokenFromUrl && status === "error" ? (
        /* ── Invalid token ── */
        <div style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
          padding: "20px 20px 16px",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          zIndex: 20,
        }}>
          <div style={{ textAlign: "center", maxWidth: "360px" }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "20px",
              background: "rgba(245,158,11,.08)", border: "1.5px solid rgba(245,158,11,.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px",
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 style={{ color: "#1F2937", fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>
              Enlace invalido
            </h2>
            <p style={{ color: "#6B7280", fontSize: "14px", lineHeight: "1.7", margin: "0 0 24px" }}>
              Este enlace no es valido, ya expiro o ya fue usado. Solicita uno nuevo para continuar.
            </p>
            <Link
              href="/auth/forgot-password"
              className="btn-main"
              style={{ display: "inline-flex", textDecoration: "none", padding: "12px 28px" }}
            >
              Solicitar nuevo enlace
            </Link>
          </div>
        </div>
      ) : (
        /* ── Reset form ── */
        <div style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
          padding: "20px 20px 16px",
          display: "flex", flexDirection: "column",
          zIndex: 20, overflow: "hidden",
        }}>
          {/* Top bar — same as auth page TopRowLogo */}
          <div className="top-row top-bar">
            <div className="flex items-center gap-2">
              {/* Logo + text: desktop only */}
              <a href="/" className="hidden md:flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Logo size="sm" showText={false} />
                <span className="logo-text font-bold tracking-tight">Turno<span style={{color:"#2563EB"}}>GO</span></span>
                <div className="w-px h-4 bg-gray-300 mx-1" />
              </a>
              <Link
                href="/auth?screen=login"
                className="btn-back"
                style={{marginLeft:0,width:32,height:32,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",color:"#475569",border:"none",background:"none",cursor:"pointer",textDecoration:"none"}}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              </Link>
            </div>
          </div>

          {/* Content area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 0 40px", overflow: "hidden" }}>
            {/* Title section */}
            <div className="logo-container" style={{ flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
              <div className="logo-mark" style={{
                width: "80px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  <circle cx="12" cy="16" r="1" fill="#2563EB" />
                </svg>
              </div>
              <h2 style={{ color: "#1E293B", fontSize: "28px", fontWeight: 800, letterSpacing: "-0.02em", margin: 0, textAlign: "center" }}>
                Nueva contrasena
              </h2>
              <p style={{ color: "#64748B", fontSize: "15px", textAlign: "center", margin: 0, lineHeight: "1.6" }}>
                Elige una contrasena segura que no uses en otros sitios.
              </p>
            </div>

            {/* Form area */}
            <div className="form-area" style={{
              width: "100%", maxWidth: "440px",
              display: "flex", flexDirection: "column", gap: "2px",
              overflowY: "auto", justifyContent: "flex-start",
              flex: 1,
            }}>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {/* New password */}
                <div className="input-group">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimo 8 caracteres"
                    className="input-field"
                    style={{ paddingRight: "44px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="pw-toggle"
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>

                {/* Strength meter */}
                {newPassword.length > 0 && (
                  <div style={{ marginTop: "4px", marginBottom: "8px", padding: "0 4px" }}>
                    <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          style={{
                            flex: 1, height: "4px", borderRadius: "2px",
                            background: level <= strength.score ? strength.color : "#E5E7EB",
                            transition: "background 0.3s",
                          }}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 500, color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}

                {/* Confirm password */}
                <div className="input-group">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    <circle cx="12" cy="16" r="1" fill="currentColor" />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contrasena"
                    className="input-field"
                    style={confirmPassword && !passwordsMatch ? { borderColor: "#FCA5A5", background: "#FFF5F5" } : {}}
                  />
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p style={{ color: "#EF4444", fontSize: "12px", margin: "4px 0 0 4px" }}>
                    Las contrasenas no coinciden
                  </p>
                )}

                {/* Error */}
                {errorMsg && (
                  <div className="error-msg" style={{ marginTop: "12px" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginRight: "8px", display: "inline", verticalAlign: "middle" }}>
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {" "}{errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="btn-main"
                  style={{ marginTop: "20px" }}
                >
                  {status === "loading" ? "Cambiando..." : "Cambiar contrasena"}
                </button>
              </form>
            </div>

            {/* Back link */}
            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <Link
                href="/auth?screen=login"
                style={{ color: "#64748B", fontSize: "14px", textDecoration: "none", fontWeight: 500 }}
              >
                ← Volver al inicio de sesion
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PAGE — same layered background as auth
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function ResetPasswordContent() {
  const meshRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<HTMLCanvasElement>(null);

  useMeshGradient(meshRef);
  useParticles(particlesRef);

  return (
    <div style={{
      position: "absolute", top: 0, right: 0, bottom: 0, left: 0,
      background: "transparent", overflow: "hidden",
      height: "100dvh",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Layer 0: Mesh gradient canvas */}
      <canvas ref={meshRef} style={{
        position: "absolute", top: 0, right: 0, bottom: 0, left: 0,
        zIndex: 0, width: "100%", height: "100%",
      }} />

      {/* Layer 1: Blob layer (5 colored blur balls) */}
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 1, overflow: "hidden" }}>
        <div style={{
          position: "absolute", borderRadius: "50%", filter: "blur(70px)", opacity: 0.45,
          width: "65%", height: "65%", top: "-20%", left: "-15%",
          background: "radial-gradient(circle, #3B82F6, transparent 70%)",
          animation: "float1 20s infinite alternate",
        }} />
        <div style={{
          position: "absolute", borderRadius: "50%", filter: "blur(70px)", opacity: 0.45,
          width: "55%", height: "55%", bottom: "-25%", right: "-10%",
          background: "radial-gradient(circle, #2563EB, transparent 70%)",
          animation: "float2 24s infinite alternate",
        }} />
        <div style={{
          position: "absolute", borderRadius: "50%", filter: "blur(70px)", opacity: 0.45,
          width: "50%", height: "50%", top: "30%", left: "35%",
          background: "radial-gradient(circle, #60A5FA, transparent 70%)",
          animation: "float3 30s infinite alternate",
        }} />
        <div style={{
          position: "absolute", borderRadius: "50%", filter: "blur(70px)", opacity: 0.45,
          width: "40%", height: "40%", top: "55%", left: "-8%",
          background: "radial-gradient(circle, #93C5FD, transparent 70%)",
          animation: "float4 28s infinite alternate",
        }} />
        <div style={{
          position: "absolute", borderRadius: "50%", filter: "blur(70px)", opacity: 0.45,
          width: "45%", height: "45%", top: "5%", right: "0%",
          background: "radial-gradient(circle, #1D4ED8, transparent 70%)",
          animation: "float5 36s infinite alternate",
        }} />
      </div>

      {/* Layer 2: Aurora */}
      <div style={{
        position: "absolute", top: 0, right: 0, bottom: 0, left: 0,
        zIndex: 2, pointerEvents: "none",
        background: "conic-gradient(from 0deg at 50% 50%, transparent 0%, rgba(37,99,235,0.06) 25%, transparent 50%, rgba(59,130,246,0.04) 75%, transparent 100%)",
        filter: "blur(80px)", opacity: 0.4,
        animation: "auroraSpin 45s linear infinite",
      }} />

      {/* Layer 3: Particle canvas */}
      <canvas ref={particlesRef} style={{
        position: "absolute", top: 0, right: 0, bottom: 0, left: 0,
        zIndex: 3, pointerEvents: "none",
      }} />

      {/* Layer 10: Glass container with backdrop blur */}
      <div style={{
        position: "absolute", top: 0, right: 0, bottom: 0, left: 0,
        zIndex: 10,
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(18px) saturate(1.2)",
        WebkitBackdropFilter: "blur(18px) saturate(1.2)",
        overflow: "hidden",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.04)",
      }}>
        {/* Glass top highlight line */}
        <div style={{
          position: "absolute", top: 0, left: "8px", right: "8px", height: "1px",
          background: "linear-gradient(to right, transparent 5%, rgba(255,255,255,0.6) 25%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.6) 75%, transparent 95%)",
          zIndex: 99, pointerEvents: "none",
        }} />

        {/* Layer 11: Floating logo (mobile only — desktop shows logo in top-bar) */}
        <a href="/" style={{
          position: "absolute", left: "16px", zIndex: 30,
          top: "calc(env(safe-area-inset-top, 0px) + 14px)",
          textDecoration: "none",
        }} className="md:hidden">
          <Logo size="sm" />
        </a>

        {/* Layer 11: Floating bubbles */}
        <Bubbles />

        {/* Main content */}
        <ResetPasswordForm />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#1D4ED8",
      }}>
        <div style={{
          width: "40px", height: "40px",
          border: "3px solid rgba(255,255,255,0.2)",
          borderTopColor: "white",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }} />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
