import re

path = r'C:\Users\yochi\Desktop\freelance-web\frontend\src\app\dashboard\settings\page.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the return block
start = content.find('  return (')
end = content.rfind('  );\n}')

if start == -1 or end == -1:
    print("ERROR: Could not find return block")
    exit(1)

# The new mobile-first JSX
new_jsx = '''  return (
    <div className="max-w-3xl mx-auto sm:space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-3 px-0 sm:px-0">
        <Link href="/dashboard" className="w-8 h-8 rounded-lg bg-gray-100 text-gray flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0">
          <IconArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-dark">Configuraci\u00f3n</h1>
          <p className="text-gray text-xs sm:text-sm mt-0.5">Administra tu perfil y wallet</p>
        </div>
      </div>

      {/* PROFILE */}
      <section className="sm:bg-white sm:rounded-2xl sm:border sm:border-gray-200 overflow-hidden">
        {/* Mobile: no header. Desktop: header */}
        <div className="hidden sm:flex bg-gradient-to-r from-blue-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <IconUser className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-dark">Informaci\u00f3n personal</h2>
              <p className="text-xs text-gray">Nombre y tel\u00e9fono</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="sm:p-6 space-y-3">
          {/* Avatar */}
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-bold overflow-hidden ring-2 ring-gray-200">
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
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5 text-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-dark">Foto de perfil</p>
              <p className="text-xs text-gray">JPG, PNG o WebP. Max 5MB.</p>
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
            <label className="block text-sm font-medium text-dark mb-1">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="Tu nombre completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              Tel\u00e9fono <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white px-5 sm:px-6 py-3 sm:py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {savingProfile ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
            ) : "Guardar cambios"}
          </button>
        </form>
      </section>

      {/* Separator line on mobile only */}
      <hr className="block sm:hidden border-t border-gray-200" />

      {/* WALLET */}
      <section className="sm:bg-white sm:rounded-2xl sm:border sm:border-gray-200 overflow-hidden">
        <div className="hidden sm:flex bg-gradient-to-r from-emerald-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <IconWallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-dark">Wallet USDT</h2>
              <p className="text-xs text-gray">Direcci\u00f3n para recibir pagos en Polygon</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveWallet} className="sm:p-6 space-y-3">
          <div>
            <label className="block text-sm font-medium text-dark mb-1">
              Direcci\u00f3n de wallet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x..."
              className={"w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all " + (wallet && !walletValid ? "border-red-300 bg-red-50" : "border-gray-200")}
            />
            {wallet && !walletValid && (
              <p className="text-xs text-red-500 mt-1.5">Direcci\u00f3n inv\u00e1lida. Debe empezar con 0x y tener 42 caracteres.</p>
            )}
            <p className="text-xs text-gray mt-1.5">
              Solo direcciones de Polygon (red principal). Aseg\u00farate de que sea correcta &mdash; los fondos no se pueden recuperar si env\u00edas a una direcci\u00f3n incorrecta.
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white px-5 sm:px-6 py-3 sm:py-2.5 rounded-xl text-sm font-medium hover:bg-primary-dark hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {savingWallet ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
            ) : user.wallet_address ? "Actualizar wallet" : "Registrar wallet"}
          </button>
        </form>
      </section>

      {/* Separator line on mobile only */}
      <hr className="block sm:hidden border-t border-gray-200" />

      {/* ACCOUNT INFO */}
      <section className="sm:bg-white sm:rounded-2xl sm:border sm:border-gray-200 overflow-hidden">
        <div className="hidden sm:flex bg-gradient-to-r from-violet-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
              <IconInfo className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-dark">Informaci\u00f3n de la cuenta</h2>
            </div>
          </div>
        </div>

        <div className="sm:p-6 space-y-0.5 text-sm">
          <div className="flex justify-between py-2 px-1.5 border-b border-gray-50 rounded-lg">
            <span className="text-sm text-gray">Rol</span>
            <span className="text-sm text-dark font-medium">
              {user.role === "worker" ? "Trabajador" : "Contratista"}
            </span>
          </div>
          <div className="flex justify-between py-2 px-1.5 border-b border-gray-50 rounded-lg">
            <span className="text-sm text-gray">C\u00e9dula</span>
            <span className="text-sm text-dark font-medium">{user.cedula}</span>
          </div>
          <div className="flex justify-between py-2 px-1.5 border-b border-gray-50 rounded-lg">
            <span className="text-sm text-gray">Calificaci\u00f3n</span>
            <span className="text-sm text-dark font-medium flex items-center gap-1">
              <IconStar className="w-4 h-4 text-amber-400" />
              {user.rating_avg.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between py-2 px-1.5 rounded-lg">
            <span className="text-sm text-gray">Estado</span>
            <span className={"font-medium flex items-center gap-1.5 text-sm " + (user.is_active ? "text-emerald-600" : "text-red-500")}>
              <span className={"w-2 h-2 rounded-full " + (user.is_active ? "bg-emerald-500" : "bg-red-500")} />
              {user.is_active ? "Activa" : "Inactiva"}
            </span>
          </div>
        </div>
      </section>

      {/* Separator line on mobile only */}
      <hr className="block sm:hidden border-t border-gray-200" />

      {/* LOGOUT */}
      <div className="pt-0 sm:pt-2">
        <button
          onClick={() => {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            router.push("/");
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-gray bg-gray-50 hover:bg-red-50 hover:text-red-500 transition-all border border-gray-200"
        >
          <IconLogout className="w-4 h-4" />
          Cerrar sesi\u00f3n
        </button>
      </div>
    </div>
  );
}'''

content = content[:start] + new_jsx + content[end + len('  );\n}'):]

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done! Settings page rewritten.")
