"use client";

import { useState, useEffect, useRef } from "react";
import Logo from "@/components/Logo";
import RevealSection from "@/components/RevealSection";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";

const navLinks = [
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Categorías", href: "#categorias" },
  { label: "Para empresas", href: "#empresas" },
];

/* ========== PARTICLES ========== */
function Particles({ count = 20 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
    duration: `${6 + Math.random() * 6}s`,
  }));

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            width: p.size,
            height: p.size,
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.duration,
            animationName: "float-particle",
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
          }}
        />
      ))}
    </>
  );
}

/* ========== WAVE DIVIDER ========== */
function WaveDivider({ color = "#F8FAFC" }: { color?: string }) {
  return (
    <div className="wave-separator -mt-1">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
        <path
          fill={color}
          d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z"
        />
      </svg>
    </div>
  );
}

/* ========== ANIMATED COUNTER ========== */
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const duration = 1500;
          const steps = 30;
          const stepTime = duration / steps;
          let current = 0;

          const timer = setInterval(() => {
            current++;
            setCount(Math.min(Math.round((target * current) / steps), target));
            if (current >= steps) clearInterval(timer);
          }, stepTime);

          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {typeof target === "number" && target === 48 ? "4.8" : count}
      {suffix}
    </span>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* ========== NAVBAR ========== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <Logo size="md" />
          </a>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-gray hover:text-dark transition-colors text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="/auth/login"
              className="px-5 py-2.5 text-sm font-medium text-dark border border-gray-light rounded-full hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
            >
              Iniciar sesión
            </a>
            <a
              href="/auth/register"
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-full hover:bg-primary-dark transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
            >
              Registrarse
            </a>
          </div>

          <button
            className="md:hidden p-2 text-dark"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menú"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>

        {menuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block text-gray hover:text-dark transition-colors text-sm font-medium py-2"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <a
                href="/auth/login"
                className="block w-full text-center px-5 py-2 text-sm font-medium text-dark border border-gray-light rounded-full"
                onClick={() => setMenuOpen(false)}
              >
                Iniciar sesión
              </a>
              <a
                href="/auth/register"
                className="block w-full text-center px-5 py-2 text-sm font-medium text-white bg-primary rounded-full"
                onClick={() => setMenuOpen(false)}
              >
                Registrarse
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ========== HERO ========== */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-20 bg-gradient-to-br from-primary-lighter via-white to-secondary-light/20 animate-gradient" />

        {/* Blobs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4" />

          {/* Moving grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03] animate-grid" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-large" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#2563EB" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-large)" />
          </svg>
        </div>

        {/* Floating particles */}
        <Particles count={25} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-8 animate-fade-up">
              <Logo size="lg" />
            </div>

            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-6 animate-fade-up border border-primary/20">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Trabajo freelance local en Venezuela
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-dark leading-tight tracking-tight animate-fade-up animate-delay-100">
              Encuentra trabajo o contrata ayuda{" "}
              <span className="text-primary">cerca de ti</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-gray leading-relaxed max-w-2xl mx-auto animate-fade-up animate-delay-200">
              TurnoGO conecta trabajadores verificados con negocios locales en
              Venezuela. Sin papeleo, sin demoras. Desde meseros hasta
              electricistas, encuentra lo que necesitas en horas.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up animate-delay-300">
              <a
                href="/auth/register?role=worker"
                className="group w-full sm:w-auto px-8 py-3.5 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 shine-hover"
              >
                Quiero trabajar
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </a>
              <a
                href="/auth/register?role=contractor"
                className="group w-full sm:w-auto px-8 py-3.5 bg-white text-dark font-semibold border-2 border-gray-light rounded-full hover:border-primary hover:text-primary transition-all hover:shadow-md"
              >
                Quiero contratar
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </a>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray animate-fade-in animate-delay-500">
              <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
              <span>+50 trabajadores ya se registraron esta semana</span>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fade-in animate-delay-500">
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-dark">
                  <Counter target={50} suffix="+" />
                </p>
                <p className="text-sm text-gray mt-1">Trabajos activos</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-dark">
                  <Counter target={200} suffix="+" />
                </p>
                <p className="text-sm text-gray mt-1">Trabajadores</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-dark">
                  <Counter target={48} />
                  <span className="text-accent">★</span>
                </p>
                <p className="text-sm text-gray mt-1">Valoración</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wave transition */}
      <WaveDivider color="#F8FAFC" />

      {/* ========== TRUSTED BY ========== */}
      <RevealSection delay={100}>
        <section className="py-12 bg-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray font-medium mb-8 uppercase tracking-widest">
              Confiado por negocios en todo Venezuela
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-6 opacity-45">
              {["Café Caracas", "Distribuidora MG", "Eventos Épicos", "Tech Soluciones VE", "Grupo Alfa"].map(
                (name) => (
                  <span
                    key={name}
                    className="text-gray/60 text-lg font-bold tracking-tight uppercase select-none"
                  >
                    {name}
                  </span>
                )
              )}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ========== CÓMO FUNCIONA ========== */}
      <RevealSection delay={100}>
        <section id="como-funciona" className="py-16 sm:py-24 bg-light relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-primary/20">
                Simple y rápido
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-dark">
                ¿Cómo funciona?
              </h2>
              <p className="mt-4 text-lg text-gray max-w-xl mx-auto">
                Tan fácil como pedir un turno. Así de simple.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* TurnoGO column — PROFESSIONAL BLUE CARD */}
              <div className="relative group rounded-2xl p-[1px] bg-gradient-to-br from-primary via-primary-dark to-secondary overflow-hidden hover:shadow-xl hover:shadow-primary/20 transition-shadow">
                <div className="relative rounded-2xl p-8 h-full bg-gradient-to-br from-primary-dark/5 via-white to-primary-light/20 backdrop-blur-sm">
                  {/* Glow effect on hover */}
                  <div className="absolute -inset-20 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="font-bold text-lg text-dark">TurnoGO</span>
                      <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        Recomendado
                      </span>
                    </div>

                    <div className="space-y-6">
                      <BlueStep num={1} title="Publica o busca" desc="El contratista publica el trabajo con todos los detalles. El trabajador encuentra turnos cerca de su ubicación." />
                      <BlueStep num={2} title="Conecta al instante" desc="Match directo en minutos. Sin esperar llamadas ni correos. Todo desde la app." />
                      <BlueStep num={3} title="Pago seguro en USDT" desc="Paga y cobra en USDT vía Polygon. Rápido, sin bancos, con respaldo de blockchain." />
                    </div>

                    <div className="mt-6 pt-4 border-t border-primary/10">
                      <a href="/auth/register" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors">
                        Empezar ahora
                        <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Traditional column */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200/60 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-7 h-7 bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="font-bold text-lg text-gray">Lo tradicional</span>
                </div>

                <div className="space-y-6">
                  <StepRow
                    num={1}
                    title="Llamadas y mensajes"
                    desc="Horas perdidas buscando contactos, preguntando disponibilidad, esperando respuestas."
                    muted
                  />
                  <StepRow
                    num={2}
                    title="Papeleo infinito"
                    desc="Contratos, recibos, transferencias bancarias. Mucha burocracia para algo simple."
                    muted
                  />
                  <StepRow
                    num={3}
                    title="Pagos lentos"
                    desc="Transferencias que tardan días, comisiones altas, efectivo inseguro."
                    muted
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ========== CATEGORÍAS ========== */}
      <RevealSection delay={100}>
        <section id="categorias" className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-primary/20">
                Explora
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-dark">
                Encuentra lo que necesitas
              </h2>
              <p className="mt-4 text-lg text-gray max-w-xl mx-auto">
                Más de 10 categorías de servicios. Elige la tuya.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
              <CategoryCard icon="🍽️" title="Gastronomía" desc="Meseros, cocineros, bartenders" />
              <CategoryCard icon="📦" title="Logística" desc="Cargadores, repartidores, almacén" />
              <CategoryCard icon="🔧" title="Servicios" desc="Electricistas, plomeros, técnicos" />
              <CategoryCard icon="🧹" title="Limpieza" desc="Housekeeping, office cleaning" />
              <CategoryCard icon="🎪" title="Eventos" desc="Staff para bodas, conciertos, ferias" />
              <CategoryCard icon="🛒" title="Retail" desc="Vendedores, stockers, cajeros" />
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ========== ESTADÍSTICAS ========== */}
      <RevealSection>
        <section className="relative py-20 sm:py-28 bg-primary overflow-hidden">
          {/* Animated grid */}
          <div className="absolute inset-0 opacity-[0.07]">
            <svg className="w-full h-full animate-grid" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="stats-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.5" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#stats-grid)" />
            </svg>
          </div>

          {/* Floating circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 animate-float" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4 animate-float-delayed" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-3 gap-12 text-center">
              <div className="animate-float">
                <p className="text-4xl sm:text-5xl font-bold text-white">
                  <Counter target={98} suffix="%" />
                </p>
                <p className="text-primary-light/80 mt-2 text-sm font-medium">
                  Tasa de presentación de trabajadores
                </p>
              </div>
              <div className="animate-float-delayed">
                <p className="text-4xl sm:text-5xl font-bold text-white">
                  &lt;<Counter target={24} />
                  <span className="text-sm ml-1">h</span>
                </p>
                <p className="text-primary-light/80 mt-2 text-sm font-medium">
                  Tiempo promedio en cubrir un turno
                </p>
              </div>
              <div className="animate-float" style={{ animationDelay: "0.8s" }}>
                <p className="text-4xl sm:text-5xl font-bold text-white">
                  <Counter target={48} />
                  <span className="text-accent ml-1">★</span>
                </p>
                <p className="text-primary-light/80 mt-2 text-sm font-medium">
                  Calificación promedio de trabajadores
                </p>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ========== PARA EMPRESAS ========== */}
      <RevealSection delay={100}>
        <section id="empresas" className="py-16 sm:py-24 relative overflow-hidden">
          {/* Decorative blob */}
          <div className="absolute top-1/2 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/2" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-primary/20">
                  Características
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-dark">
                  Para empresas y contratistas
                </h2>
                <p className="mt-4 text-lg text-gray max-w-xl mx-auto">
                  Todo lo que necesitas para gestionar tu personal temporal.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <FeatureCard
                  icon="🎯"
                  title="Matching inteligente"
                  desc="Encuentra al trabajador ideal para cada turno según su historial, calificaciones y ubicación."
                />
                <FeatureCard
                  icon="🛡️"
                  title="Verificación completa"
                  desc="Todos los trabajadores pasan por verificación de identidad y referencias antes de activarse."
                />
                <FeatureCard
                  icon="⏱️"
                  title="Tracking en tiempo real"
                  desc="Geocerca y monitoreo para saber exactamente cuándo llegan, se van y cuántas horas trabajan."
                />
                <FeatureCard
                  icon="🤖"
                  title="Backup automático"
                  desc="Si alguien no se presenta, el sistema activa automáticamente a otro trabajador disponible."
                />
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ========== TESTIMONIOS ========== */}
      <RevealSection delay={100}>
        <section className="py-16 sm:py-24 bg-light relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-primary/20">
                Testimonios
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-dark">
                Lo que dicen nuestros usuarios
              </h2>
              <p className="mt-4 text-lg text-gray max-w-xl mx-auto">
                Personas reales, resultados reales.
              </p>
            </div>
            <Testimonials />
          </div>
        </section>
      </RevealSection>

      {/* ========== FAQ ========== */}
      <RevealSection delay={100}>
        <section className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-primary/20">
                FAQ
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-dark">
                Preguntas frecuentes
              </h2>
              <p className="mt-4 text-lg text-gray max-w-xl mx-auto">
                Todo lo que necesitas saber antes de empezar.
              </p>
            </div>
            <FAQ />
          </div>
        </section>
      </RevealSection>

      {/* ========== CTA FINAL ========== */}
      <RevealSection>
        <section className="relative py-20 sm:py-28 bg-gradient-to-br from-primary via-primary-dark to-primary-darker overflow-hidden">
          {/* Animated particles */}
          <div className="absolute inset-0 opacity-10">
            <Particles count={15} />
          </div>

          {/* Background blobs */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-float-delayed" />

          {/* Grid overlay */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="cta-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.8" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cta-grid)" />
          </svg>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              ¿Listo para empezar?
            </h2>
            <p className="mt-4 text-lg text-primary-light/80 max-w-lg mx-auto">
              Únete a la comunidad TurnoGO. Encuentra trabajo o contrata ayuda en
              minutos.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/auth/register?role=worker"
                className="group w-full sm:w-auto px-8 py-3.5 bg-white text-primary font-semibold rounded-full hover:bg-primary-light transition-all shadow-lg hover:shadow-xl shine-hover"
              >
                Crear cuenta gratis
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </a>
              <a
                href="/auth/login"
                className="group w-full sm:w-auto px-8 py-3.5 text-white font-semibold border-2 border-white/20 rounded-full hover:bg-white/10 hover:border-white/40 transition-all"
              >
                Ya tengo cuenta
              </a>
            </div>
            <p className="mt-4 text-xs text-primary-light/50">
              Sin compromiso. Crea tu cuenta en menos de 2 minutos.
            </p>
          </div>
        </section>
      </RevealSection>

      {/* ========== FOOTER ========== */}
      <footer className="bg-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <Logo className="mb-4" />
              <p className="text-gray-light/60 text-sm leading-relaxed">
                Conectamos trabajadores con negocios locales en Venezuela.
                Rápido, seguro y sin complicaciones.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Plataforma</h4>
              <ul className="space-y-2 text-sm text-gray-light/60">
                <li><a href="#como-funciona" className="hover:text-white transition-colors">Cómo funciona</a></li>
                <li><a href="#categorias" className="hover:text-white transition-colors">Categorías</a></li>
                <li><a href="#empresas" className="hover:text-white transition-colors">Para empresas</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-light/60">
                <li><a href="#" className="hover:text-white transition-colors">Términos de uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de pagos</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Contacto</h4>
              <ul className="space-y-2 text-sm text-gray-light/60">
                <li className="flex items-center gap-1.5">🇻🇪 Venezuela</li>
                <li>
                  <a href="mailto:hola@turnogo.com" className="hover:text-white transition-colors">
                    hola@turnogo.com
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">@turnogo_ve</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-light/40">
            <p>© {new Date().getFullYear()} TurnoGO. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ===== SUB-COMPONENTS ===== */

/* Blue step for TurnoGO card */
function BlueStep({
  num,
  title,
  desc,
}: {
  num: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-sm font-bold shadow-sm">
        {num}
      </div>
      <div className="pt-0.5">
        <h4 className="font-semibold text-dark">{title}</h4>
        <p className="text-sm mt-0.5 leading-relaxed text-gray">{desc}</p>
      </div>
    </div>
  );
}

/* Gray step for traditional card */
function StepRow({
  num,
  title,
  desc,
  muted = false,
}: {
  num: number;
  title: string;
  desc: string;
  muted?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
        muted ? "bg-gray-100 text-gray" : "bg-primary/10 text-primary"
      }`}>
        {num}
      </div>
      <div className="pt-0.5">
        <h4 className={`font-semibold ${muted ? "text-gray" : "text-dark"}`}>
          {title}
        </h4>
        <p className={`text-sm mt-0.5 leading-relaxed ${muted ? "text-gray-light" : "text-gray"}`}>
          {desc}
        </p>
      </div>
    </div>
  );
}

function CategoryCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <a
      href="/jobs"
      className="group relative overflow-hidden flex items-center gap-5 p-6 rounded-xl border border-gray-200 bg-white hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all"
    >
      {/* Blue left accent on hover */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />

      <span className="text-3xl flex-shrink-0">{icon}</span>
      <div>
        <h4 className="font-semibold text-dark group-hover:text-primary transition-colors">
          {title}
        </h4>
        <p className="text-sm text-gray mt-0.5">{desc}</p>
      </div>

      {/* Arrow on hover */}
      <svg
        className="w-5 h-5 text-primary ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="group relative p-6 rounded-xl bg-white border border-gray-200 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all">
      {/* Blue gradient top bar */}
      <div className="absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r from-primary to-primary-dark scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />

      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
        <span className="text-2xl">{icon}</span>
      </div>
      <h4 className="font-semibold text-dark text-lg">{title}</h4>
      <p className="text-sm text-gray mt-1.5 leading-relaxed">{desc}</p>

      {/* Bottom indicator */}
      <div className="mt-4 flex items-center gap-1.5 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Saber más</span>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
