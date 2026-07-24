"use client";

import { useState } from "react";
import Link from "next/link";
import { API_BASE } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Rate limit
        setErrorMsg(data.detail || "Demasiadas solicitudes. Espera unos minutos.");
        setStatus("error");
        return;
      }

      setStatus("success");
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
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>✉️</div>
          <h2 style={{ color: "#1F2937", fontSize: "20px", margin: "0 0 8px" }}>Revisa tu email</h2>
          <p style={{ color: "#6B7280", fontSize: "14px", lineHeight: "1.6" }}>
            Si {email} esta registrado, recibiras un enlace para restablecer tu contrasena.
          </p>
          <Link
            href="/login"
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
            Volver al inicio
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
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "#2563EB" }}>TurnoGO</span>
        </div>

        <h2 style={{ color: "#1F2937", fontSize: "20px", margin: "0 0 8px", textAlign: "center" }}>
          Olvidaste tu contrasena?
        </h2>
        <p style={{ color: "#6B7280", fontSize: "14px", textAlign: "center", margin: "0 0 24px" }}>
          Ingresa tu email y te enviaremos un enlace para restablecerla.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "2px solid #E2E8F0",
                borderRadius: "8px",
                fontSize: "15px",
                color: "#1F2937",
                boxSizing: "border-box",
                outline: "none",
                transition: "border-color 0.2s",
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
            disabled={status === "loading"}
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
              transition: "background 0.2s",
            }}
          >
            {status === "loading" ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <Link
            href="/login"
            style={{ color: "#2563EB", fontSize: "14px", textDecoration: "none", fontWeight: 500 }}
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
