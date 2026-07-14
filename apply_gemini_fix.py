import re

path = r'C:\Users\yochi\Desktop\freelance-web\frontend\src\app\dashboard\settings\page.tsx'

with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

original = c

# 1. Fix container - remove duplicate space-y
c = c.replace(
    'max-w-3xl mx-auto p-4 sm:p-6 space-y-3 sm:space-y-4 sm:space-y-6',
    'max-w-3xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6'
)
print("1. Container fixed:", "YES" if c != original else "NO")

# 2. Fix section tags - add bg-white, border, shadow on mobile
# Profile section
c = c.replace(
    '<section className="sm:bg-white sm:rounded-2xl sm:border sm:border-gray-200 overflow-hidden">',
    '<section className="bg-white rounded-2xl border border-gray-100 sm:border-gray-200 overflow-hidden shadow-sm sm:shadow-none">'
)
# Wallet section
c = c.replace(
    '<section className="sm:bg-white sm:rounded-2xl sm:border sm:border-gray-200 overflow-hidden">\n        <div className="hidden sm:flex bg-gradient-to-r from-emerald-50 to-white',
    '<section className="bg-white rounded-2xl border border-gray-100 sm:border-gray-200 overflow-hidden shadow-sm sm:shadow-none">\n        <div className="hidden sm:flex bg-gradient-to-r from-emerald-50 to-white'
)
# Account info section
c = c.replace(
    '<section className="sm:bg-white sm:rounded-2xl sm:border sm:border-gray-200 overflow-hidden">\n        <div className="hidden sm:flex bg-gradient-to-r from-violet-50 to-white',
    '<section className="bg-white rounded-2xl border border-gray-100 sm:border-gray-200 overflow-hidden shadow-sm sm:shadow-none">\n        <div className="hidden sm:flex bg-gradient-to-r from-violet-50 to-white'
)
print("2. Section tags fixed")

# 3. Form containers - p-4 sm:p-6
c = c.replace(
    '<form onSubmit={handleSaveProfile} className="sm:p-6 space-y-3 sm:space-y-4">',
    '<form onSubmit={handleSaveProfile} className="p-4 sm:p-6 space-y-4">'
)
c = c.replace(
    '<form onSubmit={handleSaveWallet} className="sm:p-6 space-y-3 sm:space-y-4">',
    '<form onSubmit={handleSaveWallet} className="p-4 sm:p-6 space-y-4">'
)
# Account info div
c = c.replace(
    '<div className="sm:p-6 space-y-0.5 text-sm">',
    '<div className="p-4 sm:p-6 space-y-0.5 text-sm">'
)
# Logout inner div
c = c.replace(
    '<div className="sm:p-6 space-y-3 sm:space-y-4">',
    '<div className="p-4 sm:p-6 space-y-4">'
)
print("3. Form containers fixed")

# 4. Email input - text-base sm:text-sm
c = c.replace(
    'bg-gray-50 text-gray text-sm" />\n            <p className="text-xs text-gray mt-1">El email',
    'bg-gray-50 text-gray text-base sm:text-sm" />\n            <p className="text-xs text-gray mt-1">El email'
)
print("4. Email input fixed")

# 5. Logout section - replace completely
old_logout_section_start = c.find('{/* CERRAR SESION */}')

# Let me find the exact logout section
old_logout_section = '''      {/* CERRAR SESION */}
      <section className="bg-white rounded-2xl border border-gray-100 sm:border-gray-200 overflow-hidden shadow-sm sm:shadow-none">
        <div className="hidden sm:flex bg-gradient-to-r from-red-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center">
              <IconLogout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-dark">Cerrar sesi\u00f3n</h2>
              <p className="text-xs text-gray">Salir de tu cuenta</p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <p className="hidden sm:block text-sm text-gray">Al cerrar sesi\u00f3n tendr\u00e1s que volver a iniciar sesi\u00f3n para acceder al dashboard.</p>
          <button
            onClick={() => {
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              router.push("/");
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-red-50 text-red-500 sm:bg-gray-100 sm:text-gray px-4 sm:px-6 py-3 sm:py-2.5 rounded-xl text-sm font-medium hover:bg-red-100 hover:text-red-600 transition-all"
          >
            <IconLogout className="w-4 h-4" />
            Cerrar sesi\u00f3n
          </button>
        </div>
      </section>'''

new_logout_section = '''      {/* CERRAR SESION */}
      <section className="bg-transparent sm:bg-white sm:rounded-2xl sm:border sm:border-gray-200 overflow-hidden">
        <div className="hidden sm:flex bg-gradient-to-r from-red-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center">
              <IconLogout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-dark">Cerrar sesi\u00f3n</h2>
              <p className="text-xs text-gray">Salir de tu cuenta</p>
            </div>
          </div>
        </div>

        <div className="sm:p-6">
          <p className="hidden sm:block text-sm text-gray mb-4">
            Al cerrar sesi\u00f3n tendr\u00e1s que volver a iniciar sesi\u00f3n para acceder al dashboard.
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
            Cerrar sesi\u00f3n
          </button>
        </div>
      </section>'''

if old_logout_section in c:
    c = c.replace(old_logout_section, new_logout_section)
    print("5. Logout section replaced")
else:
    print("5. Logout section NOT FOUND!")
    # Debug: show what's around CERRAR SESION
    idx = c.find('CERRAR SESION')
    print(repr(c[idx:idx+600]))

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print("\nDone!")
