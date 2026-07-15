"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import NotificationBell from "@/components/NotificationBell";
import Link from "next/link";

const safeTop = "env(safe-area-inset-top, 0px)";
const safeBottom = "env(safe-area-inset-bottom, 0px)";

// ─── SVG ICONS ───
function IconHome({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function IconBriefcase({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75a24 24 0 01-7.577-1.22 2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  );
}

function IconWallet({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  );
}

function IconUser({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function IconLogout({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}

const navItems = [
  {
    label: "Inicio",
    href: "/dashboard",
    icon: <IconHome />,
  },
  {
    label: "Mis trabajos",
    href: "/dashboard/jobs",
    icon: <IconBriefcase />,
  },
  {
    label: "Wallet",
    href: "/dashboard/wallet",
    icon: <IconWallet />,
  },
  {
    label: "Perfil",
    href: "/dashboard/settings",
    icon: <IconUser />,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
    // Si el usuario es admin, redirigir al panel admin
    if (!loading && user?.is_admin && pathname.startsWith("/dashboard")) {
      router.push("/admin");
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const isWorker = user.role === "worker";

  return (
    <div className="min-h-screen bg-light flex">
      {/* SIDEBAR */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Link href="/dashboard">
            <Logo size="sm" />
          </Link>
        </div>

        {/* User info */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {/* Avatar */}
              <div className={"w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden " + (isWorker ? "bg-gradient-to-br from-emerald-400 to-emerald-600" : "bg-gradient-to-br from-blue-400 to-blue-600")}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                user.full_name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-dark text-sm truncate">{user.full_name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium " + (isWorker ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600")}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {isWorker ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75a24 24 0 01-7.577-1.22 2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                    )}
                  </svg>
                  {isWorker ? "Trabajador" : "Contratista"}
                </span>
              </div>
            </div>
          </div>

          {/* Rating bar */}
          <div className="mt-3 flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm font-semibold text-amber-700">{user.rating_avg.toFixed(1)}</span>
            <span className="text-[11px] text-amber-500">/ 5.0</span>
            <div className="ml-auto flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={"w-3 h-3 " + (star <= Math.round(user.rating_avg) ? "text-amber-400" : "text-amber-200")}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={"relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all overflow-hidden " + (isActive ? "bg-primary/10 text-primary" : "text-gray hover:text-dark hover:bg-gray-100")}
              >
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-full animate-fade-in" />
                )}
                {item.icon}
                {item.label}
              </Link>
            );
          })}
          {user.is_admin && (
            <Link
              href="/admin"
              className={"flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all " + (pathname === "/admin" ? "bg-red-50 text-red-600" : "text-gray hover:text-red-500 hover:bg-red-50")}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Admin
            </Link>
          )}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4">
          <button
            onClick={() => {
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              window.location.href = "/";
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray hover:text-red-500 hover:bg-red-50 transition-all w-full"
          >
            <IconLogout className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar — safe-area aware for iPhone notch/dynamic island */}
        <header
          className="border-b border-gray-200 bg-white flex items-center justify-between px-4 sm:px-6 lg:px-8"
          style={{ minHeight: `calc(3.5rem + ${safeTop})`, paddingTop: safeTop }}
        >
          <div className="flex items-center gap-3 md:hidden">
            <Link href="/dashboard">
              <Logo size="sm" />
            </Link>
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray hidden sm:inline">
              {user.full_name}
            </span>
            <NotificationBell />
            <Link
              href="/dashboard/settings"
              className="w-8 h-8 rounded-full bg-gray-100 text-gray hover:bg-gray-200 transition-colors flex items-center justify-center"
              title="Configuración"
            >
              <IconUser className="w-4 h-4" />
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                window.location.href = "/";
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
              title="Cerrar sesión"
            >
              <IconLogout className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        {/* Content with page transition */}
        <main key={pathname} className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 sm:pb-6 lg:pb-8 animate-page-enter">{children}</main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                  isActive ? "text-primary" : "text-gray hover:text-dark"
                }`}
              >
                <div className={isActive ? "scale-110 transition-transform" : ""}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
