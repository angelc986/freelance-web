"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

const safeTop = "env(safe-area-inset-top, 0px)";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      {/* Header — safe-area aware */}
      <header
        className="border-b border-gray-200/50 bg-white/60 backdrop-blur-md"
        style={{
          paddingTop: safeTop,
          minHeight: `calc(4rem + ${safeTop})`,
        }}
      >
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
                <a
                  href="/auth/register"
                  className="text-primary font-medium hover:text-primary-dark transition-colors"
                >
                  Regístrate
                </a>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">
                  Correo electrónico
                </label>
                <div className="relative">
                  {/* Email icon */}
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="input-glow w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all text-sm bg-white"
                    autoFocus
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  {/* Lock icon */}
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-glow w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:border-primary outline-none transition-all text-sm bg-white"
                    autoComplete="current-password"
                  />
                  {/* Show/Hide password toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all duration-150"
                    tabIndex={-1}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      /* Eye-off icon */
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      /* Eye icon */
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot password link */}
              <div className="flex justify-end">
                <a
                  href="/auth/recover"
                  className="text-[11px] text-gray-400 hover:text-primary transition-colors duration-150"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2 animate-fade-in">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-ripple w-full py-3 bg-primary text-white font-semibold rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20 active:scale-[0.98]"
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
