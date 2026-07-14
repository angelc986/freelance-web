"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      router.push(user.is_admin ? "/admin" : "/dashboard");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-lighter via-white to-secondary-light/20">
      {/* Header */}
      <header className="border-b border-gray-200/50 bg-white/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <a href="/" className="flex items-center gap-2">
            <Logo size="sm" />
          </a>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 animate-fade-in">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-primary/5 border border-gray-200/60 p-8 animate-page-enter">
            {/* Logo + Title */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Logo size="md" />
              </div>
              <h1 className="text-xl font-bold text-dark">Bienvenido de nuevo</h1>
              <p className="text-sm text-gray mt-1.5">
                ¿No tienes cuenta?{" "}
                <a href="/auth/register" className="text-primary font-medium hover:text-primary-dark transition-colors">
                  Regístrate
                </a>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="input-glow w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all text-sm bg-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-glow w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all text-sm bg-white"
                />
              </div>

              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-ripple w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Entrando...
                  </span>
                ) : (
                  "Entrar"
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray mt-6">
            &copy; {new Date().getFullYear()} TurnoGO. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
