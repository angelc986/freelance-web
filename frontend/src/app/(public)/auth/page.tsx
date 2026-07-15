"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import "./auth.css";

/* ══════════════════════════════════════════════════════════════
   SCREENS: welcome | register | login | reset | email
   ══════════════════════════════════════════════════════════════ */
type Screen = "welcome" | "register" | "login" | "reset" | "email";

/* ══════════════════════════════════════════════════════════════
   MESH GRADIENT (Canvas)
   ══════════════════════════════════════════════════════════════ */
function useMeshGradient(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
 useEffect(() => {
 const canvas = canvasRef.current;
 if (!canvas) return;
 const ctx = canvas.getContext("2d");
 if (!ctx) return;

 let nodes: { x: number; y: number; dx: number; dy: number; color: { r: number; g: number; b: number } }[] = [];
 let frame = 0;
 let animId = 0;

 function init() {
 const w = canvas!.clientWidth;
 const h = canvas!.clientHeight;
 canvas!.width = w;
 canvas!.height = h;
 nodes = [
 { x: 0.15, y: 0.20, dx: 0.010, dy: 0.007, color: { r: 37, g: 99, b: 235 } },
 { x: 0.78, y: 0.18, dx: -0.008, dy: 0.009, color: { r: 59, g: 130, b: 246 } },
 { x: 0.82, y: 0.75, dx: 0.007, dy: -0.010, color: { r: 96, g: 165, b: 250 } },
 { x: 0.18, y: 0.78, dx: -0.011, dy: -0.006, color: { r: 147, g: 197, b: 253 } },
 { x: 0.50, y: 0.50, dx: 0.006, dy: 0.008, color: { r: 29, g: 78, b: 216 } },
 ];
 }

 function draw() {
 const w = canvas!.width;
 const h = canvas!.height;
 const imageData = ctx!.createImageData(w, h);
 const data = imageData.data;

 for (const n of nodes) {
 n.x += n.dx; n.y += n.dy;
 if (n.x < -0.15 || n.x > 1.15) n.dx *= -1;
 if (n.y < -0.15 || n.y > 1.15) n.dy *= -1;
 }

 const step = 2;
 for (let py = 0; py < h; py += step) {
 for (let px = 0; px < w; px += step) {
 const xn = px / w;
 const yn = py / h;
 let r = 0, g = 0, b = 0, tw = 0;
 for (const n of nodes) {
 const ds = (xn - n.x) * (xn - n.x) + (yn - n.y) * (yn - n.y);
 const wgt = 1 / (ds * ds + 0.0002);
 r += n.color.r * wgt; g += n.color.g * wgt; b += n.color.b * wgt; tw += wgt;
 }
 r = Math.min(255, Math.round(r / tw * 1.1));
 g = Math.min(255, Math.round(g / tw * 1.1));
 b = Math.min(255, Math.round(b / tw * 1.1));
 const idx = (py * w + px) * 4;
 for (let dy = 0; dy < step && py + dy < h; dy++) {
 for (let dx = 0; dx < step && px + dx < w; dx++) {
 const i = idx + (dy * w + dx) * 4;
 data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
 }
 }
 }
 }

 ctx!.putImageData(imageData, 0, 0);
 frame++;
 animId = window.setTimeout(() => requestAnimationFrame(draw), 40);
 }

 init();
 draw();

 const handleResize = () => { init(); };
 window.addEventListener("resize", handleResize);

 return () => {
 window.removeEventListener("resize", handleResize);
 cancelAnimationFrame(animId);
 clearTimeout(animId);
 };
 }, [canvasRef]);
}

/* ══════════════════════════════════════════════════════════════
   PARTICLES (Canvas)
   ══════════════════════════════════════════════════════════════ */
function useParticles(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
 useEffect(() => {
 const canvas = canvasRef.current;
 if (!canvas) return;
 const ctx = canvas.getContext("2d");
 if (!ctx) return;

 interface Particle {
 x: number; y: number; size: number;
 speedX: number; speedY: number; opacity: number; hue: string;
 }
 let particles: Particle[] = [];
 let animId = 0;

 function reset() {
 const w = canvas!.clientWidth;
 const h = canvas!.clientHeight;
 canvas!.width = w;
 canvas!.height = h;
 particles = Array.from({ length: 12 }, () => ({
 x: Math.random() * w,
 y: Math.random() * h,
 size: Math.random() * 3 + 1,
 speedX: (Math.random() - 0.5) * 0.1,
 speedY: (Math.random() - 0.5) * 0.1,
 opacity: Math.random() * 0.12 + 0.02,
 hue: Math.random() > 0.3 ? "37,99,235" : "59,130,246",
 }));
 }

 function animate() {
 const w = canvas!.width;
 const h = canvas!.height;
 ctx!.clearRect(0, 0, w, h);
 for (const p of particles) {
 p.x += p.speedX; p.y += p.speedY;
 if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
 if (p.y < -10) p.y = h + 10; if (p.y > h + 10) p.y = -10;
 ctx!.beginPath();
 ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
 ctx!.fillStyle = `rgba(${p.hue},${p.opacity})`;
 ctx!.fill();
 }
 animId = requestAnimationFrame(animate);
 }

 reset();
 animate();

 const handleResize = () => reset();
 window.addEventListener("resize", handleResize);
 return () => {
 window.removeEventListener("resize", handleResize);
 cancelAnimationFrame(animId);
 };
 }, [canvasRef]);
}

/* ══════════════════════════════════════════════════════════════
   RIPPLE HOOK
   ══════════════════════════════════════════════════════════════ */
function useRipple() {
 useEffect(() => {
 const handler = (e: MouseEvent) => {
 const btn = (e.target as HTMLElement).closest(".btn-main") as HTMLElement;
 if (!btn) return;
 const ripple = document.createElement("span");
 ripple.className = "ripple";
 const rect = btn.getBoundingClientRect();
 const size = Math.max(rect.width, rect.height);
 ripple.style.width = ripple.style.height = `${size}px`;
 ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
 ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
 btn.appendChild(ripple);
 ripple.addEventListener("animationend", () => ripple.remove());
 };
 document.addEventListener("click", handler);
 return () => document.removeEventListener("click", handler);
 }, []);
}

/* ══════════════════════════════════════════════════════════════
   FLOATING PARTICLES (burbujas azules)
   ══════════════════════════════════════════════════════════════ */
function Particles({ count = 15 }: { count?: number }) {
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

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function AuthPage() {
 return (
 <Suspense fallback={
 <div className="flex-1 flex items-center justify-center min-h-screen">
 <div className="animate-pulse text-gray-400 text-sm">Cargando...</div>
 </div>
 }>
 <AuthPageInner />
 </Suspense>
 );
}

function AuthPageInner() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const { user, login, register } = useAuth();
 const meshRef = useRef<HTMLCanvasElement>(null);
 const particlesRef = useRef<HTMLCanvasElement>(null);

 useMeshGradient(meshRef);
 useParticles(particlesRef);
 useRipple();

 const [history, setHistory] = useState<Screen[]>(["welcome"]);
 const [transition, setTransition] = useState("");
 const current = history[history.length - 1];

 // Form state
 const [regFirstName, setRegFirstName] = useState("");
 const [regLastName, setRegLastName] = useState("");
 const [regEmail, setRegEmail] = useState("");
 const [regPhone, setRegPhone] = useState("");
 const [regCedula, setRegCedula] = useState("");
 const [regPassword, setRegPassword] = useState("");
 const [regShowPw, setRegShowPw] = useState(false);

 const [loginEmail, setLoginEmail] = useState("");
 const [loginPassword, setLoginPassword] = useState("");
 const [loginShowPw, setLoginShowPw] = useState(false);

 const [resetEmail, setResetEmail] = useState("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

 // ─── Redirect if already logged in ───
 useEffect(() => {
 if (user) {
 if (user.is_admin) router.push("/admin");
 else router.push("/dashboard");
 }
 }, [user, router]);

 // ─── Auto-navigate from ?screen= param ───
 useEffect(() => {
 const screen = searchParams.get("screen");
 if (screen === "login" || screen === "register" || screen === "reset") {
 setHistory(["welcome", screen]);
 }
 }, [searchParams]);

 // ─── Navigation ───
 const push = useCallback((screen: Screen) => {
 const last = history[history.length - 1];
 if (last === screen) return;
 setTransition("push");
 setHistory(prev => [...prev, screen]);
 }, [history]);

 const pop = useCallback(() => {
 if (history.length <= 1) return;
 setTransition("pop");
 setHistory(prev => prev.slice(0, -1));
 }, [history]);

 const replace = useCallback((screen: Screen) => {
 setTransition("");
 setHistory(prev => [...prev.slice(0, -1), screen]);
 }, []);

 const popTo = useCallback((screen: Screen) => {
 setTransition("pop");
 setHistory(prev => {
 const idx = prev.lastIndexOf(screen);
 return idx >= 0 ? prev.slice(0, idx + 1) : prev.slice(0, 1);
 });
 }, []);

 // ─── Screen class ───
 function screenClass(s: Screen) {
 const idx = history.indexOf(s);
 if (idx === -1) return "screen screen-hidden";
 if (idx === history.length - 1 && transition === "pop") return "screen screen-active";
 if (s === current) return "screen screen-active";
 if (idx < history.length - 1) return "screen screen-left";
 return "screen screen-right";
 }

 // ─── Handlers ───
 async function handleLogin(e: React.FormEvent) {
 e.preventDefault();
 setError("");
 if (!loginEmail || !loginPassword) { setError("Completa todos los campos"); return; }
 setLoading(true);
 try {
 const u = await login(loginEmail, loginPassword);
 router.push(u.is_admin ? "/admin" : "/dashboard");
 } catch (err: any) {
 setError(err.message || "Error al iniciar sesión");
 } finally { setLoading(false); }
 }

 async function handleRegister(e: React.FormEvent) {
 e.preventDefault();
 setError("");
 if (!regFirstName || !regLastName || !regEmail || !regPhone || !regCedula || !regPassword) { setError("Completa todos los campos"); return; }
 if (regPassword.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
 setLoading(true);
 try {
 const u = await register({
 email: regEmail,
 phone: regPhone,
 full_name: `${regFirstName} ${regLastName}`,
 cedula: regCedula,
 password: regPassword,
 role: "worker",
 });
 router.push(u.is_admin ? "/admin" : "/dashboard");
 } catch (err: any) {
 setError(err.message || "Error al registrarse");
 } finally { setLoading(false); }
 }

 function simulateReset() {
 const btn = document.getElementById("send-link-btn");
 if (!btn) return;
 const label = btn.textContent || "";
 btn.textContent = "Enviando...";
 btn.style.opacity = "0.7";
 setTimeout(() => {
 btn.textContent = "¡Enviado! ✓";
 btn.classList.add("done");
 btn.style.opacity = "1";
 setTimeout(() => {
 push("email");
 btn.textContent = label;
 btn.classList.remove("done");
 btn.style.opacity = "1";
 }, 800);
 }, 1200);
 }

 // ─── Stagger animation trigger ───
 useEffect(() => {
 const timers: NodeJS.Timeout[] = [];
 const items = document.querySelectorAll('.stagger');
 items.forEach((el, i) => {
 (el as HTMLElement).classList.remove('in');
 const timer = setTimeout(() => (el as HTMLElement).classList.add('in'), i * 60);
 timers.push(timer);
 });
 return () => timers.forEach(clearTimeout);
 }, [current, transition]);

 return (
 <>
 {/* ═══════ CONTAINER ═══════ */}
 <div className="phone-frame">
 <canvas ref={meshRef} className="mesh-canvas" />
 <div className="blob-layer">
 <div className="blob blob-1" /><div className="blob blob-2" />
 <div className="blob blob-3" /><div className="blob blob-4" /><div className="blob blob-5" />
 </div>
 <div className="aurora" />
 <canvas ref={particlesRef} className="particle-canvas" />

 <div className="glass-container">
 {/* ─── Logo superior en todas las pantallas ─── */}
 <div className="absolute top-2 left-4 z-30">
 <Logo size="sm" />
 </div>

 {/* ─── Partículas flotantes ─── */}
 <Particles />

 {/* ═══════ 1. WELCOME ═══════ */}
 <div className={screenClass("welcome")}>
 {/* Volver a la página principal */}
 <div className="stagger" style={{position:"absolute",top:46,left:16,zIndex:5}}>
 <a href="/" className="btn-back" style={{marginLeft:0}}>
 <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
 </a>
 </div>
 <div className="flex-1 flex flex-col justify-center items-center text-center">
 <div className="stagger">
 <div className="logo-container mx-auto mb-6">
 <div className="logo-mark">
 <svg viewBox="0 0 48 48" fill="none" style={{width:48,height:48}}>
 <defs><linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48"><stop offset="0%" stopColor="#2563EB"/><stop offset="100%" stopColor="#1D4ED8"/></linearGradient></defs>
 <circle cx="24" cy="24" r="22" fill="url(#logoGrad)"/>
 <path d="M15 16h18M24 16v16" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
 <path d="M33 28c3-2.5 4-6 3.5-9" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
 <circle cx="36.5" cy="19" r="1.5" fill="white" opacity="0.6"/>
 <circle cx="24" cy="24" r="3" fill="white" opacity="0.3"/>
 </svg>
 </div>
 <span className="logo-text">Turno<span style={{color:"#2563EB"}}>GO</span></span>
 </div>
 </div>
 <h1 className="text-[30px] font-extrabold mb-2 tracking-tight text-gray-900 stagger">Bienvenido</h1>
 <p className="text-gray-500 text-[15px] max-w-[260px] mx-auto leading-relaxed stagger">Encuentra trabajos, conecta y crece. Tu oportunidad empieza aquí.</p>
 </div>
 <div className="space-y-3 pb-2">
 <div className="stagger"><button onClick={() => push("register")} className="btn-main">Comenzar</button></div>
 <div className="stagger"><button onClick={() => push("login")} className="ghost-btn">Ya tengo una cuenta</button></div>
 </div>
 <div className="stagger"><p className="legal-text text-center mt-auto">Al continuar aceptas nuestros <a href="#">Términos</a> y <a href="#">Privacidad</a>.</p></div>
 </div>

 {/* ═══════ 2. REGISTER ═══════ */}
 <div className={screenClass("register")}>
 <div className="top-bar">
 <button onClick={pop} className="btn-back">
 <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
 </button>
 <div className="pill-toggle">
 <div className={`pill-slider${current === "register" && transition !== "pop" ? " right" : ""}`}></div>
 <button className={`pill-btn${current === "login" ? " active" : ""}`} onClick={() => replace("login")}>Iniciar</button>
 <button className={`pill-btn${current === "register" ? " active" : ""}`} onClick={() => replace("register")}>Registro</button>
 </div>
 </div>

 <div className="stagger">
 <h2 className="text-[26px] font-bold mb-1 tracking-tight text-gray-900">Crear cuenta</h2>
 <p className="text-gray-500 text-[14px] mb-6">Únete hoy — es gratis</p>
 </div>

 {error && <div className="error-msg">{error}</div>}

 <form onSubmit={handleRegister}>
 <div className="stagger"><div className="input-group">
 <svg className="input-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
 <input type="text" className="input-field" placeholder="Nombre" value={regFirstName} onChange={e => setRegFirstName(e.target.value)} />
 </div>
 <div className="input-group">
 <svg className="input-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
 <input type="text" className="input-field" placeholder="Apellido" value={regLastName} onChange={e => setRegLastName(e.target.value)} />
 </div></div>

 <div className="stagger"><div className="input-group">
 <svg className="input-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
 <input type="email" className="input-field" placeholder="Correo electrónico" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
 </div></div>

 <div className="stagger">
 <div className="grid grid-cols-2 gap-3">
 <div className="input-group">
 <svg className="input-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
 <input type="tel" className="input-field" placeholder="Teléfono" value={regPhone} onChange={e => setRegPhone(e.target.value)} />
 </div>
 <div className="input-group">
 <svg className="input-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V7.5A2.25 2.25 0 0019.5 5.25h-15a2.25 2.25 0 00-2.25 2.25v9.75A2.25 2.25 0 004.5 19.5zm6.75-10.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z"/></svg>
 <input type="text" className="input-field" placeholder="Cédula" value={regCedula} onChange={e => setRegCedula(e.target.value)} />
 </div>
 </div>
 </div>

 <div className="stagger"><div className="input-group">
 <svg className="input-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
 <input type={regShowPw ? "text" : "password"} className="input-field" placeholder="Contraseña" value={regPassword} onChange={e => setRegPassword(e.target.value)} />
 <button type="button" onClick={() => setRegShowPw(!regShowPw)} className="pw-toggle">
 {regShowPw
 ? <svg className="w-5 h-5" fill="none" stroke="#475569" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>
 : <svg className="w-5 h-5" fill="none" stroke="#475569" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
 </button>
 </div></div>

 <div className="stagger">
 <button type="submit" disabled={loading} className="btn-main mt-2 mb-6">{loading ? "Creando cuenta..." : "Crear Cuenta"}</button>
 </div>
 </form>

 <div className="stagger">
 <div className="flex items-center gap-4 mb-5"><div className="flex-1 h-px bg-gray-200"></div><span className="text-gray-400 text-xs font-medium">O continúa con</span><div className="flex-1 h-px bg-gray-200"></div></div>
 <div className="flex gap-3">
 <button className="btn-social"><svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5 5 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/></svg>Google</button>
 <button className="btn-social"><svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>Apple</button>
 </div>
 </div>
 </div>

 {/* ═══════ 3. LOGIN ═══════ */}
 <div className={screenClass("login")}>
 <div className="top-bar">
 <button onClick={pop} className="btn-back">
 <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
 </button>
 <div className="pill-toggle">
 <div className={`pill-slider${current === "login" && transition !== "pop" ? "" : " right"}`}></div>
 <button className={`pill-btn${current === "login" ? " active" : ""}`} onClick={() => replace("login")}>Iniciar</button>
 <button className={`pill-btn${current === "register" ? " active" : ""}`} onClick={() => replace("register")}>Registro</button>
 </div>
 </div>

 <div className="stagger">
 <h2 className="text-[26px] font-bold mb-1 tracking-tight text-gray-900">Bienvenido de nuevo</h2>
 <p className="text-gray-500 text-[14px] mb-6">Inicia sesión para continuar</p>
 </div>

 {error && <div className="error-msg">{error}</div>}

 <form onSubmit={handleLogin}>
 <div className="stagger"><div className="input-group">
 <svg className="input-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
 <input type="email" className="input-field" placeholder="Correo electrónico" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
 </div></div>

 <div className="stagger"><div className="input-group mb-1">
 <svg className="input-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
 <input type={loginShowPw ? "text" : "password"} className="input-field" placeholder="Contraseña" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
 <button type="button" onClick={() => setLoginShowPw(!loginShowPw)} className="pw-toggle">
 {loginShowPw
 ? <svg className="w-5 h-5" fill="none" stroke="#475569" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>
 : <svg className="w-5 h-5" fill="none" stroke="#475569" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
 </button>
 </div></div>

 <div className="stagger">
 <div className="flex justify-end mb-5">
 <button type="button" onClick={() => push("reset")} className="text-[#2563EB] text-[13px] font-semibold hover:underline">¿Olvidaste tu contraseña?</button>
 </div>
 <button type="submit" disabled={loading} className="btn-main mb-6">{loading ? "Iniciando sesión..." : "Iniciar Sesión"}</button>
 </div>
 </form>

 <div className="stagger">
 <div className="flex items-center gap-4 mb-5"><div className="flex-1 h-px bg-gray-200"></div><span className="text-gray-400 text-xs font-medium">O continúa con</span><div className="flex-1 h-px bg-gray-200"></div></div>
 <div className="flex gap-3">
 <button className="btn-social"><svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5 5 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/></svg>Google</button>
 <button className="btn-social"><svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>Apple</button>
 </div>
 </div>
 </div>

 {/* ═══════ 4. RESET PASSWORD ═══════ */}
 <div className={screenClass("reset")}>
 <div className="top-bar">
 <button onClick={pop} className="btn-back">
 <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
 </button>
 </div>

 <div className="stagger">
 <h2 className="text-[26px] font-bold mb-1 tracking-tight text-gray-900">Restablecer contraseña</h2>
 <p className="text-gray-500 text-[14px] leading-relaxed mb-6">Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
 </div>

 <div className="stagger"><div className="input-group mb-6">
 <svg className="input-icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
 <input type="email" className="input-field" placeholder="Correo electrónico" value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
 </div></div>

 <div className="stagger">
 <button onClick={simulateReset} className="btn-main mb-5" id="send-link-btn">Enviar Enlace</button>
 <button onClick={() => popTo("login")} className="link-btn w-full py-2">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
 Volver a iniciar sesión
 </button>
 </div>
 </div>

 {/* ═══════ 5. CHECK EMAIL ═══════ */}
 <div className={screenClass("email")}>
 <div className="flex-1 flex flex-col justify-center items-center text-center">
 <div className="pop-in">
 <div className="email-icon mx-auto mb-6">
 <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
 </div>
 </div>
 <div className="stagger">
 <h2 className="text-[26px] font-bold mb-1 tracking-tight text-gray-900">Revisa tu correo</h2>
 <p className="text-gray-500 text-[14px] max-w-[260px] mx-auto leading-relaxed mb-8">Te enviamos un enlace para restablecer tu contraseña.</p>
 </div>
 <div className="stagger space-y-3">
 <button className="btn-main">Abrir Correo</button>
 <button className="ghost-btn">Reenviar enlace</button>
 </div>
 <div className="stagger">
 <button onClick={() => popTo("login")} className="link-btn w-full py-2 mt-4">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
 Volver a iniciar sesión
 </button>
 </div>
 </div>
 </div>

 </div>
 </div>
 </>
 );
}
