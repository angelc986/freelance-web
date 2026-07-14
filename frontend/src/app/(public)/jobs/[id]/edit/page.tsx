"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getJob, updateJob } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";

// ─── CONSTANTS ───
const categories = [
  { name: "Construcci&oacute;n", desc: "Peones, alba&ntilde;iles, obra" },
  { name: "Electricidad y Mantenimiento", desc: "Electricistas, t&eacute;cnicos, plomeros" },
  { name: "Pintura y Acabados", desc: "Pintores, drywall, cer&aacute;mica" },
  { name: "Carga y Mudanza", desc: "Cargadores, fletes, mudanceros" },
  { name: "Limpieza", desc: "Casas, oficinas, edificios" },
  { name: "Cuidado Personal", desc: "Ni&ntilde;eras, cuidadores" },
  { name: "Gastronom&iacute;a", desc: "Meseros, cocina, bar" },
  { name: "Eventos", desc: "Montaje, atenci&oacute;n al p&uacute;blico" },
  { name: "Log&iacute;stica", desc: "Repartidores, almac&eacute;n" },
  { name: "Retail y Ventas", desc: "Vendedores, cajeros, stockers" },
  { name: "Jardiner&iacute;a", desc: "Jardineros, poda, limpieza" },
  { name: "Conducci&oacute;n y Mensajer&iacute;a", desc: "Conductores, mensajeros, delivery" },
];

const budgetSuggestions = [5, 10, 15, 20, 30, 50];

// ─── SVG ───
function IconArrowLeft({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
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

function IconLightbulb({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
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

// ─── SKELETON ───
function EditSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-light">
      <header className="border-b border-gray-200 bg-white h-16" />
      <div className="flex-1 py-8 max-w-4xl mx-auto px-4">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded-lg w-1/3 shimmer" />
          <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-1/4 shimmer" />
            <div className="h-10 bg-gray-200 rounded-xl shimmer" />
            <div className="h-24 bg-gray-200 rounded-xl shimmer" />
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-1/4 shimmer" />
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-200 rounded-xl shimmer" />)}
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-1/4 shimmer" />
            <div className="h-10 bg-gray-200 rounded-xl shimmer" />
            <div className="h-10 bg-gray-200 rounded-xl shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ───
export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const jobId = parseInt(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    budget: "",
    duration: "",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    if (user.role !== "contractor") { router.push("/dashboard"); return; }

    getJob(jobId).then((job) => {
      if (job.client_id !== user.id) { router.push("/dashboard"); return; }
      if (job.status !== "open") { router.push(`/jobs/${jobId}`); return; }
      setForm({
        title: job.title,
        description: job.description,
        category: job.category,
        location: job.location,
        budget: job.budget.toString(),
        duration: job.duration,
      });
    }).catch(() => router.push("/jobs")).finally(() => setLoading(false));
  }, [jobId, user, authLoading]);

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
      setError("El presupuesto debe ser un n&uacute;mero v&aacute;lido mayor a 0");
      return;
    }

    if (title.length < 5) {
      setError("El t&iacute;tulo debe tener al menos 5 caracteres");
      return;
    }

    if (description.length < 20) {
      setError("La descripci&oacute;n debe tener al menos 20 caracteres");
      return;
    }

    setSaving(true);
    try {
      const job = await updateJob(jobId, {
        title, description, category, location, budget: budgetNum, duration,
      });
      router.push(`/jobs/${job.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const descChars = form.description.length;
  const budgetNum = parseFloat(form.budget) || 0;

  if (loading || authLoading) return <EditSkeleton />;

  return (
    <div className="min-h-screen flex flex-col bg-light">
      {/* Nav */}
      <header className="border-b border-gray-200 bg-white/60 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/dashboard">
            <Logo size="sm" />
          </a>
          <span className="text-sm text-gray">Editar trabajo</span>
        </div>
      </header>

      <div className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back */}
          <a
            href={`/jobs/${jobId}`}
            className="btn-ripple inline-flex items-center gap-1.5 px-4 py-1.5 border border-gray-200 text-sm text-gray font-medium rounded-full hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all mb-6"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver
          </a>

          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-2xl font-bold text-dark">Editar trabajo</h1>
            <p className="text-gray text-sm mt-1">
              Modifica los detalles del trabajo. Solo se puede editar mientras est&aacute; abierto.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info b&aacute;sica */}
            <section className="bg-white rounded-xl border border-gray-200 p-6 animate-stagger-pop">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h2 className="font-semibold text-dark">Informaci&oacute;n b&aacute;sica</h2>
                  <p className="text-xs text-gray">T&iacute;tulo y descripci&oacute;n del trabajo</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">
                    T&iacute;tulo <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="Ej: Mesero para evento corporativo s&aacute;bado"
                    className="input-glow w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all text-sm bg-white"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">
                    Descripci&oacute;n <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="Describe las responsabilidades, horario, requisitos..."
                    className="input-glow w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all text-sm resize-none bg-white"
                    rows={5}
                    maxLength={2000}
                  />
                  <div className="flex justify-between mt-1">
                    <p className={`text-xs ${descChars < 20 ? "text-red-400" : "text-gray"}`}>
                      {descChars < 20 ? `M&iacute;nimo 20 caracteres (${descChars}/20)` : ""}
                    </p>
                    <span className="text-xs text-gray">{descChars}/2000</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Categor&iacute;a + Duraci&oacute;n */}
            <section className="bg-white rounded-xl border border-gray-200 p-6 animate-stagger-pop" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h2 className="font-semibold text-dark">Categor&iacute;a y duraci&oacute;n</h2>
                  <p className="text-xs text-gray">Clasifica tu trabajo</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    Categor&iacute;a <span className="text-red-400">*</span>
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
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">
                    Duraci&oacute;n estimada <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.duration}
                    onChange={(e) => update("duration", e.target.value)}
                    className="input-glow w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all text-sm bg-white"
                  >
                    <option value="">Selecciona una duraci&oacute;n</option>
                    <option value="1-2 horas">1-2 horas</option>
                    <option value="2-4 horas">2-4 horas</option>
                    <option value="4-6 horas">4-6 horas</option>
                    <option value="6-8 horas">6-8 horas</option>
                    <option value="8+ horas">8+ horas</option>
                    <option value="Jornada completa">Jornada completa</option>
                    <option value="Por d&iacute;as">Por d&iacute;as</option>
                    <option value="Por semanas">Por semanas</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Ubicaci&oacute;n + Pago */}
            <section className="bg-white rounded-xl border border-gray-200 p-6 animate-stagger-pop" style={{ animationDelay: "0.15s" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h2 className="font-semibold text-dark">Ubicaci&oacute;n y pago</h2>
                  <p className="text-xs text-gray">D&oacute;nde y cu&aacute;nto</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">
                    Ubicaci&oacute;n <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => update("location", e.target.value)}
                    placeholder="Ej: Caracas, Distrito Capital"
                    className="input-glow w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all text-sm bg-white"
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
                disabled={saving}
                className="btn-ripple flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 shadow-md shadow-primary/20"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </span>
                ) : "Guardar cambios"}
              </button>
              <a
                href={`/jobs/${jobId}`}
                className="px-5 py-3 border border-gray-200 rounded-xl text-sm text-gray hover:text-dark hover:border-gray-300 transition-all text-center"
              >
                Cancelar
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
