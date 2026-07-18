"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getVerificationStatus } from "@/lib/api";

export default function VerificationCompletePage() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "verified" | "pending" | "error">("checking");

  useEffect(() => {
    // Poll the backend to see if the user is verified
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
    // Poll every 3 seconds for up to 60 seconds
    const interval = setInterval(checkStatus, 3000);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (status === "checking") setStatus("pending");
    }, 60000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Status icon */}
          <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{
              background: status === "verified"
                ? "linear-gradient(135deg, #059669, #10B981)"
                : "linear-gradient(135deg, #2563EB, #3B82F6)"
            }}
          >
            {status === "verified" ? (
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </div>

          {/* Title */}
          {status === "verified" ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Identidad verificada! 🎉
              </h1>
              <p className="text-gray-600 mb-8">
                Tu identidad ha sido verificada exitosamente. Ya puedes publicar y postularte a trabajos.
              </p>
            </>
          ) : status === "checking" ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verificando...
              </h1>
              <p className="text-gray-600 mb-8">
                Estamos procesando tu verificación. Esto toma solo unos segundos.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verificación en proceso
              </h1>
              <p className="text-gray-600 mb-8">
                Tu verificación aún no se ha completado. Si ya terminaste el proceso en Didit, espera unos segundos mientras lo procesamos.
              </p>
            </>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {status === "verified" ? (
              <Link
                href="/dashboard"
                className="w-full px-6 py-3 rounded-xl text-white font-semibold text-[15px] transition-all duration-200 shadow-md hover:shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                }}
              >
                Ir al Dashboard
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="w-full px-6 py-3 rounded-xl text-[#2563EB] font-semibold text-[15px] border-2 border-[#2563EB] hover:bg-blue-50 transition-all duration-200"
              >
                Volver al Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-[13px] mt-6">
          TurnoGO — Tu seguridad es importante para nosotros
        </p>
      </div>
    </div>
  );
}
