"use client";

import { useState, useEffect, useRef } from "react";
import Logo from "@/components/Logo";
import RevealSection from "@/components/RevealSection";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import InfoModal from "@/components/InfoModal";
import CategoriasModal from "@/components/CategoriasModal";

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
  const [scrolled, setScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setShowBackToTop(y > 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* ========== NAVBAR — safe-area aware ========== */}
      <header
        className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-200" : "bg-white/80 backdrop-blur-xl border-b border-gray-200/50"
        }`}
        style={{ top: "env(safe-area-inset-top, 0px)" }}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <Logo size="md" />
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              if (link.href === "#como-funciona") {
                return (
                  <button
                    key={link.href}
                    onClick={() => {
                      document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" });
                      setInfoOpen(true);
                    }}
                    className="text-gray hover:text-dark transition-colors text-sm font-medium"
                  >
                    {link.label}
                  </button>
                );
              }
              if (link.href === "#categorias") {
                return (
                  <button
                    key={link.href}
                    onClick={() => {
                      document.getElementById("categorias")?.scrollIntoView({ behavior: "smooth" });
                      setCatOpen(true);
                    }}
                    className="text-gray hover:text-dark transition-colors text-sm font-medium"
                  >
                    {link.label}
                  </button>
                );
              }
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-gray hover:text-dark transition-colors text-sm font-medium"
                >
                  {link.label}
                </a>
              );
            })}
          </div>

          {/* Desktop CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/auth?screen=login"
              className="px-5 py-2.5 text-sm font-medium text-dark border border-gray-light rounded-full hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
            >
              Iniciar sesión
            </a>
            <a
              href="/auth"
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-full hover:bg-primary-dark transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
            >
              Registrarse
            </a>
          </div>

          {/* Mobile: botón Comenzar + hamburguer */}
          <div className="md:hidden flex items-center gap-1.5">
            <a
              href="/auth"
              className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-full hover:bg-primary-dark active:bg-primary-darker transition-all shadow-sm shadow-primary/20"
            >
              Comenzar
            </a>
            <button
              className="p-2 text-dark rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
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
          </div>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 space-y-2 animate-fade-in">
            <a
              href="/auth?screen=login"
              className="block w-full text-center px-5 py-3 text-sm font-semibold text-dark border border-gray-light rounded-full hover:border-primary hover:text-primary active:bg-primary/5 transition-all"
              onClick={() => setMenuOpen(false)}
            >
              Iniciar sesión
            </a>
            <a
              href="/auth"
              className="block w-full text-center px-5 py-3 text-sm font-semibold text-white bg-primary rounded-full hover:bg-primary-dark active:bg-primary-darker transition-all shadow-sm"
              onClick={() => setMenuOpen(false)}
            >
              Registrarse
            </a>
          </div>
        )}
      </header>

      {/* Barra de navegación visible: Cómo funciona, Categorías, Para empresas */}
      {/* Hidden on md+ porque el header ya los tiene en desktop */}
      <div className="fixed left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/70 md:hidden"
        style={{ top: "calc(4rem + env(safe-area-inset-top, 0px))" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-center gap-6 sm:gap-8 overflow-x-auto">
          {navLinks.map((link) => {
            if (link.href === "#como-funciona") {
              return (
                <button
                  key={link.href}
                  onClick={() => {
                    document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" });
                    setInfoOpen(true);
                  }}
                  className="text-gray-500 hover:text-primary transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
                >
                  {link.label}
                </button>
              );
            }
            if (link.href === "#categorias") {
              return (
                <button
                  key={link.href}
                  onClick={() => {
                    document.getElementById("categorias")?.scrollIntoView({ behavior: "smooth" });
                    setCatOpen(true);
                  }}
                  className="text-gray-500 hover:text-primary transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
                >
                  {link.label}
                </button>
              );
            }
            return (
              <a
                key={link.href}
                href={link.href}
                className="text-gray-500 hover:text-primary transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                {link.label}
              </a>
            );
          })}
        </div>
      </div>

      {/* ========== HERO ========== */}
      <section className="relative pt-[calc(8.5rem+env(safe-area-inset-top,0px))] sm:pt-[calc(10rem+env(safe-area-inset-top,0px))] md:pt-[calc(7rem+env(safe-area-inset-top,0px))] pb-16 sm:pb-24 overflow-hidden">
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
              Trabajo rápido, pago seguro, en Venezuela
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-dark leading-tight tracking-tight animate-fade-up animate-delay-100">
              Encuentra trabajo o contrata ayuda{" "}
              <span className="text-primary">cerca de ti</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-gray leading-relaxed max-w-2xl mx-auto animate-fade-up animate-delay-200">
              TurnoGO conecta trabajadores verificados con personas o negocios en
              Venezuela. Sin papeleo, sin demoras. Publica un trabajo y
              encuentra ayuda en horas.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up animate-delay-300">
              <a
                href="/auth"
                className="btn-ripple group w-full sm:w-auto px-8 py-3.5 text-white font-semibold rounded-full hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
                style={{ backgroundColor: '#2563EB' }}
              >
                Quiero trabajar
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform text-white/80">→</span>
              </a>
              <a
                href="/auth"
                className="btn-ripple group w-full sm:w-auto px-8 py-3.5 bg-white text-dark font-semibold border-2 border-primary/30 rounded-full hover:border-primary hover:text-primary hover:bg-primary/[0.03] transition-all hover:shadow-md"
              >
                Quiero contratar
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </a>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray animate-fade-in animate-delay-500">
              <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
              <span>+50 trabajadores ya se registraron esta semana</span>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fade-in animate-delay-500 md:hidden">
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

      {/* ========== TRUSTED BY (md:hidden en desktop) ========== */}
      <RevealSection delay={100}>
        <section className="py-12 bg-light md:hidden">
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
        <section id="como-funciona" className="py-10 sm:py-14 bg-light relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-10">
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

            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* TurnoGO column — PROFESSIONAL BLUE CARD */}
              <div className="rounded-2xl p-5" style={{background:"linear-gradient(135deg,rgba(37,99,235,0.03),white,rgba(5,150,105,0.08))",border:"1px solid rgba(37,99,235,0.15)"}}>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="font-bold text-base text-dark">TurnoGO</span>
                      <span className="ml-auto text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        Recomendado
                      </span>
                    </div>

                    <div className="space-y-4">
                      <BlueStep num={1} title="Publica o busca" desc="El contratista publica el trabajo con todos los detalles. El trabajador encuentra turnos cerca de su ubicación." />
                      <BlueStep num={2} title="Conecta al instante" desc="Match directo en minutos. Sin esperar llamadas ni correos. Todo desde la app." />
                      <BlueStep num={3} title="Pago protegido en USDT" desc="Cada trabajo tiene protección. Depositas los USDT y el pago se libera solo cuando el trabajo esté listo. Así de simple." />
                    </div>

                    <div className="mt-6 pt-4 border-t border-primary/10 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray group-hover:text-primary transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                        Más información
                      </span>
                      <a href="/auth?screen=register" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors">
                        Empezar ahora
                        <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
                      </a>
                    </div>
                  </div>
              </div>

              {/* Traditional column */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200/60 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="font-bold text-base text-gray">Lo tradicional</span>
                </div>

                <div className="space-y-4">
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
              <button
                onClick={() => setCatOpen(true)}
                className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer"
              >
                Explora
              </button>
              <h2 className="text-3xl sm:text-4xl font-bold text-dark">
                Encuentra lo que necesitas
              </h2>
              <p className="mt-4 text-lg text-gray max-w-xl mx-auto">
                Más de 10 categorías de servicios. Elige la tuya.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-7xl mx-auto stagger-children">
              <CategoryCard icon="construction" title="Construcción" desc="Peones, albañiles, ayudantes de obra" />
              <CategoryCard icon="tools" title="Electricidad y Mantenimiento" desc="Electricistas, técnicos de aires, plomeros" />
              <CategoryCard icon="paint" title="Pintura y Acabados" desc="Pintores, drywall, cerámica" />
              <CategoryCard icon="package" title="Carga y Mudanza" desc="Cargadores, fletes, mudanceros" />
              <CategoryCard icon="sparkles" title="Limpieza" desc="Casas, oficinas, edificios" />
              <CategoryCard icon="people" title="Cuidado Personal" desc="Niñeras, cuidadores, enfermeros" />
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ========== ESTADÍSTICAS (md:hidden) ========== */}
      <div className="md:hidden">
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
      </div>

      {/* ========== PARA EMPRESAS ========== */}
      <RevealSection delay={100}>
        <section id="empresas" className="py-16 sm:py-24 relative overflow-hidden">
          {/* Decorative blob */}
          <div className="absolute top-1/2 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/2" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-6xl mx-auto">
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

              <div className="grid sm:grid-cols-2 gap-6 stagger-children">
                <FeatureCard
                  icon={FeatureIcons.target}
                  title="Matching inteligente"
                  desc="Encuentra al trabajador ideal para cada turno según su historial, calificaciones y ubicación."
                />
                <FeatureCard
                  icon={FeatureIcons.shield}
                  title="Verificación completa"
                  desc="Todos los trabajadores pasan por verificación de identidad y referencias antes de activarse."
                />
                <FeatureCard
                  icon={FeatureIcons.clock}
                  title="Tracking en tiempo real"
                  desc="Geocerca y monitoreo para saber exactamente cuándo llegan, se van y cuántas horas trabajan."
                />
                <FeatureCard
                  icon={FeatureIcons.robot}
                  title="Backup automático"
                  desc="Si alguien no se presenta, el sistema activa automáticamente a otro trabajador disponible."
                />
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ========== TESTIMONIOS (md:hidden) ========== */}
      <div className="md:hidden">
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
      </div>

      {/* ========== FAQ (md:hidden) ========== */}
      <div className="md:hidden">
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
      </div>

      {/* ========== CTA FINAL (md:hidden) ========== */}
      <div className="md:hidden">
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
                href="/auth?screen=register"
                className="btn-ripple group w-full sm:w-auto px-8 py-3.5 text-white font-semibold border-2 border-white/30 rounded-full hover:bg-white/15 transition-all hover:border-white/60"
              >
                Crear cuenta gratis
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </a>
              <a
                href="/auth?screen=login"
                className="group w-full sm:w-auto px-8 py-3.5 text-white font-semibold border-2 border-white/30 rounded-full hover:bg-white/15 hover:border-white/60 transition-all"
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
      </div>

      {/* ========== INFO MODAL ========== */}
      <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
      <CategoriasModal open={catOpen} onClose={() => setCatOpen(false)} />

      {/* ========== BACK TO TOP ========== */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`back-to-top ${showBackToTop ? "visible" : ""}`}
        aria-label="Volver arriba"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
      </button>

      {/* ========== FOOTER (md:hidden en desktop) ========== */}
      <div className="md:hidden">
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
      </div>
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
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-xs font-bold shadow-sm">
        {num}
      </div>
      <div className="pt-0.5">
        <h4 className="font-semibold text-dark text-sm">{title}</h4>
        <p className="text-xs mt-0.5 leading-relaxed text-gray">{desc}</p>
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
    <div className="flex gap-3">
      <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
        muted ? "bg-gray-100 text-gray" : "bg-primary/10 text-primary"
      }`}>
        {num}
      </div>
      <div className="pt-0.5">
        <h4 className={`font-semibold text-sm ${muted ? "text-gray" : "text-dark"}`}>
          {title}
        </h4>
        <p className={`text-xs mt-0.5 leading-relaxed ${muted ? "text-gray-light" : "text-gray"}`}>
          {desc}
        </p>
      </div>
    </div>
  );
}

const categoryIcons: Record<string, React.ReactNode> = {
  construction: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  ),
  package: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
  tools: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.879 5.88a2.25 2.25 0 01-3.182 0 2.25 2.25 0 010-3.182l5.879-5.88m0 0l2.88-2.88m-2.88 2.88l2.88-2.88m2.88 2.88l5.88-5.879a2.25 2.25 0 000-3.182 2.25 2.25 0 00-3.182 0l-5.88 5.879m0 0l-2.88 2.88" />
    </svg>
  ),
  paint: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
    </svg>
  ),
  sparkles: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  ),
  people: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
};

function CategoryCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  const svgIcon = categoryIcons[icon] || null;

  return (
    <a
      href="/jobs"
      className="flex items-center gap-5 p-6 rounded-xl border border-gray-200 bg-white"
    >
      {/* Icon container with gradient background */}
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
        {svgIcon}
      </div>

      <div>
        <h4 className="font-semibold text-dark">
          {title}
        </h4>
        <p className="text-sm text-gray mt-0.5">{desc}</p>
      </div>

    </a>
  );
}

const FeatureIcons = {
  target: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  shield: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  clock: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  robot: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
    </svg>
  ),
};

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-6 rounded-xl bg-white border border-gray-200">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h4 className="font-semibold text-dark text-lg">{title}</h4>
      <p className="text-sm text-gray mt-1.5 leading-relaxed">{desc}</p>

    </div>
  );
}
