"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import LegalModals from "@/components/LegalModals";

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [role, setRole] = useState<"worker" | "contractor">("worker");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    cedula: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<"terms" | "privacy">("terms");

  useEffect(() => {
    const r = searchParams.get("role");
    if (r === "contractor") setRole("contractor");
  }, [searchParams]);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { full_name, email, phone, cedula, password } = form;

    if (!full_name || !email || !phone || !cedula || !password) {
      setError("Completa todos los campos");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      await register({ ...form, role });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10 animate-fade-in">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-xl shadow-primary/5 border border-gray-200/60 p-8 animate-page-enter">
          {/* Logo + Title */}
          <div className="text-center mb-7">
            <div className="flex justify-center mb-3">
              <Logo size="md" />
            </div>
            <h1 className="text-xl font-bold text-dark">Crear cuenta gratis</h1>
            <p className="text-sm text-gray mt-1.5">
              ¿Ya tienes cuenta?{" "}
              <a href="/auth/login" className="text-primary font-medium hover:text-primary-dark transition-colors">
                Inicia sesión
              </a>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Role selector - no emojis */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setRole("worker")}
                className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                  role === "worker"
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray hover:text-dark"
                }`}
              >
                Trabajador
              </button>
              <button
                type="button"
                onClick={() => setRole("contractor")}
                className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                  role === "contractor"
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray hover:text-dark"
                }`}
              >
                Contratista
              </button>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-dark mb-1">Nombre completo</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                placeholder="Tu nombre y apellido"
                className="input-glow w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all text-sm bg-white"
                autoFocus
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-dark mb-1">Correo electrónico</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="tu@correo.com"
                className="input-glow w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all text-sm bg-white"
              />
            </div>

            {/* Phone + Cedula row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="0412-1234567"
                  className="input-glow w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Cédula</label>
                <input
                  type="text"
                  value={form.cedula}
                  onChange={(e) => update("cedula", e.target.value)}
                  placeholder="V-12345678"
                  className="input-glow w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all text-sm bg-white"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-dark mb-1">Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="input-glow w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all text-sm bg-white"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Terms checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 accent-primary"
              />
              <span className="text-xs text-gray leading-relaxed">
                Acepto los{" "}
                <button
                  type="button"
                  onClick={() => { setLegalTab("terms"); setLegalOpen(true); }}
                  className="text-primary hover:underline font-medium inline"
                >
                  Términos de uso
                </button>
                {" "}y{" "}
                <button
                  type="button"
                  onClick={() => { setLegalTab("privacy"); setLegalOpen(true); }}
                  className="text-primary hover:underline font-medium inline"
                >
                  Política de privacidad
                </button>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={!accepted || loading}
              className="btn-ripple w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creando cuenta...
                </span>
              ) : (
                "Crear cuenta gratis"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray mt-6">
          &copy; {new Date().getFullYear()} TurnoGO. Todos los derechos reservados.
        </p>
      </div>

      {/* Legal modal */}
      <LegalModals open={legalOpen} tab={legalTab} onClose={() => setLegalOpen(false)} />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-lighter via-white to-secondary-light/20">
      <header className="border-b border-gray-200/50 bg-white/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <a href="/" className="flex items-center gap-2">
            <Logo size="sm" />
          </a>
        </div>
      </header>
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
