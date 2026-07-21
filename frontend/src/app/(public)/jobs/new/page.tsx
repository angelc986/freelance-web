"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJob } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import LocationPicker from "@/components/LocationPicker";
import Logo from "@/components/Logo";

// ─── CATEGORY SVGS ───
const categorySvgs: Record<string, string> = {
  "Construcción": "🏗️",
  "Electricidad y Mantenimiento": "⚡",
  "Pintura y Acabados": "🎨",
  "Carga y Mudanza": "📦",
  "Limpieza": "🧹",
  "Cuidado Personal": "👶",
  "Gastronomía": "🍽️",
  "Eventos": "🎉",
  "Logística": "📬",
  "Retail y Ventas": "🏪",
  "Jardinería": "🌿",
  "Conducción y Mensajería": "🚗",
};

// ─── CONSTANTS ───
const categories = [
  { name: "Construcción", icon: "🏗️", desc: "Peones, albañiles, obra" },
  { name: "Electricidad y Mantenimiento", icon: "⚡", desc: "Electricistas, técnicos, plomeros" },
  { name: "Pintura y Acabados", icon: "🎨", desc: "Pintores, drywall, cerámica" },
  { name: "Carga y Mudanza", icon: "📦", desc: "Cargadores, fletes, mudanceros" },
  { name: "Limpieza", icon: "🧹", desc: "Casas, oficinas, edificios" },
  { name: "Cuidado Personal", icon: "👶", desc: "Niñeras, cuidadores" },
  { name: "Gastronomía", icon: "🍽️", desc: "Meseros, cocina, bar" },
  { name: "Eventos", icon: "🎉", desc: "Montaje, atención al público" },
  { name: "Logística", icon: "📬", desc: "Repartidores, almacén" },
  { name: "Retail y Ventas", icon: "🏪", desc: "Vendedores, cajeros, stockers" },
  { name: "Jardinería", icon: "🌿", desc: "Jardineros, poda, limpieza" },
  { name: "Conducción y Mensajería", icon: "🚗", desc: "Conductores, mensajeros, delivery" },
];

const budgetSuggestions = [5, 10, 15, 20, 30, 50];

// ─── SVG COMPONENTS ───
function IconLock({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function IconLightbulb({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  );
}

function IconEye({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconChart({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function IconAlert({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

export default function NewJobPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Gastronomía",
    location: "",
    budget: "",
    duration: "",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  if (user && user.role !== "contractor") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light">
        <div className="text-center max-w-md mx-auto p-8 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <IconLock className="w-8 h-8 text-gray" />
          </div>
          <h2 className="text-xl font-bold text-dark mb-2">Acceso restringido</h2>
          <p className="text-gray text-sm mb-6">
            Solo los contratistas pueden publicar trabajos. Si necesitas publicar un trabajo,
            regístrate como contratista.
          </p>
          <a
            href="/dashboard"
            className="btn-ripple inline-block px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-all"
          >
            Volver al dashboard
          </a>
        </div>
      </div>
    );
  }

  const update = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { title, description, category, location, budget, duration } = form;
    if (!title || !description || !location || !budget || !duration) {
      setError("Completa todos los campos obligatorios");
      return;
    }

    const budgetNum = parseFloat(budget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      setError("El presupuesto debe ser un número válido mayor a 0");
      return;
    }

    if (title.length < 5) {
      setError("El título debe tener al menos 5 caracteres");
      return;
    }

    if (description.length < 20) {
      setError("La descripción debe tener al menos 20 caracteres para ser clara");
      return;
    }

    setLoading(true);
    try {
      const job = await createJob({
        title,
        description,
        category,
        location,
        budget: budgetNum,
        duration,
        latitude: coords?.lat,
        longitude: coords?.lng,
      });
      router.push(`/jobs/${job.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const descChars = form.description.length;
  const budgetNum = parseFloat(form.budget) || 0;

  return (
    <div className="min-h-screen flex flex-col bg-light">
      {/* Minimal nav — safe-area aware */}
      <header className="border-b border-gray-200 bg-white/60 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between" style={{ minHeight: 'calc(4rem + env(safe-area-inset-top, 0px))', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <a href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray hover:text-dark transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <Logo size="sm" />
          </a>
          <span className="text-sm text-gray">Publicar trabajo</span>
        </div>
      </header>

      <div className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* ===== HEADER ===== */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-2xl font-bold text-dark">Publicar nuevo trabajo</h1>
            <p className="text-gray text-sm mt-1">
              Completa los detalles del turno para encontrar al trabajador ideal
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* ===== FORM ===== */}
            <div className="lg:col-span-3">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* ██████ TÍTULO ██████ */}
                <section className="bg-white rounded-xl border border-gray-200 p-6 animate-stagger-pop">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h2 className="font-semibold text-dark">Información básica</h2>
                      <p className="text-xs text-gray">Título y descripción del trabajo</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-dark mb-1.5">
                        Título del trabajo <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => update("title", e.target.value)}
                        placeholder="Ej: Mesero para evento corporativo sábado"
                        className="input-glow w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all text-sm bg-white"
                        maxLength={100}
                      />
                      <div className="flex justify-between mt-1">
                        <p className="text-xs text-gray">Sé específico para atraer mejores candidatos</p>
                        <span className={`text-xs ${form.title.length > 80 ? "text-accent" : "text-gray"}`}>
                          {form.title.length}/100
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark mb-1.5">
                        Descripción <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(e) => update("description", e.target.value)}
                        placeholder="Describe las responsabilidades, horario, requisitos y cualquier detalle importante..."
                        className="input-glow w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all text-sm resize-none bg-white"
                        rows={5}
                        maxLength={2000}
                      />
                      <div className="flex justify-between mt-1">
                        <p className={`text-xs ${descChars < 20 ? "text-red-400" : "text-gray"}`}>
                          {descChars < 20 ? `Mínimo 20 caracteres (${descChars}/20)` : "Describe bien el trabajo para evitar malentendidos"}
                        </p>
                        <span className={`text-xs ${descChars > 1800 ? "text-accent" : "text-gray"}`}>
                          {descChars}/2000
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* ██████ CATEGORÍA + DURACIÓN ██████ */}
                <section className="bg-white rounded-xl border border-gray-200 p-6 animate-stagger-pop" style={{ animationDelay: "0.1s" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h2 className="font-semibold text-dark">Categoría y duración</h2>
                      <p className="text-xs text-gray">Clasifica tu trabajo</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Category grid */}
                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">
                        Categoría <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {categories.map((cat) => (
                          <button
                            key={cat.name}
                            type="button"
                            onClick={() => update("category", cat.name)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              form.category === cat.name
                                ? "border-primary bg-primary-light/50 ring-1 ring-primary"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                          >
                            <p className="text-sm font-medium text-dark">{cat.name}</p>
                            <p className="text-[11px] text-gray mt-0.5">{cat.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-medium text-dark mb-1.5">
                        Duración estimada <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={form.duration}
                        onChange={(e) => update("duration", e.target.value)}
                        className="input-glow w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all text-sm bg-white"
                      >
                        <option value="">Selecciona una duración</option>
                        <option value="1-2 horas">1-2 horas</option>
                        <option value="2-4 horas">2-4 horas</option>
                        <option value="4-6 horas">4-6 horas</option>
                        <option value="6-8 horas">6-8 horas</option>
                        <option value="8+ horas">8+ horas</option>
                        <option value="Jornada completa">Jornada completa</option>
                        <option value="Por días">Por días</option>
                        <option value="Por semanas">Por semanas</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* ██████ UBICACIÓN + PRESUPUESTO ██████ */}
                <section className="bg-white rounded-xl border border-gray-200 p-6 animate-stagger-pop" style={{ animationDelay: "0.15s" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h2 className="font-semibold text-dark">Ubicación y pago</h2>
                      <p className="text-xs text-gray">Dónde y cuánto</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-dark mb-1.5">
                        Ubicación <span className="text-red-400">*</span>
                      </label>
                      <LocationPicker
                        address={form.location}
                        onLocationChange={(data) => {
                          setForm((p) => ({ ...p, location: data.address }));
                          setCoords({ lat: data.lat, lng: data.lng });
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark mb-1.5">
                        Presupuesto en USDT <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-primary">$</span>
                        <input
                          type="number"
                          value={form.budget}
                          onChange={(e) => update("budget", e.target.value)}
                          placeholder="0.00"
                          min="1"
                          step="0.5"
                          className="input-glow w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all text-sm bg-white"
                        />
                      </div>

                      {/* Quick budget suggestions */}
                      <div className="mt-2">
                        <p className="text-xs text-gray mb-1.5">Sugerencias:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {budgetSuggestions.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => update("budget", s.toString())}
                              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                                budgetNum === s
                                  ? "border-primary bg-primary-light/50 text-primary"
                                  : "border-gray-200 text-gray hover:border-gray-300"
                              }`}
                            >
                              ${s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
                    <IconAlert className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-ripple flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Publicando...
                      </span>
                    ) : (
                      "Publicar trabajo"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreview(!preview)}
                    className="btn-ripple px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray hover:text-dark hover:border-gray-300 transition-all flex items-center gap-2"
                  >
                    <IconEye className="w-4 h-4" />
                    {preview ? "Ocultar vista" : "Vista previa"}
                  </button>
                </div>
              </form>
            </div>

            {/* ===== SIDEBAR / PREVIEW ===== */}
            <div className="lg:col-span-2">
              <div className="sticky top-8 space-y-4">
                {/* Tips */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <IconLightbulb className="w-4 h-4 text-accent" />
                    <h3 className="font-semibold text-dark text-sm">Consejos</h3>
                  </div>
                  <ul className="space-y-2.5 text-xs text-gray">
                    <li className="flex gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      Usa un título claro que describa el rol
                    </li>
                    <li className="flex gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      Incluye horarios y requisitos en la descripción
                    </li>
                    <li className="flex gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      Un presupuesto justo atrae mejores candidatos
                    </li>
                    <li className="flex gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      Los pagos son en USDT vía Polygon — seguro y rápido
                    </li>
                  </ul>
                </div>

                {/* Preview */}
                {preview && form.title && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5 animate-fade-up">
                    <div className="flex items-center gap-2 mb-3">
                      <IconEye className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-dark text-sm">Vista previa</h3>
                    </div>
                    <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-dark text-sm">
                            {form.title || "Título del trabajo"}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1.5 text-[11px] text-gray">
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                              </svg>
                              {form.location || "Ubicación"}
                            </span>
                            <span className="inline-flex items-center gap-1">{form.category}</span>
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {form.duration || "Duración"}
                            </span>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-primary flex-shrink-0">
                          ${budgetNum > 0 ? budgetNum.toFixed(2) : "—"}
                        </p>
                      </div>
                      {form.description && (
                        <p className="text-xs text-gray mt-2 line-clamp-3">
                          {form.description}
                        </p>
                      )}
                      <span className="inline-block mt-2 px-2 py-0.5 bg-secondary-light text-secondary text-[10px] font-medium rounded-full">
                        Abierto
                      </span>
                    </div>
                  </div>
                )}

                {/* Reference */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <IconChart className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-dark text-sm">Referencia de pagos</h3>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray">Por hora</span>
                      <span className="text-dark font-medium">$2 - $5/hr</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray">Media jornada</span>
                      <span className="text-dark font-medium">$10 - $25</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-gray">Jornada completa</span>
                      <span className="text-dark font-medium">$15 - $40</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
