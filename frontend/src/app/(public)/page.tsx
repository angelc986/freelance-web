"use client";

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
          <div className="hidden md:flex items-center justify-center flex-1 gap-12">
            {navLinks.map((link) => {
              if (link.href === "#como-funciona") {
                return (
                  <button
                    key={link.href}
                    onClick={() => {
                      document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" });
                      setInfoOpen(true);
                    }}
                    className="text-gray hover:text-dark transition-colors text-base font-semibold"
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
                    className="text-gray hover:text-dark transition-colors text-base font-semibold"
                  >
                    {link.label}
                  </button>
                );
              }
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-gray hover:text-dark transition-colors text-base font-semibold"
                >
                  {link.label}
                </a>
              );
            })}
          </div>

          {/* Desktop CTA buttons */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="/auth?screen=login"
              className="px-6 py-3 text-base font-semibold text-dark border border-gray-light rounded-full hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
            >
              Iniciar sesión
            </a>
            <a
              href="/auth"
              className="px-6 py-3 text-base font-semibold text-white bg-primary rounded-full hover:bg-primary-dark transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
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
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform text-white/80">?</span>
              </a>
              <a
                href="/auth"
                className="btn-ripple group w-full sm:w-auto px-8 py-3.5 bg-white text-dark font-semibold border-2 border-primary/30 rounded-full hover:border-primary hover:text-primary hover:bg-primary/[0.03] transition-all hover:shadow-md"
              >
                Quiero contratar
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">?</span>
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
                  <span className="text-accent">?</span>
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

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto items-stretch">
              {/* TurnoGO column â€” MODERN PREMIUM CARD */}
              <div className="group relative rounded-2xl bg-white p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1" style={{boxShadow:"0 4px 24px rgba(37,99,235,0.08), 0 1px 3px rgba(0,0,0,0.04)",border:"1px solid rgba(37,99,235,0.15)"}}>
                {/* Gradient left accent */}
                <div className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-gradient-to-b from-primary via-primary/70 to-green-500/60" />

                <div className="relative z-10 pl-3">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/25">
                      <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="font-bold text-lg text-dark tracking-tight">TurnoGO</span>
                    <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1 rounded-full shadow-lg" style={{background:"linear-gradient(135deg, #2563EB, #1d4ed8)",boxShadow:"0 4px 12px rgba(37,99,235,0.35)"}}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Recomendado
                    </span>
                  </div>

                  {/* Steps with timeline */}
                  <div className="space-y-0">
                    <BlueStep num={1} title="Publica o busca" desc="El contratista publica el trabajo con todos los detalles. El trabajador encuentra turnos cerca de su ubicaci\u00f3n." isLast={false} />
                    <BlueStep num={2} title="Conecta al instante" desc="Match directo en minutos. Sin esperar llamadas ni correos. Todo desde la app." isLast={false} />
                    <BlueStep num={3} title="Pago protegido en USDT" desc="Cada trabajo tiene protecci\u00f3n. Depositas los USDT y el pago se libera solo cuando el trabajo est\u00e9 listo. As\u00ed de simple." isLast={true} />
                  </div>

                  {/* CTA */}
                  <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" });
                        setInfoOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary transition-colors cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      </svg>
                      M\u00e1s informaci\u00f3n
                    </button>
                    <a
                      href="/auth?screen=register"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-white px-5 py-2 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                      style={{background:"linear-gradient(135deg, #2563EB, #1d4ed8)"}}
                    >
                      Empezar ahora
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Traditional column â€” DESATURATED COMPARISON */}
              <div className="relative rounded-2xl bg-white/50 p-6 transition-all duration-500 border border-gray-200/60" style={{boxShadow:"0 1px 6px rgba(0,0,0,0.03)"}}>
                <div className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-gradient-to-b from-gray-300 via-gray-200 to-gray-100" />

                <div className="relative z-10 pl-3">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-gray-200 flex items-center justify-center">
                      <svg className="w-4.5 h-4.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <span className="font-bold text-lg text-gray-400 tracking-tight">Lo tradicional</span>
                  </div>

                  {/* Steps with timeline â€” muted */}
                  <div className="space-y-0">
                    <StepRow num={1} title="Llamadas y mensajes" desc="Horas perdidas buscando contactos, preguntando disponibilidad, esperando respuestas." muted isLast={false} />
                    <StepRow num={2} title="Papeleo infinito" desc="Contratos, recibos, transferencias bancarias. Mucha burocracia para algo simple." muted isLast={false} />
                    <StepRow num={3} title="Pagos lentos" desc="Transferencias que tardan d\u00edas, comisiones altas, efectivo inseguro." muted isLast={true} />
                  </div>

                  {/* Bottom hint */}
                  <div className="mt-6 pt-5 border-t border-gray-100">
                    <p className="text-xs text-gray-300 text-center italic">
                      Sin protecci\u00f3n, sin garant\u00edas, sin tranquilidad.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ========== CATEGORIAS ========== */}
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

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto stagger-children">
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
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 ml-1.5 inline-block -mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
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

              <div className="grid sm:grid-cols-2 gap-6 stagger-children">
                                <FeatureCard
                  icon={FeatureIcons.target}
                  title="Matching inteligente"
                  desc="Encuentra al trabajador ideal para cada turno segÃºn su historial, calificaciones y ubicaciÃ³n."
                />
                <FeatureCard
                  icon={FeatureIcons.shield}
                  title="Verificación con Didit"
                  desc={<span>Verificación de identidad documental, selfie y biométrica con <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/5 px-1.5 py-0.5 rounded-md border border-primary/20">
                    <svg className="w-3 h-3" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="#2563EB" /><path d="M16 6C12 6 9 9 9 13v2a3 3 0 00-3 3v5a3 3 0 003 3h14a3 3 0 003-3v-5a3 3 0 00-3-3v-2c0-4-3-7-7-7z" fill="white" opacity="0.9" /><path d="M14 17l2 2 3-4" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Didit
                  </span></span>}
                />
                <FeatureCard
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  title="Tracking en tiempo real"
                  desc="Geocerca y monitoreo para saber exactamente cuándo llegan, se van y cuántas horas trabajan."
                />
                <FeatureCard
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                    </svg>
                  }
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
        <section className="py-16 sm:py-24 px-4 sm:px-0 bg-light relative overflow-hidden">
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
        <section className="py-16 sm:py-24 px-4 sm:px-0">
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
                href="/auth?screen=register"
                className="btn-ripple group w-full sm:w-auto px-8 py-3.5 text-white font-semibold border-2 border-white/30 rounded-full hover:bg-white/15 transition-all hover:border-white/60"
              >
                Crear cuenta gratis
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">?</span>
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
                <li><a href="https://medium.com/@turnogo" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-light/60">
                <li><a href="/terminos" className="hover:text-white transition-colors">Términos de uso</a></li>
                <li><a href="/privacidad" className="hover:text-white transition-colors">Privacidad</a></li>
                <li><a href="/politica-pagos" className="hover:text-white transition-colors">Política de pagos</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Contacto</h4>
              <ul className="space-y-2 text-sm text-gray-light/60">
                <li className="flex items-center gap-1.5">???? Venezuela</li>
                <li>
                  <a href="mailto:hola@turnogo.com" className="hover:text-white transition-colors">
                    hola@turnogo.com
                  </a>
                </li>
                <li>
                  <a href="https://instagram.com/turnogo_ve" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">@turnogo_ve</a>
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
  isLast = false,
}: {
  num: number;
  title: React.ReactNode;
  desc: string;
  isLast?: boolean;
}) {
  return (
    <div className="relative flex gap-4 pb-2">
      {/* Timeline connecting line */}
      {!isLast && (
        <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gradient-to-b from-primary/30 to-primary/5" />
      )}
      {/* Number circle */}
      <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary via-primary-dark to-primary text-white flex items-center justify-center text-xs font-bold shadow-lg shadow-primary/25">
        {num}
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-dark text-sm">{title}</h4>
        <p className="text-xs mt-0.5 leading-relaxed text-gray">{desc}</p>
      </div>
    </div>
  );
}

function StepRow({
  num,
  title,
  desc,
  muted = false,
  isLast = false,
}: {
  num: number;
  title: React.ReactNode;
  desc: string;
  muted?: boolean;
  isLast?: boolean;
}) {
  return (
    <div className="relative flex gap-4 pb-2">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-100" />
      )}
      {/* Circle */}
      <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
        muted
          ? "bg-gray-50 text-gray-300 border-gray-200"
          : "bg-primary/10 text-primary border-primary/20"
      }`}>
        {num}
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className={`font-semibold text-sm ${muted ? "text-gray-400" : "text-dark"}`}>{title}</h4>
        <p className={`text-xs mt-0.5 leading-relaxed ${muted ? "text-gray-300" : "text-gray"}`}>{desc}</p>
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
      href={`/jobs?category=${encodeURIComponent(title)}`}
      className="flex items-center gap-5 p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg hover:border-primary/30 transition-all duration-300"
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
  desc: React.ReactNode;
}) {
  return (
    <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h4 className="font-semibold text-dark text-lg">{title}</h4>
      <p className="text-sm text-gray mt-1.5 leading-relaxed">{desc}</p>

    </div>
  );
}
