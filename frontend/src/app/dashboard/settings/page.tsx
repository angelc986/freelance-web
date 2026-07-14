"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile, updateWallet, uploadAvatar, API_BASE } from "@/lib/api";

// ─── SVG ICONS ───
function IconArrowLeft({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
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

function IconWallet({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
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

function IconInfo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  );
}

function IconCopy({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
  );
}

function IconStar({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [wallet, setWallet] = useState("");
  const [savingWallet, setSavingWallet] = useState(false);
  const [walletMsg, setWalletMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiImgBase = API_BASE.replace("/api/v1", "");

  useEffect(() => {
    if (user) {
      setName(user.full_name);
      setPhone(user.phone);
      setWallet(user.wallet_address || "");
      if (user.avatar_url) setAvatarUrl(apiImgBase + user.avatar_url);
    }
  }, [user]);

  if (!user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      await updateProfile({ full_name: name, phone });
      await refreshUser?.();
      setProfileMsg({ ok: true, text: "Perfil actualizado *." });
    } catch (err: any) {
      setProfileMsg({ ok: false, text: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalletMsg(null);
    setSavingWallet(true);
    try {
      await updateWallet(wallet);
      await refreshUser?.();
      setWalletMsg({ ok: true, text: "Wallet registrada *." });
    } catch (err: any) {
      setWalletMsg({ ok: false, text: err.message });
    } finally {
      setSavingWallet(false);
    }
  };

  const walletValid = /^0x[a-fA-F0-9]{40}$/.test(wallet);
  const walletChanged = wallet !== (user.wallet_address || "");

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="w-8 h-8 rounded-lg bg-gray-100 text-gray flex items-center justify-center hover:bg-gray-200 transition-colors">
          <IconArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-dark">Configuración</h1>
          <p className="text-gray text-sm mt-0.5">Administra tu perfil y wallet</p>
        </div>
      </div>

      {/* PROFILE */}
      <section className="bg-white rounded-2xl border border-gray-100 sm:border-gray-200 overflow-hidden shadow-sm sm:shadow-none">
        <div className="hidden sm:flex bg-gradient-to-r from-blue-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <IconUser className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-dark">Información personal</h2>
              <p className="text-xs text-gray">Nombre y teléfono</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="p-4 sm:p-6 space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <div className="relative">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-base sm:text-2xl font-bold overflow-hidden ring-2 ring-gray-200">
                {avatarPreview || avatarUrl ? (
                  <img src={avatarPreview || avatarUrl || ""} alt="" className="w-full h-full object-cover" />
                ) : (
                  user.full_name.charAt(0).toUpperCase()
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4 text-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-dark">Foto de perfil</p>
              <p className="text-xs text-gray mt-0.5">JPG, PNG o WebP. Max 5MB.</p>
              {avatarUploading && (
                <p className="text-xs text-primary mt-1 flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Subiendo...
                </p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setAvatarPreview(URL.createObjectURL(file));
                setAvatarUploading(true);
                try {
                  const result = await uploadAvatar(file);
                  setAvatarUrl(apiImgBase + result.avatar_url);
                  if (refreshUser) refreshUser();
                } catch {}
                setAvatarUploading(false);
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray text-sm"
            />
            <p className="text-xs text-gray mt-1">El email no se puede cambiar</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="Tu nombre completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">
              Teléfono <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-base sm:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="+1 234 567 8900"
            />
          </div>

          {profileMsg && (
            <div className={"text-sm px-4 py-3 rounded-xl border " + (profileMsg.ok ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200")}>
              {profileMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {savingProfile ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
            ) : "Guardar cambios"}
          </button>
        </form>
      </section>

      {/* WALLET */}
      <section className="bg-white rounded-2xl border border-gray-100 sm:border-gray-200 overflow-hidden shadow-sm sm:shadow-none">
        <div className="hidden sm:flex bg-gradient-to-r from-emerald-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <IconWallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-dark">Wallet USDT</h2>
              <p className="text-xs text-gray">Dirección donde recibirás tus pagos en Polygon</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveWallet} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">
              Dirección de wallet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x..."
              className={"w-full px-3.5 py-2.5 border rounded-xl text-base sm:text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all " + (wallet && !walletValid ? "border-red-300 bg-red-50" : "border-gray-200")}
            />
            {wallet && !walletValid && (
              <p className="text-xs text-red-500 mt-1.5">Dirección inválida. Debe empezar con 0x y tener 42 caracteres.</p>
            )}
            <p className="text-xs text-gray mt-1.5">
              Solo direcciones de Polygon (red principal). Asegúrate de que sea correcta &mdash; los fondos no se pueden recuperar si envías a una dirección incorrecta.
            </p>
          </div>

          {user.wallet_address && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray font-medium">Wallet actual:</p>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(user.wallet_address || '')}
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  <IconCopy className="w-3.5 h-3.5" /> Copiar
                </button>
              </div>
              <p className="text-sm font-mono text-dark break-all">{user.wallet_address}</p>
            </div>
          )}

          {walletMsg && (
            <div className={"text-sm px-4 py-3 rounded-xl border " + (walletMsg.ok ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200")}>
              {walletMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={savingWallet || !walletValid || !walletChanged}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {savingWallet ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
            ) : user.wallet_address ? "Actualizar wallet" : "Registrar wallet"}
          </button>
        </form>
      </section>

      {/* CERRAR SESION */}
      <section className="bg-transparent sm:bg-white sm:rounded-2xl sm:border sm:border-gray-200 overflow-hidden">
        <div className="hidden sm:flex bg-gradient-to-r from-red-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center">
              <IconLogout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-dark">Cerrar sesión</h2>
              <p className="text-xs text-gray">Salir de tu cuenta</p>
            </div>
          </div>
        </div>

        <div className="sm:p-6">
          <p className="hidden sm:block text-sm text-gray mb-4">
            Al cerrar sesión tendrás que volver a iniciar sesión para acceder al dashboard.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              router.push("/");
            }}
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-white sm:bg-gray-100 text-red-500 sm:text-gray px-6 py-3 sm:py-2.5 rounded-xl text-base sm:text-sm font-medium border border-red-100 sm:border-transparent hover:bg-red-50 hover:text-red-600 transition-all shadow-sm sm:shadow-none"
          >
            <IconLogout className="w-5 h-5 sm:w-4 sm:h-4" />
            Cerrar sesión
          </button>
        </div>
      </section>

      {/* ACCOUNT INFO */}
      <section className="bg-white rounded-2xl border border-gray-100 sm:border-gray-200 overflow-hidden shadow-sm sm:shadow-none">
        <div className="hidden sm:flex bg-gradient-to-r from-violet-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
              <IconInfo className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-dark">Información de la cuenta</h2>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-0.5 text-sm">
          <div className="flex justify-between py-3 px-3 border-b border-gray-50 rounded-lg hover:bg-gray-50/50 transition-colors">
            <span className="text-gray">Rol</span>
            <span className="text-dark font-medium">
              {user.role === "worker" ? "Trabajador" : "Contratista"}
            </span>
          </div>
          <div className="flex justify-between py-3 px-3 border-b border-gray-50 rounded-lg hover:bg-gray-50/50 transition-colors">
            <span className="text-gray">Cédula</span>
            <span className="text-dark font-medium">{user.cedula}</span>
          </div>
          <div className="flex justify-between py-3 px-3 border-b border-gray-50 rounded-lg hover:bg-gray-50/50 transition-colors">
            <span className="text-gray">Calificación</span>
            <span className="text-dark font-medium flex items-center gap-1">
              <IconStar className="w-4 h-4 text-amber-400" />
              {user.rating_avg.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between py-3 px-3 rounded-lg hover:bg-gray-50/50 transition-colors">
            <span className="text-gray">Estado</span>
            <span className={"font-medium flex items-center gap-1.5 " + (user.is_active ? "text-emerald-600" : "text-red-500")}>
              <span className={"w-2 h-2 rounded-full " + (user.is_active ? "bg-emerald-500" : "bg-red-500")} />
              {user.is_active ? "Activa" : "Inactiva"}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
