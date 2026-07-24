"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "@/lib/api";
import Logo from "@/components/Logo";

/* ── Password strength checker ── */
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

  /* ── Success screen ── */
  if (status === "success") {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #1E40AF 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: "24px",
      }}>
        <div style={{
          background: "white",
          borderRadius: "20px",
          padding: "48px 36px",
          maxWidth: "440px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)",
          animation: "fadeIn 0.5s ease-out",
        }}>
          {/* Checkmark circle */}
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 8px 32px rgba(5,150,105,0.35)",
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ color: "#1F2937", fontSize: "22px", fontWeight: 700, margin: "0 0 8px" }}>
            Contrasena actualizada
          </h2>
          <p style={{ color: "#6B7280", fontSize: "15px", lineHeight: "1.7", margin: "0 0 8px" }}>
            Tu contrasena ha sido cambiada exitosamente.
          </p>
          <p style={{ color: "#9CA3AF", fontSize: "13px" }}>
            Redirigiendo al inicio de sesion...
          </p>
        </div>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  /* ── Invalid token screen ── */
  if (!tokenFromUrl && status === "error") {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #1E40AF 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: "24px",
      }}>
        <div style={{
          background: "white",
          borderRadius: "20px",
          padding: "48px 36px",
          maxWidth: "440px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 8px 32px rgba(245,158,11,0.3)",
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 style={{ color: "#1F2937", fontSize: "22px", fontWeight: 700, margin: "0 0 8px" }}>
            Enlace invalido
          </h2>
          <p style={{ color: "#6B7280", fontSize: "15px", lineHeight: "1.7", margin: "0 0 24px" }}>
            Este enlace no es valido, ya expiro o ya fue usado. Solicita uno nuevo para continuar.
          </p>
          <Link
            href="/auth/forgot-password"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
              color: "white",
              padding: "14px 32px",
              borderRadius: "12px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "15px",
              boxShadow: "0 4px 16px rgba(37,99,235,0.35)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(37,99,235,0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(37,99,235,0.35)";
            }}
          >
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  /* ── Reset form ── */
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #1E40AF 100%)",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "24px",
    }}>
      <div style={{
        background: "white",
        borderRadius: "20px",
        padding: "44px 36px",
        maxWidth: "440px",
        width: "100%",
        boxShadow: "0 25px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.08)",
        animation: "fadeIn 0.4s ease-out",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <Logo size="md" />
        </div>

        <h2 style={{
          color: "#1F2937",
          fontSize: "22px",
          fontWeight: 700,
          margin: "0 0 6px",
          textAlign: "center",
          letterSpacing: "-0.3px",
        }}>
          Crea una nueva contrasena
        </h2>
        <p style={{
          color: "#6B7280",
          fontSize: "14px",
          textAlign: "center",
          margin: "0 0 28px",
          lineHeight: "1.6",
        }}>
          Elige una contrasena segura que no uses en otros sitios.
        </p>

        <form onSubmit={handleSubmit}>
          {/* New password */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              color: "#374151",
              marginBottom: "6px",
            }}>
              Nueva contrasena
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimo 8 caracteres"
                style={{
                  width: "100%",
                  padding: "13px 48px 13px 16px",
                  border: `2px solid ${errorMsg ? "#FCA5A5" : "#E2E8F0"}`,
                  borderRadius: "12px",
                  fontSize: "15px",
                  color: "#1F2937",
                  boxSizing: "border-box",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#2563EB";
                  e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errorMsg ? "#FCA5A5" : "#E2E8F0";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px",
                  color: "#9CA3AF",
                  lineHeight: 0,
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {/* Strength meter */}
            {newPassword.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      style={{
                        flex: 1,
                        height: "4px",
                        borderRadius: "2px",
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
          </div>

          {/* Confirm password */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              color: "#374151",
              marginBottom: "6px",
            }}>
              Confirmar contrasena
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contrasena"
                style={{
                  width: "100%",
                  padding: "13px 48px 13px 16px",
                  border: `2px solid ${confirmPassword && !passwordsMatch ? "#FCA5A5" : "#E2E8F0"}`,
                  borderRadius: "12px",
                  fontSize: "15px",
                  color: "#1F2937",
                  boxSizing: "border-box",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = confirmPassword && !passwordsMatch ? "#EF4444" : "#2563EB";
                  e.target.style.boxShadow = `0 0 0 3px ${confirmPassword && !passwordsMatch ? "rgba(239,68,68,0.1)" : "rgba(37,99,235,0.1)"}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = confirmPassword && !passwordsMatch ? "#FCA5A5" : "#E2E8F0";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
            {confirmPassword && !passwordsMatch && (
              <p style={{ color: "#EF4444", fontSize: "12px", margin: "6px 0 0" }}>
                Las contrasenas no coinciden
              </p>
            )}
          </div>

          {/* Error message */}
          {errorMsg && (
            <div style={{
              background: "#FEF2F2",
              color: "#DC2626",
              padding: "12px 16px",
              borderRadius: "10px",
              fontSize: "13px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: "100%",
              padding: "14px",
              background: canSubmit
                ? "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)"
                : "#D1D5DB",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: canSubmit ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              boxShadow: canSubmit ? "0 4px 16px rgba(37,99,235,0.35)" : "none",
              transform: "translateY(0)",
              letterSpacing: "0.2px",
            }}
            onMouseEnter={(e) => {
              if (canSubmit) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(37,99,235,0.45)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = canSubmit ? "0 4px 16px rgba(37,99,235,0.35)" : "none";
            }}
          >
            {status === "loading" ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 0.8s linear infinite" }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Cambiando...
              </span>
            ) : (
              "Cambiar contrasena"
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "22px" }}>
          <Link
            href="/auth?screen=login"
            style={{
              color: "#2563EB",
              fontSize: "14px",
              textDecoration: "none",
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#1D4ED8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#2563EB"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver al inicio de sesion
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #1E40AF 100%)",
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "3px solid rgba(255,255,255,0.2)",
          borderTopColor: "white",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
