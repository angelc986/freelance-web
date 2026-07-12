"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJob } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";

const categories = [
  { name: "Gastronomía", icon: "🍽️", desc: "Meseros, cocina, bar" },
  { name: "Logística", icon: "📦", desc: "Reparto, mudanza, almacén" },
  { name: "Servicios", icon: "🔧", desc: "Técnicos, reparaciones" },
  { name: "Limpieza", icon: "🧹", desc: "Limpieza general" },
  { name: "Eventos", icon: "🎉", desc: "Montaje, atención al público" },
  { name: "Retail", icon: "🏪", desc: "Ventas, inventario" },
];

const budgetSuggestions = [20, 50, 80, 100, 150, 200];

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  if (user && user.role !== "contractor") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light">
        <div className="text-center max-w-md mx-auto p-8">
          <p className="text-5xl mb-4">🔒</p>
          <h2 className="text-xl font-bold text-dark mb-2">Acceso restringido</h2>
          <p className="text-gray text-sm mb-6">
            Solo los contratistas pueden publicar trabajos. Si necesitas publicar un trabajo,
            regístrate como contratista.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-all"
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
      {/* Minimal nav */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/dashboard">
            <Logo size="sm" />
          </a>
          <span className="text-sm text-gray">Publicar trabajo</span>
        </div>
      </header>

      <div className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* ===== HEADER ===== */}
          <div className="mb-8">
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
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center text-sm">
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
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
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
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm resize-none"
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
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center text-sm">
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
                            <span className="text-lg">{cat.icon}</span>
                            <p className="text-sm font-medium text-dark mt-0.5">{cat.name}</p>
                            <p className="text-[11px] text-gray">{cat.desc}</p>
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
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm bg-white"
                      >
                        <option value="">Selecciona una duración</option>
                        <option value="1-2 horas">⏱️ 1-2 horas</option>
                        <option value="2-4 horas">⏱️ 2-4 horas</option>
                        <option value="4-6 horas">⏱️ 4-6 horas</option>
                        <option value="6-8 horas">⏱️ 6-8 horas</option>
                        <option value="8+ horas">⏱️ 8+ horas</option>
                        <option value="Jornada completa">📅 Jornada completa</option>
                        <option value="Por días">📅 Por días</option>
                        <option value="Por semanas">📅 Por semanas</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* ██████ UBICACIÓN + PRESUPUESTO ██████ */}
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center text-sm">
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
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">📍</span>
                        <input
                          type="text"
                          value={form.location}
                          onChange={(e) => update("location", e.target.value)}
                          placeholder="Ej: Caracas, Distrito Capital"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
                        />
                      </div>
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
                          className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
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
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-red-500 mt-0.5">⚠️</span>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
                    className="px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray hover:text-dark hover:border-gray-300 transition-all"
                  >
                    {preview ? "Ocultar vista" : "👁️ Vista previa"}
                  </button>
                </div>
              </form>
            </div>

            {/* ===== SIDEBAR / PREVIEW ===== */}
            <div className="lg:col-span-2">
              <div className="sticky top-8 space-y-4">
                {/* Tips */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-dark text-sm mb-3">💡 Consejos</h3>
                  <ul className="space-y-2 text-xs text-gray">
                    <li className="flex gap-2">
                      <span className="text-primary flex-shrink-0">•</span>
                      Usa un título claro que describa el rol
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary flex-shrink-0">•</span>
                      Incluye horarios y requisitos en la descripción
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary flex-shrink-0">•</span>
                      Un presupuesto justo atrae mejores candidatos
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary flex-shrink-0">•</span>
                      Los pagos son en USDT vía Polygon (seguro y rápido)
                    </li>
                  </ul>
                </div>

                {/* Preview */}
                {preview && form.title && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5 animate-fade-up">
                    <h3 className="font-semibold text-dark text-sm mb-3">👁️ Vista previa</h3>
                    <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-dark text-sm">
                            {form.title || "Título del trabajo"}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1.5 text-[11px] text-gray">
                            <span>📍 {form.location || "Ubicación"}</span>
                            <span>📂 {form.category}</span>
                            <span>⏱️ {form.duration || "Duración"}</span>
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

                {/* Duration reference */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-dark text-sm mb-3">📊 Referencia de pagos</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray">Media por hora</span>
                      <span className="text-dark font-medium">$8 - $15/hr</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-gray">Media jornada</span>
                      <span className="text-dark font-medium">$30 - $60</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-gray">Jornada completa</span>
                      <span className="text-dark font-medium">$60 - $150</span>
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
