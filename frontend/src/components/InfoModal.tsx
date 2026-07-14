"use client";

import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const steps = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    title: "Buscar o publicar trabajo",
    desc: "El contratista publica el turno con precio, ubicación y horario. El trabajador busca oportunidades cerca de él y aplica en un clic.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Match y confirmación",
    desc: "El contratista revisa los candidatos, elige al que mejor le parezca y confirma el turno. El trabajador recibe la notificación al instante.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Trabajo y check-in",
    desc: "El trabajador llega, hace check-in con geolocalización, cumple su turno y solicita finalizar. Todo se registra en la app.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Protección de pago",
    desc: "Cuando el contratista acepta al trabajador, los USDT quedan retenidos en la app. Nadie cobra hasta que el contratista apruebe que el trabajo quedó bien. Sin riesgo, sin reclamaciones.",
    highlight: true,
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m0 0l-3-3m3 3l3-3m-8.64 5.25a9 9 0 1112.28 0" />
      </svg>
    ),
    title: "Cobro o retiro",
    desc: "Una vez aprobado, el pago se libera automáticamente al trabajador. Puede retirar sus USDT a su wallet externa cuando quiera. Sin comisiones ocultas.",
  },
];

export default function InfoModal({ open, onClose }: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white rounded-3xl shadow-2xl animate-modal-enter modal-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center z-10"
          aria-label="Cerrar"
        >
          <svg className="w-4 h-4 text-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="pt-8 pb-2 px-7">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-7 h-7 text-primary shrink-0" viewBox="0 0 28 28" fill="currentColor">
              <circle cx="14" cy="14" r="12" />
              <path d="M9 14l3.5 3.5L19 11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <span className="font-bold text-lg text-dark">Cómo funciona TurnoGO</span>
          </div>
          <p className="text-sm text-gray leading-relaxed">
            Así de fácil consigues trabajo o contratas ayuda en Venezuela.
          </p>
        </div>

        {/* Steps */}
        <div className="px-7 pb-6 pt-3 space-y-0">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-4 py-3 group">
              {/* Icon */}
              <div className={`relative flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                s.highlight
                  ? "bg-primary text-white shadow-md shadow-primary/25 group-hover:scale-110"
                  : "bg-primary/10 text-primary group-hover:bg-primary/15"
              }`}>
                {s.icon}
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className={`absolute top-11 left-1/2 -translate-x-1/2 w-px h-4 ${
                    s.highlight ? "bg-primary/30" : "bg-gray-200"
                  }`} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <h4 className={`font-semibold text-sm ${s.highlight ? "text-primary" : "text-dark"}`}>
                  {s.title}
                  {s.highlight && (
                    <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-white bg-primary px-2 py-0.5 rounded-full">
                      Seguro
                    </span>
                  )}
                </h4>
                <p className="text-xs text-gray mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="px-7 pb-7 pt-2">
          <a
            href="/auth/register"
            className="block w-full py-3 bg-primary text-white font-semibold text-center rounded-2xl hover:bg-primary-dark transition-all shadow-md shadow-primary/20"
          >
            Empezar ahora
          </a>
          <p className="text-center text-xs text-gray mt-2">Sin compromiso, créala en 2 minutos</p>
        </div>
      </div>
    </div>
  );
}
