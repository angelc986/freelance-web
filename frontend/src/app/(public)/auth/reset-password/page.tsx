"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "@/lib/api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!tokenFromUrl) {
      setErrorMsg("Enlace invalido. Solicita un nuevo enlace de recuperacion.");
      setStatus("error");
    }
  }, [tokenFromUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenFromUrl) return;

    if (newPassword !== confirmPassword) {
      setErrorMsg("Las contrasenas no coinciden.");
      setStatus("error");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg("La contrasena debe tener al menos 8 caracteres.");
      setStatus("error");
      return;
    }

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
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setErrorMsg("Error de conexion. Intenta de nuevo.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
        fontFamily: "Inter, sans-serif",
        padding: "24px",
      }}>
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "40px 32px",
          maxWidth: "420px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔐</div>
          <h2 style={{ color: "#1F2937", fontSize: "20px", margin: "0 0 8px" }}>Contrasena cambiada</h2>
          <p style={{ color: "#6B7280", fontSize: "14px", lineHeight: "1.6" }}>
            Tu contrasena ha sido actualizada. Seras redirigido al inicio de sesion...
          </p>
        </div>
      </div>
    );
  }

  if (!tokenFromUrl && status === "error") {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
        fontFamily: "Inter, sans-serif",
        padding: "24px",
      }}>
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "40px 32px",
          maxWidth: "420px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
          <h2 style={{ color: "#1F2937", fontSize: "20px", margin: "0 0 8px" }}>Enlace invalido</h2>
          <p style={{ color: "#6B7280", fontSize: "14px", lineHeight: "1.6" }}>
            Este enlace no es valido o ya fue usado. Solicita uno nuevo.
          </p>
          <Link
            href="/forgot-password"
            style={{
              display: "inline-block",
              marginTop: "24px",
              background: "#2563EB",
              color: "white",
              padding: "12px 32px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
      fontFamily: "Inter, sans-serif",
      padding: "24px",
    }}>
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "40px 32px",
        maxWidth: "420px",
        width: "100%",
        boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "#2563EB" }}>TurnoGO</span>
        </div>

        <h2 style={{ color: "#1F2937", fontSize: "20px", margin: "0 0 8px", textAlign: "center" }}>
          Nueva contrasena
        </h2>
        <p style={{ color: "#6B7280", fontSize: "14px", textAlign: "center", margin: "0 0 24px" }}>
          Elige una contrasena segura.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
              Nueva contrasena
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimo 8 caracteres"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "2px solid #E2E8F0",
                borderRadius: "8px",
                fontSize: "15px",
                color: "#1F2937",
                boxSizing: "border-box",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
              onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
              Confirmar contrasena
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contrasena"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "2px solid #E2E8F0",
                borderRadius: "8px",
                fontSize: "15px",
                color: "#1F2937",
                boxSizing: "border-box",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
              onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
            />
          </div>

          {errorMsg && (
            <div style={{
              background: "#FEF2F2",
              color: "#DC2626",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "16px",
            }}>
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading" || !tokenFromUrl}
            style={{
              width: "100%",
              padding: "14px",
              background: status === "loading" ? "#93C5FD" : "#2563EB",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: status === "loading" ? "not-allowed" : "pointer",
            }}
          >
            {status === "loading" ? "Cambiando..." : "Cambiar contrasena"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <Link
            href="/login"
            style={{ color: "#6B7280", fontSize: "14px", textDecoration: "none" }}
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
