"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile, updateWallet, uploadAvatar, updateNotificationPreferences, addPushSubscription, removePushSubscription, requestChange, confirmChange, API_BASE } from "@/lib/api";

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

function IconHeadset({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  );
}

function IconSocial({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  );
}

function IconChat({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}

// ─── CARD REUSABLE COMPONENT ───
function Card({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200/70 overflow-hidden shadow-sm shadow-gray-200/20">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100/80 bg-gradient-to-r from-blue-50/50 to-white">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h2 className="font-semibold text-dark text-sm">{title}</h2>
          {desc && <p className="text-xs text-gray mt-0.5">{desc}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [wallet, setWallet] = useState("");
  const [savingWallet, setSavingWallet] = useState(false);
  const [walletMsg, setWalletMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notifications
  const VAPID_PUBLIC_KEY = "BJnPRCNyyvzo33TPisGKkeuKA8SGkVT6NvBM51NS0kzHRRygAluHE-KMyULfdnFkkyRHIGgkugdmr9ACkeenpes";
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifMsg, setNotifMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Cambio de email/phone con verificación
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [pendingChanges, setPendingChanges] = useState<{ new_email?: string; new_phone?: string; new_wallet?: string }>({});
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [editingWallet, setEditingWallet] = useState(false);

  const urlB64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
  };

  // Detect if cedula is a hash (64 hex chars = stored as hash before the fix)
  const hasCedulaHash = user?.cedula?.length === 64 && /^[a-f0-9]{64}$/i.test(user.cedula);
  const [cedula, setCedula] = useState("");
  const resolveAvatarUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return API_BASE.replace("/api/v1", "") + url;
  };

  useEffect(() => {
    if (user) {
      setName(user.full_name);
      setPhone(user.phone);
      setEmail(user.email);
      setWallet(user.wallet_address || "");
      if (user.avatar_url) setAvatarUrl(resolveAvatarUrl(user.avatar_url));
      setEmailNotif(user.email_notifications ?? true);
    }
  }, [user]);

  // Check push support + current subscription
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushSupported(false);
      return;
    }
    setPushSupported(true);
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setPushEnabled(!!sub);
    });
  }, []);

  // Only set initial cedula once on mount, never overwrite while user is typing
  useEffect(() => {
    if (hasCedulaHash) setCedula(""); else setCedula(user?.cedula || "");
  }, []);

  if (!user) return null;

  const togglePush = async () => {
    setNotifMsg(null);
    setNotifLoading(true);
    try {
      if (pushEnabled) {
        // Unsubscribe: remover esta suscripción del backend
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        const endpoint = sub?.endpoint;
        if (sub) await sub.unsubscribe();
        if (endpoint) {
          try { await removePushSubscription(endpoint); } catch {}
        }
        setPushEnabled(false);
        setNotifMsg({ ok: true, text: "Notificaciones push desactivadas en este dispositivo." });
      } else {
        // Subscribe: agregar este dispositivo
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        const subJSON = sub.toJSON();
        await addPushSubscription({
          endpoint: subJSON.endpoint!,
          keys: {
            auth: subJSON.keys!.auth!,
            p256dh: subJSON.keys!.p256dh!,
          },
        });
        setPushEnabled(true);
        setNotifMsg({ ok: true, text: "✅ Notificaciones push activadas! Recibirás en todos tus dispositivos." });
      }
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setNotifMsg({ ok: false, text: "Permiso denegado. Activa las notificaciones en la configuración de tu navegador." });
      } else {
        setNotifMsg({ ok: false, text: err.message || "Error al configurar notificaciones" });
      }
      setPushEnabled(false);
    } finally {
      setNotifLoading(false);
    }
  };

  const toggleEmail = async (val: boolean) => {
    setEmailNotif(val);
    try {
      await updateNotificationPreferences({ email_notifications: val });
    } catch { /* silent */ }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    // Detectar si cambió email o teléfono
    const emailChanged = email !== user.email;
    const phoneChanged = phone !== user.phone;
    const needsVerify = emailChanged || phoneChanged;

    if (needsVerify) {
      // Mostrar modal de verificación en vez de guardar directo
      setSavingProfile(true);
      try {
        const changes: { new_email?: string; new_phone?: string } = {};
        if (emailChanged) changes.new_email = email;
        if (phoneChanged) changes.new_phone = phone;
        await requestChange(changes);
        setPendingChanges(changes);
        setVerifyCode("");
        setVerifyMsg(null);
        setShowVerifyModal(true);
        setProfileMsg({ ok: true, text: "📧 Código enviado a tu correo actual. Revisa tu bandeja de entrada." });
      } catch (err: any) {
        setProfileMsg({ ok: false, text: err.message });
      } finally {
        setSavingProfile(false);
      }
      return;
    }

    // Solo nombre/cedula - guardar directo
    setSavingProfile(true);
    try {
      await updateProfile({ full_name: name, phone, email, cedula: hasCedulaHash ? cedula : undefined });
      await refreshUser?.();
      setProfileMsg({ ok: true, text: "Perfil actualizado correctamente." });
    } catch (err: any) {
      setProfileMsg({ ok: false, text: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleConfirmChange = async () => {
    setVerifyMsg(null);
    setVerifying(true);
    try {
      const result = await confirmChange({
        token: verifyCode,
        ...pendingChanges,
      });
      setShowVerifyModal(false);
      // Mostrar mensaje en la sección correcta
      if (pendingChanges.new_wallet) {
        setWalletMsg({ ok: true, text: result.message });
      } else {
        setProfileMsg({ ok: true, text: result.message });
      }
      await refreshUser?.();
    } catch (err: any) {
      setVerifyMsg({ ok: false, text: err.message });
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalletMsg(null);

    // Si cambió la wallet, usar verificación
    if (walletChanged) {
      setSavingWallet(true);
      try {
        await requestChange({ new_wallet: wallet });
        setPendingChanges({ new_wallet: wallet });
        setVerifyCode("");
        setVerifyMsg(null);
        setShowVerifyModal(true);
        setWalletMsg({ ok: true, text: "📧 Código enviado a tu correo. Revisa tu bandeja." });
      } catch (err: any) {
        setWalletMsg({ ok: false, text: err.message });
      } finally {
        setSavingWallet(false);
      }
      return;
    }

    // Sin cambios - guardar directo
    setSavingWallet(true);
    try {
      await updateWallet(wallet);
      await refreshUser?.();
      setWalletMsg({ ok: true, text: "Wallet registrada correctamente." });
    } catch (err: any) {
      setWalletMsg({ ok: false, text: err.message });
    } finally {
      setSavingWallet(false);
    }
  };

  const walletValid = /^0x[a-fA-F0-9]{40}$/.test(wallet);
  const walletChanged = wallet !== (user.wallet_address || "");

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5 sm:space-y-6 w-full overflow-hidden">

      {/* ═══ HEADER ═══ */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="w-8 h-8 rounded-xl bg-gray-100 text-gray flex items-center justify-center hover:bg-gray-200 hover:text-primary transition-all">
          <IconArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-dark">Configuración</h1>
          <p className="text-sm text-gray">Administra tu perfil y wallet</p>
        </div>
      </div>

      {/* ═══ INFORMACIÓN PERSONAL ═══ */}
      <Card icon={<IconUser className="w-5 h-5 text-primary" />} title="Información personal" desc="Nombre, teléfono y foto de perfil">
        <form onSubmit={handleSaveProfile} className="p-5 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white text-xl sm:text-2xl font-bold overflow-hidden ring-2 ring-gray-200/50 shadow-sm">
                {avatarPreview || avatarUrl ? (
                  <img src={avatarPreview || avatarUrl || ""} alt="" className="w-full h-full object-cover" />
                ) : (
                  user.full_name.charAt(0).toUpperCase()
                )}
              </div>
              {/* Locked: avatar can't be changed once set */}
              {user.avatar_url ? (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center" title="Foto protegida">
                  <svg className="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                /* Upload button: only when no photo yet */
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                </button>
              )}
            </div>
            <div>
              {user.avatar_url ? (
                <>
                  <p className="text-sm font-medium text-dark flex items-center gap-1.5">
                    Foto de perfil
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-200">Protegida</span>
                  </p>
                  <p className="text-xs text-gray mt-0.5">Esta foto no se puede modificar. Para cambiarla, contacta a soporte y verifica tu identidad nuevamente.</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-dark">Foto de perfil</p>
                  <p className="text-xs text-gray mt-0.5">Sube tu foto. JPG, PNG o WebP. Max 5MB.</p>
                </>
              )}
              {avatarUploading && (
                <p className="text-xs text-primary mt-1 flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Subiendo...
                </p>
              )}
              {avatarError && <p className="text-xs text-red-500 mt-1">{avatarError}</p>}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setAvatarError(null);
                setAvatarPreview(URL.createObjectURL(file));
                setAvatarUploading(true);
                try {
                  const result = await uploadAvatar(file);
                  setAvatarUrl(resolveAvatarUrl(result.avatar_url));
                  if (refreshUser) refreshUser();
                } catch (err: any) {
                  setAvatarError(err.message || "Error al subir la foto");
                  setAvatarPreview(null);
                }
                setAvatarUploading(false);
              }}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre completo</label>
              <input type="text" value={user.full_name} disabled className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Cédula</label>
              {hasCedulaHash && (
                <div className="mb-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-xs font-medium text-amber-800">Actualiza tu número de cédula</p>
                  <p className="text-xs text-amber-600 mt-0.5">Tu documento de identidad necesita ser actualizado. Solo podrás hacerlo una vez.</p>
                </div>
              )}
              <div className={"relative flex items-center gap-2 w-full px-3.5 py-2.5 rounded-xl text-sm border transition-all " + (hasCedulaHash ? "border-amber-300 focus-within:ring-2 focus-within:ring-amber/20 focus-within:border-amber" : "border-gray-200 bg-gray-50 text-gray")}>
                {user.cedula_locked && (
                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                  </svg>
                )}
                <input
                  type="text"
                  value={hasCedulaHash ? cedula : user.cedula}
                  onChange={(e) => { if (hasCedulaHash) setCedula(e.target.value); }}
                  disabled={!hasCedulaHash}
                  required={hasCedulaHash}
                  placeholder={hasCedulaHash ? "Ingresa tu número de cédula" : ""}
                  className="flex-1 bg-transparent outline-none text-sm disabled:text-gray disabled:cursor-default"
                />
                {user.cedula_locked && (
                  <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-200 flex-shrink-0">Verificada</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="correo@ejemplo.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Teléfono</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="+1 234 567 8900" />
            </div>
          </div>

          {profileMsg && (
            <div className={"text-sm px-4 py-3 rounded-xl border " + (profileMsg.ok ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-red-50 text-red-600 border-red-200")}>
              {profileMsg.text}
            </div>
          )}

          <button type="submit" disabled={savingProfile} className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 md:py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
            {savingProfile ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
            ) : "Guardar cambios"}
          </button>
        </form>
      </Card>

      {/* ═══ WALLET ═══ */}
      <Card icon={<IconWallet className="w-5 h-5 text-primary" />} title="Wallet USDT" desc="Dirección Polygon para recibir pagos">
        <form onSubmit={handleSaveWallet} className="p-5 space-y-5">
          {user.wallet_address && !editingWallet ? (
            /* ── Wallet ya registrada: mostrar tarjeta limpia ── */
            <div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Polygon</span>
                  </div>
                  <button type="button" onClick={() => navigator.clipboard.writeText(user.wallet_address || '')} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-500 hover:text-primary hover:border-primary/30 transition-all">
                    <IconCopy className="w-3.5 h-3.5" />
                    Copiar
                  </button>
                </div>
                <p className="text-sm font-mono text-dark break-all tracking-wide">{user.wallet_address}</p>
              </div>
              <p className="text-xs text-gray mt-3">Los pagos se enviarán a esta dirección. No podrás recuperar fondos si cambias la dirección sin verificación.</p>
              <button type="button" onClick={() => { setEditingWallet(true); setWallet(user.wallet_address || ""); }} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Cambiar wallet
              </button>
            </div>
          ) : (
            /* ── Input para nueva wallet o cambio ── */
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Dirección de wallet</label>
              <div className="relative">
                <input type="text" value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="0x..."
                  className={"w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all " + (wallet && !walletValid ? "border-red-300 bg-red-50" : "border-gray-200")} />
                {user.wallet_address && (
                  <button type="button" onClick={() => { setEditingWallet(false); setWallet(user.wallet_address || ""); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 transition-all">
                    Cancelar
                  </button>
                )}
              </div>
              {wallet && !walletValid && (
                <p className="text-xs text-red-500 mt-1.5">Dirección inválida. Debe empezar con 0x y tener 42 caracteres.</p>
              )}
              <p className="text-xs text-gray mt-1.5">Solo direcciones Polygon. Verifica que sea correcta — los fondos no se pueden recuperar si envías a una dirección incorrecta.</p>
            </div>
          )}

          {walletMsg && (
            <div className={"text-sm px-4 py-3 rounded-xl border " + (walletMsg.ok ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-red-50 text-red-600 border-red-200")}>
              {walletMsg.text}
            </div>
          )}

          {(editingWallet || !user.wallet_address) && (
            <button type="submit" disabled={savingWallet || !walletValid || (user.wallet_address ? !walletChanged : false)} className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 md:py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
              {savingWallet ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
              ) : "Guardar wallet"}
            </button>
          )}
        </form>
      </Card>

      {/* ═══ INFORMACIÓN DE LA CUENTA ═══ */}
      <Card icon={<IconInfo className="w-5 h-5 text-primary" />} title="Detalles de la cuenta">
        <div className="p-5 space-y-1">
          {[
            { label: "Rol", value: <span className="flex items-center gap-2">{user.role === "worker" ? "Trabajador" : "Contratista"}{user.is_verified && <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">Verificado <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg></span>}</span> },
            { label: "Email", value: user.email },
            { label: "Cédula", value: user.cedula },
            { label: "Calificación", value: <span className="flex items-center gap-1"><IconStar className="w-4 h-4 text-blue-400" /> {user.rating_avg.toFixed(1)}</span> },
          ].map((item, i) => (
            <div key={i} className="flex justify-between py-3 px-3 border-b border-gray-50 rounded-lg hover:bg-blue-50/30 transition-colors">
              <span className="text-gray text-sm">{item.label}</span>
              <span className="text-dark font-medium text-sm">{item.value}</span>
            </div>
          ))}
          <div className="flex justify-between py-3 px-3 rounded-lg hover:bg-blue-50/30 transition-colors">
            <span className="text-gray text-sm">Estado</span>
            <span className={"font-medium text-sm flex items-center gap-1.5 " + (user.is_active ? "text-blue-600" : "text-red-500")}>
              <span className={"w-2 h-2 rounded-full " + (user.is_active ? "bg-blue-500" : "bg-red-500")} />
              {user.is_active ? "Activa" : "Inactiva"}
            </span>
          </div>
          <div className="flex justify-between py-3 px-3 rounded-lg hover:bg-blue-50/30 transition-colors">
            <span className="text-gray text-sm">Identidad</span>
            <span className={"font-medium text-sm flex items-center gap-1.5 " + (user.is_verified ? "text-green-600" : "text-amber-600")}>
              <span className={"w-2 h-2 rounded-full " + (user.is_verified ? "bg-green-500" : "bg-amber-500")} />
              {user.is_verified ? "Verificada" : "Pendiente"}
            </span>
          </div>
        </div>
      </Card>

      {/* ═══ NOTIFICACIONES ═══ */}
      <Card icon={
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      } title="Notificaciones" desc="Email y notificaciones push">
        <div className="p-5 space-y-5">
          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark">Notificaciones Push 🔔</p>
              <p className="text-xs text-gray mt-0.5">
                {!pushSupported
                  ? "Tu navegador no soporta notificaciones push."
                  : pushEnabled
                    ? "Recibirás notificaciones aunque no tengas TurnoGO abierto."
                    : "Actívalas para recibir alertas instantáneas."}
              </p>
            </div>
            {pushSupported && (
              <button
                onClick={togglePush}
                disabled={notifLoading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                  pushEnabled ? "bg-primary" : "bg-gray-300"
                }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  pushEnabled ? "translate-x-5" : "translate-x-0.5"
                }`} />
              </button>
            )}
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-dark">Notificaciones por Email ✉️</p>
              <p className="text-xs text-gray mt-0.5">Recibe un correo cuando te contraten, paguen o envíen mensajes.</p>
            </div>
            <button
              onClick={() => toggleEmail(!emailNotif)}
              disabled={notifLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                emailNotif ? "bg-primary" : "bg-gray-300"
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                emailNotif ? "translate-x-5" : "translate-x-0.5"
              }`} />
            </button>
          </div>

          {notifMsg && (
            <div className={`text-sm px-4 py-3 rounded-xl border ${notifMsg.ok ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-red-50 text-red-600 border-red-200"}`}>
              {notifMsg.text}
            </div>
          )}
        </div>
      </Card>

      {/* ═══ SOPORTE ═══ */}
      <Card icon={<IconHeadset className="w-5 h-5 text-primary" />} title="Soporte" desc="Estamos aquí para ayudarte">
        <div className="p-5 space-y-5">
          {/* Contact methods */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/40 border border-blue-100/60">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Email</p>
                <a href="mailto:soporte@turnogo.com" className="text-sm font-semibold text-primary hover:underline">soporte@turnogo.com</a>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/40 border border-blue-100/60">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Teléfono</p>
                <a href="tel:+1234567890" className="text-sm font-semibold text-primary hover:underline">+1 (234) 567-890</a>
              </div>
            </div>
          </div>

          {/* Social media */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2.5">Redes sociales</p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "Instagram", icon: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z", color: "bg-gradient-to-br from-pink-400 to-purple-500" },
                { name: "Twitter / X", icon: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z", color: "bg-gradient-to-br from-gray-800 to-gray-600" },
                { name: "WhatsApp", icon: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z", color: "bg-gradient-to-br from-emerald-500 to-emerald-600" },
                { name: "Telegram", icon: "M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z", color: "bg-gradient-to-br from-blue-400 to-blue-500" },
              ].map((social, i) => (
                <button
                  key={i}
                  onClick={() => window.open("#", "_blank")}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                  title={social.name}
                >
                  <span className={"w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] " + social.color}>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d={social.icon} />
                    </svg>
                  </span>
                  <span className="group-hover:text-dark transition-colors">{social.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live chat */}
          <div className="pt-2">
            <button
              onClick={() => window.open("#", "_blank")}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-primary-dark hover:-translate-y-0.5 transition-all shadow-sm shadow-primary/20"
            >
              <IconChat className="w-5 h-5" />
              Abrir chat en vivo
            </button>
            <p className="text-xs text-gray text-center mt-2">Respuesta promedio en menos de 5 minutos</p>
          </div>
        </div>
      </Card>

      {/* ═══ CERRAR SESIÓN ═══ */}
      <Card icon={<IconLogout className="w-5 h-5 text-gray-400" />} title="Cerrar sesión">
        <div className="p-5">
          <button
            onClick={() => {
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              localStorage.removeItem("mock_email");
              router.push("/");
            }}
            className="inline-flex items-center gap-2 bg-white text-gray-600 px-6 py-2.5 rounded-xl text-sm font-medium border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
          >
            <IconLogout className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </Card>

      {/* ═══ MODAL VERIFICACIÓN ═══ */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={() => setShowVerifyModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-sm mx-auto overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header sutil */}
            <div className="px-6 pt-6 pb-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-dark">Verificar cambios</h3>
              <p className="text-sm text-gray mt-1.5 leading-relaxed">
                Enviamos un código de 6 dígitos a <strong className="text-dark">{user.email}</strong>.
                Ingresa el código para confirmar {pendingChanges.new_wallet ? "tu nueva wallet" : "los cambios"}.
              </p>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Input con diseño mejorado */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Código de verificación</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full px-4 py-3.5 text-center text-3xl font-mono font-bold tracking-[10px] border border-gray-200 rounded-2xl bg-white focus:ring-2 focus:ring-primary/15 focus:border-primary/50 outline-none transition-all placeholder:text-gray-300"
                  autoFocus
                />
                {/* Barra de progreso de llenado */}
                <div className="flex gap-1 mt-2 justify-center">
                  {[0,1,2,3,4,5].map((i) => (
                    <div key={i} className={`h-1.5 w-6 rounded-full transition-all duration-200 ${verifyCode.length > i ? "bg-primary" : "bg-gray-200"}`} />
                  ))}
                </div>
              </div>

              {verifyMsg && (
                <div className={`text-sm px-4 py-3 rounded-2xl border ${verifyMsg.ok ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                  <div className="flex items-start gap-2.5">
                    {verifyMsg.ok ? (
                      <svg className="w-4 h-4 mt-0.5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                    )}
                    <span>{verifyMsg.text}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowVerifyModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmChange}
                  disabled={verifying || verifyCode.length < 6}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-2xl text-sm font-semibold hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm shadow-primary/20"
                >
                  {verifying ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" className="opacity-75" />
                      </svg>
                      Verificando
                    </span>
                  ) : "Confirmar cambios"}
                </button>
              </div>

              <p className="text-xs text-gray-300 text-center pt-0.5">El código expira en 15 minutos</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
