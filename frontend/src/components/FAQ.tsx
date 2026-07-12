"use client";

import { useState } from "react";

const faqs = [
  {
    q: "¿Cómo me registro como trabajador?",
    a: "Solo necesitas tu correo, número de teléfono y crear una contraseña. Después podrás agregar tu cédula, foto y preferencias. El registro es gratis y tomas menos de 2 minutos.",
  },
  {
    q: "¿Cómo funcionan los pagos?",
    a: "Usamos USDT en la red Polygon. Los contratistas depositan USDT a su wallet del sistema, liberan el pago cuando el trabajo está completo, y los trabajadores reciben automáticamente. Todo queda registrado en la blockchain.",
  },
  {
    q: "¿Qué pasa si el trabajador no se presenta?",
    a: "Tenemos un sistema de backup automático. Si alguien no llega, el sistema notifica a otros trabajadores disponibles para cubrir el turno. Además, el trabajador que no se presenta recibe una penalización en su rating.",
  },
  {
    q: "¿Hay un monto mínimo para retirar?",
    a: "Sí, el retiro mínimo es de $1 USDT. Puedes retirar hasta 3 veces por día a tu wallet externa. Las transacciones mayores a $100 requieren doble confirmación por seguridad.",
  },
  {
    q: "¿Necesito tener criptomonedas para usar TurnoGO?",
    a: "Si eres trabajador, no. Solo recibes USDT. Si eres contratista, necesitas USDT en tu wallet del sistema para pagar los trabajos. Puedes depositar desde cualquier exchange o wallet externa.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className={`border rounded-xl overflow-hidden transition-all ${
              isOpen
                ? "border-primary/30 bg-primary-lighter/50 shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50/50 transition-colors"
            >
              <span className={`font-medium pr-4 ${isOpen ? "text-primary" : "text-dark"}`}>
                {faq.q}
              </span>
              <svg
                className={`w-5 h-5 flex-shrink-0 transition-all ${
                  isOpen ? "rotate-180 text-primary" : "text-gray"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <div
              className={`transition-all duration-300 overflow-hidden ${
                isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <p className="px-6 pb-4 text-sm text-gray leading-relaxed">
                {faq.a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
