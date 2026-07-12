"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";

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

  // Read role from URL ?role=worker or ?role=contractor
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
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <a href="/">
            <Logo size="sm" />
          </a>
        </div>
      </header>

      {/* Form */}
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-dark">Crear cuenta</h1>
            <p className="text-gray text-sm mt-2">
              ¿Ya tienes cuenta?{" "}
              <a href="/auth/login" className="text-primary font-medium hover:underline">
                Inicia sesión
              </a>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selector */}
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
                🧑‍💼 Trabajador
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
                🏢 Contratista
              </button>
            </div>

            {/* Full name */}
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Nombre completo
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                placeholder="Tu nombre y apellido"
                className="w-full px-4 py-2.5 border border-gray-light rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
                autoFocus
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="tu@correo.com"
                className="w-full px-4 py-2.5 border border-gray-light rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Teléfono
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="0412-1234567"
                className="w-full px-4 py-2.5 border border-gray-light rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
              />
            </div>

            {/* Cédula */}
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Cédula de identidad
              </label>
              <input
                type="text"
                value={form.cedula}
                onChange={(e) => update("cedula", e.target.value)}
                placeholder="V-12345678"
                className="w-full px-4 py-2.5 border border-gray-light rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-2.5 border border-gray-light rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Terms */}
            <p className="text-xs text-gray text-center">
              Al registrarte aceptas nuestros{" "}
              <a href="#" className="text-primary hover:underline">Términos de uso</a>{" "}
              y{" "}
              <a href="#" className="text-primary hover:underline">Política de privacidad</a>.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <a href="/">
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
