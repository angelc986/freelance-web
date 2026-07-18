"use client";

import { useState } from "react";
import { createVerificationSession } from "@/lib/api";

/* ══════════════════════════════════════════════════════════════
   VERIFICATION BANNER
   Muestra un banner para que el usuario verifique su identidad.
   - No verificado → Banner azul con botón "Verificar ahora"
   - En proceso → Loading con spinner
   - Verificado → Check verde (no se muestra este banner)
   ══════════════════════════════════════════════════════════════ */

interface Props {
  onComplete?: () => void;
}

export default function VerificationBanner({ onComplete }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);

  async function handleVerify() {
    setLoading(true);
    setError("");
    try {
      const res = await createVerificationSession();
      if (res.status === "already_verified") {
        onComplete?.();
        return;
      }
      if (res.verification_url) {
        setVerificationUrl(res.verification_url);
        // Open in new tab (or same window for iframe approach)
        window.open(res.verification_url, "_blank");
      }
    } catch (err: any) {
      setError(err.message || "Error al crear la verificación");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] p-5 mb-6 shadow-lg">
      {/* Decorative blobs */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-xl" />
      <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full blur-lg" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-sm">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-[15px] mb-0.5">
            Verifica tu identidad
          </h3>
          <p className="text-blue-100 text-[13px] leading-relaxed">
            Confirma quién eres para empezar a publicar y postularte a trabajos. Solo te tomará unos segundos.
          </p>
        </div>

        <button
          onClick={handleVerify}
          disabled={loading}
          className="flex-shrink-0 w-full sm:w-auto px-6 py-2.5 bg-white text-[#2563EB] font-semibold text-[14px] rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Abriendo...
            </>
          ) : verificationUrl ? (
            "Reabrir verificación"
          ) : (
            "Verificar ahora"
          )}
        </button>
      </div>

      {error && (
        <p className="relative z-10 mt-3 text-white/80 text-[13px] flex items-center gap-1.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
