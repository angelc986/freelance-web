path = r'C:\Users\yochi\Desktop\freelance-web\frontend\src\app\dashboard\settings\page.tsx'

with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Container - fix duplicate space-y
c = c.replace(
    'max-w-3xl mx-auto p-4 sm:p-6 space-y-3 sm:space-y-4 sm:space-y-6',
    'max-w-3xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6'
)
print("1. Container fixed")

# 2. Section tags - add bg-white, border, shadow on mobile too
c = c.replace(
    '<section className="sm:bg-white sm:rounded-2xl sm:border sm:border-gray-200 overflow-hidden">',
    '<section className="bg-white rounded-2xl border border-gray-100 sm:border-gray-200 overflow-hidden shadow-sm sm:shadow-none">'
)
print("2. Section tags fixed")

# 3. Form containers - p-4 base
c = c.replace(
    '<form onSubmit={handleSaveProfile} className="sm:p-6 space-y-3 sm:space-y-4">',
    '<form onSubmit={handleSaveProfile} className="p-4 sm:p-6 space-y-4">'
)
c = c.replace(
    '<form onSubmit={handleSaveWallet} className="sm:p-6 space-y-3 sm:space-y-4">',
    '<form onSubmit={handleSaveWallet} className="p-4 sm:p-6 space-y-4">'
)
c = c.replace(
    '<div className="sm:p-6 space-y-0.5 text-sm">',
    '<div className="p-4 sm:p-6 space-y-0.5 text-sm">'
)
print("3. Form containers fixed")

# 4. Email input - text-base on mobile
c = c.replace(
    'bg-gray-50 text-gray text-sm" />',
    'bg-gray-50 text-gray text-base sm:text-sm" />'
)
print("4. Email input fixed")

# 5. Logout section
old_logout = '      {/* CERRAR SESION */}\n      <section className="sm:bg-white sm:rounded-2xl sm:border sm:border-gray-200 overflow-hidden">\n        <div className="hidden sm:flex bg-gradient-to-r from-red-50 to-white px-6 py-4 border-b border-gray-100">\n          <div className="flex items-center gap-3">\n            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center">\n              <IconLogout className="w-5 h-5" />\n            </div>\n            <div>\n              <h2 className="font-semibold text-dark">Cerrar sesión</h2>\n              <p className="text-xs text-gray">Salir de tu cuenta</p>\n            </div>\n          </div>\n        </div>\n\n        <div className="sm:p-6 space-y-3 sm:space-y-4">\n          <p className="hidden sm:block text-sm text-gray">Al cerrar sesión tendrás que volver a iniciar sesión para acceder al dashboard.</p>\n          <button\n            onClick={() => {\n              localStorage.removeItem("access_token");\n              localStorage.removeItem("refresh_token");\n              router.push("/");\n            }}\n            className="inline-flex items-center gap-2 bg-gray-100 text-gray px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 hover:text-red-500 hover:-translate-y-0.5 transition-all"\n          >\n            <IconLogout className="w-4 h-4" />\n            Cerrar sesión\n          </button>\n        </div>\n      </section>'

new_logout = '      {/* CERRAR SESION */}\n      <section className="bg-transparent sm:bg-white sm:rounded-2xl sm:border sm:border-gray-200 overflow-hidden">\n        <div className="hidden sm:flex bg-gradient-to-r from-red-50 to-white px-6 py-4 border-b border-gray-100">\n          <div className="flex items-center gap-3">\n            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center">\n              <IconLogout className="w-5 h-5" />\n            </div>\n            <div>\n              <h2 className="font-semibold text-dark">Cerrar sesión</h2>\n              <p className="text-xs text-gray">Salir de tu cuenta</p>\n            </div>\n          </div>\n        </div>\n\n        <div className="sm:p-6">\n          <p className="hidden sm:block text-sm text-gray mb-4">\n            Al cerrar sesión tendrás que volver a iniciar sesión para acceder al dashboard.\n          </p>\n          <button\n            onClick={() => {\n              localStorage.removeItem("access_token");\n              localStorage.removeItem("refresh_token");\n              router.push("/");\n            }}\n            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-white sm:bg-gray-100 text-red-500 sm:text-gray px-6 py-3 sm:py-2.5 rounded-xl text-base sm:text-sm font-medium border border-red-100 sm:border-transparent hover:bg-red-50 hover:text-red-600 transition-all shadow-sm sm:shadow-none"\n          >\n            <IconLogout className="w-5 h-5 sm:w-4 sm:h-4" />\n            Cerrar sesión\n          </button>\n        </div>\n      </section>'

if old_logout in c:
    c = c.replace(old_logout, new_logout)
    print("5. Logout section replaced")
else:
    print("5. Logout section NOT FOUND!")
    idx = c.find('CERRAR SESION')
    print(repr(c[idx:idx+1400]))

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("\nAll done!")
