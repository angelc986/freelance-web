"use client";

const testimonials = [
  {
    name: "María G.",
    role: "Dueña de restaurante, Caracas",
    text: "Antes perdía días enteros buscando meseros para eventos. Con TurnoGO encuentro personal en cuestión de horas. Los pagos en USDT son súper rápidos y seguros.",
    rating: 5,
  },
  {
    name: "Carlos M.",
    role: "Electricista, Maracay",
    text: "Me registré y al día siguiente ya tenía mi primer trabajo. Me pagan directo a mi wallet, sin que nadie me retega comisiones. Recomendado 100%.",
    rating: 5,
  },
  {
    name: "Ana L.",
    role: "Coordinadora de eventos, Valencia",
    text: "La verificación de los trabajadores me da tranquilidad. Sé que quien llega es quien dice ser. El backup automático nos ha salvado de varias emergencias.",
    rating: 4,
  },
  {
    name: "José R.",
    role: "Cargador de almacén, Barquisimeto",
    text: "Trabajo cuando quiero, sin horarios fijos. La app me avisa cuando hay turnos cerca de mi casa y yo decido si acepto o no. Me encanta la libertad.",
    rating: 5,
  },
];

export default function Testimonials() {
  const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

  return (
    <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {testimonials.map((t, i) => (
        <div
          key={i}
          className="group relative p-6 rounded-xl border border-gray-200 bg-white hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all"
        >
          {/* Blue quote mark */}
          <div className="absolute -top-3 -left-2 text-5xl text-primary/10 font-serif leading-none select-none">
            &ldquo;
          </div>

          {/* Stars */}
          <div className="text-accent text-sm mb-3 relative">{stars(t.rating)}</div>

          {/* Quote */}
          <p className="text-dark leading-relaxed text-sm relative">&ldquo;{t.text}&rdquo;</p>

          {/* Author */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              {/* Avatar circle */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-semibold text-sm">
                {t.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-dark text-sm">{t.name}</p>
                <p className="text-gray text-xs mt-0.5">{t.role}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
